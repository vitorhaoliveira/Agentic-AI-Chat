// Ensure dotenv is loaded before accessing process.env
import './env.js';

export const llmConfig = {
  apiKey: process.env.GROQ_API_KEY || '',
  
  // Model Configuration
  model: {
    // Groq models available (December 2024):
    // - llama-3.3-70b-versatile: Llama 3.3 70B (best quality, newest) ⭐
    // - llama-3.1-8b-instant: Llama 3.1 8B (fastest)
    // - mixtral-8x7b-32768: Mixtral (32K context)
    // - gemma2-9b-it: Google Gemma 2 (fast)
    chat: 'llama-3.3-70b-versatile',
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

