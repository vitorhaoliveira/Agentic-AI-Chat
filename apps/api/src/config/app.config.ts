// Ensure dotenv is loaded before accessing process.env
import './env.js';

export const appConfig = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET || 'supersecretkey-change-in-production',
    expiresIn: '7d',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf'],
  },

  // PDF Processing Configuration
  pdf: {
    minTextLength: 50,
    maxContextLength: 8000,
  },

  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || true,
    credentials: true,
  },

  // Data Directory
  dataDir: process.env.DATA_DIR || './data',
} as const;

export function validateConfig(): void {
  const requiredEnvVars = ['OPENAI_API_KEY'];
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }

  if (appConfig.nodeEnv === 'production' && appConfig.jwt.secret === 'supersecretkey-change-in-production') {
    throw new Error('JWT_SECRET must be set in production environment');
  }
}

