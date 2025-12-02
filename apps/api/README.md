# Agentic AI Chat - Backend API

> **Enterprise-grade Express + Agent-based backend** with structured logging, centralized configuration, and comprehensive error handling.

## ✨ Features

### Core Functionality
- 🚀 **RESTful API** with Express (reliable and widely-supported)
- 🤖 **Autonomous Agent System** - Custom lightweight orchestration
- 💬 **OpenAI GPT-4o-mini** integration with streaming
- 📄 **PDF Processing** - Extract and index PDF content
- 🔐 **JWT Authentication** - Secure token-based auth
- 🌊 **Server-Sent Events (SSE)** - Real-time streaming

### Agent Tools
- 🌤️ **Weather** - Open-Meteo API integration
- 💱 **Currency** - Real-time exchange rates
- 📚 **PDF Search** - TF-IDF based document search

### Code Quality Features ⭐
- 📊 **Structured Logging** - Pino logger with context
- ⚙️ **Centralized Config** - Type-safe configuration
- 🎯 **Error Handling** - Comprehensive error middleware
- 🧪 **Testing** - Vitest with coverage
- 📝 **Type Safety** - Full TypeScript with no `any`
- 🔄 **Clean Architecture** - Service-based organization

## 🚀 Quick Start

```bash
# Install dependencies
cd apps/api
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Run in development
npm run dev

# Run tests
npm test
```

Server will start at: http://localhost:3001

## 📖 Documentation

- **[API Endpoints](#api-endpoints)** - See below

## 🏗️ Architecture

```
src/
├── config/              # ⚙️ Centralized configuration
├── express/             # 🚀 Express server and routes
│   ├── server.express.ts  # Main Express server
│   ├── routes/          # API route handlers
│   ├── middleware/      # Express middleware
│   └── utils/           # Express utilities (SSE)
├── prompts/            # 💬 LLM prompt templates
├── services/           # 🔧 Business logic services
├── agents/             # 🤖 Agent orchestration
└── tools/              # 🛠️ External API integrations
```

### Key Principles

✅ **SOLID Principles** - Single responsibility, dependency injection  
✅ **Clean Code** - Small functions, meaningful names  
✅ **Type Safety** - Full TypeScript, no `any` types  
✅ **Error Handling** - Proper error types and messages  
✅ **Testing** - Unit tests with good coverage  

### Authentication

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "demo",
  "password": "password123"
}
```

### Chat Streaming

```http
POST /api/chat/stream
Authorization: Bearer <token>
Content-Type: application/json

{
  "message": "What's the weather in London?"
}
```

### PDF Upload

```http
POST /api/pdf/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <pdf-file>
```

### Health Check

```http
GET /health
```

## 🤖 Agent Architecture

**Autonomous Agent System** - Not a fixed workflow, agents decide based on context:

1. **Router** - Analyzes query and routes to appropriate tool
2. **Weather Agent** - Fetches weather data (Open-Meteo)
3. **Currency Agent** - Gets exchange rates
4. **PDF Agent** - Searches indexed documents
5. **Synthesizer** - GPT-4 natural language generation

## 🛠️ Tech Stack

| Category | Technologies |
|----------|-------------|
| **Runtime** | Node.js, TypeScript |
| **Framework** | Express (reliable and widely-supported) |
| **AI/LLM** | OpenAI GPT-4o-mini (custom agent orchestration) |
| **Logging** | Pino (structured logging) |
| **Validation** | Zod (runtime validation) |
| **Testing** | Vitest, @vitest/coverage-v8 |
| **Auth** | JWT (jsonwebtoken) |
| **PDF** | pdf-parse, TF-IDF indexing |

## 🔧 Development

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run production
npm start

# Run tests
npm test

# Test with coverage
npm run test:coverage

# Lint code
npm run lint
```

## 🌍 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | - | OpenAI API key |
| `PORT` | No | `3001` | Server port |
| `NODE_ENV` | No | `development` | Environment |
| `JWT_SECRET` | Prod only | (default) | JWT secret |
| `LOG_LEVEL` | No | `debug` | Log level |

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📝 Logging

**Development (pretty):**
```
[14:23:45] INFO  (server): 🚀 Server started
    port: 3001
    environment: "development"
```

**Production (JSON):**
```json
{"level":30,"time":1699876543210,"msg":"Server started","port":3001}
```


## 📚 Learn More

- **[Project Docs](../../docs/)** - System architecture
