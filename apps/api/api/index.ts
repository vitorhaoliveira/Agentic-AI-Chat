// Vercel Serverless Handler with Express
import '../src/config/env.js';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { loginSchema } from '@agentic-ai-chat/shared';
import { executeAgentTools } from '../src/agents/graph.js';
import { streamCompletion } from '../src/services/llm.js';
import { buildSystemPrompt } from '../src/prompts/agent-prompts.js';
import { indexPdf, getPdfDocuments } from '../src/services/pdf-index.js';

const app = express();

// Multer config for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
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

// JWT Middleware
const authMiddleware = (req: any, res: any, next: any) => {
  // Allow OPTIONS requests (CORS preflight) to pass through
  if (req.method === 'OPTIONS') {
    return next();
  }
  
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

// PDF Upload
app.post('/api/pdf/upload', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE',
      });
    }
    
    const pdfDoc = await indexPdf(req.file.originalname, req.file.buffer);
    
    res.json({
      success: true,
      data: {
        id: pdfDoc.id,
        filename: pdfDoc.filename,
        size: pdfDoc.size,
        uploadedAt: pdfDoc.uploadedAt,
      },
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload PDF',
    });
  }
});

// PDF List
app.get('/api/pdf/list', authMiddleware, async (req, res) => {
  try {
    const documents = await getPdfDocuments();
    
    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    console.error('PDF list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list PDFs',
    });
  }
});

// Chat with PDF support
app.post('/api/chat/stream-with-pdf', authMiddleware, upload.single('pdf'), async (req, res) => {
  try {
    const message = req.body.message;
    
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
    
    // Handle PDF if uploaded
    let pdfContext = '';
    if (req.file) {
      try {
        const pdfDoc = await indexPdf(req.file.originalname, req.file.buffer);
        pdfContext = `\n\nPDF Context (${pdfDoc.filename}):\n${(pdfDoc as any).content?.substring(0, 8000) || 'No text extracted'}`;
        res.write(`event: tool\ndata: ${JSON.stringify({ tool: 'pdf_reader' })}\n\n`);
      } catch (pdfError) {
        console.error('PDF processing error:', pdfError);
        pdfContext = '\n\nPDF processing failed.';
      }
    }
    
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
    }) + pdfContext;
    
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
    console.error('Chat with PDF error:', error);
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

