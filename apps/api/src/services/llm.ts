import Groq from 'groq-sdk';
import { llmConfig } from '../config/llm.config.js';
import { createLogger } from '../config/logger.config.js';
import { AppError } from '../middleware/error-handler.middleware.js';

const logger = createLogger('llm-service');

let groq: Groq | null = null;

function getGroq(): Groq {
  if (!groq) {
    if (!llmConfig.apiKey) {
      throw new AppError(
        'Groq API key is not configured. Get your free API key at https://console.groq.com',
        500,
        'GROQ_API_KEY_MISSING'
      );
    }

    groq = new Groq({
      apiKey: llmConfig.apiKey,
    });

    logger.info('Groq client initialized', { model: llmConfig.model.chat });
  }
  return groq;
}

export interface StreamOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  onToken?: (token: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: Error) => void;
}

export async function* streamCompletion(
  options: StreamOptions
): AsyncGenerator<string, void, unknown> {
  const { messages } = options;

  logger.debug({ messageCount: messages.length }, 'Starting stream completion');

  try {
    const client = getGroq();
    const stream = await client.chat.completions.create({
      model: llmConfig.model.chat,
      messages,
      stream: true,
      temperature: llmConfig.model.temperature,
      max_tokens: llmConfig.model.maxTokens,
    });

    let fullResponse = '';
    let tokenCount = 0;

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        fullResponse += content;
        tokenCount++;
        yield content;
      }
    }

    logger.info({ tokenCount, responseLength: fullResponse.length }, 'Stream completed');
    options.onComplete?.(fullResponse);
  } catch (error) {
    logger.error({ error }, 'Groq streaming error');
    const err = error instanceof Error ? error : new Error('Unknown error');
    options.onError?.(err);
    throw new AppError(
      'Failed to stream completion from Groq',
      500,
      'GROQ_STREAM_ERROR',
      err.message
    );
  }
}

export async function generateCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  logger.debug({ messageCount: messages.length }, 'Generating completion');

  try {
    const client = getGroq();
    const response = await client.chat.completions.create({
      model: llmConfig.model.chat,
      messages,
      temperature: llmConfig.model.temperature,
      max_tokens: llmConfig.model.maxTokens,
    });

    const content = response.choices[0]?.message?.content || '';
    
    logger.info({ responseLength: content.length }, 'Completion generated');
    
    return content;
  } catch (error) {
    logger.error({ error }, 'Groq completion error');
    throw new AppError(
      'Failed to generate completion from Groq',
      500,
      'GROQ_COMPLETION_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

