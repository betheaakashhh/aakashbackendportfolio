import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { corsConfig, handlePreflight } from './middleware/corsConfig.js';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import migrationRoutes from './routes/migration.js';

const app = express();
const PORT = config.port || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsConfig);
app.use(handlePreflight);

// Connect to MongoDB
connectDB();

// ==================== HEALTH & ROOT ROUTES ====================
app.get('/', (req, res) => {
  res.json({ 
    message: 'Portfolio API is running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
    deployment: 'Vercel + Local Compatible'
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  const healthData = {
    status: dbStatus === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    environment: config.nodeEnv,
    
    components: {
      database: {
        status: dbStatus,
        readyState: mongoose.connection.readyState,
        collections: Object.keys(mongoose.connection.collections).length
      },
      server: {
        port: PORT,
        environment: config.nodeEnv,
        memory: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        platform: process.platform
      }
    },
    
    // All registered routes
    routes: {
      auth: [
        'POST /api/auth/signup',
        'POST /api/auth/login',
        'GET /api/auth/verify',
        'POST /api/auth/admin/signup'
      ],
      projects: [
        'GET /api/projects',
        'POST /api/projects',
        'PUT /api/projects/:id',
        'DELETE /api/projects/:id'
      ],
      admin: [
        'GET /api/admin/users',
        'DELETE /api/admin/users/:id'
      ],
      migration: [
        'POST /api/migrate/fix-user-roles'
      ]
    },
    
    // Quick diagnostics
    diagnostics: {
      mongodbUri: !!config.mongodbUri,
      jwtSecret: !!config.jwtSecret,
      adminSecret: !!config.adminSecret,
      corsEnabled: true,
      jsonParser: true,
      vercel: process.env.VERCEL === '1'
    }
  };
  
  res.json(healthData);
});

// ==================== API ROUTES ====================
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/migrate', migrationRoutes);

// ==================== ERROR HANDLERS ====================
// 404 Handler
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Global Error Handler
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ message: 'Internal server error' });
});

// ==================== VERCEL COMPATIBLE SERVER START ====================
// Start server locally (for development) if not on Vercel
if (process.env.VERCEL !== '1') {
  const server = app.listen(PORT, 'localhost', () => {
    console.log('=================================');
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${config.nodeEnv}`);
    console.log('=================================');
    console.log('📝 Migration: POST /api/migrate/fix-user-roles');
    console.log('👤 Client: POST /api/auth/signup');
    console.log('🛡️  Admin: POST /api/auth/admin/signup');
    console.log('=================================');
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.log(`Try: PORT=${Number(PORT) + 1} npm start`);
    } else {
      console.error('❌ Server error:', error.message);
    }
    process.exit(1);
  });
}

// Export for Vercel serverless functions
export default app;