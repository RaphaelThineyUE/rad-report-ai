import { Router } from 'express';
import { body } from 'express-validator';
import { createTreatment, deleteTreatment, getTreatment, listTreatments, updateTreatment } from '../controllers/treatmentsController.js';
import { requireAuth } from '../middleware/auth.js';
import { protectedLimiter } from '../middleware/rateLimit.js';
import { handleValidation } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const treatmentRouter = Router();

treatmentRouter.use(protectedLimiter);
treatmentRouter.use(requireAuth);
treatmentRouter.get('/', asyncHandler(listTreatments));
treatmentRouter.post(
  '/',
  body('patient_id').notEmpty(),
  body('treatment_type').notEmpty(),
  body('treatment_start_date').isISO8601(),
  handleValidation,
  asyncHandler(createTreatment),
);
treatmentRouter.get('/:id', asyncHandler(getTreatment));
treatmentRouter.patch('/:id', asyncHandler(updateTreatment));
treatmentRouter.delete('/:id', asyncHandler(deleteTreatment));
