module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your-fallback-secret-key-for-development-only-change-in-production',
  ADMIN_SECRET: process.env.ADMIN_SECRET || 'super-secret-admin-key-change-in-production',
  JWT_EXPIRY: '7d'
};