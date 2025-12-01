const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  getUserProjects,
  getProjectById,
  getWorkProjects,
  getNotifications
} = require('../controllers/projectController');

// Protected routes for clients
router.get('/projects', verifyToken, getUserProjects);
router.get('/projects/:id', verifyToken, getProjectById);
router.get('/projects/work', verifyToken, getWorkProjects);
router.get('/notifications', verifyToken, getNotifications);

module.exports = router;