import { Router } from 'express';
import { SSEStream } from '../utils/sse-stream.express.js';
import { streamCompletion } from '../../services/llm.js';
import { executeAgentTools } from '../../agents/graph.js';
import { authenticateRequest } from '../middleware/auth.express.js';
import { createLogger } from '../../config/logger.config.js';
import {
  buildSystemPrompt,
  buildPdfContextMessage,
  buildPdfErrorMessage,
} from '../../prompts/agent-prompts.js';
import { appConfig } from '../../config/app.config.js';
import pdfParse from 'pdf-parse';

const logger = createLogger('chat-routes');
const router = Router();

// Apply authentication to all chat routes
router.use(authenticateRequest);

router.post('/stream', async (req, res) => {
  logger.info('Chat stream request received');

  try {
    // Parse request - can be JSON or multipart with PDF
    let message: string;
    let pdfFile: { filename: string; buffer: Buffer } | undefined;

    if (req.is('multipart/form-data')) {
      // Handled by multer in the main server setup
      message = req.body.message;
      if (req.file) {
        pdfFile = {
          filename: req.file.originalname,
          buffer: req.file.buffer,
        };
      }
    } else {
      // JSON request
      message = req.body.message;
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    logger.info({
      message: message.slice(0, 100),
      hasPdf: !!pdfFile,
      pdfFilename: pdfFile?.filename,
    }, 'Request parsed');

    // Create SSE stream
    const stream = new SSEStream(res);

    try {
      // Execute agent tools ONLY for weather/currency (PDF is handled directly)
      logger.debug('Executing agent tools');
      const agentState = await executeAgentTools(message);

      // Send tool notifications
      if (agentState.toolResults && agentState.toolResults.length > 0) {
        logger.info({ toolCount: agentState.toolResults.length }, 'Sending tool results');
        for (const toolResult of agentState.toolResults) {
          stream.sendTool(toolResult.toolName);
        }
      }

      // Build context for streaming synthesis
      const toolResultsText = agentState.toolResults
        ?.map((tr) => {
          if (tr.error) {
            return `Tool ${tr.toolName} failed: ${tr.error}`;
          }
          return `Tool ${tr.toolName} result: ${JSON.stringify(tr.result, null, 2)}`;
        })
        .join('\n\n');

      // Build PDF context if available
      let pdfContext: string | undefined;
      let pdfError: string | undefined;

      if (pdfFile) {
        try {
          const pdfData = await pdfParse(pdfFile.buffer);
          const pdfText = pdfData.text;

          if (pdfText && pdfText.length > 50) {
            logger.info({ filename: pdfFile.filename, textLength: pdfText.length }, 'Using PDF context');
            pdfContext = buildPdfContextMessage(
              pdfFile.filename,
              pdfText,
              appConfig.pdf.maxContextLength
            );
            stream.sendTool('pdf_reader');
          } else {
            logger.warn({ filename: pdfFile.filename }, 'PDF extraction yielded insufficient text');
            pdfError = buildPdfErrorMessage(pdfFile.filename);
          }
        } catch (pdfErr) {
          logger.error({ error: pdfErr, filename: pdfFile.filename }, 'PDF parsing error');
          pdfError = buildPdfErrorMessage(pdfFile.filename);
        }
      }

      // Build system prompt
      const systemPrompt = buildSystemPrompt({
        toolResults: toolResultsText,
        pdfContext,
        pdfError,
      });

      const messages = [
        { role: 'system' as const, content: systemPrompt },
        { role: 'user' as const, content: message },
      ];

      // Stream completion from OpenAI
      logger.debug('Starting LLM streaming');
      let tokenCount = 0;
      for await (const token of streamCompletion({ messages })) {
        stream.sendToken(token);
        tokenCount++;
      }

      logger.info({ tokenCount }, 'Streaming completed');

      stream.sendDone();
      stream.end();
    } catch (error) {
      logger.error({ error }, 'Chat stream error');
      stream.sendError(
        error instanceof Error ? error.message : 'An error occurred processing your request'
      );
      stream.sendDone();
      stream.end();
    }
  } catch (error) {
    logger.error({ error }, 'Chat request parsing error');
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

