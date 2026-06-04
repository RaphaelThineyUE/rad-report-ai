import { IRouter, Router } from 'express';
import authRoutes from './auth';
import patientsRouter from './patients';
import reportsRouter from './reports';
import treatmentsRouter from './treatments';
import aiRoutes from './ai';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientsRouter);
router.use('/reports', reportsRouter);
router.use('/treatments', treatmentsRouter);
router.use('/ai', aiRoutes);

export default router;
