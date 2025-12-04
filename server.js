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
app.use(corsConfig);
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==================== STATIC FILE SERVING ====================
// Try different common static directories
const staticDirs = [
  'public',
  'dist',
  'build',
  'assets',
  'static',
  'client/build'
];

// Serve static files from multiple possible directories
staticDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  try {
    if (fs.existsSync(dirPath)) {
      console.log(`📁 Serving static files from: ${dir}`);
      app.use(`/${dir}`, express.static(dirPath));
      app.use(`/assets`, express.static(path.join(dirPath, 'assets')));
    }
  } catch (err) {
    console.log(`Directory ${dir} not found`);
  }
});



// ==================== DB CONNECTION ====================
connectDB();

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio API is live 🎯',
    time: new Date().toISOString(),
    server: 'Render Deployment',
    mongoose: mongoose.version,
    cors: 'Enabled for Vercel frontend',
    note: 'This is API only. Frontend is hosted separately on Vercel.'
  });
});

// ==================== API ROUTES ====================
app.use('/api', router);



// ==================== START SERVER ====================
app.listen(PORT, () => {
  console.log('=================================');
  console.log(`🚀 Server running on port ${PORT}`);
  console.log('=================================');
  console.log('📝 This is a BACKEND ONLY server');
  console.log('🌐 Frontend is hosted separately on Vercel');
  console.log('=================================');
});

export default app;