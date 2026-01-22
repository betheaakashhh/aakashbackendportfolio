import express from 'express';
import mongoose from 'mongoose';
import { config } from './config/env.js';
import connectDB from './config/db.js';
import { corsConfig, handlePreflight } from './middleware/corsConfig.js';
import router from './routes/router.js';
import path from 'path';


const app = express();
const PORT = process.env.PORT || config.port || 5000;

// ==================== MIDDLEWARE ====================
app.use(corsConfig);
app.use(handlePreflight);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));




// ==================== DB CONNECTION ====================
connectDB();

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.json({
    message: 'Portfolio API is live ',
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
  console.log(` Server running on port ${PORT}`);
  console.log('=================================');
  console.log('This is a BACKEND ONLY server');
  console.log(' Frontend is hosted separately on Vercel');
  console.log('=================================');
});

export default app;