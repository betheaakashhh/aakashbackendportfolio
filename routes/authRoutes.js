import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// CLIENT SIGNUP
router.post('/signup', async (req, res) => {
  try {
    console.log('📝 Client signup request:', req.body);
    const { name, email, password, contact } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      contact: contact || '',
      role: 'client'
    });

    await user.save();
    console.log('✅ Client created:', user.email, 'with role:', user.role);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ADMIN SIGNUP
router.post('/admin/signup', async (req, res) => {
  try {
    console.log('📝 Admin signup request:', req.body);
    const { name, email, password, adminSecret, contact } = req.body;

    if (adminSecret !== config.adminSecret) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = new User({
      name,
      email,
      password: hashedPassword,
      contact: contact || '',
      role: 'admin'
    });

    await admin.save();
    console.log('✅ Admin created:', admin.email, 'with role:', admin.role);

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Admin created successfully',
      token,
      user: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('❌ Admin signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UNIVERSAL LOGIN
router.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login request:', req.body.email);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (!user.role) {
      console.log('⚠️ User missing role, setting to client:', user.email);
      user.role = 'client';
      await user.save();
    }

    console.log('✅ Login successful:', user.email, 'Role:', user.role);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET USER PROFILE
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.role) {
      user.role = 'client';
      await user.save();
    }

    res.json(user);
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE PROFILE
router.put('/profile/update', verifyToken, async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { $set: req.body },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// VERIFY TOKEN
router.get('/verify', verifyToken, (req, res) => {
  res.json({ 
    message: 'Token is valid', 
    userId: req.userId,
    role: req.userRole,
    valid: true 
  });
});

// LOGOUT
router.post('/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// TEST ROUTE
router.get('/test', async (req, res) => {
  try {
    const userCount = await User.countDocuments().catch(() => 'DB Query Failed');

    res.json({
      status: 'API Working ✅',
      database: 'Connected',
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Test route error:', error);
    res.status(500).json({
      status: 'Server error ❌',
      error: error.message
    });
  }
});

export default router;