import dotenv from 'dotenv';

dotenv.config();

// Debug: Check environment variables
console.log('Environment check:');
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✓ Loaded' : '✗ Missing');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('ADMIN_SECRET:', process.env.ADMIN_SECRET ? '✓ Loaded' : '✗ Missing');
console.log('PORT:', process.env.PORT || 5000);

export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only-change-in-production',
  adminSecret: process.env.ADMIN_SECRET || 'super-secret-admin-key-change-in-production',
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL,
  adminUrl: process.env.ADMIN_URL,
  mongoUri: process.env.MONGODB_URI
};