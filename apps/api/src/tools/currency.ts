import type { CurrencyData } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';

const logger = createLogger('currency-tool');

interface ExchangeRateResponse {
  success: boolean;
  rates: Record<string, number>;
  base: string;
  date: string;
}

export async function getCurrencyRate(
  from: string,
  to: string,
  amount?: number
): Promise<CurrencyData> {
  logger.info({ from, to, amount }, 'Fetching currency rate');

  try {
    // Using exchangerate-api.com (free, no API key required)
    const url = `https://open.er-api.com/v6/latest/${from}`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = (await response.json()) as ExchangeRateResponse;

    if (!data.rates || !data.rates[to]) {
      throw new Error(`Currency ${to} not found in rates`);
    }

    const rate = data.rates[to];
    const converted = amount ? amount * rate : undefined;

    // Round to 4 decimal places for exchange rates
    const roundedRate = Math.round(rate * 10000) / 10000;
    const roundedConverted = converted ? Math.round(converted * 100) / 100 : undefined;

    const currencyData = {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      rate: roundedRate,
      amount,
      converted: roundedConverted,
      timestamp: Date.now(),
    };

    logger.info({ from, to, rate: roundedRate }, 'Currency rate fetched successfully');

    return currencyData;
  } catch (error) {
    logger.error({ error, from, to }, 'Failed to fetch currency rate');
    throw new Error(`Failed to get currency rate from ${from} to ${to}. ${error instanceof Error ? error.message : ''}`);
  }
}

// Common currencies for validation
export const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'BRL',
  'JPY',
  'CNY',
  'AUD',
  'CAD',
  'CHF',
  'INR',
  'MXN',
  'ARS',
];

export function isSupportedCurrency(currency: string): boolean {
  return SUPPORTED_CURRENCIES.includes(currency.toUpperCase());
}

