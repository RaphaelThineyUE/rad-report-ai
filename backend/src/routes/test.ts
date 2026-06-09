/**
 * Test routes — admin-only testing harness endpoints.
 * Mounted at /api/test. All routes require admin authentication.
 * POST /analyze — analyze report with configurable prompt/model/temperature
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { requireAdmin, AuthRequest } from '../middleware/auth.js';
import { analyzeReportText } from '../controllers/aiController.js';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

// Test analyze endpoint with configurable options
router.post(
  '/analyze',
  requireAdmin,
  [
    body('report_text').isString().notEmpty().withMessage('report_text must be a non-empty string'),
    body('prompt_variant').optional().isIn(['default', 'strict', 'lenient']),
    body('model').optional().isString(),
    body('temperature').optional().isFloat({ min: 0, max: 1 }),
  ],
  wrapAuth(analyzeReportText)
);

export default router;
