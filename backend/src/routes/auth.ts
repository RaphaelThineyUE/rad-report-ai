import { Router, IRouter } from 'express';
import { body } from 'express-validator';
import { login, register, getMe, updateMe } from '../controllers/authController';
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
router.patch('/me', requireAuth, body('full_name').optional().notEmpty(), updateMe);

export default router;
