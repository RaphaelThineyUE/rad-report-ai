import { IRouter, Router } from 'express';
import authRoutes from './auth';
import reportsRouter from './reports';
import treatmentsRouter from './treatments';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/reports', reportsRouter);
router.use('/treatments', treatmentsRouter);

export default router;
