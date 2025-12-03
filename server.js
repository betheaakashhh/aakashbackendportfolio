import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { corsConfig, handlePreflight } from './middleware/corsConfig.js';
import router from './routes/router.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || config.port || 5000;

// ==================== MIDDLEWARE ====================
// Apply CORS middleware FIRST
app.use(corsConfig);
app.use(handlePreflight);

// Then parse body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILES with CORS ====================
// Serve static files from 'public' or 'assets' directory
app.use('/assets', (req, res, next) => {
  // Apply CORS headers specifically for static files
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  // Serve static files from the correct directory
  express.static(path.join(__dirname, 'assets'))(req, res, next);
});

// ==================== DB CONNECTION ====================
connectDB();

// ==================== ROOT ROUTE ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio API is live 🎯',
    time: new Date().toISOString(),
    server: 'Render Deployment',
    mongoose: mongoose.version,
    cors: 'Enabled for Vercel frontend'
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
  console.log(`✅ CORS enabled for: ${config.frontendUrl}`);
  console.log(`✅ CORS enabled for: ${config.adminUrl}`);
  console.log('=================================');
});

export default app;