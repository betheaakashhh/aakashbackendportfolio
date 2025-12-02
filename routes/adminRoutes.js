import express from 'express';
import User from '../models/User.js';
import ProjectRequest from '../models/ProjectRequest.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET ALL CLIENTS
router.get('/clients', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const clients = await User.find({ role: 'client' })
      .select('-password')
      .sort({ createdAt: -1 });

    const clientsWithStats = await Promise.all(clients.map(async (client) => {
      const totalProjects = await ProjectRequest.countDocuments({ userId: client._id });
      const requestedProjects = await ProjectRequest.countDocuments({ userId: client._id, status: 'requested' });
      const acceptedProjects = await ProjectRequest.countDocuments({ userId: client._id, status: 'accepted' });
      const rejectedProjects = await ProjectRequest.countDocuments({ userId: client._id, status: 'rejected' });
      const negotiableProjects = await ProjectRequest.countDocuments({ userId: client._id, status: 'negotiable' });

      const acceptedProjectsData = await ProjectRequest.find({ 
        userId: client._id, 
        status: 'accepted',
        'payment.finalBudget': { $exists: true }
      });

      const totalPaid = acceptedProjectsData.reduce((sum, p) => sum + (p.payment?.paidAmount || 0), 0);
      const totalDue = acceptedProjectsData.reduce((sum, p) => sum + (p.payment?.dueAmount || 0), 0);

      return {
        ...client.toObject(),
        stats: {
          totalProjects,
          requestedProjects,
          acceptedProjects,
          rejectedProjects,
          negotiableProjects,
          totalPaid,
          totalDue
        }
      };
    }));

    res.json(clientsWithStats);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE CLIENT DETAILS
router.get('/clients/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const client = await User.findById(req.params.id).select('-password');
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    const projects = await ProjectRequest.find({ userId: client._id })
      .sort({ createdAt: -1 });

    const stats = {
      totalProjects: projects.length,
      requestedProjects: projects.filter(p => p.status === 'requested').length,
      acceptedProjects: projects.filter(p => p.status === 'accepted').length,
      rejectedProjects: projects.filter(p => p.status === 'rejected').length,
      negotiableProjects: projects.filter(p => p.status === 'negotiable').length,
      totalPaid: projects
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + (p.payment?.paidAmount || 0), 0),
      totalDue: projects
        .filter(p => p.status === 'accepted')
        .reduce((sum, p) => sum + (p.payment?.dueAmount || 0), 0)
    };

    res.json({
      client: client.toObject(),
      projects,
      stats
    });
  } catch (error) {
    console.error('Get client details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET ALL PROJECT REQUESTS
router.get('/projects/requests', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    
    const projects = await ProjectRequest.find(filter)
      .populate('userId', 'name email contact')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get admin projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET SINGLE PROJECT REQUEST
router.get('/projects/requests/:id', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const project = await ProjectRequest.findById(req.params.id)
      .populate('userId', 'name email contact');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get admin project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ACCEPT PROJECT REQUEST
router.put('/projects/requests/:id/accept', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { finalBudget, startDate, deadline } = req.body;

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.status = 'accepted';
    project.payment = {
      finalBudget: finalBudget || project.budget,
      paidAmount: 0,
      dueAmount: finalBudget || project.budget,
      paymentHistory: []
    };
    project.timeline = {
      startDate: startDate || new Date(),
      deadline: deadline || null
    };
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Project accepted successfully',
      project
    });
  } catch (error) {
    console.error('Accept project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// NEGOTIATE PROJECT REQUEST
router.put('/projects/requests/:id/negotiate', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { proposedBudget, proposedDuration, adminNotes } = req.body;

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.status = 'negotiable';
    project.negotiation = {
      proposedBudget: proposedBudget || project.budget,
      proposedDuration: proposedDuration || project.duration,
      adminNotes: adminNotes || '',
      negotiatedAt: new Date()
    };
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Negotiation proposal sent successfully',
      project
    });
  } catch (error) {
    console.error('Negotiate project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// REJECT PROJECT REQUEST
router.put('/projects/requests/:id/reject', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.status = 'rejected';
    project.rejection = {
      reason,
      rejectedAt: new Date()
    };
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Project rejected successfully',
      project
    });
  } catch (error) {
    console.error('Reject project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD PAYMENT TO PROJECT
router.post('/projects/requests/:id/payment', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { amount, note } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid payment amount is required' });
    }

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only add payments to accepted projects' });
    }

    const newPayment = {
      amount,
      date: new Date(),
      note: note || ''
    };

    project.payment.paymentHistory.push(newPayment);
    project.payment.paidAmount += amount;
    project.payment.dueAmount = project.payment.finalBudget - project.payment.paidAmount;
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Payment added successfully',
      project
    });
  } catch (error) {
    console.error('Add payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADD COMMIT/PROGRESS UPDATE
router.post('/projects/requests/:id/commit', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { weekNumber, description, completedTasks } = req.body;

    if (!weekNumber || !description) {
      return res.status(400).json({ message: 'Week number and description are required' });
    }

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.status !== 'accepted') {
      return res.status(400).json({ message: 'Can only add commits to accepted projects' });
    }

    const existingCommit = project.commits.find(c => c.weekNumber === parseInt(weekNumber));
    if (existingCommit) {
      return res.status(400).json({ message: `Week ${weekNumber} already has a progress update` });
    }

    const newCommit = {
      weekNumber: parseInt(weekNumber),
      description,
      completedTasks: completedTasks || [],
      date: new Date()
    };

    if (!project.commits) {
      project.commits = [];
    }

    project.commits.push(newCommit);
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Progress update added successfully',
      project
    });
  } catch (error) {
    console.error('Add commit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE COMMIT
router.put('/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { description, completedTasks } = req.body;
    const { projectId, weekNumber } = req.params;

    const project = await ProjectRequest.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const commitIndex = project.commits.findIndex(c => c.weekNumber === parseInt(weekNumber));
    if (commitIndex === -1) {
      return res.status(404).json({ message: 'Commit not found' });
    }

    if (description) {
      project.commits[commitIndex].description = description;
    }
    if (completedTasks) {
      project.commits[commitIndex].completedTasks = completedTasks;
    }

    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Commit updated successfully',
      commit: project.commits[commitIndex]
    });
  } catch (error) {
    console.error('Update commit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE COMMIT
router.delete('/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { projectId, weekNumber } = req.params;

    const project = await ProjectRequest.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const commitIndex = project.commits.findIndex(c => c.weekNumber === parseInt(weekNumber));
    if (commitIndex === -1) {
      return res.status(404).json({ message: 'Commit not found' });
    }

    project.commits.splice(commitIndex, 1);
    project.updatedAt = new Date();

    await project.save();

    res.json({
      message: 'Commit deleted successfully',
      remainingCommits: project.commits
    });
  } catch (error) {
    console.error('Delete commit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET PROJECT STATISTICS
router.get('/projects/statistics', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const acceptedProjects = await ProjectRequest.find({ status: 'accepted' });
    
    const projectsWithCommitStats = acceptedProjects.map(project => ({
      _id: project._id,
      projectName: project.projectName,
      clientId: project.userId,
      totalCommits: project.commits ? project.commits.length : 0,
      lastCommitDate: project.commits && project.commits.length > 0 
        ? project.commits[project.commits.length - 1].date 
        : null,
      payment: project.payment,
      timeline: project.timeline
    }));

    res.json(projectsWithCommitStats);
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET DASHBOARD STATS
router.get('/dashboard/stats', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalProjects = await ProjectRequest.countDocuments();
    const requestedProjects = await ProjectRequest.countDocuments({ status: 'requested' });
    const acceptedProjects = await ProjectRequest.countDocuments({ status: 'accepted' });
    const negotiableProjects = await ProjectRequest.countDocuments({ status: 'negotiable' });
    const rejectedProjects = await ProjectRequest.countDocuments({ status: 'rejected' });

    const acceptedProjectsData = await ProjectRequest.find({ 
      status: 'accepted',
      'payment.finalBudget': { $exists: true }
    });

    const totalRevenue = acceptedProjectsData.reduce((sum, p) => sum + (p.payment?.finalBudget || 0), 0);
    const totalPaid = acceptedProjectsData.reduce((sum, p) => sum + (p.payment?.paidAmount || 0), 0);
    const totalDue = acceptedProjectsData.reduce((sum, p) => sum + (p.payment?.dueAmount || 0), 0);

    res.json({
      totalClients,
      totalProjects,
      requestedProjects,
      acceptedProjects,
      negotiableProjects,
      rejectedProjects,
      totalRevenue,
      totalPaid,
      totalDue
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;