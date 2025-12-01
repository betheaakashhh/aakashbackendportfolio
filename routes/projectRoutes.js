const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const { submitProjectRequest } = require('../controllers/projectController');

// Submit new project request (for clients)
router.post('/requests', verifyToken, submitProjectRequest);

// Get commits for a project (shared by clients and admins)
router.get('/:id/commits', verifyToken, (req, res, next) => {
  // This route is shared, so we need to import and call the controller separately
  const { getCommits } = require('../controllers/adminController');
  return getCommits(req, res, next);
});

module.exports = router;