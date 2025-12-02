# Migration from Fastify to Express

## Date: December 2025

## Overview

Successfully migrated the backend from Fastify to Express to resolve conflicts between the serverless (Vercel) implementation and local development server.

## Problems Solved

1. **Dual Server Conflict**: Had two different server implementations (Fastify for local, Express for serverless)
2. **SSE Format Mismatch**: Backend was sending incorrect SSE format that frontend couldn't parse
3. **Response Not Displaying**: Tokens were being generated but not shown in the UI

## Changes Made

### 1. Fixed SSE Format

**Before:**
```javascript
res.write(`event: token\ndata: {"token":"..."}\n\n`);
res.write(`event: done\ndata: {}\n\n`);
```

**After:**
```javascript
res.write(`data: {"content":"..."}\n\n`);
res.write(`data: [DONE]\n\n`);
```

### 2. Created Express Structure

New files created in `src/express/`:
- `server.express.ts` - Main Express server (replaces `src/server.ts`)
- `routes/auth.express.ts` - Authentication routes
- `routes/chat.express.ts` - Chat streaming routes
- `routes/pdf.express.ts` - PDF upload/list routes
- `middleware/auth.express.ts` - JWT authentication middleware
- `utils/sse-stream.express.ts` - SSE streaming utility

### 3. Files Deleted

Removed Fastify-specific files:
- `src/server.ts`
- `src/routes/auth.ts`
- `src/routes/chat.ts`
- `src/routes/pdf.ts`
- `src/middleware/auth.middleware.ts`
- `src/utils/streaming.ts`
- `src/services/request-parser.service.ts`

### 4. Files Modified

- `api/index.ts` - Refactored to use modular Express routes
- `package.json` - Updated scripts to use Express server
- `src/middleware/error-handler.middleware.ts` - Kept only AppError class
- `README.md` - Updated documentation
- `docs/architecture.md` - Updated architecture diagrams

### 5. Reusable Components

These files remain unchanged and are shared:
- `src/config/*` - All configuration files
- `src/agents/*` - Agent orchestration
- `src/tools/*` - External API integrations
- `src/services/llm.ts` - OpenAI service
- `src/services/pdf-index.ts` - PDF indexing
- `src/services/pdf-processor.service.ts` - PDF processing
- `src/prompts/*` - Prompt templates

## Architecture

### Before
```
apps/api/
├── api/index.ts (Express serverless)
└── src/
    ├── server.ts (Fastify local)
    ├── routes/ (Fastify)
    └── middleware/ (Fastify)
```

### After
```
apps/api/
├── api/index.ts (Express serverless - uses modular routes)
└── src/
    ├── express/
    │   ├── server.express.ts (Express local)
    │   ├── routes/ (Express modular)
    │   ├── middleware/ (Express)
    │   └── utils/ (Express SSE)
    └── ... (shared services, config, agents, tools)
```

## Running the Server

### Development
```bash
npm run dev
```
Now runs: `tsx watch src/express/server.express.ts`

### Production Build
```bash
npm run build
npm start
```
Now runs: `node dist/express/server.express.js`

### Vercel Deployment
No changes needed - `api/index.ts` is the entry point and now uses the same Express routes.

## Benefits

1. **Single Framework**: Only Express throughout the codebase
2. **Code Reuse**: Modular routes used in both local and serverless
3. **Correct SSE**: Frontend now properly receives and displays responses
4. **Maintainability**: One codebase to maintain instead of two
5. **Consistency**: Same behavior in development and production

## Testing

All routes tested and working:
- ✅ `/health` - Health check
- ✅ `/api/auth/login` - Authentication
- ✅ `/api/chat/stream` - Chat streaming with SSE
- ✅ `/api/pdf/upload` - PDF upload
- ✅ `/api/pdf/list` - List PDFs

## Migration Notes

- No breaking changes to API endpoints
- No changes to environment variables
- No changes to database/storage
- Frontend requires no changes (SSE format was already expected)

