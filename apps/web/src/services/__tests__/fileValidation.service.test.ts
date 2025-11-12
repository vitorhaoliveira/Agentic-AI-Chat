import { describe, it, expect } from 'vitest';
import { fileValidationService } from '../fileValidation.service';

describe('fileValidationService', () => {
  describe('validatePdf', () => {
    it('should validate PDF files correctly', () => {
      const mockPdfFile = new File(['content'], 'test.pdf', {
        type: 'application/pdf',
      });

      const result = fileValidationService.validatePdf(mockPdfFile);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject non-PDF files', () => {
      const mockJpgFile = new File(['content'], 'test.jpg', {
        type: 'image/jpeg',
      });

      const result = fileValidationService.validatePdf(mockJpgFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Only PDF files are allowed');
    });

    it('should reject files larger than 10MB', () => {
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const mockLargeFile = new File([largeContent], 'large.pdf', {
        type: 'application/pdf',
      });

      const result = fileValidationService.validatePdf(mockLargeFile);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be less than');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(fileValidationService.formatFileSize(500)).toBe('500 B');
    });

    it('should format kilobytes correctly', () => {
      expect(fileValidationService.formatFileSize(1024)).toBe('1.0 KB');
      expect(fileValidationService.formatFileSize(5120)).toBe('5.0 KB');
    });

    it('should format megabytes correctly', () => {
      expect(fileValidationService.formatFileSize(1048576)).toBe('1.0 MB');
      expect(fileValidationService.formatFileSize(5242880)).toBe('5.0 MB');
    });
  });
});

