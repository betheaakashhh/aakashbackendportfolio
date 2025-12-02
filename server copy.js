const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();


// Debug: Check environment variables
console.log('Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Loaded' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('ADMIN_SECRET:', process.env.ADMIN_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('PORT:', process.env.PORT || 5000);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Replace your existing CORS configuration with this:

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:3001',
  'https://aakashkumarsahu.vercel.app', // ✅ Add your frontend URL
  'https://aakashkumarsahu.vercel.app/', // with trailing slash
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.sendStatus(200);
  }
  next();
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

connectDB();
// User Schema with role field
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  contact: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client',
    required: true  // Make it required so it's always set
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  phone: { type: String, default: '' },
company: { type: String, default: '' },
country: { type: String, default: '' },
city: { type: String, default: '' },
projectExperience: { type: String, default: '' },
contactMethod: {
  type: String,
  enum: ['email', 'phone', 'whatsapp'],
  default: 'email'
},
budgetPreference: { type: String, default: '' }

});

const User = mongoose.model('User', userSchema);

// Project Request Schema (Enhanced)
const projectRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectName: {
    type: String,
    required: true,
    trim: true
  },
  duration: {
    type: String,
    required: true
  },
  budget: {
    type: Number,
    required: true
  },
  tools: {
    type: String,
    required: true
  },
  projectType: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  attachmentLink: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['requested', 'accepted', 'negotiable', 'rejected'],
    default: 'requested'
  },
  negotiation: {
    proposedBudget: Number,
    proposedDuration: String,
    adminNotes: String,
    negotiatedAt: Date
  },
  rejection: {
    reason: String,
    rejectedAt: Date
  },
  payment: {
    finalBudget: Number,
    paidAmount: {
      type: Number,
      default: 0
    },
    dueAmount: Number,
    paymentHistory: [{
      amount: Number,
      date: Date,
      note: String
    }]
  },
  timeline: {
    startDate: Date,
    deadline: Date,
    completedDate: Date
  },
  commits: [{
    weekNumber: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    completedTasks: [{
      type: String
    }],
    date: {
      type: Date,
      default: Date.now
    }
  }],
  hasUnreadUpdate: {
    type: Boolean,
    default: false
  },
  lastUpdatedBy: {
    type: String,
    enum: ['client', 'admin'],
    default: 'client'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const ProjectRequest = mongoose.model('ProjectRequest', projectRequestSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only-change-in-production';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'super-secret-admin-key-change-in-production';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    req.userRole = decoded.role || 'client'; // Default to client if no role
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Middleware to verify admin
const verifyAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// ==================== HEALTH & MIGRATION ROUTES ====================

app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// 🔧 MIGRATION ENDPOINT - Run this ONCE to fix existing users
app.post('/api/migrate/fix-user-roles', async (req, res) => {
  try {
    // Update all users without role field to 'client'
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

// ==================== AUTH ROUTES ====================

// CLIENT SIGNUP - Regular user registration
app.post('/api/auth/signup', async (req, res) => {
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

    // Create user with explicit role: 'client'
    const user = new User({
      name,
      email,
      password: hashedPassword,
      contact: contact || '',
      role: 'client'  // Explicitly set role
    });

    await user.save();
    console.log('✅ Client created:', user.email, 'with role:', user.role);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
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

// ADMIN SIGNUP - Admin registration with secret key
app.post('/api/auth/admin/signup', async (req, res) => {
  try {
    console.log('📝 Admin signup request:', req.body);
    const { name, email, password, adminSecret, contact } = req.body;

    // Verify admin secret key
    if (adminSecret !== ADMIN_SECRET) {
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

    // Create admin with explicit role: 'admin'
    const admin = new User({
      name,
      email,
      password: hashedPassword,
      contact: contact || '',
      role: 'admin'  // Explicitly set role as admin
    });

    await admin.save();
    console.log('✅ Admin created:', admin.email, 'with role:', admin.role);

    const token = jwt.sign(
      { userId: admin._id, role: admin.role },
      JWT_SECRET,
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

// UNIVERSAL LOGIN - For both clients and admins
app.post('/api/auth/login', async (req, res) => {
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

    // 🔧 FIX: If user doesn't have role (old users), set to 'client'
    if (!user.role) {
      console.log('⚠️ User missing role, setting to client:', user.email);
      user.role = 'client';
      await user.save();
    }

    console.log('✅ Login successful:', user.email, 'Role:', user.role);

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      JWT_SECRET,
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

// Get User Profile
app.get('/api/auth/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 🔧 FIX: Ensure role exists
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
//api auth profile update
// UPDATE PROFILE
app.put('/api/auth/profile/update', verifyToken, async (req, res) => {
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


// Verify Token
app.get('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ 
    message: 'Token is valid', 
    userId: req.userId,
    role: req.userRole,
    valid: true 
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  res.json({ message: 'Logout successful' });
});

// ==================== CLIENT PROJECT ROUTES ====================

// Submit New Project Request
app.post('/api/projects/requests', verifyToken, async (req, res) => {
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
});

// Get All Project Requests for Current User
app.get('/api/projects/requests', verifyToken, async (req, res) => {
  try {
    const projects = await ProjectRequest.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get Single Project Request
app.get('/api/projects/requests/:id', verifyToken, async (req, res) => {
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
});

// Get Client's Work Projects (Accepted projects)
app.get('/api/projects/work', verifyToken, async (req, res) => {
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
});

// Get notification counts for client
app.get('/api/projects/notifications', verifyToken, async (req, res) => {
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
});

// ==================== ADMIN ROUTES ====================

// Get All Clients
app.get('/api/admin/clients', verifyToken, verifyAdmin, async (req, res) => {
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

// Get Single Client Details
app.get('/api/admin/clients/:id', verifyToken, verifyAdmin, async (req, res) => {
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

// Get All Project Requests (Admin)
app.get('/api/admin/projects/requests', verifyToken, verifyAdmin, async (req, res) => {
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

// Get Single Project Request (Admin)
app.get('/api/admin/projects/requests/:id', verifyToken, verifyAdmin, async (req, res) => {
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

// Accept Project Request
app.put('/api/admin/projects/requests/:id/accept', verifyToken, verifyAdmin, async (req, res) => {
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

// Negotiate Project Request
app.put('/api/admin/projects/requests/:id/negotiate', verifyToken, verifyAdmin, async (req, res) => {
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

// Reject Project Request
app.put('/api/admin/projects/requests/:id/reject', verifyToken, verifyAdmin, async (req, res) => {
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

// Add Payment to Project
app.post('/api/admin/projects/requests/:id/payment', verifyToken, verifyAdmin, async (req, res) => {
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

app.post('/api/admin/projects/requests/:id/commit', verifyToken, verifyAdmin, async (req, res) => {
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

    // Check if week number already exists
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

    // Initialize commits array if it doesn't exist
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

// Get All Commits for a Project (Both Client and Admin)
app.get('/api/projects/:id/commits', verifyToken, async (req, res) => {
  try {
    const project = await ProjectRequest.findById(req.params.id);
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify user has access to this project
    if (req.userRole !== 'admin' && project.userId.toString() !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Mark as read if client is viewing
    if (req.userRole === 'client' && project.hasUnreadUpdate && project.lastUpdatedBy === 'admin') {
      project.hasUnreadUpdate = false;
      await project.save();
    }

    res.json({
      commits: project.commits || [],
      projectName: project.projectName
    });
  } catch (error) {
    console.error('Get commits error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/admin/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, async (req, res) => {
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

// Delete a Commit (Admin Only)
app.delete('/api/admin/projects/requests/:projectId/commit/:weekNumber', verifyToken, verifyAdmin, async (req, res) => {
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
//Get Project Statistics including commits count (Admin Dashboard)
app.get('/api/admin/projects/statistics', verifyToken, verifyAdmin, async (req, res) => {
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

// Get Admin Dashboard Stats
app.get('/api/admin/dashboard/stats', verifyToken, verifyAdmin, async (req, res) => {
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

// 404 Handler


// ==================== DEBUG TEST ROUTE ====================
app.get('/api/auth/test', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState; // 0 = Disconnected, 1 = Connected

    const userCount = await User.countDocuments().catch(() => 'DB Query Failed');

    res.json({
      status: 'API Working ✅',
      database: dbState === 1 ? 'Connected' : 'Disconnected ❌',
      dbState,
      userCount,
      timestamp: new Date().toISOString(),
      environment: {
        node_env: process.env.NODE_ENV,
        vercel: !!process.env.VERCEL, // true if deployed on vercel
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
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});


app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ message: 'Internal server error' });
});




if (process.env.NODE_ENV !== 'production') {
 app.listen(PORT, () => {
      console.log('=================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('=================================');
      console.log('📝 Migration: POST /api/migrate/fix-user-roles');
      console.log('👤 Client: POST /api/auth/signup');
      console.log('🛡️  Admin: POST /api/auth/admin/login (requires ADMIN_SECRET)');
      console.log('=================================');
    });
}

export default app;

