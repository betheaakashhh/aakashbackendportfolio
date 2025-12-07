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
    const { finalBudget, startDate, deadline, initialPayment = false, createInitialInvoice = false } = req.body;

    console.log('✅ Accepting project:', req.params.id);
    console.log('📋 Accept data:', req.body);

    const project = await ProjectRequest.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ 
        success: false,
        message: 'Project not found' 
      });
    }

    project.status = 'accepted';
    
    // Set final budget (use provided or existing)
    const projectBudget = finalBudget || project.budget || 0;
    
    // Initialize payment object
    project.payment = {
      finalBudget: projectBudget,
      initialPayment: initialPayment,
      paidAmount: initialPayment ? projectBudget * 0.5 : 0,
      dueAmount: initialPayment ? projectBudget * 0.5 : projectBudget,
      paymentHistory: [],
      fullyPaid: false
    };

    // Add initial payment record if provided
    if (initialPayment && projectBudget > 0) {
      project.payment.paymentHistory.push({
        amount: projectBudget * 0.5,
        date: new Date(),
        note: 'Initial deposit upon project acceptance',
        isInitialPayment: true,
        paymentMethod: 'Bank Transfer'
      });
    }

    // Create initial invoice if requested
    if (createInitialInvoice && projectBudget > 0) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      const prefix = project.projectName.substring(0, 3).toUpperCase();
      const invoiceNumber = `INV-${prefix}-${timestamp}-INITIAL`;
      
      const initialInvoice = {
        invoiceNumber,
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        invoiceType: 'initial',
        items: [{
          description: 'Initial Deposit - Project Kickoff',
          quantity: 1,
          unitPrice: projectBudget * 0.5,
          total: projectBudget * 0.5
        }],
        subtotal: projectBudget * 0.5,
        tax: 0,
        totalAmount: projectBudget * 0.5,
        amountPaid: initialPayment ? projectBudget * 0.5 : 0,
        balanceDue: initialPayment ? 0 : projectBudget * 0.5,
        status: initialPayment ? 'paid' : 'pending',
        paymentMethod: 'Bank Transfer',
        notes: `Initial invoice for ${project.projectName}`
      };
      
      if (!project.invoices) {
        project.invoices = [];
      }
      project.invoices.push(initialInvoice);
      
      console.log('📄 Initial invoice created:', invoiceNumber);
    }

    // Set timeline
    project.timeline = {
      startDate: startDate ? new Date(startDate) : new Date(),
      deadline: deadline ? new Date(deadline) : null,
      completedDate: null
    };

    // Set notification flags
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    
    await project.save();

    res.json({
      success: true,
      message: initialPayment 
        ? 'Project accepted with initial payment' + (createInitialInvoice ? ' and invoice created' : '')
        : 'Project accepted successfully',
      data: {
        project: {
          id: project._id,
          projectName: project.projectName,
          status: project.status,
          payment: project.payment,
          timeline: project.timeline,
          invoices: project.invoices || []
        }
      }
    });
  } catch (error) {
    console.error('❌ Accept project error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error: ' + error.message 
    });
  }
});

router.post('/projects/requests/:id/invoice', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { 
      invoiceType = 'standard', 
      items, 
      dueDate, 
      taxRate = 0, 
      paymentMethod = 'Bank Transfer', 
      notes 
    } = req.body;

    console.log('📝 Creating invoice for project:', req.params.id);
    console.log('📦 Invoice data:', req.body);

    const project = await ProjectRequest.findById(req.params.id)
      .populate('userId', 'name email contact company');
    
    if (!project) {
      console.error('❌ Project not found:', req.params.id);
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    if (project.status !== 'accepted') {
      console.error('❌ Invalid project status for invoice:', project.status);
      return res.status(400).json({
        success: false,
        message: 'Can only create invoices for accepted projects'
      });
    }

    // Validate items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one invoice item is required'
      });
    }

    // Calculate totals
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
      return sum + itemTotal;
    }, 0);
    
    const tax = subtotal * (taxRate / 100);
    const totalAmount = subtotal + tax;

    // Generate invoice number
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const prefix = project.projectName.substring(0, 3).toUpperCase();
    const invoiceNumber = `INV-${prefix}-${timestamp}-${random}`;

    // Create invoice
    const invoice = {
      invoiceNumber,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      invoiceType,
      items: items.map(item => ({
        description: item.description || 'Project Service',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        total: (item.quantity || 1) * (item.unitPrice || 0)
      })),
      subtotal,
      tax,
      totalAmount,
      amountPaid: 0,
      balanceDue: totalAmount,
      status: 'pending',
      paymentMethod,
      notes: notes || `Invoice for ${project.projectName}`
    };

    console.log('✅ Invoice created:', invoiceNumber);

    // Add to project
    if (!project.invoices) {
      project.invoices = [];
    }
    
    project.invoices.push(invoice);
    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: {
        invoice,
        projectName: project.projectName,
        clientName: project.userId.name
      }
    });

  } catch (error) {
    console.error('❌ Create invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// MARK INVOICE AS PAID (ADMIN ONLY)
router.put('/projects/requests/:projectId/invoices/:invoiceNumber/pay', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { projectId, invoiceNumber } = req.params;
    const { amount, paymentMethod = 'Bank Transfer', note, isInitialPayment = false } = req.body;

    console.log('💰 Marking invoice as paid:', invoiceNumber, 'for project:', projectId);

    const project = await ProjectRequest.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Find the invoice
    const invoice = project.invoices.find(inv => inv.invoiceNumber === invoiceNumber);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found'
      });
    }

    const paymentAmount = amount || invoice.balanceDue;

    // Update invoice
    invoice.amountPaid += paymentAmount;
    invoice.balanceDue = invoice.totalAmount - invoice.amountPaid;
    invoice.status = invoice.balanceDue <= 0 ? 'paid' : 'partial';
    invoice.paymentMethod = paymentMethod;

    // Update project payment if this is initial payment
    if (isInitialPayment && invoice.invoiceType === 'initial') {
      project.payment.initialPayment = true;
    }

    // Add to payment history
    if (!project.payment.paymentHistory) {
      project.payment.paymentHistory = [];
    }
    
    project.payment.paymentHistory.push({
      amount: paymentAmount,
      date: new Date(),
      note: note || `Payment for invoice ${invoiceNumber}`,
      invoiceNumber,
      paymentMethod,
      isInitialPayment
    });

    // Update payment totals
    project.payment.paidAmount += paymentAmount;
    project.payment.dueAmount = project.payment.finalBudget - project.payment.paidAmount;
    project.payment.fullyPaid = project.payment.dueAmount <= 0;

    project.hasUnreadUpdate = true;
    project.lastUpdatedBy = 'admin';
    project.updatedAt = new Date();

    await project.save();

    console.log('✅ Invoice marked as paid:', invoiceNumber);

    res.json({
      success: true,
      message: 'Payment recorded successfully',
      data: {
        invoice,
        projectPayment: {
          paidAmount: project.payment.paidAmount,
          dueAmount: project.payment.dueAmount,
          initialPaymentMade: project.payment.initialPayment,
          fullyPaid: project.payment.fullyPaid
        }
      }
    });

  } catch (error) {
    console.error('❌ Mark invoice as paid error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
  }
});

// GET PROJECT INVOICES (ADMIN VIEW)
router.get('/projects/requests/:id/invoices', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const project = await ProjectRequest.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: {
        projectName: project.projectName,
        invoices: project.invoices || [],
        paymentSummary: {
          totalBudget: project.payment?.finalBudget || 0,
          paidAmount: project.payment?.paidAmount || 0,
          dueAmount: project.payment?.dueAmount || 0,
          initialPaymentMade: project.payment?.initialPayment || false
        }
      }
    });

  } catch (error) {
    console.error('❌ Get project invoices error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error: ' + error.message
    });
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