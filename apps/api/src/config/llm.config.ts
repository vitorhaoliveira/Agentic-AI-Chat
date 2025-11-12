// Ensure dotenv is loaded before accessing process.env
import './env.js';

export const llmConfig = {
  apiKey: process.env.OPENAI_API_KEY || '',
  
  // Model Configuration
  model: {
    chat: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,
  },

  // Streaming Configuration
  streaming: {
    enabled: true,
    bufferSize: 1024,
  },

  // Timeouts (in milliseconds)
  timeouts: {
    completion: 30000, // 30 seconds
    streaming: 60000,  // 60 seconds
  },
} as const;

