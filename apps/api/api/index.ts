// Vercel Serverless Function Handler
// This file adapts Fastify to work with Vercel's serverless functions

import '../src/config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';

import { appConfig, validateConfig } from '../src/config/app.config.js';
import { logger } from '../src/config/logger.config.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error-handler.middleware.js';
import authRoutes from '../src/routes/auth.js';
import chatRoutes from '../src/routes/chat.js';
import pdfRoutes from '../src/routes/pdf.js';

// Validate config
try {
  validateConfig();
  logger.info('Environment configuration validated');
} catch (error) {
  logger.fatal({ error }, 'Invalid configuration');
  throw error; // Re-throw para Vercel ver o erro
}

// Create Fastify instance (singleton)
let app: any = null;

async function buildApp() {
  if (app) return app;

  const fastify = Fastify({
    logger: { level: logger.level },
    disableRequestLogging: false,
  });

  await fastify.register(cors, {
    ...appConfig.cors,
    origin: process.env.CORS_ORIGIN || true,
  });

  await fastify.register(multipart, {
    limits: { fileSize: appConfig.upload.maxFileSize },
  });

  await fastify.register(jwt, {
    secret: appConfig.jwt.secret,
  });

  // Health check
  fastify.get('/health', async () => ({
    status: 'ok',
    timestamp: Date.now(),
    environment: appConfig.nodeEnv,
    version: '1.0.0',
  }));

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(pdfRoutes, { prefix: '/api/pdf' });

  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  await fastify.ready();
  app = fastify;
  return app;
}

// Vercel handler - usando inject
export default async function handler(req: any, res: any) {
  try {
    const app = await buildApp();
    
    // Aguarda o app estar pronto
    await app.ready();
    
    // Usa inject para simular requisição HTTP
    const response = await app.inject({
      method: req.method,
      url: req.url,
      headers: req.headers,
      payload: req.body,
      query: req.query,
    });
    
    // Copia os headers da resposta
    Object.keys(response.headers).forEach((key) => {
      res.setHeader(key, response.headers[key]);
    });
    
    // Envia a resposta
    res.status(response.statusCode).send(response.payload);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

