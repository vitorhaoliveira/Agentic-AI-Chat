import { useState } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useConversationStore } from '@/store/conversationStore';
import { apiService } from '@/services/api.service';
import { logger } from '@/utils/logger';
import { showToast } from '@/utils/toast';
import type { Message } from '@agentic-ai-chat/shared';
import { appConfig } from '@/config/app.config';

export function useChat() {
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = useMessageStore((s) => s.addMessage);
  const updateLastMessage = useMessageStore((s) => s.updateLastMessage);
  const setStreaming = useMessageStore((s) => s.setStreaming);
  const sessionId = useMessageStore((s) => s.sessionId);

  const currentConversationId = useConversationStore((s) => s.currentConversationId);
  const createConversation = useConversationStore((s) => s.createConversation);
  const updateConversation = useConversationStore((s) => s.updateConversation);

  const sendMessage = async (content: string, pdfFile?: File) => {
    setIsLoading(true);
    setStreaming(true);

    // Ensure we have a conversation
    let conversationId = currentConversationId;
    if (!conversationId) {
      conversationId = createConversation();
      logger.info('Created new conversation for message', { id: conversationId });
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: pdfFile
        ? `${content}\n\n📎 Attached: ${pdfFile.name}`
        : content,
      timestamp: Date.now(),
    };
    addMessage(userMessage);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      metadata: { streaming: true },
    };
    addMessage(assistantMessage);

    try {
      let fullResponse = '';

      for await (const chunk of apiService.streamChat(
        {
          message: content,
          sessionId: sessionId || undefined,
        },
        pdfFile
      )) {
        fullResponse += chunk;
        updateLastMessage(fullResponse);
      }

      setStreaming(false);

      // Auto-save conversation after streaming completes
      setTimeout(() => {
        // Get fresh messages from store using getState
        const allMessages = useMessageStore.getState().messages;
        updateConversation(conversationId, {
          messages: allMessages,
        });
        logger.debug('Auto-saved conversation', { 
          conversationId, 
          messageCount: allMessages.length 
        });
      }, appConfig.chat.autoSaveDelay);
    } catch (err) {
      logger.error('Chat error', err);
      showToast.error(
        err instanceof Error ? err.message : 'Failed to send message'
      );
      setStreaming(false);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendMessage,
    isLoading,
  };
}
