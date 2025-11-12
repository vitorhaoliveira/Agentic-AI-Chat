export const appConfig = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || '/api',
    timeout: 30000,
  },

  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf'] as const,
    allowedMimeTypes: ['application/pdf'] as const,
  },

  storage: {
    keys: {
      auth: 'auth-storage',
      conversations: 'chat-conversations',
    },
  },

  chat: {
    debounceDelay: 500,
    autoSaveDelay: 100,
    maxTitleLength: 50,
  },

  ui: {
    toastDuration: 4000,
    sidebarWidth: 256,
  },
} as const;

export type AppConfig = typeof appConfig;

