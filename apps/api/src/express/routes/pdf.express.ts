import { Router } from 'express';
import type { ApiResponse, PdfUploadResponse, PdfDocument } from '@agentic-ai-chat/shared';
import { indexPdf, getPdfDocuments } from '../../services/pdf-index.js';
import { authenticateRequest } from '../middleware/auth.express.js';
import { createLogger } from '../../config/logger.config.js';
import { appConfig } from '../../config/app.config.js';

const logger = createLogger('pdf-routes');
const router = Router();

// Apply authentication to all PDF routes
router.use(authenticateRequest);

router.post('/upload', async (req, res) => {
  logger.info('PDF upload request received');

  try {
    if (!req.file) {
      logger.warn('No file in upload request');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
        code: 'NO_FILE',
      });
    }

    const file = req.file;

    logger.debug({ filename: file.originalname, mimetype: file.mimetype }, 'File received');

    // Validate PDF file
    if (file.mimetype !== 'application/pdf') {
      logger.warn({ filename: file.originalname, mimetype: file.mimetype }, 'Invalid file type');
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed',
        code: 'INVALID_FILE_TYPE',
      });
    }

    if (file.size > appConfig.upload.maxFileSize) {
      logger.warn({ filename: file.originalname, size: file.size }, 'File too large');
      return res.status(400).json({
        success: false,
        error: `File size exceeds ${appConfig.upload.maxFileSize / 1024 / 1024}MB limit`,
        code: 'FILE_TOO_LARGE',
      });
    }

    logger.debug({ filename: file.originalname, size: file.size }, 'File validated');

    // Index the PDF
    const pdfDoc = await indexPdf(file.originalname, file.buffer);

    logger.info({ id: pdfDoc.id, filename: pdfDoc.filename }, 'PDF uploaded and indexed');

    return res.json({
      success: true,
      data: {
        id: pdfDoc.id,
        filename: pdfDoc.filename,
        size: pdfDoc.size,
        uploadedAt: pdfDoc.uploadedAt,
      },
    });
  } catch (error) {
    logger.error({ error }, 'PDF upload error');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload PDF',
    });
  }
});

router.get('/list', async (req, res) => {
  logger.info('Listing PDFs');

  try {
    const documents = getPdfDocuments();

    logger.info({ count: documents.length }, 'PDFs listed');

    return res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    logger.error({ error }, 'List PDFs error');
    return res.status(500).json({
      success: false,
      error: 'Failed to list PDFs',
    });
  }
});

export default router;

