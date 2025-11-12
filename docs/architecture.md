# Agentic AI Chat - System Architecture

## Overview

This is a full-stack agentic AI chat system built with a focus on **autonomous agents** rather than fixed workflows. The system can answer questions about weather, currency exchange rates, and PDF documents through intelligent agent orchestration.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend (React)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Chat UI      │  │ PDF Uploader │  │ Auth         │       │
│  │ (SSE Stream) │  │              │  │ (Mock JWT)   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/SSE
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend (Fastify)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Custom Agent System                    │   │
│  │                                                      │   │
│  │   ┌────────┐    ┌─────────┐    ┌──────────┐          │   │
│  │   │ Router │───▶│ Weather │───▶│          │          │   │
│  │   │ Agent  │    │ Agent   │    │          │          │   │
│  │   └────────┘    └─────────┘    │          │          │   │
│  │       │                        │ Synthe-  │          │   │
│  │       │         ┌─────────┐    │ sizer    │          │   │
│  │       ├────────▶│Currency │───▶│ (GPT-4)  │          │   │
│  │       │         │ Agent   │    │          │          │   │
│  │       │         └─────────┘    │          │          │   │
│  │       │                        │          │          │   │
│  │       │         ┌─────────┐     │          │         │   │
│  │       └────────▶│PDF Search│───▶│          │         │   │
│  │                 │ Agent    │    └──────────┘         │   │
│  │                 └─────────┘                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌───────────┐  ┌───────────┐  ┌────────────┐               │
│  │ OpenAI    │  │ Tools     │  │ PDF Index  │               │
│  │ GPT-4     │  │ (APIs)    │  │ (TF-IDF)   │               │
│  └───────────┘  └───────────┘  └────────────┘               │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────┐
         │      External APIs                 │
         │  • Open-Meteo (Weather)            │
         │  • exchangerate.host (Currency)    │
         └────────────────────────────────────┘
```

## Key Components

### Frontend (apps/web)

**Tech Stack**: React 18, Vite, TypeScript, Tailwind CSS, Zustand, React Query, Vitest

**Directory Structure**:
```
src/
├── config/              # Centralized configuration
│   └── app.config.ts
├── utils/               # Utilities
│   ├── logger.ts        # Structured logging
│   └── toast.ts         # Toast notifications
├── services/            # Business logic layer
│   ├── api.service.ts
│   ├── storage.service.ts
│   ├── fileValidation.service.ts
│   ├── conversation.service.ts
│   └── __tests__/
├── store/               # Zustand stores (separated)
│   ├── conversationStore.ts
│   ├── messageStore.ts
│   └── authStore.ts
├── components/
│   ├── ErrorBoundary.tsx
│   ├── sidebar/         # 6 sidebar components
│   ├── chat/
│   ├── ui/
│   └── modals/
├── hooks/
├── pages/
└── test/
```

**Components**:
- `ChatContainer`: Main chat interface with message list
- `ChatMessage`: Individual message rendering
- `ChatInput`: Text input with send functionality (with validation)
- `StreamingMessage`: Real-time token display during streaming
- `ErrorBoundary`: Global error handling
- **Sidebar Components**:
  - `Sidebar`: Container
  - `SidebarSearch`: Conversation search
  - `NewChatButton`: Create new conversation
  - `ConversationList`: List of conversations (memoized)
  - `ConversationItem`: Individual conversation (memoized)
  - `UserProfile`: User info and logout (memoized)

**State Management**:
- `authStore` (Zustand): Authentication state and JWT token
- `conversationStore` (Zustand): Conversation CRUD and persistence
- `messageStore` (Zustand): Message management and streaming state

**Services**:
- `api.service.ts`: API client with logging
- `storage.service.ts`: LocalStorage abstraction
- `fileValidation.service.ts`: PDF validation
- `conversation.service.ts`: Conversation logic (title generation, sorting, filtering)

**Features**:
- Real-time SSE streaming
- Responsive design
- Toast notifications (react-hot-toast)
- Protected routes with lazy loading
- Error boundaries
- Structured logging
- Unit testing

### Backend (apps/api)

**Tech Stack**: Node.js, Fastify, TypeScript, Custom Agent System, OpenAI SDK, Pino, Vitest

**Directory Structure**:
```
src/
├── config/              # Centralized configuration
│   ├── app.config.ts    # Application settings
│   ├── llm.config.ts    # LLM configuration
│   └── logger.config.ts # Logging setup
├── middleware/          # Reusable middleware
│   ├── auth.middleware.ts
│   └── error-handler.middleware.ts
├── prompts/             # LLM prompt templates
│   └── agent-prompts.ts
├── routes/              # API routes
├── agents/              # Agent orchestration
├── tools/               # External API integrations
├── services/            # Business logic services
└── utils/               # Utilities
```

**Routes**:
- `POST /api/auth/login`: Mock authentication
- `POST /api/chat/stream`: SSE streaming chat endpoint
- `POST /api/pdf/upload`: PDF upload and indexing
- `GET /api/pdf/list`: List uploaded PDFs
- `GET /health`: Health check

**Agent System** (Custom Orchestration):

The system uses **autonomous agents**, not fixed workflows. Each agent makes dynamic decisions:

1. **Router Agent**: 
   - Analyzes user query with LLM
   - Decides which tool(s) to invoke
   - Uses LLM-based routing (not keyword matching)

2. **Weather Agent**:
   - Extracts location from query using LLM
   - Calls Open-Meteo geocoding + weather API
   - Returns structured weather data
   - Smart Brazilian geocoding

3. **Currency Agent**:
   - Extracts currencies and amounts using LLM
   - Calls exchangerate API
   - Returns exchange rate data
   - Professional value formatting

4. **PDF Search Agent**:
   - Searches indexed PDFs using TF-IDF
   - Returns relevant excerpts with scores
   - Works across all uploaded PDFs

5. **Synthesizer Agent**:
   - Takes tool results
   - Uses GPT-4o-mini to generate natural language response
   - Streams tokens to client via SSE

**Services**:
- `llm.ts`: OpenAI client with streaming support and structured logging
- `pdf-index.ts`: TF-IDF indexing and search (persisted to JSON)
- `pdf-processor.service.ts`: PDF extraction and validation
- `request-parser.service.ts`: Request parsing for JSON and multipart

**Tools**:
- `weather.ts`: Open-Meteo integration with logging
- `currency.ts`: Exchange rate API integration with logging
- `pdf-reader.ts`: PDF search with TF-IDF

**Configuration**:
- `app.config.ts`: Application settings (port, JWT, file limits, etc.)
- `llm.config.ts`: LLM/OpenAI configuration
- `logger.config.ts`: Pino logger setup with environment-specific settings

**Middleware**:
- `auth.middleware.ts`: JWT authentication (reusable across routes)
- `error-handler.middleware.ts`: Global error handling with AppError class

**Prompts**:
- `agent-prompts.ts`: Centralized LLM prompt templates and builders

### Shared Package (packages/shared)

**Purpose**: Type definitions and validation schemas shared between frontend and backend

**Exports**:
- TypeScript types (Message, AgentState, API types)
- Zod validation schemas
- Ensures type safety across the monorepo

## Data Flow

### Chat Message Flow

1. User types message in frontend
2. Frontend calls `POST /api/chat/stream` with SSE
3. Backend receives message, validates with Zod
4. Custom agent graph is invoked:
   - Router analyzes query → selects tool
   - Tool agent executes (weather/currency/PDF)
   - Synthesizer receives tool results
   - GPT-4o-mini generates response with streaming
5. Tokens stream back via SSE
6. Frontend updates UI in real-time

### PDF Upload Flow

1. User drags/drops PDF file
2. Frontend uploads via `POST /api/pdf/upload`
3. Backend:
   - Validates file type and size
   - Parses PDF with `pdf-parse`
   - Calculates TF-IDF index
   - Persists index to `data/pdf-index.json`
4. PDF is now searchable by the agent

## Agents vs Workflows

**This system uses AGENTS, not workflows:**

- ❌ **Workflow**: Fixed sequence of steps (A → B → C)
- ✅ **Agents**: Dynamic decision-making based on state

**How it works**:
- The Router agent autonomously decides which tool to use
- Tool agents execute independently
- The Synthesizer adapts its response based on what tools ran
- Agents can be extended without changing the core flow

## Scalability

The architecture supports:

1. **Adding new tools**: Create new tool + agent node
2. **Multiple tool execution**: Router can invoke multiple tools
3. **Custom routing logic**: Upgrade router to use LLM-based decisions
4. **Caching**: Add Redis for tool result caching
5. **Vector search**: Upgrade PDF search to embeddings + vector DB

## Security

- JWT authentication (mock in current version)
- Input validation with Zod schemas
- File upload size limits (10MB)
- CORS configuration (configurable by environment)
- Rate limiting (recommended for production)
- Global error handler (sanitizes errors in production)
- AppError class for controlled error responses

## Performance

- SSE streaming for low latency perception
- In-memory TF-IDF index (loaded at startup)
- Efficient tool execution with early returns
- Minimal dependencies
- Structured logging with Pino (faster than console.log)
- Type-safe configuration (no runtime checks needed)

## Development

### Prerequisites
- Node.js 18+
- OpenAI API key

### Setup
```bash
# Install dependencies
npm install

# Create .env in apps/api
# Add OPENAI_API_KEY

# Start frontend and backend
npm run dev
```

### Project Structure
```
the-project/
├── apps/
│   ├── web/        # React frontend
│   └── api/        # Fastify backend
│       ├── src/
│       │   ├── config/      # Configuration
│       │   ├── middleware/  # Middleware
│       │   ├── prompts/     # LLM prompts
│       │   ├── routes/      # API routes
│       │   ├── agents/      # Agent system
│       │   ├── tools/       # External APIs
│       │   ├── services/    # Business logic
│       │   └── utils/       # Utilities
│       ├── IMPROVEMENTS.md  # Code quality improvements
│       ├── SETUP.md         # Setup guide
│       └── SUMMARY.md       # Improvements summary
├── packages/
│   └── shared/     # Shared types and schemas
└── docs/           # Documentation
```

See [apps/web/README.md](../apps/web/README.md)

## License

MIT

