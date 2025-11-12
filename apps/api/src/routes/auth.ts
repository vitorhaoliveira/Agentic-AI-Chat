import type { FastifyPluginAsync } from 'fastify';
import { loginSchema } from '@agentic-ai-chat/shared';
import type { LoginRequest, ApiResponse, LoginResponse } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';
import { appConfig } from '../config/app.config.js';
import { AppError } from '../middleware/error-handler.middleware.js';

const logger = createLogger('auth-routes');

const authRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{ Body: LoginRequest; Reply: ApiResponse<LoginResponse> }>(
    '/login',
    async (request, reply) => {
      logger.info('Login attempt');

      // Validate input
      const validation = loginSchema.safeParse(request.body);

      if (!validation.success) {
        logger.warn({ errors: validation.error.errors }, 'Login validation failed');
        throw new AppError('Invalid credentials format', 400, 'VALIDATION_ERROR');
      }

      const { username, password } = validation.data;

      // Mock authentication - only accept demo credentials
      const MOCK_USERNAME = 'demo';
      const MOCK_PASSWORD = 'password123';

      if (username !== MOCK_USERNAME || password !== MOCK_PASSWORD) {
        logger.warn({ username }, 'Invalid credentials attempt');
        throw new AppError('Invalid username or password', 401, 'INVALID_CREDENTIALS');
      }

      const user = {
        id: crypto.randomUUID(),
        username,
      };

      const token = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: appConfig.jwt.expiresIn }
      );

      logger.info({ userId: user.id, username }, 'User logged in successfully');

      return reply.send({
        success: true,
        data: {
          token,
          user,
        },
      });
    }
  );
};

export default authRoutes;

