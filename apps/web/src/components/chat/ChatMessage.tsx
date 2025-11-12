import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@agentic-ai-chat/shared';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 p-4', isUser ? 'flex-row-reverse' : 'flex-row')}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback 
          className={cn(
            'border',
            isUser 
              ? 'bg-[#4169E1] border-[#4169E1] text-white' 
              : 'bg-[#2a2a3e] border-gray-700 text-gray-300'
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div
        className={cn(
          'flex-1 rounded-lg px-4 py-3',
          isUser
            ? 'bg-[#4169E1] text-white ml-12'
            : 'bg-[#2a2a3e] text-gray-200 mr-12 border border-gray-700/50'
        )}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{message.content}</p>
        {message.metadata?.toolCalls && message.metadata.toolCalls.length > 0 && (
          <div className="mt-2 text-xs opacity-70 text-gray-400">
            Tools used: {message.metadata.toolCalls.join(', ')}
          </div>
        )}
      </div>
    </div>
  );
}

