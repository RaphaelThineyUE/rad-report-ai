import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getAnalytics, exportAnalyticsCsv } from '../controllers/analyticsController';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

router.get('/', requireAuth, wrapAuth(getAnalytics));
router.get('/export/csv', requireAuth, wrapAuth(exportAnalyticsCsv));

export default router;
