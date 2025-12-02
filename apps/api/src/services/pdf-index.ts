import pdfParse from 'pdf-parse';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { PdfDocument } from '@agentic-ai-chat/shared';
import { createLogger } from '../config/logger.config.js';
import { appConfig } from '../config/app.config.js';

const logger = createLogger('pdf-index');

interface PdfIndex {
  id: string;
  filename: string;
  size: number;
  uploadedAt: number;
  indexed: boolean;
  text: string;
  terms: Map<string, number>;
}

const DATA_DIR = appConfig.dataDir;
const INDEX_FILE = join(DATA_DIR, 'pdf-index.json');

// In-memory storage
let pdfIndices: PdfIndex[] = [];
let indexInitialized = false;

// Ensure data directory exists (lazy initialization for serverless)
function ensureDataDir(): void {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
      logger.info({ dataDir: DATA_DIR }, 'Data directory created');
    }
  } catch (error) {
    // In serverless environments, file system may be read-only
    // This is okay, we'll use in-memory storage only
    logger.warn({ error, dataDir: DATA_DIR }, 'Could not create data directory, using in-memory storage only');
  }
}

function loadIndex(): void {
  try {
    ensureDataDir();
    if (existsSync(INDEX_FILE)) {
      const data = readFileSync(INDEX_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      // Convert terms back to Map
      pdfIndices = parsed.map((doc: Record<string, unknown>) => ({
        ...doc,
        terms: new Map(Object.entries(doc.terms as Record<string, number>)),
      }));
      logger.info({ count: pdfIndices.length }, 'PDFs loaded from index');
    }
  } catch (error) {
    // In serverless environments, file system may be read-only
    // This is okay, we'll use in-memory storage only
    logger.warn({ error }, 'Could not load PDF index from disk, using in-memory storage only');
    pdfIndices = [];
  }
}

function initializeIndex(): void {
  if (!indexInitialized) {
    loadIndex();
    indexInitialized = true;
  }
}

function saveIndex(): void {
  try {
    ensureDataDir();
    // Convert Map to object for JSON serialization
    const serializable = pdfIndices.map((doc) => ({
      ...doc,
      terms: Object.fromEntries(doc.terms),
    }));
    writeFileSync(INDEX_FILE, JSON.stringify(serializable, null, 2));
    logger.debug({ count: pdfIndices.length }, 'PDF index saved to disk');
  } catch (error) {
    // In serverless environments, file system may be read-only
    // This is okay, we'll use in-memory storage only
    logger.warn({ error }, 'Could not save PDF index to disk, using in-memory storage only');
  }
}

function calculateTfIdf(text: string): Map<string, number> {
  const terms = new Map<string, number>();
  
  // Tokenize and normalize
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);

  // Calculate term frequency
  for (const word of words) {
    terms.set(word, (terms.get(word) || 0) + 1);
  }

  // Normalize by document length
  const totalWords = words.length;
  for (const [word, count] of terms.entries()) {
    terms.set(word, count / totalWords);
  }

  logger.debug({ uniqueTerms: terms.size, totalWords }, 'TF-IDF calculated');

  return terms;
}

export async function indexPdf(filename: string, buffer: Buffer): Promise<PdfDocument> {
  initializeIndex();
  logger.info({ filename, size: buffer.length }, 'Indexing PDF');

  try {
    const data = await pdfParse(buffer);
    const text = data.text;

    const pdfDoc: PdfIndex = {
      id: crypto.randomUUID(),
      filename,
      size: buffer.length,
      uploadedAt: Date.now(),
      indexed: true,
      text,
      terms: calculateTfIdf(text),
    };

    pdfIndices.push(pdfDoc);
    saveIndex();

    logger.info({ id: pdfDoc.id, filename }, 'PDF indexed successfully');

    return {
      id: pdfDoc.id,
      filename: pdfDoc.filename,
      size: pdfDoc.size,
      uploadedAt: pdfDoc.uploadedAt,
      indexed: pdfDoc.indexed,
    };
  } catch (error) {
    logger.error({ error, filename }, 'Error indexing PDF');
    throw new Error('Failed to index PDF');
  }
}

export function searchPdfs(query: string, limit = 3): Array<{ text: string; score: number; filename: string }> {
  initializeIndex();
  logger.debug({ query, limit }, 'Searching PDFs');
  const queryTerms = calculateTfIdf(query);
  const results: Array<{ text: string; score: number; filename: string }> = [];

  for (const doc of pdfIndices) {
    let score = 0;

    // Calculate cosine similarity
    for (const [term, queryTf] of queryTerms.entries()) {
      const docTf = doc.terms.get(term) || 0;
      score += queryTf * docTf;
    }

    if (score > 0) {
      // Find relevant excerpt
      const queryWords = query.toLowerCase().split(/\s+/);
      const sentences = doc.text.split(/[.!?]+/);
      let bestSentence = '';
      let bestMatchCount = 0;

      for (const sentence of sentences) {
        const sentenceLower = sentence.toLowerCase();
        const matchCount = queryWords.filter((word) => sentenceLower.includes(word)).length;
        if (matchCount > bestMatchCount) {
          bestMatchCount = matchCount;
          bestSentence = sentence.trim();
        }
      }

      results.push({
        text: bestSentence || doc.text.substring(0, 200),
        score,
        filename: doc.filename,
      });
    }
  }

  const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, limit);
  logger.info({ resultCount: sortedResults.length, query }, 'PDF search completed');
  
  return sortedResults;
}

export function getPdfDocuments(): PdfDocument[] {
  initializeIndex();
  return pdfIndices.map((doc) => ({
    id: doc.id,
    filename: doc.filename,
    size: doc.size,
    uploadedAt: doc.uploadedAt,
    indexed: doc.indexed,
  }));
}

export function getAllIndexedPdfs(): Array<{ id: string; filename: string; text: string }> {
  initializeIndex();
  return pdfIndices
    .filter((doc) => doc.indexed)
    .map((doc) => ({
      id: doc.id,
      filename: doc.filename,
      text: doc.text,
    }));
}

// Lazy initialization - don't load on module import for serverless compatibility
// Index will be loaded on first use
logger.info('PDF index service ready (lazy initialization)');

