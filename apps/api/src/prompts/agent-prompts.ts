export function buildRouterPrompt(query: string): string {
  return `You are a routing assistant. Analyze the user's query and decide which tool to use.

Available tools:
- "weather": For questions about weather, temperature, climate, forecast
- "currency": For questions about currency exchange, rates, conversions, money
- "none": If the query is general conversation or doesn't need a specific tool

User query: "${query}"

Respond with ONLY ONE WORD: weather, currency, or none`;
}

export function buildLocationExtractionPrompt(query: string): string {
  return `Extract ONLY the location name from this query. Return just the city/state/country name, nothing else.

Query: "${query}"

Location:`;
}

export function buildCurrencyExtractionPrompt(query: string): string {
  return `Extract currency information from this query. Return ONLY in this format:
FROM:CURRENCY_CODE TO:CURRENCY_CODE AMOUNT:NUMBER

If no amount, use 1. If only one currency mentioned, assume conversion to/from BRL.
Use standard codes: USD, BRL, EUR, GBP, JPY, etc.

Query: "${query}"

Result:`;
}

export const SYSTEM_INSTRUCTIONS = {
  weather: 'When providing weather information, ALWAYS mention the complete location (city, state, country) from the tool result',
  currency: 'When providing currency information, clearly state both currencies and format the exchange rate nicely (e.g., "1 CAD = 3.79 BRL"). For currency conversions, show the final amount with 2 decimal places (e.g., "R$ 379.00")',
  pdf: 'When the user attaches a PDF with content, answer their question based on the PDF content. Mention the PDF filename when referencing its content',
  pdfError: 'When the user attaches a PDF but it cannot be read, explain why and offer alternatives',
  general: 'Be specific and use the exact location/currency names from the tool results. Provide a clear, natural response based on the data above. If there are errors, explain them kindly and helpfully',
} as const;

interface BuildSystemPromptOptions {
  toolResults?: string;
  pdfContext?: string;
  pdfError?: string;
}

export function buildSystemPrompt(options: BuildSystemPromptOptions): string {
  const { toolResults, pdfContext, pdfError } = options;

  const sections: string[] = [
    'You are a helpful AI assistant. Use the following tool results and PDF content to answer the user\'s query naturally and conversationally.',
  ];

  // Add tool results section
  if (toolResults) {
    sections.push(`\nTool Results:\n${toolResults}`);
  } else {
    sections.push('\nNo tools were used.');
  }

  // Add PDF context if available
  if (pdfContext) {
    sections.push(pdfContext);
  }

  // Add PDF error if present
  if (pdfError) {
    sections.push(pdfError);
  }

  // Add instructions
  sections.push('\nIMPORTANT INSTRUCTIONS:');
  sections.push(`- ${SYSTEM_INSTRUCTIONS.weather}`);
  sections.push(`- ${SYSTEM_INSTRUCTIONS.currency}`);
  sections.push(`- ${SYSTEM_INSTRUCTIONS.pdf}`);
  sections.push(`- ${SYSTEM_INSTRUCTIONS.pdfError}`);
  sections.push(`- ${SYSTEM_INSTRUCTIONS.general}`);

  return sections.join('\n');
}

export function buildPdfErrorMessage(filename: string): string {
  const cleanFilename = filename
    .replace(' (⚠️ No text found - may be scanned)', '')
    .replace(' (Error extracting text)', '');

  return `\n\nPDF ATTACHMENT ISSUE:
The user attached "${cleanFilename}" but the file appears to be:
- A scanned document (image-based PDF)
- A PDF without selectable text
- Encrypted or protected

Please inform the user that:
1. The PDF cannot be read because it doesn't contain text
2. They should try a PDF with selectable text
3. Or they can describe the content and you'll help based on that`;
}

export function buildPdfContextMessage(filename: string, text: string, maxLength = 8000): string {
  const truncatedText = text.length > maxLength 
    ? text.slice(0, maxLength) + '...' 
    : text;

  return `\n\nATTACHED PDF DOCUMENT (${filename}):\n${truncatedText}`;
}

