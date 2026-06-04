import { Router } from 'express';
import { body } from 'express-validator';
import { createPatient, deletePatient, getPatient, listPatients, updatePatient } from '../controllers/patientsController.js';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const patientRouter = Router();

patientRouter.use(requireAuth);
patientRouter.get('/', asyncHandler(listPatients));
patientRouter.post(
  '/',
  body('full_name').notEmpty(),
  body('date_of_birth').isISO8601(),
  body('diagnosis_date').isISO8601(),
  body('cancer_type').notEmpty(),
  handleValidation,
  asyncHandler(createPatient),
);
patientRouter.get('/:id', asyncHandler(getPatient));
patientRouter.patch('/:id', handleValidation, asyncHandler(updatePatient));
patientRouter.delete('/:id', asyncHandler(deletePatient));
