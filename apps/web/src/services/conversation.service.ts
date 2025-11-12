import type { Conversation, Message } from '@agentic-ai-chat/shared';
import { appConfig } from '@/config/app.config';

export const conversationService = {
  generateTitle(message: string): string {
    const cleaned = message.trim();
    if (cleaned.length <= appConfig.chat.maxTitleLength) {
      return cleaned;
    }
    return cleaned.slice(0, appConfig.chat.maxTitleLength) + '...';
  },

  createNew(): Conversation {
    return {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },

  update(
    conversation: Conversation,
    messages: Message[]
  ): Conversation {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    const title =
      firstUserMessage && conversation.title === 'New Conversation'
        ? this.generateTitle(firstUserMessage.content)
        : conversation.title;

    return {
      ...conversation,
      title,
      messages,
      updatedAt: Date.now(),
    };
  },

  sortByRecent(conversations: Conversation[]): Conversation[] {
    return [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
  },

  filter(conversations: Conversation[], query: string): Conversation[] {
    const lowerQuery = query.toLowerCase();
    return conversations.filter((conv) =>
      conv.title.toLowerCase().includes(lowerQuery)
    );
  },
};

