// Ensure dotenv is loaded before accessing process.env
import './env.js';

export const llmConfig = {
  apiKey: process.env.GROQ_API_KEY || '',
  
  // Model Configuration
  model: {
    // Groq models available:
    // - llama3-70b-8192: Llama 3 70B (best quality)
    // - llama3-8b-8192: Llama 3 8B (faster)
    // - mixtral-8x7b-32768: Mixtral (32K context)
    // - gemma-7b-it: Google Gemma (fast)
    chat: 'llama3-70b-8192',
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

