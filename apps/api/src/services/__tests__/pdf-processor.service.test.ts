import { describe, it, expect } from 'vitest';
import type { MultipartFile } from '@fastify/multipart';
import { validatePdfFile } from '../pdf-processor.service.js';

describe('PDF Processor Service', () => {
  describe('validatePdfFile', () => {
    it('should validate PDF files correctly', () => {
      const mockPdfFile = {
        mimetype: 'application/pdf',
        filename: 'test.pdf',
      } as MultipartFile;

      const result = validatePdfFile(mockPdfFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PDF files', () => {
      const mockNonPdfFile = {
        mimetype: 'image/jpeg',
        filename: 'test.jpg',
      } as MultipartFile;

      const result = validatePdfFile(mockNonPdfFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
    });

    it('should reject text files', () => {
      const mockTextFile = {
        mimetype: 'text/plain',
        filename: 'test.txt',
      } as MultipartFile;

      const result = validatePdfFile(mockTextFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only PDF files are allowed');
    });
  });
});

