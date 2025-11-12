import { SidebarSearch } from './SidebarSearch';
import { NewChatButton } from './NewChatButton';
import { ConversationList } from '@/components/sidebar/ConversationList';
import { UserProfile } from '@/components/sidebar/UserProfile';
import { useState } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onDeleteClick?: (id: string, title: string) => void;
}

export function Sidebar({ isOpen, onDeleteClick }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div
      className={`fixed left-0 top-0 h-full bg-[#0f0f23]/50 backdrop-blur-md border-r border-gray-800/50 flex flex-col transition-all duration-300 ease-in-out z-40 ${
        isOpen 
          ? 'w-64' 
          : 'w-0 overflow-hidden'
      }`}
    >
      <div className="flex flex-col h-full p-3 space-y-3 min-h-0 overflow-y-auto">
        <SidebarSearch onSearch={setSearchQuery} />
        <NewChatButton />
        <ConversationList searchQuery={searchQuery} onDeleteClick={onDeleteClick} />
        <UserProfile />
      </div>
    </div>
  );
}

