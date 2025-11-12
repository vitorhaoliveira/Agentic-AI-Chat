import type { FastifyPluginAsync } from 'fastify';
import type { ApiResponse, PdfUploadResponse, PdfDocument } from '@agentic-ai-chat/shared';
import { indexPdf, getPdfDocuments } from '../services/pdf-index.js';
import { authenticateRequest } from '../middleware/auth.middleware.js';
import { createLogger } from '../config/logger.config.js';
import { AppError } from '../middleware/error-handler.middleware.js';
import { validatePdfFile } from '../services/pdf-processor.service.js';

const logger = createLogger('pdf-routes');

const pdfRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all PDF routes
  fastify.addHook('onRequest', authenticateRequest);

  fastify.post<{ Reply: ApiResponse<PdfUploadResponse> }>('/upload', async (request, reply) => {
    logger.info('PDF upload request received');
    
    const data = await request.file();

    if (!data) {
      logger.warn('No file in upload request');
      throw new AppError('No file uploaded', 400, 'NO_FILE');
    }

    logger.debug({ filename: data.filename, mimetype: data.mimetype }, 'File received');

    // Validate PDF file
    const validation = validatePdfFile(data);
    if (!validation.valid) {
      logger.warn({ filename: data.filename, error: validation.error }, 'Invalid file');
      throw new AppError(validation.error || 'Invalid file', 400, 'INVALID_FILE');
    }

    // Read file buffer
    const buffer = await data.toBuffer();
    logger.debug({ filename: data.filename, size: buffer.length }, 'File buffer read');

    // Index the PDF
    const pdfDoc = await indexPdf(data.filename, buffer);
    
    logger.info({ id: pdfDoc.id, filename: pdfDoc.filename }, 'PDF uploaded and indexed');

    return reply.send({
      success: true,
      data: {
        id: pdfDoc.id,
        filename: pdfDoc.filename,
        size: pdfDoc.size,
        uploadedAt: pdfDoc.uploadedAt,
      },
    });
  });

  fastify.get<{ Reply: ApiResponse<PdfDocument[]> }>('/list', async (_request, reply) => {
    logger.info('Listing PDFs');
    
    const documents = getPdfDocuments();
    
    logger.info({ count: documents.length }, 'PDFs listed');

    return reply.send({
      success: true,
      data: documents,
    });
  });
};

export default pdfRoutes;

