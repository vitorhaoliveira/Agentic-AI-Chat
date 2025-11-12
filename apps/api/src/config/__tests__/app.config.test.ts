import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('App Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset process.env before each test
    process.env = { ...originalEnv };
    // Reset modules to ensure fresh imports
    vi.resetModules();
  });

  afterEach(() => {
    // Restore process.env after each test
    process.env = originalEnv;
  });

  describe('appConfig', () => {
    it('should use default port if not set', async () => {
      delete process.env.PORT;
      const { appConfig } = await import('../app.config.js');
      
      expect(appConfig.port).toBe(3001);
    });

    it('should use environment port if set', async () => {
      process.env.PORT = '4000';
      // Reset modules to get fresh config with new env var
      vi.resetModules();
      const { appConfig } = await import('../app.config.js');
      
      expect(appConfig.port).toBe(4000);
    });

    it('should have correct default values', async () => {
      const { appConfig } = await import('../app.config.js');
      
      expect(appConfig.host).toBeDefined();
      expect(appConfig.jwt).toBeDefined();
      expect(appConfig.upload).toBeDefined();
      expect(appConfig.pdf).toBeDefined();
    });

    it('should have correct upload configuration', async () => {
      const { appConfig } = await import('../app.config.js');
      
      expect(appConfig.upload.maxFileSize).toBe(10 * 1024 * 1024); // 10MB
      expect(appConfig.upload.allowedMimeTypes).toContain('application/pdf');
    });

    it('should have correct PDF configuration', async () => {
      const { appConfig } = await import('../app.config.js');
      
      expect(appConfig.pdf.minTextLength).toBe(50);
      expect(appConfig.pdf.maxContextLength).toBe(8000);
    });
  });
});

