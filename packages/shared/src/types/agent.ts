import type { Message } from './chat.js';

export interface AgentState {
  messages: Message[];
  context: Record<string, unknown>;
  toolResults: ToolResult[];
  nextStep?: string;
}

export interface ToolResult {
  toolName: string;
  result: unknown;
  error?: string;
  timestamp: number;
}

export interface WeatherData {
  location: string;
  temperature: number;
  conditions: string;
  humidity?: number;
  windSpeed?: number;
}

export interface CurrencyData {
  from: string;
  to: string;
  rate: number;
  amount?: number;
  converted?: number;
  timestamp: number;
}

export interface PdfSearchResult {
  query: string;
  results: Array<{
    text: string;
    score: number;
    page?: number;
  }>;
  documentName?: string;
}

export type ToolData = WeatherData | CurrencyData | PdfSearchResult;

