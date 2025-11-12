
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { createLogger } from '../config/logger.config.js';
import { appConfig } from '../config/app.config.js';

const logger = createLogger('error-handler');

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: unknown;
  stack?: string;
}

function formatZodError(error: ZodError): ErrorResponse {
  const details = error.errors.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
  }));

  return {
    success: false,
    error: 'Validation error',
    code: 'VALIDATION_ERROR',
    details,
  };
}

function formatAppError(error: AppError, includeStack: boolean): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: error.message,
    code: error.code,
    details: error.details,
  };

  if (includeStack) {
    response.stack = error.stack;
  }

  return response;
}

function formatGenericError(error: Error, includeStack: boolean): ErrorResponse {
  const response: ErrorResponse = {
    success: false,
    error: appConfig.nodeEnv === 'production' 
      ? 'Internal server error' 
      : error.message,
  };

  if (includeStack) {
    response.stack = error.stack;
  }

  return response;
}

export async function errorHandler(
  error: FastifyError | AppError | ZodError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const isDevelopment = appConfig.nodeEnv === 'development';
  
  // Log error with context
  logger.error(
    {
      error,
      method: request.method,
      url: request.url,
      userId: (request.user as any)?.userId,
    },
    'Request error'
  );

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response = formatZodError(error);
    return reply.code(400).send(response);
  }

  // Handle application errors
  if (error instanceof AppError) {
    const response = formatAppError(error, isDevelopment);
    return reply.code(error.statusCode).send(response);
  }

  // Handle Fastify errors
  if ('statusCode' in error && error.statusCode) {
    return reply.code(error.statusCode).send({
      success: false,
      error: error.message,
      code: (error as FastifyError).code,
    });
  }

  // Handle generic errors
  const response = formatGenericError(error, isDevelopment);
  return reply.code(500).send(response);
}

export async function notFoundHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  logger.warn(
    {
      method: request.method,
      url: request.url,
    },
    'Route not found'
  );

  return reply.code(404).send({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
}

