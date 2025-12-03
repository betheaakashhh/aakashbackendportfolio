import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { corsConfig, handlePreflight } from './middleware/corsConfig.js';
import router from './routes/router.js';

const app = express();
const PORT = process.env.PORT || config.port || 5000;

// ==================== MIDDLEWARE ====================
app.use(corsConfig);
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== DB CONNECTION ====================
connectDB();

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio API is live 🎯',
    time: new Date().toISOString(),
    server: 'Render Deployment',
    mongoose: mongoose.version
  });
});

// ==================== API ROUTES ====================
app.use('/api', router);

// ==================== GLOBAL ERROR HANDLER ====================
app.use((error, req, res, next) => {
  console.error('Global error:', error);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('=================================');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log('=================================');
      console.log('📝 Migration: POST /api/migrate/fix-user-roles');
      console.log('👤 Client: POST /api/auth/signup');
      console.log('🛡️  Admin: POST /api/auth/admin/login (requires ADMIN_SECRET)');
      console.log(`health check:http://localhost:${port} GET /api/health`);

      console.log('=================================');
});

export default app;
