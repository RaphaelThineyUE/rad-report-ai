import { Router, IRouter } from 'express';
import authRoutes from './auth';
import patientsRouter from './patients';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientsRouter);

export default router;
