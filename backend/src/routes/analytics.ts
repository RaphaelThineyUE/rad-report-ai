/**
 * Analytics routes — mounted at /api/analytics. All routes require requireAuth.
 * GET /          — fetch aggregated dashboard analytics (getAnalytics)
 * GET /export/csv — download analytics data as a CSV file (exportAnalyticsCsv)
 * Delegates to analyticsController; no body validation needed (query-only endpoints).
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getAnalytics, exportAnalyticsCsv } from '../controllers/analyticsController.js';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

router.get('/', requireAuth, wrapAuth(getAnalytics));
router.get('/export/csv', requireAuth, wrapAuth(exportAnalyticsCsv));

export default router;
