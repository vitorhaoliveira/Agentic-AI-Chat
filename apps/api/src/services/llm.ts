import OpenAI from 'openai';
import { llmConfig } from '../config/llm.config.js';
import { createLogger } from '../config/logger.config.js';
import { AppError } from '../middleware/error-handler.middleware.js';

const logger = createLogger('llm-service');

let openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openai) {
    if (!llmConfig.apiKey) {
      throw new AppError(
        'OpenAI API key is not configured',
        500,
        'OPENAI_API_KEY_MISSING'
      );
    }

    openai = new OpenAI({
      apiKey: llmConfig.apiKey,
    });

    logger.info('OpenAI client initialized');
  }
  return openai;
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
    const client = getOpenAI();
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
    logger.error({ error }, 'OpenAI streaming error');
    const err = error instanceof Error ? error : new Error('Unknown error');
    options.onError?.(err);
    throw new AppError(
      'Failed to stream completion from OpenAI',
      500,
      'OPENAI_STREAM_ERROR',
      err.message
    );
  }
}

export async function generateCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>
): Promise<string> {
  logger.debug({ messageCount: messages.length }, 'Generating completion');

  try {
    const client = getOpenAI();
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
    logger.error({ error }, 'OpenAI completion error');
    throw new AppError(
      'Failed to generate completion from OpenAI',
      500,
      'OPENAI_COMPLETION_ERROR',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

