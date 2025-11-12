import { create } from 'zustand';
import type { Conversation, Message } from '@agentic-ai-chat/shared';
import { storageService } from '@/services/storage.service';
import { conversationService } from '@/services/conversation.service';
import { appConfig } from '@/config/app.config';
import { logger } from '@/utils/logger';
import { useMessageStore } from './messageStore';

interface ConversationState {
  conversations: Conversation[];
  currentConversationId: string | null;
  
  loadConversations: () => void;
  createConversation: () => string;
  loadConversation: (id: string) => Conversation | undefined;
  updateConversation: (id: string, updates: Partial<Conversation>) => void;
  deleteConversation: (id: string) => void;
  saveConversations: () => void;
  setCurrentConversationId: (id: string | null) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  
  loadConversations: () => {
    const conversations = storageService.get<Conversation[]>(
      appConfig.storage.keys.conversations
    ) || [];
    
    logger.info('Loaded conversations', { count: conversations.length });
    set({ conversations });
  },
  
  createConversation: () => {
    const newConversation = conversationService.createNew();
    
    set((state) => ({
      conversations: [newConversation, ...state.conversations],
      currentConversationId: newConversation.id,
    }));
    
    // Save immediately after creating
    get().saveConversations();
    
    logger.info('Created new conversation', { id: newConversation.id });
    return newConversation.id;
  },
  
  loadConversation: (id) => {
    const conversation = get().conversations.find((conv) => conv.id === id);
    
    if (conversation) {
      set({ currentConversationId: id });
      logger.info('Loaded conversation', { id });
    }
    
    return conversation;
  },
  
  updateConversation: (id, updates) => {
    set((state) => {
      const updated = state.conversations.map((conv) => {
        if (conv.id === id) {
          // Generate title from first user message if still "New Conversation"
          let title = conv.title;
          if (updates.messages && updates.messages.length > 0 && title === 'New Conversation') {
            const firstUserMessage = updates.messages.find((m: Message) => m.role === 'user');
            if (firstUserMessage) {
              title = conversationService.generateTitle(firstUserMessage.content);
            }
          }
          
          return {
            ...conv,
            ...updates,
            title,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });
      
      return { conversations: updated };
    });
    
    get().saveConversations();
  },
  
  deleteConversation: (id) => {
    const state = get();
    const updatedConversations = state.conversations.filter(
      (conv) => conv.id !== id
    );
    
    set({ conversations: updatedConversations });
    
    if (state.currentConversationId === id) {
      // Clear messages from message store
      useMessageStore.getState().clearMessages();
      
      // If there are other conversations, load the most recent one
      if (updatedConversations.length > 0) {
        const sorted = conversationService.sortByRecent(updatedConversations);
        const mostRecent = sorted[0];
        set({ currentConversationId: mostRecent.id });
        
        // Load messages from the most recent conversation
        useMessageStore.getState().setMessages(mostRecent.messages || []);
        logger.info('Loaded most recent conversation after delete', { id: mostRecent.id });
      } else {
        // No conversations left, create a new one
        const newConversation = conversationService.createNew();
        set({
          conversations: [newConversation],
          currentConversationId: newConversation.id,
        });
        // Messages are already cleared, so we don't need to set them
        logger.info('Created new conversation after deleting last one', { id: newConversation.id });
      }
    }
    
    // Save conversations (including the new one if created)
    get().saveConversations();
    logger.info('Deleted conversation', { id });
  },
  
  saveConversations: () => {
    const { conversations } = get();
    storageService.set(appConfig.storage.keys.conversations, conversations);
    logger.debug('Saved conversations', { count: conversations.length });
  },
  
  setCurrentConversationId: (id) => {
    set({ currentConversationId: id });
  },
}));

