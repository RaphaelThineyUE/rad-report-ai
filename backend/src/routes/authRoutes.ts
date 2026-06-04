import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, register, updateMe } from '../controllers/authController.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, protectedLimiter } from '../middleware/rateLimit.js';
import { handleValidation } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const authRouter = Router();

authRouter.use(authLimiter);
authRouter.post(
  '/register',
  body('email').isEmail(),
  body('password').isLength({ min: 8 }),
  handleValidation,
  asyncHandler(register),
);
authRouter.post('/login', body('email').isEmail(), body('password').notEmpty(), handleValidation, asyncHandler(login));
authRouter.get('/me', protectedLimiter, requireAuth, asyncHandler(me));
authRouter.patch('/me', protectedLimiter, requireAuth, body('full_name').optional().isString(), handleValidation, asyncHandler(updateMe));
