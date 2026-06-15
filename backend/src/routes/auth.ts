/**
 * Auth routes — mounted at /api/auth.
 * POST /register         — create account (authRateLimiter + body validation → register)
 * POST /login            — sign in (authRateLimiter + body validation → login)
 * GET  /me               — fetch current user profile (requireAuth → getMe)
 * PATCH /me              — update profile/email/password (requireAuth → updateMe)
 * POST /forgot-password  — send reset email (authRateLimiter → forgotPassword)
 * POST /reset-password   — apply new password (requireAuth + authRateLimiter → resetPassword)
 * DELETE /me             — delete account (requireAuth → deleteAccount)
 */
import { Router, IRouter, type NextFunction, type Request, type Response } from 'express';
import { body } from 'express-validator';
import { login, register, getMe, updateMe, forgotPassword, resetPassword, deleteAccount } from '../controllers/authController.js';
import { requireAuth, type AuthRequest } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router: IRouter = Router();

function wrapAsync(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

router.post(
  '/register',
  authRateLimiter,
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('full_name').notEmpty(),
  wrapAsync(register)
);

router.post(
  '/login',
  authRateLimiter,
  body('email').isEmail(),
  body('password').notEmpty(),
  wrapAsync(login)
);

router.get('/me', requireAuth, wrapAuth(getMe));
router.patch(
  '/me',
  requireAuth,
  body('full_name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 8 }),
  wrapAuth(updateMe)
);

router.post(
  '/forgot-password',
  authRateLimiter,
  body('email').isEmail(),
  wrapAsync(forgotPassword)
);

router.post(
  '/reset-password',
  requireAuth,
  authRateLimiter,
  body('password').isLength({ min: 8 }),
  wrapAuth(resetPassword)
);

router.delete('/me', requireAuth, wrapAuth(deleteAccount));

export default router;
