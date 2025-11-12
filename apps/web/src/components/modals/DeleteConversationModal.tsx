import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DeleteConversationModalProps {
  isOpen: boolean;
  conversationTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConversationModal({
  isOpen,
  conversationTitle,
  onConfirm,
  onCancel,
}: DeleteConversationModalProps) {
  const { t } = useTranslation();

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div
          className="bg-[#1a1a2e] border border-gray-700/50 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">{t('modal.deleteConversation.title')}</h2>
            </div>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-gray-700/50"
              aria-label={t('modal.deleteConversation.close')}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-gray-300 text-base leading-relaxed">
              {t('modal.deleteConversation.message')}
            </p>

            <div className="bg-[#0f0f23]/50 border border-gray-700/30 rounded-lg p-4">
              <p className="text-sm text-gray-500 mb-1">{t('modal.deleteConversation.conversationLabel')}:</p>
              <p className="text-white font-medium truncate">{conversationTitle}</p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-700/50 bg-[#0f0f23]/30">
            <Button
              onClick={onCancel}
              variant="ghost"
              className="text-gray-400 hover:text-white hover:bg-gray-700/50"
            >
              {t('modal.deleteConversation.cancel')}
            </Button>
            <Button
              onClick={onConfirm}
              className="bg-red-500 hover:bg-red-600 text-white gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {t('modal.deleteConversation.delete')}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

