import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@agentic-ai-chat/shared';
import type { LoginRequest, ApiResponse, LoginResponse } from '@agentic-ai-chat/shared';
import { createLogger } from '../../config/logger.config.js';
import { appConfig } from '../../config/app.config.js';

const logger = createLogger('auth-routes');
const router = Router();

router.post('/login', async (req, res) => {
  logger.info('Login attempt');

  try {
    // Validate input
    const validation = loginSchema.safeParse(req.body);

    if (!validation.success) {
      logger.warn({ errors: validation.error.errors }, 'Login validation failed');
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials format',
        code: 'VALIDATION_ERROR',
      });
    }

    const { username, password } = validation.data;

    // Mock authentication - only accept demo credentials
    const MOCK_USERNAME = 'demo';
    const MOCK_PASSWORD = 'password123';

    if (username !== MOCK_USERNAME || password !== MOCK_PASSWORD) {
      logger.warn({ username }, 'Invalid credentials attempt');
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password',
        code: 'INVALID_CREDENTIALS',
      });
    }

    const user = {
      id: crypto.randomUUID(),
      username,
    };

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      appConfig.jwt.secret,
      { expiresIn: appConfig.jwt.expiresIn }
    );

    logger.info({ userId: user.id, username }, 'User logged in successfully');

    return res.json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Login error');
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

