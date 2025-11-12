import { describe, it, expect } from 'vitest';
import { AppError } from '../error-handler.middleware.js';

describe('Error Handler Middleware', () => {
  describe('AppError', () => {
    it('should create an error with default status code', () => {
      const error = new AppError('Test error');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
    });

    it('should create an error with custom status code', () => {
      const error = new AppError('Not found', 404);

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should create an error with code and details', () => {
      const error = new AppError('Validation error', 400, 'VALIDATION_ERROR', { field: 'email' });

      expect(error.message).toBe('Validation error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.details).toEqual({ field: 'email' });
    });

    it('should have proper stack trace', () => {
      const error = new AppError('Test error');

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });
});

