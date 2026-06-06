/**
 * Admin routes — mounted at /api/admin. All routes require requireAuth.
 * GET /health          — system health check (getSystemHealth)
 * GET /users           — list all users (listUsers)
 * GET /users/:userId   — fetch a specific user profile (getUserProfile)
 * Authorization beyond authentication (e.g. admin role check) is enforced in adminController.
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import { getSystemHealth, listUsers, getUserProfile } from '../controllers/adminController.js';

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
