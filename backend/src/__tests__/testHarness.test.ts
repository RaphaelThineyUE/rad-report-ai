/**
 * Test Harness Route Tests
 * POST /api/test/analyze-file — upload a PDF, extract text, analyze with AI
 *
 * Uses sample PDFs from docs/samples/ to exercise the full OCR pipeline.
 * AI services (extractTextFromPdf, cleanupIdentifiers, analyzeReport) are mocked
 * so tests are fast and don't consume API credits. One integration-style test
 * runs extractTextFromPdf against the real text-based PDF to verify pdf-parse works.
 */
import path from 'path';
import fs from 'fs';
import request from 'supertest';
import express from 'express';

// --- mocks must be declared before imports that use them ---

jest.mock('../services/supabaseClient', () => ({
  supabaseAdmin: { storage: { from: jest.fn() } },
  createUserClient: jest.fn(),
}));

jest.mock('../middleware/auth', () => ({
  requireAuth: (req: any, _res: any, next: any) => {
    req.userId = 'test-user-id';
    req.accessToken = 'test-token';
    next();
  },
}));

jest.mock('../services/pdfService', () => ({
  extractTextFromPdf: jest.fn(),
}));

jest.mock('../services/claudeService', () => ({
  cleanupIdentifiers: jest.fn((text: string) => Promise.resolve(text)),
  analyzeReport: jest.fn(),
}));

// imports after mocks
import testRouter from '../routes/test';
import { errorHandler } from '../middleware/errorHandler';
import { extractTextFromPdf } from '../services/pdfService';
import { analyzeReport } from '../services/claudeService';

const mockExtractText = extractTextFromPdf as jest.MockedFunction<typeof extractTextFromPdf>;
const mockAnalyze = analyzeReport as jest.MockedFunction<typeof analyzeReport>;

// --- sample files ---
const SAMPLES_DIR = path.resolve(__dirname, '../../../docs/samples');
const TEXT_PDF = path.join(SAMPLES_DIR, 'text-based-pdf-sample.pdf');
const IMAGE_PDF = path.join(SAMPLES_DIR, 'image-based-pdf-sample.pdf');
const REAL_REPORT_PDF = path.join(SAMPLES_DIR, 'bresdt_rediology.pdf');

const MOCK_ANALYSIS = {
  summary: 'Bilateral screening mammography with no suspicious findings.',
  birads_value: 2,
  birads_confidence: 'high' as const,
  breast_density_value: 'B',
  exam_date: '2026-06-01',
  modality: 'mammography',
  contrast: 'without' as const,
  exam_type: 'screening',
  exam_laterality: 'bilateral',
  clinical_history: null,
  risk_factors: [],
  prior_exam_date: null,
  comparison_dates: [],
  findings: [{ description: 'No suspicious masses', location: 'bilateral', birads: 2 } as any],
  lymph_nodes: [],
  skin_nipple_changes: [],
  implants: null,
  post_surgical_changes: [],
  multifocal: null,
  multicentric: null,
  bilateral_disease: null,
  disease_extent: null,
  recommendations: [{ action: 'Routine annual screening', timeframe: '12 months' } as any],
  management: { followup: 'routine' } as any,
  pathology_correlation: null,
  red_flags: [],
  raw_analysis: '',
  clinical_disclaimer: 'For clinical use only.',
};

// --- app setup ---
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/test', testRouter);
  app.use(errorHandler);
  return app;
}

// --- helpers ---
function pdfBuffer(filePath: string): Buffer {
  return fs.readFileSync(filePath);
}

// ============================================================
describe('POST /api/test/analyze-file', () => {
  let app: express.Application;

  beforeAll(() => {
    app = buildApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- happy path ---

  it('returns 200 with extraction results for a text-layer PDF', async () => {
    const extractedText = 'MAMMOGRAPHY REPORT\nBI-RADS 2\nNo suspicious findings.\nRecommend routine screening.';
    mockExtractText.mockResolvedValueOnce(extractedText);
    mockAnalyze.mockResolvedValueOnce(MOCK_ANALYSIS);

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'text-based-pdf-sample.pdf', contentType: 'application/pdf' })
      .field('prompt_variant', 'default')
      .field('model', 'claude-sonnet-4-6')
      .field('temperature', '0.2');

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      analysis: expect.objectContaining({ birads_value: 2 }),
      original_text_length: extractedText.length,
      extracted_text: extractedText,
    });
    expect(mockExtractText).toHaveBeenCalledWith(expect.any(Buffer));
    expect(mockAnalyze).toHaveBeenCalledWith(
      extractedText,
      expect.objectContaining({ prompt_variant: 'default', model: 'claude-sonnet-4-6' })
    );
  });

  it('returns 200 using the real report sample (bresdt_rediology.pdf)', async () => {
    const extractedText = 'BREAST IMAGING REPORT\nBI-RADS 3\nShort-interval follow-up recommended.';
    mockExtractText.mockResolvedValueOnce(extractedText);
    mockAnalyze.mockResolvedValueOnce({ ...MOCK_ANALYSIS, birads_value: 3 });

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(REAL_REPORT_PDF), { filename: 'bresdt_rediology.pdf', contentType: 'application/pdf' })
      .field('prompt_variant', 'strict');

    expect(res.status).toBe(200);
    expect(res.body.analysis.birads_value).toBe(3);
  });

  it('passes temperature and model overrides to analyzeReport', async () => {
    mockExtractText.mockResolvedValueOnce('Report text with enough content to analyze.');
    mockAnalyze.mockResolvedValueOnce(MOCK_ANALYSIS);

    await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'test.pdf', contentType: 'application/pdf' })
      .field('model', 'claude-opus-4-8')
      .field('temperature', '0.0');

    expect(mockAnalyze).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ model: 'claude-opus-4-8', temperature: 0 })
    );
  });

  it('includes the full extracted text in the response', async () => {
    const longText = 'A'.repeat(2000);
    mockExtractText.mockResolvedValueOnce(longText);
    mockAnalyze.mockResolvedValueOnce(MOCK_ANALYSIS);

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'long.pdf', contentType: 'application/pdf' });

    expect(res.body.extracted_text).toHaveLength(2000);
  });

  // --- error cases ---

  it('returns 400 when no file is attached', async () => {
    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .field('prompt_variant', 'default');

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/file/i);
  });

  it('returns 422 when extracted text is empty', async () => {
    mockExtractText.mockResolvedValueOnce('');

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'empty.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      error: expect.stringMatching(/no text/i),
      stage: 'extraction',
    });
  });

  it('returns 422 with error details when extractTextFromPdf throws', async () => {
    mockExtractText.mockRejectedValueOnce(new Error('PDF extraction failed: corrupt PDF header'));

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'corrupt.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(422);
    expect(res.body).toMatchObject({
      error: expect.stringMatching(/extract/i),
      details: expect.stringContaining('PDF extraction failed'),
      stage: 'extraction',
    });
  });

  it('returns 502 with extracted text and error details when analyzeReport throws', async () => {
    const extractedText = 'Valid report text that is long enough to pass the check.';
    mockExtractText.mockResolvedValueOnce(extractedText);
    mockAnalyze.mockRejectedValueOnce(new Error('Anthropic API error: rate limit exceeded'));

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', pdfBuffer(TEXT_PDF), { filename: 'test.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(502);
    expect(res.body).toMatchObject({
      error: 'AI analysis failed',
      details: expect.stringContaining('Anthropic API error'),
      stage: 'analysis',
      extracted_text: extractedText,
    });
  });

  it('returns 413 when file exceeds 20MB limit', async () => {
    const bigBuffer = Buffer.alloc(21 * 1024 * 1024);

    const res = await request(app)
      .post('/api/test/analyze-file')
      .set('Authorization', 'Bearer test-token')
      .attach('file', bigBuffer, { filename: 'huge.pdf', contentType: 'application/pdf' });

    expect(res.status).toBe(413);
  });
});

// ============================================================
// Integration test — real pdf-parse, no Claude calls
// ============================================================
describe('extractTextFromPdf — real pdf-parse integration', () => {
  it('extracts text from text-based-pdf-sample.pdf without Claude fallback', async () => {
    // Unmock pdfService so we run the real implementation
    jest.unmock('../services/pdfService');
    jest.resetModules();
    const { extractTextFromPdf: realExtract } = await import('../services/pdfService');

    const buffer = pdfBuffer(TEXT_PDF);
    const text = await realExtract(buffer);

    expect(typeof text).toBe('string');
    expect(text.length).toBeGreaterThan(50);
  }, 15000);
});
