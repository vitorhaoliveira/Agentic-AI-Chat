import { appConfig } from '@/config/app.config';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const fileValidationService = {
  validatePdf(file: File): ValidationResult {
    if (!appConfig.upload.allowedMimeTypes.includes(file.type as any)) {
      return {
        valid: false,
        error: 'Only PDF files are allowed',
      };
    }

    if (file.size > appConfig.upload.maxFileSize) {
      const maxSizeMB = appConfig.upload.maxFileSize / (1024 * 1024);
      return {
        valid: false,
        error: `File must be less than ${maxSizeMB}MB`,
      };
    }

    return { valid: true };
  },

  formatFileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(1)} KB`;
    }
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  },
};

