import { create } from 'zustand';
import type { Message } from '@agentic-ai-chat/shared';
import { logger } from '@/utils/logger';

interface MessageState {
  messages: Message[];
  isStreaming: boolean;
  sessionId: string | null;
  
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;
  setStreaming: (isStreaming: boolean) => void;
  clearMessages: () => void;
  setMessages: (messages: Message[]) => void;
  setSessionId: (sessionId: string | null) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  messages: [],
  isStreaming: false,
  sessionId: null,
  
  addMessage: (message) => {
    set((state) => {
      logger.debug('Adding message', { role: message.role });
      return { messages: [...state.messages, message] };
    });
  },
  
  updateLastMessage: (content) => {
    set((state) => {
      const messages = [...state.messages];
      if (messages.length > 0) {
        messages[messages.length - 1] = {
          ...messages[messages.length - 1],
          content,
        };
      }
      return { messages };
    });
  },
  
  setStreaming: (isStreaming) => {
    logger.debug('Set streaming', { isStreaming });
    set({ isStreaming });
  },
  
  clearMessages: () => {
    logger.info('Cleared messages');
    set({ messages: [], sessionId: null });
  },
  
  setMessages: (messages) => {
    logger.info('Set messages', { count: messages.length });
    set({ messages });
  },
  
  setSessionId: (sessionId) => {
    set({ sessionId });
  },
}));

