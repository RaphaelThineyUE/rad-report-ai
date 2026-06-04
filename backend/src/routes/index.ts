import { Router, IRouter } from 'express';
import authRoutes from './auth';
import patientsRouter from './patients';
import reportsRouter from './reports';
import treatmentsRouter from './treatments';

const router: IRouter = Router();

router.use('/auth', authRoutes);
router.use('/patients', patientsRouter);
router.use('/reports', reportsRouter);
router.use('/treatments', treatmentsRouter);

export default router;
