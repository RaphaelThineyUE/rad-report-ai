/**
 * PDF utility service used by report-upload routes before AI analysis.
 *
 * Extraction chain:
 * 1. `pdf-parse` for normal text-layer PDFs
 * 2. Ghostscript `txtwrite` for PDFs that `pdf-parse` cannot read cleanly
 * 3. Ghostscript OCR device when local tessdata exists
 * 4. Claude OCR as final fallback for scanned / image-only PDFs
 *
 * Goal: keep extraction local when possible, but still recover scanned PDFs
 * when remote OCR is configured.
 */
import { execFile } from 'node:child_process';
import { constants as fsConstants } from 'node:fs';
import { access, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import { logger } from '../utils/logger.js';

const MIN_TEXT_LENGTH = 100;
const OCR_LANGUAGE = 'eng';
const OCR_TIMEOUT_MS = 120_000;
const PREPROCESS_TIMEOUT_MS = 180_000;
const COMMAND_BUFFER_LIMIT = 10 * 1024 * 1024;
const OCR_RASTER_DPI = 300;
const OCR_SIGNAL_TERMS = [
  'patient',
  'report',
  'exam',
  'date',
  'history',
  'findings',
  'impression',
  'recommendation',
  'radiologist',
  'breast',
  'ultrasound',
  'mammography',
  'bi-rads',
];
const OCR_PREPROCESS_VARIANTS = [
  {
    name: 'deskewed-gray',
    convertArgs: ['-deskew', '40%', '-normalize', '-contrast-stretch', '1%x1%', '-sharpen', '0x1.0'],
  },
  {
    name: 'deskewed-binary',
    convertArgs: ['-deskew', '40%', '-normalize', '-contrast-stretch', '1%x1%', '-sharpen', '0x1.0', '-threshold', '62%'],
  },
] as const;

type OcrCandidate = {
  label: string;
  score: number;
  text: string;
};

export type PdfExtractionStage =
  | 'extracting_text'
  | 'preprocessing_images'
  | 'running_ocr';

interface ExtractPdfOptions {
  onStage?: (stage: PdfExtractionStage) => void | Promise<void>;
}

function execFileAsync(
  file: string,
  args: string[],
  options: {
    timeout?: number;
    maxBuffer?: number;
    env?: NodeJS.ProcessEnv;
  } = {}
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(file, args, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        stdout: stdout ?? '',
        stderr: stderr ?? '',
      });
    });
  });
}

function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\f/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function hasEnoughText(text: string): boolean {
  return cleanExtractedText(text).length >= MIN_TEXT_LENGTH;
}

function scoreExtractedText(text: string): number {
  const cleaned = cleanExtractedText(text);
  if (!cleaned) {
    return 0;
  }

  const alphaChars = cleaned.match(/[A-Za-z]/g)?.length ?? 0;
  const digitChars = cleaned.match(/\d/g)?.length ?? 0;
  const weirdChars = cleaned.match(/[^A-Za-z0-9\s.,:;()/%\-']/g)?.length ?? 0;
  const words = cleaned.toLowerCase().match(/[a-z]{2,}/g) ?? [];
  const plausibleWords = words.filter((word) => word.length >= 4 || /[aeiouy]/.test(word)).length;
  const signalHits = OCR_SIGNAL_TERMS.filter((term) => cleaned.toLowerCase().includes(term)).length;
  const populatedLines = cleaned.split('\n').filter((line) => /[A-Za-z0-9]{3,}/.test(line)).length;

  return (
    alphaChars +
    digitChars * 0.5 +
    plausibleWords * 8 +
    signalHits * 30 +
    populatedLines * 2 -
    weirdChars * 6
  );
}

function pickBetterOcrCandidate(current: OcrCandidate | null, next: OcrCandidate | null): OcrCandidate | null {
  if (!next || !next.text) {
    return current;
  }
  if (!current) {
    return next;
  }
  return next.score > current.score ? next : current;
}

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  return new Anthropic({ apiKey });
}

async function commandExists(command: string): Promise<boolean> {
  try {
    await execFileAsync('sh', ['-lc', `command -v ${command}`], {
      timeout: 5_000,
      maxBuffer: 8 * 1024,
    });
    return true;
  } catch {
    return false;
  }
}

async function resolveTessdataDir(): Promise<string | null> {
  const candidates = [
    process.env.TESSDATA_PREFIX,
    path.resolve(process.cwd(), '.tessdata'),
    path.resolve(process.cwd(), 'backend/.tessdata'),
    '/usr/share/tesseract-ocr/5/tessdata',
    '/usr/share/tesseract-ocr/4.00/tessdata',
    '/usr/share/tesseract-ocr/tessdata',
    '/usr/share/tessdata',
    '/usr/local/share/tessdata',
    '/opt/homebrew/share/tessdata',
  ].filter(Boolean) as string[];

  for (const dir of candidates) {
    try {
      await access(path.join(dir, `${OCR_LANGUAGE}.traineddata`), fsConstants.R_OK);
      return dir;
    } catch {
      // keep searching
    }
  }

  return null;
}

async function withTempDir<T>(prefix: string, work: (dir: string) => Promise<T>): Promise<T> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await work(tempDir);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function notifyStage(options: ExtractPdfOptions | undefined, stage: PdfExtractionStage): Promise<void> {
  await options?.onStage?.(stage);
}

/**
 * Uses Claude's native PDF vision to extract text from scanned / image-only PDFs.
 * Sends raw PDF buffer as base64 document; Claude transcribes text verbatim.
 */
async function ocrWithClaude(buffer: Buffer): Promise<string> {
  logger.info('Falling back to Claude OCR for image-only PDF');

  const response = await getAnthropicClient().messages.create({
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

  const textBlock = response.content.find((block) => block.type === 'text');
  const extracted = textBlock?.type === 'text' ? cleanExtractedText(textBlock.text) : '';

  logger.info('Claude OCR complete', { textLength: extracted.length });
  return extracted;
}

async function extractWithGhostscriptTxtwrite(filePath: string): Promise<string> {
  const { stdout } = await execFileAsync(
    'gs',
    ['-q', '-sDEVICE=txtwrite', '-o', '-', filePath],
    {
      timeout: OCR_TIMEOUT_MS,
      maxBuffer: COMMAND_BUFFER_LIMIT,
    }
  );

  const cleaned = cleanExtractedText(stdout);
  if (cleaned) {
    logger.info('Ghostscript txtwrite extracted text', { textLength: cleaned.length });
  }
  return cleaned;
}

async function extractWithGhostscriptOcr(
  filePath: string,
  options: {
    label?: string;
    tessdataDir?: string;
  } = {}
): Promise<string> {
  const tessdataDir = options.tessdataDir ?? await resolveTessdataDir();
  if (!tessdataDir) {
    logger.info('Skipping Ghostscript OCR; tessdata not installed');
    return '';
  }

  const { stdout } = await execFileAsync(
    'gs',
    ['-q', '-sDEVICE=ocr', `-sOCRLanguage=${OCR_LANGUAGE}`, '-o', '-', filePath],
    {
      timeout: OCR_TIMEOUT_MS,
      maxBuffer: COMMAND_BUFFER_LIMIT,
      env: {
        ...process.env,
        TESSDATA_PREFIX: tessdataDir,
      },
    }
  );

  const cleaned = cleanExtractedText(stdout);
  if (cleaned) {
    logger.info(options.label || 'Ghostscript OCR extracted text', {
      textLength: cleaned.length,
      qualityScore: scoreExtractedText(cleaned),
    });
  }
  return cleaned;
}

async function withTempPdf<T>(buffer: Buffer, work: (filePath: string) => Promise<T>): Promise<T> {
  return withTempDir('rad-report-pdf-', async (tempDir) => {
    const tempPdfPath = path.join(tempDir, 'input.pdf');
    await writeFile(tempPdfPath, buffer);
    return await work(tempPdfPath);
  });
}

async function buildPreprocessedPdf(
  filePath: string,
  tempDir: string,
  variant: (typeof OCR_PREPROCESS_VARIANTS)[number]
): Promise<string> {
  const rawDir = path.join(tempDir, `${variant.name}-raw`);
  const processedDir = path.join(tempDir, `${variant.name}-processed`);
  const outputPdfPath = path.join(tempDir, `${variant.name}.pdf`);

  await mkdir(rawDir, { recursive: true });
  await mkdir(processedDir, { recursive: true });

  await execFileAsync(
    'gs',
    [
      '-q',
      '-dNOPAUSE',
      '-dBATCH',
      `-r${OCR_RASTER_DPI}`,
      '-sDEVICE=pnggray',
      `-sOutputFile=${path.join(rawDir, 'page-%03d.png')}`,
      filePath,
    ],
    {
      timeout: PREPROCESS_TIMEOUT_MS,
      maxBuffer: COMMAND_BUFFER_LIMIT,
    }
  );

  const rawFiles = (await readdir(rawDir))
    .filter((name) => name.endsWith('.png'))
    .sort()
    .map((name) => path.join(rawDir, name));

  if (rawFiles.length === 0) {
    throw new Error(`Preprocessing produced no raster pages for ${variant.name}`);
  }

  const processedFiles: string[] = [];
  for (const rawFile of rawFiles) {
    const processedFile = path.join(processedDir, path.basename(rawFile));
    await execFileAsync(
      'convert',
      [rawFile, ...variant.convertArgs, processedFile],
      {
        timeout: PREPROCESS_TIMEOUT_MS,
        maxBuffer: COMMAND_BUFFER_LIMIT,
      }
    );
    processedFiles.push(processedFile);
  }

  await execFileAsync(
    'convert',
    [...processedFiles, outputPdfPath],
    {
      timeout: PREPROCESS_TIMEOUT_MS,
      maxBuffer: COMMAND_BUFFER_LIMIT,
    }
  );

  return outputPdfPath;
}

async function extractBestPreprocessedOcr(
  filePath: string,
  tessdataDir: string,
  options?: ExtractPdfOptions
): Promise<OcrCandidate | null> {
  if (!await commandExists('convert')) {
    logger.info('Skipping OCR preprocessing; ImageMagick convert not installed');
    return null;
  }

  await notifyStage(options, 'preprocessing_images');

  return withTempDir('rad-report-preprocess-', async (tempDir) => {
    let bestCandidate: OcrCandidate | null = null;

    for (const variant of OCR_PREPROCESS_VARIANTS) {
      try {
        const processedPdfPath = await buildPreprocessedPdf(filePath, tempDir, variant);
        const text = await extractWithGhostscriptOcr(processedPdfPath, {
          label: `Ghostscript OCR extracted text (${variant.name})`,
          tessdataDir,
        });
        bestCandidate = pickBetterOcrCandidate(bestCandidate, {
          label: variant.name,
          text,
          score: scoreExtractedText(text),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        logger.warn('Preprocessed OCR variant failed', {
          variant: variant.name,
          error: msg,
        });
      }
    }

    return bestCandidate;
  });
}

async function extractTextLocally(buffer: Buffer, options?: ExtractPdfOptions): Promise<string> {
  return withTempPdf(buffer, async (filePath) => {
    if (await commandExists('gs')) {
      try {
        await notifyStage(options, 'extracting_text');
        const textWriteText = await extractWithGhostscriptTxtwrite(filePath);
        if (hasEnoughText(textWriteText)) {
          return textWriteText;
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        logger.warn('Ghostscript txtwrite failed', { error: msg });
      }

      let bestOcrCandidate: OcrCandidate | null = null;
      const tessdataDir = await resolveTessdataDir();

      try {
        await notifyStage(options, 'running_ocr');
        const ocrText = await extractWithGhostscriptOcr(filePath, {
          label: 'Ghostscript OCR extracted text (direct)',
          tessdataDir: tessdataDir ?? undefined,
        });
        bestOcrCandidate = pickBetterOcrCandidate(bestOcrCandidate, {
          label: 'direct',
          text: ocrText,
          score: scoreExtractedText(ocrText),
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'unknown';
        logger.warn('Ghostscript OCR failed', { error: msg });
      }

      if (tessdataDir) {
        const preprocessedCandidate = await extractBestPreprocessedOcr(filePath, tessdataDir, options);
        bestOcrCandidate = pickBetterOcrCandidate(bestOcrCandidate, preprocessedCandidate);
      }

      if (bestOcrCandidate?.text) {
        logger.info('Using best local OCR result', {
          source: bestOcrCandidate.label,
          qualityScore: bestOcrCandidate.score,
          textLength: bestOcrCandidate.text.length,
        });
        return bestOcrCandidate.text;
      }
    } else {
      logger.info('Ghostscript not installed; skipping local fallback');
    }

    return '';
  });
}

/**
 * Extracts text from PDF buffer.
 * Tries local parsers first, remote OCR last.
 */
export async function extractTextFromPdf(
  buffer: Buffer | Blob,
  options?: ExtractPdfOptions
): Promise<string> {
  const bufferToUse = buffer instanceof Blob
    ? Buffer.from(await buffer.arrayBuffer())
    : buffer;

  try {
    const data = await pdfParse(bufferToUse);
    const cleaned = cleanExtractedText(data.text || '');

    if (hasEnoughText(cleaned)) {
      logger.info('pdf-parse extracted text successfully', {
        pageCount: data.numpages,
        textLength: cleaned.length,
      });
      return cleaned;
    }

    logger.info('pdf-parse returned insufficient text, trying local fallbacks', {
      textLength: cleaned.length,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.warn('pdf-parse failed, trying local fallbacks', { error: msg });
  }

  const localText = await extractTextLocally(bufferToUse, options);
  if (localText) {
    return localText;
  }

  try {
    await notifyStage(options, 'running_ocr');
    const ocrText = await ocrWithClaude(bufferToUse);
    if (ocrText) {
      return ocrText;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    logger.error('Claude OCR failed', { error: msg });
    throw new Error(`PDF extraction failed: ${msg}`);
  }

  throw new Error('No text could be extracted from the PDF');
}

/**
 * Validates that PDF buffer is valid.
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

export async function extractTextFromPdfPath(filePath: string): Promise<string> {
  return extractTextFromPdf(await readFile(filePath));
}
