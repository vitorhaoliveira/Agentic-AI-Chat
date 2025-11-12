import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChatContainer } from '@/components/chat/ChatContainer';
import { DeleteConversationModal } from '@/components/modals/DeleteConversationModal';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { useConversationStore } from '@/store/conversationStore';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const loadConversations = useConversationStore((s) => s.loadConversations);
  const deleteConversation = useConversationStore((s) => s.deleteConversation);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleDeleteClick = useCallback((id: string, title: string) => {
    setConversationToDelete({ id, title });
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (conversationToDelete) {
      deleteConversation(conversationToDelete.id);
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    }
  }, [conversationToDelete, deleteConversation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  }, []);

  return (
    <div className="flex h-screen bg-gradient-to-br from-[#0f0f23] via-[#1a1a3e] to-[#0f0f23] overflow-hidden relative">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)}
        onDeleteClick={handleDeleteClick}
      />

      <div
        className={`flex-1 flex flex-col transition-all duration-300 w-full ${
          isSidebarOpen ? 'md:ml-64' : 'md:ml-0'
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`absolute top-4 z-50 text-gray-400 hover:text-white hover:bg-[#1a1a2e]/90 rounded-lg border border-gray-700/50 transition-all duration-300 ${
            isSidebarOpen ? 'left-[16.5rem] md:left-[16.5rem]' : 'left-4'
          }`}
          aria-label="Toggle sidebar"
        >
          {isSidebarOpen ? (
            <ChevronLeft className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>

        <ChatContainer />
      </div>

      <DeleteConversationModal
        isOpen={deleteModalOpen}
        conversationTitle={conversationToDelete?.title || ''}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
