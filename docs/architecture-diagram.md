# Architecture Diagrams

## 1. System Overview

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        UI[User Interface]
        Store[Zustand Store]
        API[API Client]
        
        UI --> Store
        Store --> API
    end
    
    subgraph "Backend (Node + Fastify)"
        Routes[Routes Layer]
        Auth[Auth Service]
        Agent[Agent Orchestrator]
        Tools[Tools Layer]
        LLM[OpenAI Service]
        
        Routes --> Auth
        Routes --> Agent
        Agent --> Tools
        Agent --> LLM
    end
    
    subgraph "External Services"
        OpenAI[OpenAI GPT-4o-mini]
        Weather[Open-Meteo API]
        Currency[Exchange Rate API]
        
        LLM --> OpenAI
        Tools --> Weather
        Tools --> Currency
    end
    
    API -->|SSE Stream| Routes
    
    style Agent fill:#e1bee7
    style Tools fill:#fff9c4
    style LLM fill:#c5e1a5
```

## 2. Agent Architecture (Core Focus)

```mermaid
graph TD
    Start([User Query]) --> Router[Router Agent]
    
    Router -->|Analyze Query| LLM1[LLM: Intent Detection]
    LLM1 --> Decision{Route Decision}
    
    Decision -->|Weather Intent| WeatherAgent[Weather Agent]
    Decision -->|Currency Intent| CurrencyAgent[Currency Agent]
    Decision -->|PDF Intent| PDFAgent[PDF Agent]
    Decision -->|No Tools| Synthesizer[Synthesizer Agent]
    
    WeatherAgent -->|Extract Location| LLM2[LLM: Entity Extraction]
    LLM2 --> WeatherTool[Weather Tool]
    WeatherTool -->|API Call| OpenMeteo[Open-Meteo]
    OpenMeteo -->|Weather Data| State1[Update State]
    
    CurrencyAgent -->|Extract Currencies| LLM3[LLM: Entity Extraction]
    LLM3 --> CurrencyTool[Currency Tool]
    CurrencyTool -->|API Call| ExchangeAPI[Exchange Rate API]
    ExchangeAPI -->|Rate Data| State2[Update State]
    
    PDFAgent -->|Extract Query| PDFTool[PDF Search Tool]
    PDFTool -->|TF-IDF Search| Index[PDF Index]
    Index -->|Relevant Chunks| State3[Update State]
    
    State1 --> Synthesizer
    State2 --> Synthesizer
    State3 --> Synthesizer
    
    Synthesizer -->|Generate Response| LLM4[LLM: Stream Response]
    LLM4 -->|SSE| Client([Client])
    
    style Router fill:#e1bee7
    style WeatherAgent fill:#fff9c4
    style CurrencyAgent fill:#fff9c4
    style PDFAgent fill:#fff9c4
    style Synthesizer fill:#c5e1a5
    style LLM1 fill:#bbdefb
    style LLM2 fill:#bbdefb
    style LLM3 fill:#bbdefb
    style LLM4 fill:#bbdefb
```

## 3. Agent State Flow

```mermaid
stateDiagram-v2
    [*] --> Router: User Query Received
    
    Router --> Weather: Weather Intent
    Router --> Currency: Currency Intent
    Router --> PDF: PDF Intent
    Router --> Synthesize: No Tools Needed
    
    state "Weather Agent" as Weather {
        [*] --> ExtractLocation
        ExtractLocation --> CallWeatherAPI
        CallWeatherAPI --> UpdateState
        UpdateState --> [*]
    }
    
    state "Currency Agent" as Currency {
        [*] --> ExtractCurrencies
        ExtractCurrencies --> CallCurrencyAPI
        CallCurrencyAPI --> UpdateState2
        UpdateState2 --> [*]
    }
    
    state "PDF Agent" as PDF {
        [*] --> ExtractQuery
        ExtractQuery --> SearchIndex
        SearchIndex --> UpdateState3
        UpdateState3 --> [*]
    }
    
    Weather --> Synthesize: Tool Result Ready
    Currency --> Synthesize: Tool Result Ready
    PDF --> Synthesize: Tool Result Ready
    
    state "Synthesizer Agent" as Synthesize {
        [*] --> BuildContext
        BuildContext --> StreamLLM
        StreamLLM --> SendTokens
        SendTokens --> [*]
    }
    
    Synthesize --> [*]: Response Complete
```

## 4. Frontend Component Architecture

```mermaid
graph TB
    subgraph "Pages"
        Login[LoginPage]
        Chat[ChatPage]
        PDF[PDFUploadPage]
    end
    
    subgraph "Chat Components"
        ChatContainer[ChatContainer]
        MessageList[MessageList]
        ChatInput[ChatInput]
        MessageBubble[MessageBubble]
        TypingIndicator[TypingIndicator]
        ToolIndicator[ToolIndicator]
    end
    
    subgraph "Auth Components"
        LoginForm[LoginForm]
        AuthGuard[AuthGuard]
    end
    
    subgraph "PDF Components"
        PDFUpload[PDFUpload]
        FileList[FileList]
    end
    
    subgraph "UI Components (shadcn)"
        Button[Button]
        Input[Input]
        Card[Card]
        ScrollArea[ScrollArea]
    end
    
    subgraph "State Management"
        AuthStore[Auth Store]
        ChatStore[Chat Store]
    end
    
    subgraph "Hooks"
        useChat[useChat]
        useAuth[useAuth]
        usePdfUpload[usePdfUpload]
    end
    
    Chat --> ChatContainer
    ChatContainer --> MessageList
    ChatContainer --> ChatInput
    MessageList --> MessageBubble
    MessageList --> TypingIndicator
    MessageList --> ToolIndicator
    
    Login --> LoginForm
    PDF --> PDFUpload
    PDFUpload --> FileList
    
    ChatContainer --> useChat
    LoginForm --> useAuth
    PDFUpload --> usePdfUpload
    
    useChat --> ChatStore
    useAuth --> AuthStore
    
    style ChatStore fill:#e1bee7
    style AuthStore fill:#e1bee7
```

## 5. Backend Request Flow (SSE Streaming)

```mermaid
sequenceDiagram
    participant Client
    participant Route as /chat/stream
    participant Orchestrator as Agent Orchestrator
    participant Router as Router Agent
    participant Tool as Tool Agent
    participant LLM as OpenAI Service
    participant API as External API
    
    Client->>Route: POST /chat/stream
    Route->>Route: Initialize SSE Stream
    
    Route->>Orchestrator: executeAgentTools(query)
    Orchestrator->>Router: Analyze Query
    Router->>LLM: Intent Detection
    LLM-->>Router: weather
    Router-->>Orchestrator: nextStep = weather
    
    Orchestrator->>Tool: Execute Weather Tool
    Tool->>LLM: Extract Location
    LLM-->>Tool: "Salvador, Bahia"
    Tool->>API: Get Weather
    API-->>Tool: Weather Data
    Tool-->>Orchestrator: Tool Result
    
    Orchestrator-->>Route: State with Tool Results
    
    Route->>Client: event: tool (weather)
    
    Route->>LLM: Stream Synthesis
    loop Token Stream
        LLM-->>Route: Token
        Route->>Client: event: token
    end
    
    Route->>Client: event: done
    Route->>Client: Close Stream
```

## 6. Data Flow (Message Streaming)

```mermaid
graph LR
    User[User Input] --> Input[ChatInput Component]
    Input --> Hook[useChat Hook]
    Hook --> API[API Client]
    API -->|POST /chat/stream| Backend[Backend Route]
    
    Backend --> SSE[SSE Stream Handler]
    
    SSE -->|event: tool| Store1[Chat Store]
    SSE -->|event: token| Store2[Chat Store]
    SSE -->|event: done| Store3[Chat Store]
    
    Store1 --> UI1[Tool Indicator]
    Store2 --> UI2[Message Bubble]
    Store3 --> UI3[Complete Message]
    
    style SSE fill:#c5e1a5
    style Store1 fill:#e1bee7
    style Store2 fill:#e1bee7
    style Store3 fill:#e1bee7
```

## 7. Tools Architecture

```mermaid
graph TB
    subgraph "Tools Layer"
        Weather[Weather Tool]
        Currency[Currency Tool]
        PDF[PDF Tool]
    end
    
    subgraph "Weather Tool"
        Normalize[Normalize Location]
        Geocode[Geocoding Service]
        WeatherAPI[Weather API]
        
        Normalize --> Geocode
        Geocode --> WeatherAPI
    end
    
    subgraph "Currency Tool"
        Parse[Parse Currencies]
        ExchangeAPI[Exchange Rate API]
        Format[Format Response]
        
        Parse --> ExchangeAPI
        ExchangeAPI --> Format
    end
    
    subgraph "PDF Tool"
        Index[TF-IDF Index]
        Search[Search Engine]
        Rank[Ranking Algorithm]
        
        Index --> Search
        Search --> Rank
    end
    
    Weather --> Normalize
    Currency --> Parse
    PDF --> Index
    
    style Weather fill:#fff9c4
    style Currency fill:#fff9c4
    style PDF fill:#fff9c4
```

## 8. Agent State Structure

```mermaid
classDiagram
    class AgentState {
        +string userQuery
        +string[] messages
        +ToolResult[] toolResults
        +Record context
        +string nextStep
        +string finalResponse
    }
    
    class ToolResult {
        +string toolName
        +any result
        +string error
        +number timestamp
    }
    
    class WeatherData {
        +string location
        +number temperature
        +string conditions
        +number humidity
        +number windSpeed
    }
    
    class CurrencyData {
        +string from
        +string to
        +number rate
        +number amount
        +number converted
        +number timestamp
    }
    
    class PDFSearchResult {
        +string filename
        +string[] chunks
        +number[] scores
    }
    
    AgentState --> ToolResult
    ToolResult --> WeatherData
    ToolResult --> CurrencyData
    ToolResult --> PDFSearchResult
```

## 9. Monorepo Structure

```mermaid
graph TB
    Root[Root]
    
    Root --> Apps[apps/]
    Root --> Packages[packages/]
    Root --> Docs[docs/]
    
    Apps --> Web[web/]
    Apps --> API[api/]
    
    Packages --> Shared[shared/]
    
    Web --> WebSrc[src/]
    API --> APISrc[src/]
    Shared --> SharedSrc[src/]
    
    WebSrc --> Components[components/]
    WebSrc --> Store[store/]
    WebSrc --> Hooks[hooks/]
    WebSrc --> Pages[pages/]
    
    APISrc --> Routes[routes/]
    APISrc --> Agents[agents/]
    APISrc --> Tools[tools/]
    APISrc --> Services[services/]
    
    SharedSrc --> Types[types/]
    SharedSrc --> Schemas[schemas/]
    
    style Apps fill:#e1bee7
    style Packages fill:#fff9c4
    style Agents fill:#c5e1a5
    style Tools fill:#c5e1a5
```

## 10. Deployment Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        LB[Load Balancer]
        
        subgraph "Frontend Servers"
            Web1[Vite Build - Server 1]
            Web2[Vite Build - Server 2]
        end
        
        subgraph "Backend Servers"
            API1[Fastify - Server 1]
            API2[Fastify - Server 2]
        end
        
        subgraph "Storage"
            PDFs[PDF Storage]
            Index[TF-IDF Index JSON]
        end
        
        subgraph "External Services"
            OpenAI[OpenAI API]
            Weather[Open-Meteo]
            Currency[Exchange Rate API]
        end
    end
    
    Client[Clients] --> LB
    LB --> Web1
    LB --> Web2
    
    Web1 --> API1
    Web2 --> API2
    
    API1 --> PDFs
    API2 --> PDFs
    API1 --> Index
    API2 --> Index
    
    API1 --> OpenAI
    API1 --> Weather
    API1 --> Currency
    
    API2 --> OpenAI
    API2 --> Weather
    API2 --> Currency
    
    style OpenAI fill:#bbdefb
    style Weather fill:#c5e1a5
    style Currency fill:#fff9c4
```

---

## Key Architectural Decisions

### 1. **Agent Orchestration**
- **Custom implementation** instead of LangGraph (removed due to version incompatibility)
- **Stateful agents** with explicit state transitions
- **LLM-based routing** for flexible intent detection (not keyword-based)

### 2. **Streaming Architecture**
- **Server-Sent Events (SSE)** for real-time token delivery
- **Progressive response**: tool notifications → token stream → completion
- **State synchronization** between backend agents and frontend store

### 3. **Tool Design**
- **Autonomous tools**: Each tool is self-contained with its own logic
- **Geocoding intelligence**: Smart location resolution with Brazilian context awareness
- **Currency formatting**: Market-standard precision (4 decimals for rates, 2 for amounts)

### 4. **Frontend Patterns**
- **Component composition**: Atomic design principles
- **State management**: Zustand for simplicity vs Redux complexity
- **Optimistic UI**: Show typing indicators and tool usage immediately

### 5. **Scalability**
- **Monorepo**: Shared types and utilities across frontend/backend
- **Modular agents**: Easy to add new agents/tools
- **Stateless design**: Backend can scale horizontally
- **Persistent storage**: TF-IDF index saved to disk for persistence

---

## Diagrams Explanation

1. **System Overview**: High-level view of frontend, backend, and external services
2. **Agent Architecture**: Core focus - detailed agent orchestration flow
3. **Agent State Flow**: State machine showing agent transitions
4. **Frontend Component Architecture**: React component hierarchy
5. **Backend Request Flow**: Sequence diagram showing SSE streaming
6. **Data Flow**: Message streaming from user to UI
7. **Tools Architecture**: Internal structure of each tool
8. **Agent State Structure**: TypeScript classes and interfaces
9. **Monorepo Structure**: Project organization
10. **Deployment Architecture**: Production setup (optional)
