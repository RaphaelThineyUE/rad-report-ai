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
import { Router, IRouter } from 'express';
import { body } from 'express-validator';
import { login, register, getMe, updateMe, forgotPassword, resetPassword, deleteAccount } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router: IRouter = Router();

router.post(
  '/register',
  authRateLimiter,
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  body('full_name').notEmpty(),
  register
);

router.post(
  '/login',
  authRateLimiter,
  body('email').isEmail(),
  body('password').notEmpty(),
  login
);

router.get('/me', requireAuth, getMe);
router.patch(
  '/me',
  requireAuth,
  body('full_name').optional().notEmpty(),
  body('email').optional().isEmail(),
  body('password').optional().isLength({ min: 8 }),
  updateMe
);

router.post(
  '/forgot-password',
  authRateLimiter,
  body('email').isEmail(),
  forgotPassword
);

router.post(
  '/reset-password',
  requireAuth,
  authRateLimiter,
  body('password').isLength({ min: 8 }),
  resetPassword
);

router.delete('/me', requireAuth, deleteAccount);

export default router;
