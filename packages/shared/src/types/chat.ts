export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  metadata?: {
    toolCalls?: string[];
    streaming?: boolean;
  };
}

export interface ChatSession {
  id: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export interface StreamChunk {
  type: 'token' | 'tool' | 'done' | 'error';
  content?: string;
  toolName?: string;
  error?: string;
}

