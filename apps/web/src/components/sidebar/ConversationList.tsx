import { ConversationItem } from './ConversationItem';
import { useConversationStore } from '@/store/conversationStore';
import { conversationService } from '@/services/conversation.service';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { memo } from 'react';

interface ConversationListProps {
  searchQuery?: string;
  onDeleteClick?: (id: string, title: string) => void;
}

export const ConversationList = memo(function ConversationList({
  searchQuery = '',
  onDeleteClick,
}: ConversationListProps) {
  const { t } = useTranslation();
  const conversations = useConversationStore((s) => s.conversations);
  const currentId = useConversationStore((s) => s.currentConversationId);

  const filtered = searchQuery
    ? conversationService.filter(conversations, searchQuery)
    : conversations;

  const sorted = conversationService.sortByRecent(filtered);

  return (
    <ScrollArea className="flex-1 -mx-1 px-1">
      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-500 uppercase px-2 py-2">
          {t('chat.sidebar.history')}
        </p>
        <div className="space-y-0.5">
          {sorted.length === 0 ? (
            <p className="text-xs text-gray-600 px-3 py-2">
              {searchQuery
                ? t('chat.sidebar.noResults')
                : t('chat.sidebar.noConversations')}
            </p>
          ) : (
            sorted.map((conv) => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={currentId === conv.id}
                onDeleteClick={onDeleteClick}
              />
            ))
          )}
        </div>
      </div>
    </ScrollArea>
  );
});

