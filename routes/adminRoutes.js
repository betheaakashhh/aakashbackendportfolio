const express = require('express');
const router = express.Router();
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const {
  getAllClients,
  getClientById,
  getAllProjects,
  getProjectById,
  acceptProject,
  negotiateProject,
  rejectProject,
  addPayment,
  addCommit,
  getCommits,
  updateCommit,
  deleteCommit,
  getProjectStatistics,
  getDashboardStats
} = require('../controllers/adminController');

// Admin protected routes
router.get('/clients', verifyToken, verifyAdmin, getAllClients);
router.get('/clients/:id', verifyToken, verifyAdmin, getClientById);
router.get('/projects/requests', verifyToken, verifyAdmin, getAllProjects);
router.get('/projects/requests/:id', verifyToken, verifyAdmin, getProjectById);
router.put('/projects/requests/:id/accept', verifyToken, verifyAdmin, acceptProject);
router.put('/projects/requests/:id/negotiate', verifyToken, verifyAdmin, negotiateProject);
router.put('/projects/requests/:id/reject', verifyToken, verifyAdmin, rejectProject);
router.post('/projects/requests/:id/payment', verifyToken, verifyAdmin, addPayment);
router.post('/projects/requests/:id/commit', verifyToken, verifyAdmin, addCommit);
router.get('/projects/:id/commits', verifyToken, verifyAdmin, getCommits);
router.put('/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, updateCommit);
router.delete('/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, deleteCommit);
router.get('/projects/statistics', verifyToken, verifyAdmin, getProjectStatistics);
router.get('/dashboard/stats', verifyToken, verifyAdmin, getDashboardStats);

module.exports = router;