import { useState, KeyboardEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, X } from 'lucide-react';
import { fileValidationService } from '@/services/fileValidation.service';
import { showToast } from '@/utils/toast';
import { logger } from '@/utils/logger';

interface ChatInputProps {
  onSend: (message: string, pdfFile?: File) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [attachedPdf, setAttachedPdf] = useState<File | null>(null);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim(), attachedPdf || undefined);
      setMessage('');
      setAttachedPdf(null);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const validation = fileValidationService.validatePdf(file);

      if (!validation.valid) {
        showToast.error(validation.error!);
        e.target.value = '';
        return;
      }

      logger.info('PDF file attached', {
        filename: file.name,
        size: fileValidationService.formatFileSize(file.size),
      });

      setAttachedPdf(file);
      e.target.value = '';
    },
    []
  );

  const handleRemovePdf = () => {
    logger.debug('PDF file removed');
    setAttachedPdf(null);
  };

  return (
    <div className="border-t border-gray-800/50 bg-[#0f0f23]/30 backdrop-blur-sm">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="bg-[#1a1a2e]/80 border border-gray-700/50 rounded-2xl shadow-lg overflow-hidden">
          {attachedPdf && (
            <div className="px-4 pt-3 pb-2">
              <div className="inline-flex items-center gap-2 bg-[#2a2a3e] px-3 py-2 rounded-lg text-sm">
                <Paperclip className="h-4 w-4 text-blue-400" />
                <span className="text-white">{attachedPdf.name}</span>
                <span className="text-gray-400">
                  ({fileValidationService.formatFileSize(attachedPdf.size)})
                </span>
                <button
                  onClick={handleRemovePdf}
                  className="ml-2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Remove PDF"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.input.placeholder')}
                disabled={disabled}
                className="border-0 bg-transparent text-white placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm md:text-base h-auto py-2"
              />
            </div>
          </div>

          <div className="border-t border-gray-700/30 px-3 md:px-4 py-2 md:py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="application/pdf"
                onChange={handleFileSelect}
                className="hidden"
                id="pdf-attach-input"
                disabled={disabled}
              />
              <label
                htmlFor="pdf-attach-input"
                className={`inline-flex items-center justify-center rounded-md text-xs md:text-sm font-medium transition-colors h-8 md:h-9 px-2 md:px-3 cursor-pointer text-gray-400 hover:text-white hover:bg-[#2a2a3e] ${
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Paperclip className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                <span className="hidden sm:inline">Attach PDF</span>
              </label>
            </div>

            <Button
              onClick={handleSend}
              disabled={disabled || !message.trim()}
              size="sm"
              className="bg-[#4169E1] hover:bg-[#3559d1] text-white h-8 md:h-9 px-4 md:px-6 rounded-lg font-medium text-xs md:text-sm"
            >
              <Send className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Send</span>
            </Button>
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center mt-3">
          {t('chat.input.hint')}
        </p>
      </div>
    </div>
  );
}
