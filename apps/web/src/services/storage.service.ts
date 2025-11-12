import { appConfig } from '@/config/app.config';
import { logger } from '@/utils/logger';

export const storageService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      logger.error(`Failed to get item from storage: ${key}`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Failed to set item in storage: ${key}`, error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      logger.error(`Failed to remove item from storage: ${key}`, error);
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      logger.error('Failed to clear storage', error);
    }
  },

  getAuthToken(): string | null {
    const authStorage = this.get<{ state: { token: string } }>(
      appConfig.storage.keys.auth
    );
    return authStorage?.state?.token || null;
  },
};

