import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger.js';

/**
 * Extracts text content from a PDF buffer.
 * @param buffer - The PDF file buffer
 * @returns Extracted text content
 */
export async function extractTextFromPdf(buffer: Buffer | Blob): Promise<string> {
  try {
    const bufferToUse = buffer instanceof Blob
      ? Buffer.from(await buffer.arrayBuffer())
      : buffer;
    const data = await pdfParse(bufferToUse);

    if (!data.text) {
      logger.warn('PDF extracted but contains no text');
      return '';
    }

    // Clean up the extracted text
    const cleaned = data.text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\f/g, '\n') // Replace form feeds with newlines
      .replace(/\n{3,}/g, '\n\n') // Remove excessive blank lines
      .trim();

    logger.info('Successfully extracted text from PDF', {
      pageCount: data.numpages,
      textLength: cleaned.length,
    });

    return cleaned;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Failed to extract text from PDF', { error: message });
    throw new Error(`PDF extraction failed: ${message}`);
  }
}

/**
 * Validates that a PDF buffer is valid
 * @param buffer - The PDF file buffer
 * @returns true if valid, false otherwise
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
