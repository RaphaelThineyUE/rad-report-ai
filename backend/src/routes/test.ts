/**
 * Test routes — testing harness endpoints (open to all authenticated users).
 * Mounted at /api/test.
 * POST /analyze      — analyze report text with configurable prompt/model/temperature
 * POST /analyze-file — upload a PDF, extract text via OCR, then analyze
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import multer from 'multer';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { analyzeReportText } from '../controllers/aiController.js';
import { extractTextFromPdf } from '../services/pdfService.js';
import { cleanupIdentifiers, analyzeReport } from '../services/claudeService.js';
import { logger } from '../utils/logger.js';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    cb(null, file.mimetype === 'application/pdf');
  },
});

const router: IRouter = Router();

// Analyze raw text
router.post(
  '/analyze',
  requireAuth,
  [
    body('report_text').isString().notEmpty().withMessage('report_text must be a non-empty string'),
    body('prompt_variant').optional().isIn(['default', 'strict', 'lenient']),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 1 }),
  ],
  wrapAuth(analyzeReportText)
);

// Upload a PDF, extract text, then analyze — tests full OCR pipeline
router.post(
  '/analyze-file',
  requireAuth,
  upload.single('file'),
  wrapAuth(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'A PDF file is required' });
      return;
    }

    const promptVariant = (req.body.prompt_variant as 'default' | 'strict' | 'lenient') || 'default';
    const model = req.body.model as string | undefined;
    const temperature = req.body.temperature ? parseFloat(req.body.temperature) : undefined;

    const startTime = Date.now();

    let extractedText: string;
    try {
      extractedText = await extractTextFromPdf(req.file.buffer);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Test harness text extraction error', { userId: req.userId, error: message });
      res.status(422).json({
        error: 'Could not extract text from the PDF',
        details: message,
        stage: 'extraction',
      });
      return;
    }

    if (!extractedText?.trim()) {
      res.status(422).json({
        error: 'No text could be extracted from the PDF',
        details: 'Both the text-layer parser and the Claude OCR fallback returned no text. The file may be blank, corrupted, or password-protected.',
        stage: 'extraction',
      });
      return;
    }

    try {
      const cleanedText = await cleanupIdentifiers(extractedText);
      const analysis = await analyzeReport(cleanedText, { prompt_variant: promptVariant, model, temperature });

      logger.info('Test harness file analysis complete', {
        userId: req.userId,
        filename: req.file.originalname,
        textLength: extractedText.length,
        promptVariant,
        model,
        processingMs: Date.now() - startTime,
      });

      res.json({
        analysis,
        original_text_length: extractedText.length,
        extracted_text: extractedText,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Test harness AI analysis error', { userId: req.userId, error: message });
      // Text extraction succeeded, so return it even though AI analysis failed —
      // lets the harness show OCR output for debugging the extraction pipeline.
      res.status(502).json({
        error: 'AI analysis failed',
        details: message,
        stage: 'analysis',
        extracted_text: extractedText,
        original_text_length: extractedText.length,
      });
    }
  })
);

export default router;
