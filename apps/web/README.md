# Agentic AI Chat - Frontend

Modern React frontend with enterprise-grade architecture for the Agentic AI Chat system.

## Features

- 🎨 Modern UI with Tailwind CSS and shadcn/ui
- ⚡ Real-time chat with streaming responses (SSE)
- 📄 PDF upload and analysis (ChatGPT-style)
- 🔐 JWT authentication (mock for demo)
- 📱 Responsive design
- 🌍 Bilingual support (EN/PT-BR)
- 🧪 Unit testing with Vitest
- 🔔 Toast notifications
- 🛡️ Error boundary handling
- 📊 Structured logging

## Development

```bash
npm run dev
```

Runs on http://localhost:3000

## Build

```bash
npm run build
```

## Testing

```bash
npm test              # Run tests once
npm run test:watch    # Watch mode
npm run test:ui       # Interactive UI
npm run test:coverage # Coverage report
```

## Tech Stack

### Core
- React 18
- Vite
- TypeScript
- Tailwind CSS

### State Management
- Zustand (separate stores for conversations and messages)
- React Query (data fetching & caching)

### Routing & Navigation
- React Router (with lazy loading)

### UI & Notifications
- shadcn/ui components
- react-hot-toast (notifications)
- react-error-boundary (error handling)

### Testing
- Vitest
- @testing-library/react
- happy-dom

### Internationalization
- i18next
- react-i18next

## Architecture

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
├── store/               # Zustand stores
│   ├── conversationStore.ts    # Conversation management
│   ├── messageStore.ts         # Message management
│   └── authStore.ts            # Authentication
├── components/
│   ├── ErrorBoundary.tsx       # Global error boundary
│   ├── sidebar/         # Sidebar components (6)
│   │   ├── Sidebar.tsx
│   │   ├── SidebarSearch.tsx
│   │   ├── NewChatButton.tsx
│   │   ├── ConversationList.tsx
│   │   ├── ConversationItem.tsx
│   │   └── UserProfile.tsx
│   ├── chat/            # Chat components
│   ├── ui/              # shadcn/ui components
│   └── modals/          # Modal components
├── hooks/               # Custom hooks
│   └── useChat.ts       # Chat logic
├── pages/               # Route pages
│   ├── LoginPage.tsx
│   └── ChatPage.tsx
├── lib/                 # Libraries
└── test/                # Test setup
    └── setup.ts
```

## Documentation

- [Architecture](../docs/architecture.md) - System architecture
- [Main README](../../README.md) - Project overview

## Scripts

```bash
npm run dev            # Development server
npm run build          # Production build
npm run preview        # Preview build
npm run lint           # ESLint
npm test               # Run tests
npm run test:watch     # Watch mode
npm run test:ui        # Interactive UI
npm run test:coverage  # Coverage report
```

## Environment Variables

Frontend uses Vite environment variables:

```env
VITE_API_BASE_URL=/api  # API endpoint (optional)
```

## License

MIT

