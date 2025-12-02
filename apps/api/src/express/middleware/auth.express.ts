import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { appConfig } from '../../config/app.config.js';
import { createLogger } from '../../config/logger.config.js';

const logger = createLogger('auth-middleware');

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    username: string;
  };
}

export async function authenticateRequest(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn({ path: req.path }, 'Missing or invalid authorization header');
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or missing token',
        code: 'UNAUTHORIZED',
      });
      return;
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, appConfig.jwt.secret) as {
        userId: string;
        username: string;
      };

      (req as AuthenticatedRequest).user = decoded;
      logger.debug({ userId: decoded.userId }, 'Request authenticated');
      next();
    } catch (jwtError) {
      logger.warn({ error: jwtError }, 'Invalid JWT token');
      res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid token',
        code: 'INVALID_TOKEN',
      });
    }
  } catch (error) {
    logger.error({ error }, 'Authentication error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
}

