import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { getSystemHealth, listUsers, getUserProfile } from '../controllers/adminController';

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

router.get('/health', requireAuth, wrapAuth(getSystemHealth));
router.get('/users', requireAuth, wrapAuth(listUsers));
router.get('/users/:userId', requireAuth, wrapAuth(getUserProfile));

export default router;
