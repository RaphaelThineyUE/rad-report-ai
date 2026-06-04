import { Router, IRouter } from 'express';
import authRoutes from './auth';

const router: IRouter = Router();

router.use('/auth', authRoutes);

export default router;
