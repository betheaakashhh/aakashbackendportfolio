// routes/index.js (or routes/router.js)
import express from 'express';
import authRoutes from './authRoutes.js';
import projectRoutes from './projectRoutes.js';
import adminRoutes from './adminRoutes.js';
import migrationRoutes from './migration.js';
import resumeRoutes from './resumeRoutes.js';
import visitorRoutes from './visitorRoutes.js';
import invoiceRoutes from './invoiceRoutes.js';
import blogRoutes from './blogRoutes.js';

const router = express.Router();

// ==================== HEALTH & ROOT ROUTES ====================


router.get('/health', (req, res) => {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()) + 's',
    environment: process.env.NODE_ENV || 'development',
    routes: {
      auth: '/api/auth',
      projects: '/api/projects',
      admin: '/api/admin',
      migration: '/api/migrate',
      visitor: 'api/resume'
    }
  };
  res.json(healthData);
});

// ==================== API ROUTES ====================
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/admin', adminRoutes);
router.use('/migrate', migrationRoutes);
router.use("/resume", resumeRoutes);
router.use("/resume", visitorRoutes);
router.use("/invoices", invoiceRoutes);
router.use("/blogs", blogRoutes);


// ==================== 404 HANDLER ====================
// Use a catch-all middleware without a path string to avoid passing
// the literal '*' into path-to-regexp (which throws an error).
router.use((req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

export default router;