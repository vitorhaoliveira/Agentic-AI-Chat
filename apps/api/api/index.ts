// Vercel Serverless Handler with Express
import '../src/config/env.js';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@agentic-ai-chat/shared';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// Simple login route
app.post('/api/auth/login', (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid credentials format',
        code: 'VALIDATION_ERROR',
      });
    }
    
    const { username, password } = validation.data;
    
    if (username !== 'demo' || password !== 'password123') {
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
      process.env.JWT_SECRET || 'supersecretkey-change-in-production',
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV || 'development',
  });
});

export default app;

