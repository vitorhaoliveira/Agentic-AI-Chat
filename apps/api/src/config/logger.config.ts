import pino from 'pino';
import { appConfig } from './app.config.js';

const isDevelopment = appConfig.nodeEnv === 'development';
const isTest = appConfig.nodeEnv === 'test';

export const loggerConfig = {
  level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
  
  // Pretty print in development
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
          singleLine: false,
        },
      }
    : undefined,

  // Disable logging in test environment
  enabled: !isTest,
  
  // Serializers for common objects
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err,
  },
};

export const logger = pino(loggerConfig);

export function createLogger(context: string) {
  return logger.child({ context });
}

