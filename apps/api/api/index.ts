// Vercel Serverless Function Handler
// This file adapts Fastify to work with Vercel's serverless functions

import '../src/config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import { IncomingMessage, ServerResponse } from 'http';

import { appConfig, validateConfig } from '../src/config/app.config.js';
import { logger } from '../src/config/logger.config.js';
import { errorHandler, notFoundHandler } from '../src/middleware/error-handler.middleware.js';
import authRoutes from '../src/routes/auth.js';
import chatRoutes from '../src/routes/chat.js';
import pdfRoutes from '../src/routes/pdf.js';

// Validate config on module load
try {
  validateConfig();
  logger.info('Environment configuration validated');
} catch (error) {
  logger.fatal({ error }, 'Invalid configuration');
}

// Create Fastify instance (singleton)
let fastifyInstance: Awaited<ReturnType<typeof createFastifyInstance>> | null = null;

async function createFastifyInstance() {
  const fastify = Fastify({
    logger: {
      level: logger.level,
    },
    disableRequestLogging: false,
  });

  // Register plugins
  await fastify.register(cors, {
    ...appConfig.cors,
    origin: process.env.CORS_ORIGIN || true,
  });

  await fastify.register(multipart, {
    limits: {
      fileSize: appConfig.upload.maxFileSize,
    },
  });

  await fastify.register(jwt, {
    secret: appConfig.jwt.secret,
  });

  // Health check
  fastify.get('/health', async () => {
    return {
      status: 'ok',
      timestamp: Date.now(),
      environment: appConfig.nodeEnv,
      version: '1.0.0',
    };
  });

  // Register routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(pdfRoutes, { prefix: '/api/pdf' });

  fastify.setErrorHandler(errorHandler);
  fastify.setNotFoundHandler(notFoundHandler);

  await fastify.ready();
  
  return fastify;
}

async function getFastifyInstance() {
  if (!fastifyInstance) {
    fastifyInstance = await createFastifyInstance();
  }
  return fastifyInstance;
}

// Vercel serverless function handler
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const fastify = await getFastifyInstance();
  
  // Read request body if present
  let body = '';
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    await new Promise((resolve) => req.on('end', resolve));
  }
  
  // Build URL with query string
  const url = req.url || '/';
  const queryString = url.includes('?') ? url.split('?')[1] : '';
  
  // Use Fastify's inject method to handle the request
  const response = await fastify.inject({
    method: req.method || 'GET',
    url: url.split('?')[0],
    headers: req.headers as Record<string, string>,
    payload: body || undefined,
    query: queryString ? Object.fromEntries(new URLSearchParams(queryString)) : {},
  });
  
  // Set response headers
  Object.keys(response.headers).forEach((key) => {
    const value = response.headers[key];
    if (value) {
      res.setHeader(key, value);
    }
  });
  
  // Send response
  res.statusCode = response.statusCode;
  res.end(response.payload);
}

