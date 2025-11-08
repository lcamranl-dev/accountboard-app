import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { testConnection } from './config/database.js';
import { runAutoMigration } from './config/auto-migrate.js';
import { apiLimiter, errorHandler, notFoundHandler } from './middleware/rateLimiting.js';

// Import routes
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import accountRoutes from './routes/accounts.js';
import transactionRoutes from './routes/transactions.js';
// import customerRoutes from './routes/customers.js';
// import serviceRoutes from './routes/services.js';
// import collaboratorRoutes from './routes/collaborators.js';
// import projectRoutes from './routes/projects.js';
// import reportRoutes from './routes/reports.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/', apiLimiter);

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/transactions', transactionRoutes);
// app.use('/api/customers', customerRoutes);
// app.use('/api/services', serviceRoutes);
// app.use('/api/collaborators', collaboratorRoutes);
// app.use('/api/projects', projectRoutes);
// app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Accountboard API Server',
    version: '1.0.0',
    endpoints: [
      'GET /health - Health check',
      'POST /api/auth/login - User login',
      'GET /api/auth/me - Get current user',
      'GET /api/employees - Get employees',
      'GET /api/accounts - Get accounts',
      'GET /api/transactions - Get transactions',
      // Add more as we implement them
    ]
  });
});

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('⚠️  Database connection failed. Some features may not work.');
      console.warn('💡 Make sure your database is running and accessible.');
      return;
    }

    // Run auto-migration on startup (for production deployment)
    if (process.env.NODE_ENV === 'production') {
      console.log('🔄 Running auto-migration for production...');
      try {
        await runAutoMigration();
        console.log('✅ Auto-migration completed successfully');
      } catch (error) {
        console.error('❌ Auto-migration failed:', error);
        // Don't exit - let the server start anyway
      }
    }

    app.listen(PORT, () => {
      console.log('🚀 Server started successfully!');
      console.log(`📡 API Server running on http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL ? 'PostgreSQL (Production)' : 'MySQL (Development)'}`);
      console.log(`📊 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
      console.log('\n📋 Available endpoints:');
      console.log('   GET  /health - Health check');
      console.log('   POST /api/auth/login - User login');
      console.log('   GET  /api/auth/me - Get current user');
      console.log('   GET  /api/employees - Get employees');
      console.log('   GET  /api/accounts - Get accounts');
      console.log('   GET  /api/transactions - Get transactions');
      if (process.env.NODE_ENV !== 'production') {
        console.log('\n💡 For development setup:');
        console.log('   npm run db:migrate');
        console.log('   npm run db:seed');
      } else {
        console.log('\n📧 Demo login: admin@demo.com / admin123');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT. Graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM. Graceful shutdown...');
  process.exit(0);
});