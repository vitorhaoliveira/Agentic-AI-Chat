// Vercel Serverless Handler with Express
import '../src/config/env.js';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { appConfig } from '../src/config/app.config.js';

// Import Express routes
import authRoutes from '../src/express/routes/auth.express.js';
import chatRoutes from '../src/express/routes/chat.express.js';
import pdfRoutes from '../src/express/routes/pdf.express.js';

const app = express();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: appConfig.upload.maxFileSize,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

// Middleware - CORS must be first
// Handle OPTIONS requests before CORS middleware
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    return res.status(204).end();
  }
  next();
});

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', upload.single('pdf'), chatRoutes);
app.use('/api/pdf', upload.single('file'), pdfRoutes);

// Global error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('Unhandled error:', err);
  if (!res.headersSent) {
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Export handler for Vercel
export default app;
