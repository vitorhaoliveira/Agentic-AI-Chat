import type { FastifyPluginAsync } from 'fastify';
import { SSEStream } from '../utils/streaming.js';
import { streamCompletion } from '../services/llm.js';
import { executeAgentTools } from '../agents/graph.js';
import { authenticateRequest } from '../middleware/auth.middleware.js';
import { parseChatRequest } from '../services/request-parser.service.js';
import { createLogger } from '../config/logger.config.js';
import {
  buildSystemPrompt,
  buildPdfContextMessage,
  buildPdfErrorMessage,
} from '../prompts/agent-prompts.js';
import { appConfig } from '../config/app.config.js';

const logger = createLogger('chat-routes');

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  // Apply authentication to all chat routes
  fastify.addHook('onRequest', authenticateRequest);

  fastify.post('/stream', async (request, reply) => {
    logger.info('Chat stream request received');

    // Parse request (handles both JSON and multipart with PDF)
    const { message, pdf } = await parseChatRequest(request);

    logger.info({ 
      message: message.slice(0, 100), 
      hasPdf: !!pdf,
      pdfFilename: pdf?.filename 
    }, 'Request parsed');

    // Create SSE stream
    const stream = new SSEStream(reply);

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

      if (pdf) {
        if (pdf.hasError) {
          // PDF had extraction issues
          logger.warn({ filename: pdf.filename }, 'PDF extraction had errors');
          pdfError = buildPdfErrorMessage(pdf.filename);
        } else if (pdf.text) {
          // PDF successfully extracted
          logger.info({ filename: pdf.filename, textLength: pdf.text.length }, 'Using PDF context');
          pdfContext = buildPdfContextMessage(
            pdf.filename,
            pdf.text,
            appConfig.pdf.maxContextLength
          );
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
  });
};

export default chatRoutes;
