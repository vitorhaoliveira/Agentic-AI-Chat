import type { PdfSearchResult } from '@agentic-ai-chat/shared';
import { searchPdfs } from '../services/pdf-index.js';

export async function searchPdf(query: string): Promise<PdfSearchResult> {
  try {
    const results = searchPdfs(query, 3);

    if (results.length === 0) {
      return {
        query,
        results: [],
        documentName: undefined,
      };
    }

    return {
      query,
      results: results.map((r) => ({
        text: r.text,
        score: r.score,
      })),
      documentName: results[0]?.filename,
    };
  } catch (error) {
    throw new Error('Failed to search PDFs');
  }
}

