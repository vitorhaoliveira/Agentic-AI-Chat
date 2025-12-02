# Agentic AI Chat System

An intelligent chat assistant powered by autonomous AI agents (not workflows) with custom orchestration. The system can answer questions about weather, currency exchange rates, and PDF documents in Portuguese and English.

## Features

- 🤖 **Autonomous Agents**: Dynamic decision-making with custom lightweight orchestration
- 🌤️ **Weather Information**: Real-time weather data via Open-Meteo (accent-aware)
- 💱 **Currency Exchange**: Live exchange rates with Portuguese support (dólar, real, euro)
- 📄 **PDF Search**: Upload and query PDF documents with TF-IDF indexing
- ⚡ **Real-time Streaming**: Server-Sent Events (SSE) for live responses
- 🎨 **Modern UI**: Beautiful interface with Tailwind CSS and shadcn/ui
- 🔐 **Authentication**: JWT-based auth (mock for demo)
- 🌍 **Bilingual**: Full support for Portuguese and English queries

## Architecture

This is a **monorepo** with npm workspaces:

```
the-project/
├── apps/
│   ├── web/          # React + Vite frontend
│   └── api/          # Express + Custom Agent System backend
├── packages/
│   └── shared/       # Shared TypeScript types and Zod schemas
└── docs/
    ├── architecture.md          # Detailed architecture documentation
    └── architecture-diagram.md  # 📊 Mermaid diagrams (visual architecture)
```

**📊 [View Architecture Diagrams](docs/architecture-diagram.md)** - Complete visual architecture with 10 interactive Mermaid diagrams covering:
- System overview
- **Agent orchestration flow** (core focus)
- State transitions
- Component hierarchy
- Streaming sequences
- Tool architecture

### Tech Stack

**Frontend**:
- React 18, Vite, TypeScript
- Tailwind CSS, shadcn/ui
- Zustand (state management - separated stores)
- React Query (data fetching)
- React Router (routing with lazy loading)
- react-hot-toast (notifications)
- react-error-boundary (error handling)
- Vitest (testing framework)

**Backend**:
- Node.js, Express, TypeScript
- Custom Agent Orchestration (lightweight, no LangGraph)
- Groq Llama 3.3 70B (Free LLM with ultra-fast streaming) ⚡
- Pino (structured logging)
- Vitest (testing framework)
- pdf-parse (PDF extraction)
- TF-IDF indexing (persisted to JSON)

**External APIs**:
- Open-Meteo (weather)
- open.er-api.com (currency)

## Quick Start

### Prerequisites

- Node.js 18+
- Groq API key (free at https://console.groq.com)

### Installation

```bash
# Install all dependencies
npm install

# Create .env file in apps/api
cat > apps/api/.env << EOF
PORT=3001
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_secret_key_here
DATA_DIR=./data
EOF
```

**Get your FREE Groq API key:**
1. Visit https://console.groq.com
2. Sign up (free)
3. Generate an API key
4. Add it to `apps/api/.env`

**Why Groq?**
- ✅ **100% Free** - 14,400 requests/day
- ✅ **Extremely Fast** - Up to 10x faster than GPT-4
- ✅ **No Credit Card** - No billing required
- ✅ **Production Ready** - Powers many apps

### Development

```bash
# Start both frontend and backend
npm run dev

# Or start separately:
npm run dev:web    # Frontend on http://localhost:3000
npm run dev:api    # Backend on http://localhost:3001
```

### Build

```bash
# Build all workspaces
npm run build
```

## Usage

1. **Login**: Use any username (min 3 chars) and password (min 6 chars)
2. **Upload PDF**: Click "Attach PDF" button in the chat input
3. **Ask Questions**:
   - "What's the weather in São Paulo?"
   - "Convert 100 USD to EUR"
   - "Search for [topic] in my PDF"

### 📄 How to Use PDF Attachments (ChatGPT-style)

1. Click "Attach PDF" button in the chat input
2. Select a PDF file (max 10MB)
3. The PDF preview appears above the input
4. Type your question and press Send
5. The AI reads the PDF and answers your question

**Examples:**
- "What is this document about?"
- "Summarize the main points"
- "Find information about [topic] in this PDF"
- "O que diz este documento?"

**Note:** PDFs are processed on-demand and not stored permanently. Attach a new PDF for each conversation.

**⚠️ Important:** PDFs must have **selectable text**. Scanned PDFs (images) won't work. Use OCR tools like [ilovepdf.com/ocr-pdf](https://www.ilovepdf.com/ocr-pdf) to convert scanned PDFs first.

See **[PDF_TROUBLESHOOTING.md](PDF_TROUBLESHOOTING.md)** if you get "cannot read PDF" errors.

## Agent System

The system uses a **custom lightweight agent orchestration** (no external dependencies):

```
User Query → Router Agent (LLM) → [Weather/Currency/PDF] Agent → Synthesizer (Llama 3.3 70B) → Response
```

**Key Difference from Workflows**:
- ❌ Workflow: Fixed sequence (A → B → C)
- ✅ Agents: Dynamic decisions based on query

**How it works**:
- **Router Agent**: Uses LLM to analyze intent (not keyword-based!)
- **Tool Selection**: Dynamically chooses weather/currency/PDF tool
- **Entity Extraction**: LLM extracts locations, currencies, etc.
- **Synthesis**: Streams response with SSE
- **Bilingual**: Works with Portuguese and English queries

Agents autonomously decide what tools to use based on the user's query.

**Example Flow**:
1. User: "qual a cotação do dólar?"
2. Router → Llama 3.3 analyzes → "currency intent detected"
3. Currency Agent → Llama 3.3 extracts → "FROM:USD TO:BRL"
4. API call → Exchange rate retrieved
5. Synthesizer → Llama 3.3 streams → "1 USD = 5.23 BRL"

## Project Structure

### Frontend (apps/web)

```
src/
├── config/              # Centralized configuration
│   └── app.config.ts
├── utils/               # Utilities
│   ├── logger.ts        # Structured logging
│   └── toast.ts         # Toast notifications
├── services/            # Business logic layer
│   ├── api.service.ts          # API client
│   ├── storage.service.ts      # LocalStorage abstraction
│   ├── fileValidation.service.ts
│   ├── conversation.service.ts
│   └── __tests__/       # Service tests
├── components/
│   ├── ErrorBoundary.tsx       # Global error boundary
│   ├── sidebar/         # Sidebar components (6)
│   ├── ui/              # shadcn/ui components
│   ├── chat/            # Chat components
│   ├── auth/            # Authentication
│   └── modals/          # Modal components
├── store/               # Zustand stores (separated)
│   ├── conversationStore.ts    # Conversation management
│   ├── messageStore.ts         # Message management
│   └── authStore.ts
├── hooks/               # Custom hooks
├── lib/                 # API client, utilities
└── pages/               # Route pages
```

### Backend (apps/api)

```
src/
├── config/              # Centralized configuration
│   ├── app.config.ts    # App settings
│   ├── llm.config.ts    # LLM configuration
│   └── logger.config.ts # Logging setup
├── express/             # Express server
│   ├── server.express.ts  # Main server
│   ├── routes/          # API routes
│   │   ├── auth.express.ts      # Authentication
│   │   ├── chat.express.ts      # Chat streaming
│   │   └── pdf.express.ts       # PDF management
│   ├── middleware/      # Express middleware
│   │   └── auth.express.ts      # JWT authentication
│   └── utils/           # Express utilities
│       └── sse-stream.express.ts  # SSE helpers
├── middleware/          # Error handling
│   └── error-handler.middleware.ts
├── prompts/             # LLM prompt templates
│   └── agent-prompts.ts
├── agents/              # Agent orchestration
│   ├── state.ts         # Agent state
│   └── graph.ts         # Agent graph
├── tools/               # Tool implementations
│   ├── weather.ts       # Weather API
│   ├── currency.ts      # Currency API
│   └── pdf-reader.ts    # PDF search
└── services/            # Core services
    ├── llm.ts           # Groq client (Llama 3.3)
    └── pdf-index.ts     # TF-IDF indexing
```

### Shared (packages/shared)

```
src/
├── types/               # TypeScript types
└── schemas/             # Zod validation schemas
```

## Documentation

- **[📊 Architecture Diagrams](docs/architecture-diagram.md)** - Visual architecture with Mermaid diagrams
- [Architecture Guide](docs/architecture.md) - Detailed system architecture
- [Frontend README](apps/web/README.md) - Frontend documentation
- [Backend README](apps/api/README.md) - Backend documentation

## Features in Detail

### Real-time Streaming

The chat uses Server-Sent Events (SSE) to stream Llama 3.3 tokens in real-time with ultra-fast responses from Groq's infrastructure.

### PDF Indexing

PDFs are indexed using TF-IDF (Term Frequency-Inverse Document Frequency):
- Efficient keyword-based search
- Extracts relevant excerpts
- Persisted to `data/pdf-index.json`
- Can be upgraded to vector embeddings for semantic search

### Agent Orchestration

Custom lightweight orchestration manages the agent workflow:
1. **Router**: LLM analyzes intent and routes to appropriate tool
2. **Tool Agents**: LLM extracts entities (location, currency, etc.), executes tasks
3. **Synthesizer**: Llama 3.3 70B streams natural response via SSE

**Key Features**:
- ✅ No external dependencies (removed LangGraph)
- ✅ **LLM-based routing** (not keyword-based!)
- ✅ **LLM-based entity extraction** for flexible queries
- ✅ Portuguese and English support
- ✅ Smart geocoding with Brazilian context awareness
- ✅ Professional value formatting (4 decimals for rates, 2 for amounts)
- ✅ **Ultra-fast streaming** (token-by-token from Groq)

Agents operate autonomously - no fixed workflow!

## Scripts

```bash
npm run dev          # Start frontend + backend
npm run dev:web      # Start frontend only
npm run dev:api      # Start backend only
npm run build        # Build all workspaces
npm run lint         # Lint all workspaces
npm run format       # Format with Prettier
```

## Environment Variables

**Backend** (`apps/api/.env`):
```env
PORT=3001
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key
JWT_SECRET=your_secret_key
DATA_DIR=./data
```
**Metrics**:
- ChatPage: 195 → 70 lines (-65%)
- Components: +600% (sidebar componentization)
- Test Coverage: 0 → 2 test suites

## License

MIT

## Cost & Performance

**Groq Costs** (Llama 3.3 70B):
- ✅ **$0.00** - Completely FREE
- ✅ **14,400 requests/day** - Generous free tier
- ✅ **No credit card required**
- ✅ **No hidden costs**

**Why Groq + Llama 3.3?**
- ✅ **100% Free** - Perfect for portfolios
- ✅ **Ultra Fast** - 10x faster than GPT-4
- ✅ **Open Source** - Llama 3.3 70B model (newest version!)
- ✅ **Production Ready** - Used by thousands of apps
- ✅ **High Quality** - Comparable to GPT-4

**Performance**:
- Average response time: <1 second
- Streaming latency: ~50ms
- Tokens per second: 200-400 (extremely fast!)

## Acknowledgments

- [Groq](https://groq.com) - Ultra-fast LLM inference (Free!)
- [Meta AI](https://ai.meta.com) - Llama 3.3 70B model
- [Open-Meteo](https://open-meteo.com) - Weather API
- [ExchangeRate-API](https://www.exchangerate-api.com) - Currency API
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Express](https://expressjs.com) - HTTP server

