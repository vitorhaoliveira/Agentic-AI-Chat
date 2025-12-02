import { Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { Conversation } from '@agentic-ai-chat/shared';
import { useConversationStore } from '@/store/conversationStore';
import { useMessageStore } from '@/store/messageStore';
import { logger } from '@/utils/logger';
import { memo } from 'react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onDeleteClick?: (id: string, title: string) => void;
}

export const ConversationItem = memo(function ConversationItem({
  conversation,
  isActive,
  onDeleteClick,
}: ConversationItemProps) {
  const { t } = useTranslation();
  const loadConversation = useConversationStore((s) => s.loadConversation);
  const conversations = useConversationStore((s) => s.conversations);
  const setMessages = useMessageStore((s) => s.setMessages);
  
  const canDelete = conversations.length > 1;

  const handleClick = () => {
    const conv = loadConversation(conversation.id);
    if (conv) {
      // Load messages into message store
      setMessages(conv.messages || []);
      logger.debug('Loaded conversation messages', { 
        conversationId: conv.id, 
        messageCount: conv.messages?.length || 0 
      });
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (canDelete) {
      onDeleteClick?.(conversation.id, conversation.title);
    }
  };

  return (
    <div
      className={`relative group flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors ${
        isActive
          ? 'bg-[#2a2a3e] text-white'
          : 'text-gray-400 hover:text-white hover:bg-[#1a1a2e]/50'
      }`}
      onClick={handleClick}
    >
      <span className="flex-1 text-sm truncate">{conversation.title}</span>
      {canDelete && (
        <button
          onClick={handleDelete}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
          title={t('chat.sidebar.deleteConversation')}
          aria-label={t('chat.sidebar.deleteConversation')}
        >
          <Trash2 className="h-3.5 w-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
});

