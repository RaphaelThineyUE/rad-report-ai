import { IRouter, Router } from 'express';
import authRoutes from './auth';
import patientsRouter from './patients';
import reportsRouter from './reports';
import treatmentsRouter from './treatments';
import aiRoutes from './ai';
import analyticsRouter from './analytics';
import adminRouter from './admin';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientsRouter);
router.use('/reports', reportsRouter);
router.use('/treatments', treatmentsRouter);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRouter);
router.use('/admin', adminRouter);

export default router;
