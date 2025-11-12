import toast from 'react-hot-toast';
import { appConfig } from '@/config/app.config';

export const showToast = {
  success: (message: string) => {
    toast.success(message, {
      duration: appConfig.ui.toastDuration,
      style: {
        background: '#10B981',
        color: '#fff',
      },
    });
  },

  error: (message: string) => {
    toast.error(message, {
      duration: appConfig.ui.toastDuration,
      style: {
        background: '#EF4444',
        color: '#fff',
      },
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      style: {
        background: '#3B82F6',
        color: '#fff',
      },
    });
  },

  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ) => {
    return toast.promise(promise, messages, {
      style: {
        minWidth: '250px',
      },
      success: {
        duration: appConfig.ui.toastDuration,
      },
    });
  },
};

