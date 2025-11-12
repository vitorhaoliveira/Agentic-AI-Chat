import type { FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { chatRequestSchema } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';
import { processPdfFile, type PdfProcessingResult } from './pdf-processor.service.js';
import { AppError } from '../middleware/error-handler.middleware.js';

const logger = createLogger('request-parser');

export interface ParsedChatRequest {
  message: string;
  pdf?: PdfProcessingResult;
}

async function parseMultipartRequest(request: FastifyRequest): Promise<ParsedChatRequest> {
  logger.debug('Parsing multipart request');

  let message: string | undefined;
  let pdf: PdfProcessingResult | undefined;

  const parts = await request.parts();

  for await (const part of parts) {
    if (part.type === 'field' && part.fieldname === 'message') {
      // TypeScript doesn't know about the value property, but it exists
      message = (part as unknown as { value: string }).value;
    } else if (part.type === 'file' && part.fieldname === 'pdf') {
      const file = part as MultipartFile;
      pdf = await processPdfFile(file);
    }
  }

  if (!message) {
    throw new AppError('Message is required', 400, 'MISSING_MESSAGE');
  }

  logger.info({ hasMessage: !!message, hasPdf: !!pdf }, 'Multipart request parsed');

  return { message, pdf };
}

function parseJsonRequest(request: FastifyRequest): ParsedChatRequest {
  logger.debug('Parsing JSON request');

  const validation = chatRequestSchema.safeParse(request.body);

  if (!validation.success) {
    logger.warn({ errors: validation.error.errors }, 'Validation failed');
    throw new AppError('Invalid request format', 400, 'VALIDATION_ERROR', validation.error.errors);
  }

  const { message } = validation.data;

  logger.info({ hasMessage: !!message }, 'JSON request parsed');

  return { message };
}

function isMultipartRequest(request: FastifyRequest): boolean {
  const contentType = request.headers['content-type'] || '';
  return contentType.includes('multipart/form-data');
}

export async function parseChatRequest(request: FastifyRequest): Promise<ParsedChatRequest> {
  if (isMultipartRequest(request)) {
    return parseMultipartRequest(request);
  }
  
  return parseJsonRequest(request);
}

