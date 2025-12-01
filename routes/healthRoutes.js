const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Root endpoint
router.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API is running',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint
router.get('/auth/test', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const userCount = await User.countDocuments().catch(() => 'DB Query Failed');

    res.json({
      status: 'API Working ✅',
      database: dbState === 1 ? 'Connected' : 'Disconnected ❌',
      dbState,
      userCount,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL,
      },
      env_check: {
        MONGODB_URI: process.env.MONGODB_URI ? 'Loaded ✓' : 'Missing ✗',
        JWT_SECRET: process.env.JWT_SECRET ? 'Loaded ✓' : 'Missing ✗',
      }
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      status: 'Server error ❌',
      error: error.message
    });
  }
});

// Migration endpoint
router.post('/migrate/fix-user-roles', async (req, res) => {
  try {
    const result = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'client' } }
    );
    
    console.log('✅ Migration completed:', result.modifiedCount, 'users updated');
    
    res.json({
      success: true,
      message: 'Migration completed successfully',
      modifiedCount: result.modifiedCount,
      instructions: 'All existing users have been set to role: client'
    });
  } catch (error) {
    console.error('❌ Migration error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Migration failed',
      error: error.message 
    });
  }
});

module.exports = router;