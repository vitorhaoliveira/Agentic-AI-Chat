// Vercel Serverless Handler with Express
import '../src/config/env.js';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { loginSchema } from '@agentic-ai-chat/shared';
import { executeAgentTools } from '../src/agents/graph.js';
import { streamCompletion } from '../src/services/llm.js';
import { buildSystemPrompt } from '../src/prompts/agent-prompts.js';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));
app.use(express.json());

// JWT Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - Invalid or missing token',
      });
    }
    
    const token = authHeader.substring(7);
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'supersecretkey-change-in-production'
    );
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized - Invalid or missing token',
    });
  }
};

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

// Chat route with streaming
app.post('/api/chat/stream', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }
    
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    
    // Execute agent tools
    const agentState = await executeAgentTools(message);
    
    // Send tool notifications
    if (agentState.toolResults && agentState.toolResults.length > 0) {
      for (const toolResult of agentState.toolResults) {
        res.write(`event: tool\ndata: ${JSON.stringify({ tool: toolResult.toolName })}\n\n`);
      }
    }
    
    // Build context
    const toolResultsText = agentState.toolResults
      .map((tr: any) => {
        if (tr.error) {
          return `Tool ${tr.toolName} failed: ${tr.error}`;
        }
        return `Tool ${tr.toolName} result: ${JSON.stringify(tr.result, null, 2)}`;
      })
      .join('\n\n');
    
    const systemPrompt = buildSystemPrompt({
      toolResults: toolResultsText || 'No tools were used.',
    });
    
    // Stream response
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: message },
    ];
    
    for await (const token of streamCompletion({ messages })) {
      res.write(`event: token\ndata: ${JSON.stringify({ token })}\n\n`);
    }
    
    res.write(`event: done\ndata: {}\n\n`);
    res.end();
  } catch (error) {
    console.error('Chat error:', error);
    res.write(`event: error\ndata: ${JSON.stringify({ error: 'Internal server error' })}\n\n`);
    res.end();
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

