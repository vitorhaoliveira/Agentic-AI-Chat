import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SidebarSearchProps {
  onSearch: (query: string) => void;
}

export function SidebarSearch({ onSearch }: SidebarSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch(value);
  };

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
      <Input
        type="text"
        placeholder="Search Chats"
        value={searchQuery}
        onChange={handleChange}
        className="w-full pl-10 bg-[#1a1a2e]/80 border-gray-700/50 text-white placeholder:text-gray-500 focus:border-[#4169E1] h-10"
      />
    </div>
  );
}

