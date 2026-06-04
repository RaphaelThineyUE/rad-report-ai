import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth';
import {
  consolidatePatientReports,
  comparePatientTreatments,
  detectPatientBiradsTrend,
  extractReportQuotes,
} from '../controllers/aiController';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

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
