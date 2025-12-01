const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const {
  clientSignup,
  adminSignup,
  login,
  getProfile,
  updateProfile,
  verifyToken: verifyTokenController,
  logout
} = require('../controllers/authController');

// Public routes
router.post('/signup', clientSignup);
router.post('/admin/signup', adminSignup);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.put('/profile/update', verifyToken, updateProfile);
router.get('/verify', verifyToken, verifyTokenController);

module.exports = router;