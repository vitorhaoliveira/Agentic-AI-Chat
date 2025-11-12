// Load environment variables FIRST, before any other imports
import './config/env.js';

import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';

// Import configurations
import { appConfig, validateConfig } from './config/app.config.js';
import { logger } from './config/logger.config.js';

// Import middleware
import { errorHandler, notFoundHandler } from './middleware/error-handler.middleware.js';

// Import routes
import authRoutes from './routes/auth.js';
import chatRoutes from './routes/chat.js';
import pdfRoutes from './routes/pdf.js';

// Verify environment is loaded
import { verifyEnvLoaded } from './config/env.js';

try {
  validateConfig();
  logger.info('Environment configuration validated');
  
  // Additional check for OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    verifyEnvLoaded();
    logger.fatal('OPENAI_API_KEY is required but not found in environment');
    console.error('\n❌ ERROR: OPENAI_API_KEY not found!');
    console.error('   Please create a .env file in apps/api/ with:');
    console.error('   OPENAI_API_KEY=your_api_key_here\n');
    process.exit(1);
  }
} catch (error) {
  logger.fatal({ error }, 'Invalid configuration');
  process.exit(1);
}

const fastify = Fastify({
  logger: {
    level: logger.level,
  },
  // Disable Fastify's internal logger to use our custom Pino logger
  disableRequestLogging: false,
});

await fastify.register(cors, appConfig.cors);
logger.debug('CORS configured');

await fastify.register(multipart, {
  limits: {
    fileSize: appConfig.upload.maxFileSize,
  },
});
logger.debug({ maxFileSize: appConfig.upload.maxFileSize }, 'Multipart configured');

await fastify.register(jwt, {
  secret: appConfig.jwt.secret,
});
logger.debug('JWT configured');

fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: Date.now(),
    environment: appConfig.nodeEnv,
    version: '1.0.0',
  };
});

await fastify.register(authRoutes, { prefix: '/api/auth' });
await fastify.register(chatRoutes, { prefix: '/api/chat' });
await fastify.register(pdfRoutes, { prefix: '/api/pdf' });

logger.info('Routes registered');

fastify.setErrorHandler(errorHandler);
fastify.setNotFoundHandler(notFoundHandler);

logger.info('Error handlers registered');

const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal');
  
  try {
    await fastify.close();
    logger.info('Server closed gracefully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

try {
  await fastify.listen({ 
    port: appConfig.port, 
    host: appConfig.host 
  });
  
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
} catch (err) {
  logger.fatal({ error: err }, 'Failed to start server');
  process.exit(1);
}
