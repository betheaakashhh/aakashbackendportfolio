import express from 'express';
import User from '../models/User.js';

const router = express.Router();

// MIGRATION ENDPOINT - Run once to fix existing users
router.post('/fix-user-roles', async (req, res) => {
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

export default router;