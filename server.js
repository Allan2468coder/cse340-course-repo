import 'dotenv/config';
import { testConnection, initializeDatabase } from './src/models/db.js';
import { ensureAdminAccount } from './src/models/accounts.js';
import { createApp } from './src/app.js';

const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || 'production';
const PORT = process.env.PORT || 3000;
const app = createApp(NODE_ENV);

const startServer = async () => {
  await testConnection();
  await initializeDatabase();
  const adminReady = await ensureAdminAccount({
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD,
    firstName: process.env.ADMIN_FIRSTNAME || 'Admin',
    lastName: process.env.ADMIN_LASTNAME || 'User'
  });
  if (!adminReady && NODE_ENV !== 'development') {
    throw new Error('ADMIN_PASSWORD must be set to provision the required admin account.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running at http://127.0.0.1:${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
  });
};

startServer().catch(error => {
  console.error('Application startup failed:', error.message);
  process.exitCode = 1;
});
