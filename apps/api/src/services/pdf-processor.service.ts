import pdfParse from 'pdf-parse';
import type { MultipartFile } from '@fastify/multipart';
import { createLogger } from '../config/logger.config.js';
import { appConfig } from '../config/app.config.js';

const logger = createLogger('pdf-processor');

export interface PdfProcessingResult {
  filename: string;
  text: string | null;
  hasError: boolean;
  errorMessage?: string;
}

async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  try {
    const pdfData = await pdfParse(buffer);
    return pdfData.text.trim();
  } catch (error) {
    logger.error({ error }, 'Failed to extract text from PDF');
    throw new Error('Failed to extract text from PDF');
  }
}

function hasValidTextContent(text: string): boolean {
  return text.length >= appConfig.pdf.minTextLength;
}

export async function processPdfFile(file: MultipartFile): Promise<PdfProcessingResult> {
  const { filename } = file;
  
  logger.info({ filename }, 'Processing PDF file');

  try {
    const buffer = await file.toBuffer();
    logger.debug({ filename, size: buffer.length }, 'PDF buffer read');

    const text = await extractTextFromPdf(buffer);
    logger.info({ filename, textLength: text.length }, 'PDF text extracted');

    // Check if PDF has meaningful text
    if (!hasValidTextContent(text)) {
      logger.warn({ filename, textLength: text.length }, 'PDF has insufficient text');
      return {
        filename: `${filename} (⚠️ No text found - may be scanned)`,
        text: null,
        hasError: true,
        errorMessage: 'PDF appears to be scanned or image-based',
      };
    }

    return {
      filename,
      text,
      hasError: false,
    };
  } catch (error) {
    logger.error({ error, filename }, 'PDF processing error');
    return {
      filename: `${filename} (Error extracting text)`,
      text: null,
      hasError: true,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export function validatePdfFile(file: MultipartFile): { valid: boolean; error?: string } {
  if (file.mimetype !== 'application/pdf') {
    return {
      valid: false,
      error: `Invalid file type: ${file.mimetype}. Only PDF files are allowed`,
    };
  }

  return { valid: true };
}

