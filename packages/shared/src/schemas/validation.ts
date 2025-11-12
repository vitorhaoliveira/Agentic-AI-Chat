import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
});

// Chat schemas
export const chatRequestSchema = z.object({
  message: z.string().min(1).max(5000),
  sessionId: z.string().optional(),
});

export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
  timestamp: z.number(),
  metadata: z
    .object({
      toolCalls: z.array(z.string()).optional(),
      streaming: z.boolean().optional(),
    })
    .optional(),
});

// PDF schemas
export const pdfUploadSchema = z.object({
  filename: z.string(),
  size: z.number().max(10 * 1024 * 1024), // 10MB max
  mimetype: z.string().refine((val) => val === 'application/pdf', {
    message: 'Only PDF files are allowed',
  }),
});

// Tool schemas
export const weatherQuerySchema = z.object({
  location: z.string().min(2).max(100),
});

export const currencyQuerySchema = z.object({
  from: z.string().length(3).toUpperCase(),
  to: z.string().length(3).toUpperCase(),
  amount: z.number().positive().optional(),
});

export const pdfSearchSchema = z.object({
  query: z.string().min(1).max(500),
  documentId: z.string().optional(),
});

// Export types from schemas
export type LoginInput = z.infer<typeof loginSchema>;
export type ChatRequestInput = z.infer<typeof chatRequestSchema>;
export type MessageInput = z.infer<typeof messageSchema>;
export type PdfUploadInput = z.infer<typeof pdfUploadSchema>;
export type WeatherQueryInput = z.infer<typeof weatherQuerySchema>;
export type CurrencyQueryInput = z.infer<typeof currencyQuerySchema>;
export type PdfSearchInput = z.infer<typeof pdfSearchSchema>;

