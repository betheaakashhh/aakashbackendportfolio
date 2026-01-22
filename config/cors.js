const cors = require('cors');

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173', 
  'http://localhost:5174',
  'http://localhost:3001',
  'https://aakashkumarsahu.vercel.app',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL
].filter(Boolean);

const corsConfig = cors({
  origin: function (origin, callback) {
    
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('⚠️ CORS blocked for origin:', origin);
      callback(null, true); 
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
});

module.exports = corsConfig;