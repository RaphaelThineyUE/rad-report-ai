import { IRouter, Router } from 'express';
import authRoutes from './auth.js';
import patientsRouter from './patients.js';
import reportsRouter from './reports.js';
import treatmentsRouter from './treatments.js';
import aiRoutes from './ai.js';
import analyticsRouter from './analytics.js';
import adminRouter from './admin.js';
import organizationsRouter from './organizations.js';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientsRouter);
router.use('/reports', reportsRouter);
router.use('/treatments', treatmentsRouter);
router.use('/ai', aiRoutes);
router.use('/analytics', analyticsRouter);
router.use('/admin', adminRouter);
router.use('/organizations', organizationsRouter);

export default router;
