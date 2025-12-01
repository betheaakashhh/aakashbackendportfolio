const ProjectRequest = require('../models/ProjectRequest');
const User = require('../models/User');

// Submit New Project Request
const submitProjectRequest = async (req, res) => {
  try {
    console.log('📝 Project request received:', req.body);
    const { projectName, duration, budget, tools, projectType, description, attachmentLink } = req.body;

    if (!attachmentLink && (!projectName || !duration || !budget || !tools || !projectType || !description)) {
      return res.status(400).json({ message: 'Upload document or fill all fields' });
    }

    const projectRequest = new ProjectRequest({
      userId: req.userId,
      projectName,
      duration,
      budget: Number(budget),
      tools,
      projectType,
      description,
      attachmentLink: attachmentLink || '',
      status: 'requested',
      lastUpdatedBy: 'client'
    });

    await projectRequest.save();

    res.status(201).json({
      message: 'Project request submitted successfully',
      project: projectRequest
    });
  } catch (error) {
    console.error('Project request error:', error);
    res.status(500).json({ message: 'Server error: ' + error.message });
  }
};

// Get All Project Requests for Current User
const getUserProjects = async (req, res) => {
  try {
    const projects = await ProjectRequest.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Single Project Request
const getProjectById = async (req, res) => {
  try {
    const project = await ProjectRequest.findOne({
      _id: req.params.id,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Mark as read by client
    if (project.hasUnreadUpdate && project.lastUpdatedBy === 'admin') {
      project.hasUnreadUpdate = false;
      await project.save();
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get Client's Work Projects (Accepted projects)
const getWorkProjects = async (req, res) => {
  try {
    const projects = await ProjectRequest.find({ 
      userId: req.userId,
      status: 'accepted'
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get work projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get notification counts for client
const getNotifications = async (req, res) => {
  try {
    const newWorkProjects = await ProjectRequest.countDocuments({
      userId: req.userId,
      status: 'accepted',
      hasUnreadUpdate: true,
      lastUpdatedBy: 'admin'
    });

    const negotiableProjects = await ProjectRequest.countDocuments({
      userId: req.userId,
      status: 'negotiable',
      hasUnreadUpdate: true,
      lastUpdatedBy: 'admin'
    });

    const rejectedProjects = await ProjectRequest.countDocuments({
      userId: req.userId,
      status: 'rejected',
      hasUnreadUpdate: true,
      lastUpdatedBy: 'admin'
    });

    res.json({
      newWorkProjects,
      negotiableProjects,
      rejectedProjects
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitProjectRequest,
  getUserProjects,
  getProjectById,
  getWorkProjects,
  getNotifications
};