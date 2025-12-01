// Vercel Serverless Function Handler
import '../src/config/env.js';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { appConfig } from '../src/config/app.config.js';
import authRoutes from '../src/routes/auth.js';
import chatRoutes from '../src/routes/chat.js';
import pdfRoutes from '../src/routes/pdf.js';

let fastify: any = null;

async function build() {
  if (fastify) return fastify;
  
  fastify = Fastify({ logger: false });
  
  // CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
  
  // JWT
  await fastify.register(jwt, { secret: appConfig.jwt.secret });
  
  // Routes
  await fastify.register(authRoutes, { prefix: '/api/auth' });
  await fastify.register(chatRoutes, { prefix: '/api/chat' });
  await fastify.register(pdfRoutes, { prefix: '/api/pdf' });
  
  return fastify;
}

export default async function handler(req: any, res: any) {
  const app = await build();
  await app.ready();
  app.server.emit('request', req, res);
}

