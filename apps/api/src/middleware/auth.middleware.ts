import type { FastifyRequest, FastifyReply } from 'fastify';
import { createLogger } from '../config/logger.config.js';

const logger = createLogger('auth-middleware');

export async function authenticateRequest(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify();
    logger.debug({ userId: request.user }, 'User authenticated');
  } catch (err) {
    logger.warn({ error: err }, 'Authentication failed');
    reply.code(401).send({ 
      success: false, 
      error: 'Unauthorized - Invalid or missing token' 
    });
  }
}
