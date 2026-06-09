/**
 * PDF utility service used by report-upload routes before AI analysis.
 *
 * `extractTextFromPdf(buffer)` — first tries pdf-parse (fast, zero API cost,
 * works for text-layer PDFs). If the result is empty or under MIN_TEXT_LENGTH
 * chars, falls back to `ocrWithClaude()` which sends the PDF directly to
 * Claude as a base64 document and asks it to transcribe the text verbatim.
 * This covers scanned / image-only PDFs with no additional packages and no
 * extra API keys — Claude's native PDF vision is the best free OCR available
 * when hosting on Vercel.
 *
 * `isValidPdf(buffer)` — lightweight validation that at least one page parsed.
 */
import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const MIN_TEXT_LENGTH = 100;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * Uses Claude's native PDF vision to extract text from scanned / image-only PDFs.
 * Sends the raw PDF buffer as a base64 document; Claude transcribes text verbatim.
 */
async function ocrWithClaude(buffer: Buffer): Promise<string> {
  logger.info('Falling back to Claude OCR for image-only PDF');

  const response = await anthropic.messages.create({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: buffer.toString('base64'),
            },
          },
          {
            type: 'text',
            text: 'Transcribe all text from this PDF exactly as written. Output only the raw text with no commentary, formatting markers, or explanations.',
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find(b => b.type === 'text');
  const extracted = textBlock?.type === 'text' ? textBlock.text.trim() : '';

  logger.info('Claude OCR complete', { textLength: extracted.length });
  return extracted;
}

/**
 * Extracts text from a PDF buffer.
 * Tries pdf-parse first; falls back to Claude OCR for image-only PDFs.
 */
export async function extractTextFromPdf(buffer: Buffer | Blob): Promise<string> {
  const bufferToUse = buffer instanceof Blob
    ? Buffer.from(await buffer.arrayBuffer())
    : buffer;

  // --- attempt 1: pdf-parse (text-layer PDFs, fast, free) ---
  try {
    const data = await pdfParse(bufferToUse);
    const cleaned = (data.text || '')
      .replace(/\r\n/g, '\n')
      .replace(/\f/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (cleaned.length >= MIN_TEXT_LENGTH) {
      logger.info('pdf-parse extracted text successfully', {
        pageCount: data.numpages,
        textLength: cleaned.length,
      });
      return cleaned;
    }

    logger.info('pdf-parse returned insufficient text, trying Claude OCR', {
      textLength: cleaned.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.warn('pdf-parse failed, trying Claude OCR', { error: msg });
  }

  // --- attempt 2: Claude PDF vision OCR (scanned / image-only PDFs) ---
  try {
    const ocrText = await ocrWithClaude(bufferToUse);
    if (ocrText) return ocrText;
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error('Claude OCR failed', { error: msg });
    throw new Error(`PDF extraction failed: ${msg}`);
  }

  throw new Error('No text could be extracted from the PDF (tried pdf-parse and Claude OCR)');
}

/**
 * Validates that a PDF buffer is valid (at least one page parsed).
 */
export async function isValidPdf(buffer: Buffer | Blob): Promise<boolean> {
  try {
    const bufferToUse = buffer instanceof Blob
      ? Buffer.from(await buffer.arrayBuffer())
      : buffer;
    const data = await pdfParse(bufferToUse);
    return data.numpages > 0;
  } catch {
    return false;
  }
}
