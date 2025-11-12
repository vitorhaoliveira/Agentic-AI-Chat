import type { Conversation } from '@agentic-ai-chat/shared';
import { logger } from '@/utils/logger';

const CONVERSATIONS_KEY = 'chat-conversations';

export function saveConversations(conversations: Conversation[]): void {
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(conversations));
  } catch (error) {
    logger.error('Failed to save conversations', error);
  }
}

export function loadConversations(): Conversation[] {
  try {
    const stored = localStorage.getItem(CONVERSATIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Failed to load conversations', error);
    return [];
  }
}

export function generateConversationTitle(firstMessage: string): string {
  const maxLength = 50;
  const cleaned = firstMessage.trim();
  
  if (!cleaned) {
    return 'New Conversation';
  }
  
  return cleaned.length > maxLength 
    ? cleaned.slice(0, maxLength) + '...' 
    : cleaned;
}

