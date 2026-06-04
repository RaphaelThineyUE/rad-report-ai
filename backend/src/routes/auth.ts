import { Router, IRouter } from 'express';
import { body } from 'express-validator';
import { login, register, getMe, updateMe, forgotPassword, resetPassword, deleteAccount } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';

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
