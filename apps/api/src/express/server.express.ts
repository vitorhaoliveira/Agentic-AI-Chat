// Load environment variables FIRST, before any other imports
import '../config/env.js';

import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { appConfig, validateConfig } from '../config/app.config.js';
import { logger } from '../config/logger.config.js';
import { verifyEnvLoaded } from '../config/env.js';

// Import routes
import authRoutes from './routes/auth.express.js';
import chatRoutes from './routes/chat.express.js';
import pdfRoutes from './routes/pdf.express.js';

// Verify environment is loaded
try {
  validateConfig();
  logger.info('Environment configuration validated');

  // Additional check for Groq API key
  if (!process.env.GROQ_API_KEY) {
    verifyEnvLoaded();
    logger.fatal('GROQ_API_KEY is required but not found in environment');
    console.error('\n❌ ERROR: GROQ_API_KEY not found!');
    console.error('   Please create a .env file in apps/api/ with:');
    console.error('   GROQ_API_KEY=your_api_key_here');
    console.error('   Get your free API key at: https://console.groq.com\n');
    process.exit(1);
  }
} catch (error) {
  logger.fatal({ error }, 'Invalid configuration');
  process.exit(1);
}

const app = express();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: appConfig.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// CORS middleware
app.use(cors(appConfig.cors));
logger.debug('CORS configured');

// JSON body parser
app.use(express.json());
logger.debug('JSON body parser configured');

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    environment: appConfig.nodeEnv,
    version: '1.0.0',
  });
});

// Register routes (without /api prefix for local development)
// The frontend proxy already adds /api, so routes are:
// /auth/login -> http://localhost:3001/auth/login
app.use('/auth', authRoutes);
app.use('/chat', upload.single('pdf'), chatRoutes);
app.use('/pdf', upload.single('file'), pdfRoutes);

logger.info('Routes registered');

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error({ error: err, path: req.path, method: req.method }, 'Unhandled error');

  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: appConfig.nodeEnv === 'development' ? err.message : 'Internal server error',
    });
  }
});

// 404 handler
app.use((req, res) => {
  logger.warn({ path: req.path, method: req.method }, 'Route not found');
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

logger.info('Error handlers registered');

const gracefulShutdown = (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');

  server.close(() => {
    logger.info('Server closed gracefully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forcing shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const server = app.listen(appConfig.port, appConfig.host, () => {
  logger.info(
    {
      port: appConfig.port,
      host: appConfig.host,
      environment: appConfig.nodeEnv,
    },
    '🚀 Server started successfully'
  );

  console.log('\n');
  console.log(`🚀 Server running at: http://localhost:${appConfig.port}`);
  console.log(`📊 Health check: http://localhost:${appConfig.port}/health`);
  console.log('\n');
});

