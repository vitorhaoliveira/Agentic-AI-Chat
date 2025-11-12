import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConversationStore } from '@/store/conversationStore';
import { useMessageStore } from '@/store/messageStore';
import { useTranslation } from 'react-i18next';

export function NewChatButton() {
  const { t } = useTranslation();
  const createConversation = useConversationStore((s) => s.createConversation);
  const clearMessages = useMessageStore((s) => s.clearMessages);

  const handleNewChat = () => {
    createConversation();
    clearMessages();
  };

  return (
    <Button
      onClick={handleNewChat}
      className="w-full bg-[#1a1a2e] hover:bg-[#2a2a3e] text-white border border-gray-700/50 justify-start h-10 font-medium"
    >
      <Plus className="h-4 w-4 mr-2" />
      {t('chat.sidebar.newChat')}
    </Button>
  );
}

