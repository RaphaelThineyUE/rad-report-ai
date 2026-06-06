/**
 * AI routes — mounted at /api/ai. All routes require requireAuth.
 * POST /analyze           — analyze raw report text via Claude (analyzeReportText)
 * POST /summarize         — generate a plain-language summary (generateReportSummary)
 * POST /consolidate       — consolidate all reports for a patient (consolidatePatientReports)
 * POST /compare-treatments — compare treatments against a report (comparePatientTreatments)
 * POST /birads-trend      — deterministic BI-RADS trend detection (detectPatientBiradsTrend)
 * POST /quotes            — extract source evidence quotes from a report (extractReportQuotes)
 * All handlers live in aiController and call claudeService (backend-only; no direct Anthropic calls from frontend).
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  analyzeReportText,
  generateReportSummary,
  consolidatePatientReports,
  comparePatientTreatments,
  detectPatientBiradsTrend,
  extractReportQuotes,
} from '../controllers/aiController.js';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

// Analyze report from raw text
router.post(
  '/analyze',
  requireAuth,
  [body('report_text').isString().notEmpty().withMessage('report_text must be a non-empty string')],
  wrapAuth(analyzeReportText)
);

// Generate summary from raw text
router.post(
  '/summarize',
  requireAuth,
  [body('report_text').isString().notEmpty().withMessage('report_text must be a non-empty string')],
  wrapAuth(generateReportSummary)
);

// Consolidate reports
router.post(
  '/consolidate',
  requireAuth,
  [body('patient_id').isUUID().withMessage('patient_id must be a UUID')],
  wrapAuth(consolidatePatientReports)
);

// Compare treatments
router.post(
  '/compare-treatments',
  requireAuth,
  [
    body('patient_id').isUUID().withMessage('patient_id must be a UUID'),
    body('report_id').isUUID().withMessage('report_id must be a UUID'),
  ],
  wrapAuth(comparePatientTreatments)
);

// Detect BI-RADS trend
router.post(
  '/birads-trend',
  requireAuth,
  [body('patient_id').isUUID().withMessage('patient_id must be a UUID')],
  wrapAuth(detectPatientBiradsTrend)
);

// Extract source quotes
router.post(
  '/quotes',
  requireAuth,
  [
    body('report_id').isUUID().withMessage('report_id must be a UUID'),
    body('findings')
      .isArray({ min: 1 })
      .withMessage('findings must be a non-empty array'),
  ],
  wrapAuth(extractReportQuotes)
);

export default router;
