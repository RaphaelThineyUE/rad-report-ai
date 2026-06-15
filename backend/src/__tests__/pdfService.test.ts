import { mkdirSync, writeFileSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import pdfParse from 'pdf-parse';
import Anthropic from '@anthropic-ai/sdk';
import { execFile } from 'node:child_process';
import { extractTextFromPdf } from '../services/pdfService';

jest.mock('pdf-parse', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const createMock = jest.fn();

jest.mock('@anthropic-ai/sdk', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: createMock,
    },
  })),
}));

jest.mock('node:child_process', () => ({
  execFile: jest.fn(),
}));

const mockPdfParse = pdfParse as jest.MockedFunction<typeof pdfParse>;
const mockExecFile = execFile as unknown as jest.MockedFunction<typeof execFile>;
const MockAnthropic = Anthropic as unknown as jest.Mock;

describe('pdfService', () => {
  const sampleBuffer = Buffer.from('%PDF-1.4 fake');
  const originalKey = process.env.ANTHROPIC_API_KEY;
  const originalTessdata = process.env.TESSDATA_PREFIX;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = originalKey;
    process.env.TESSDATA_PREFIX = originalTessdata;
  });

  afterAll(() => {
    process.env.ANTHROPIC_API_KEY = originalKey;
    process.env.TESSDATA_PREFIX = originalTessdata;
  });

  it('returns text from pdf-parse when text layer is present', async () => {
    mockPdfParse.mockResolvedValue({
      text: 'A'.repeat(150),
      numpages: 2,
    } as any);

    const text = await extractTextFromPdf(sampleBuffer);

    expect(text).toBe('A'.repeat(150));
    expect(mockExecFile).not.toHaveBeenCalled();
    expect(MockAnthropic).not.toHaveBeenCalled();
  });

  it('falls back to Ghostscript txtwrite when pdf-parse text is insufficient', async () => {
    mockPdfParse.mockResolvedValue({
      text: '',
      numpages: 2,
    } as any);

    mockExecFile.mockImplementation((file, args, options, callback) => {
      const cb = typeof options === 'function' ? options : callback!;
      if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v gs')) {
        cb(null, '/usr/bin/gs\n', '');
        return {} as any;
      }
      if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v convert')) {
        cb(new Error('not found') as any, '', '');
        return {} as any;
      }
      if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('txtwrite'))) {
        cb(null, 'B'.repeat(180), '');
        return {} as any;
      }
      cb(new Error('unexpected command') as any, '', '');
      return {} as any;
    });

    const text = await extractTextFromPdf(sampleBuffer);

    expect(text).toBe('B'.repeat(180));
    expect(MockAnthropic).not.toHaveBeenCalled();
  });

  it('falls back to Ghostscript OCR when tessdata exists', async () => {
    const tessdataDir = await mkdtemp(path.join(os.tmpdir(), 'tessdata-'));
    await writeFile(path.join(tessdataDir, 'eng.traineddata'), 'fake');

    try {
      process.env.TESSDATA_PREFIX = tessdataDir;
      mockPdfParse.mockResolvedValue({
        text: '',
        numpages: 2,
      } as any);

      mockExecFile.mockImplementation((file, args, options, callback) => {
        const cb = typeof options === 'function' ? options : callback!;
        if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v gs')) {
          cb(null, '/usr/bin/gs\n', '');
          return {} as any;
        }
        if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v convert')) {
          cb(new Error('not found') as any, '', '');
          return {} as any;
        }
        if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('txtwrite'))) {
          cb(null, '', '');
          return {} as any;
        }
        if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('DEVICE=ocr'))) {
          cb(null, 'OCR extracted text', '');
          return {} as any;
        }
        cb(new Error('unexpected command') as any, '', '');
        return {} as any;
      });

      const text = await extractTextFromPdf(sampleBuffer);

      expect(text).toBe('OCR extracted text');
      expect(MockAnthropic).not.toHaveBeenCalled();
    } finally {
      await rm(tessdataDir, { recursive: true, force: true });
    }
  });

  it('prefers preprocessed OCR when it scores better than direct OCR', async () => {
    const tessdataDir = await mkdtemp(path.join(os.tmpdir(), 'tessdata-'));
    await writeFile(path.join(tessdataDir, 'eng.traineddata'), 'fake');

    let ocrCallCount = 0;

    try {
      process.env.TESSDATA_PREFIX = tessdataDir;
      mockPdfParse.mockResolvedValue({
        text: '',
        numpages: 2,
      } as any);

      mockExecFile.mockImplementation((file, args, options, callback) => {
        const cb = typeof options === 'function' ? options : callback!;

        if (file === 'sh' && Array.isArray(args)) {
          if (String(args[1]).includes('command -v gs')) {
            cb(null, '/usr/bin/gs\n', '');
            return {} as any;
          }
          if (String(args[1]).includes('command -v convert')) {
            cb(null, '/usr/bin/convert\n', '');
            return {} as any;
          }
        }

        if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('txtwrite'))) {
          cb(null, '', '');
          return {} as any;
        }

        if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('DEVICE=pnggray'))) {
          const outputArg = args.find((arg) => String(arg).includes('-sOutputFile=')) as string;
          const outputPattern = outputArg.replace('-sOutputFile=', '');
          const rasterPath = outputPattern.replace('%03d', '001');
          mkdirSync(path.dirname(rasterPath), { recursive: true });
          writeFileSync(rasterPath, 'fake-png');
          cb(null, '', '');
          return {} as any;
        }

        if (file === 'convert' && Array.isArray(args)) {
          const outputPath = String(args[args.length - 1]);
          mkdirSync(path.dirname(outputPath), { recursive: true });
          writeFileSync(outputPath, 'converted');
          cb(null, '', '');
          return {} as any;
        }

        if (file === 'gs' && Array.isArray(args) && args.some((arg) => String(arg).includes('DEVICE=ocr'))) {
          ocrCallCount += 1;
          if (ocrCallCount === 1) {
            cb(null, 'zz qxj 12\nzz qxj 12', '');
            return {} as any;
          }
          cb(null, 'BREAST ULTRASOUND REPORT\nPATIENT NAME: Jane Doe\nFINDINGS: benign simple cyst', '');
          return {} as any;
        }

        cb(new Error('unexpected command') as any, '', '');
        return {} as any;
      });

      const text = await extractTextFromPdf(sampleBuffer);

      expect(text).toContain('BREAST ULTRASOUND REPORT');
      expect(text).toContain('PATIENT NAME');
    } finally {
      await rm(tessdataDir, { recursive: true, force: true });
    }
  });

  it('falls back to Claude OCR when local methods do not extract text', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';
    mockPdfParse.mockResolvedValue({
      text: '',
      numpages: 2,
    } as any);

    mockExecFile.mockImplementation((file, args, options, callback) => {
      const cb = typeof options === 'function' ? options : callback!;
      if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v gs')) {
        cb(null, '/usr/bin/gs\n', '');
        return {} as any;
      }
      if (file === 'sh' && Array.isArray(args) && String(args[1]).includes('command -v convert')) {
        cb(new Error('not found') as any, '', '');
        return {} as any;
      }
      if (file === 'gs') {
        cb(null, '', '');
        return {} as any;
      }
      cb(new Error('unexpected command') as any, '', '');
      return {} as any;
    });

    createMock.mockResolvedValue({
      content: [{ type: 'text', text: 'Claude OCR text' }],
    });

    const text = await extractTextFromPdf(sampleBuffer);

    expect(text).toBe('Claude OCR text');
    expect(MockAnthropic).toHaveBeenCalledTimes(1);
  });

  it('throws clear error when all extraction methods fail and no Claude key exists', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    mockPdfParse.mockResolvedValue({
      text: '',
      numpages: 2,
    } as any);

    mockExecFile.mockImplementation((file, args, options, callback) => {
      const cb = typeof options === 'function' ? options : callback!;
      if (file === 'sh') {
        cb(new Error('not found') as any, '', '');
        return {} as any;
      }
      cb(new Error('unexpected command') as any, '', '');
      return {} as any;
    });

    await expect(extractTextFromPdf(sampleBuffer)).rejects.toThrow(
      'PDF extraction failed: ANTHROPIC_API_KEY is not configured'
    );
  });
});
