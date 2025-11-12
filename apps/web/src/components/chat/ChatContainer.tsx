import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMessageStore } from '@/store/messageStore';
import { useChat } from '@/hooks/useChat';
import { Sparkles } from 'lucide-react';

export function ChatContainer() {
  const { t } = useTranslation();
  const messages = useMessageStore((s) => s.messages);
  const isStreaming = useMessageStore((s) => s.isStreaming);
  const { sendMessage, isLoading } = useChat();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-gray-800/50 bg-[#0f0f23]/30 backdrop-blur-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 ml-[3rem]">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#4169E1] to-[#7B68EE] flex items-center justify-center shadow-lg shadow-[#4169E1]/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold text-white">
              {t('chat.title')}
            </h1>
            <p className="text-xs text-gray-400">{t('chat.header.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea ref={scrollRef} className="flex-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full px-4">
            <div className="text-center max-w-md">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4169E1]/20 to-[#7B68EE]/20 flex items-center justify-center mb-6 ring-1 ring-[#4169E1]/30">
                <Sparkles className="h-8 w-8 text-[#4169E1]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">
                {t('chat.welcome.title')}
              </h2>
              <p className="text-gray-400 mb-6">
                {t('chat.welcome.subtitle')}
              </p>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-500 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#4169E1]"></span>
                  {t('chat.welcome.feature1')}
                </div>
                <div className="flex items-center gap-2 text-gray-500 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#7B68EE]"></span>
                  {t('chat.welcome.feature2')}
                </div>
                <div className="flex items-center gap-2 text-gray-500 justify-center">
                  <span className="w-2 h-2 rounded-full bg-[#4169E1]"></span>
                  {t('chat.welcome.feature3')}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto py-4 md:py-8 px-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      <ChatInput onSend={sendMessage} disabled={isLoading || isStreaming} />
    </div>
  );
}
