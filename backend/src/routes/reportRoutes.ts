import { Router } from 'express';
import { body } from 'express-validator';
import { createReport, deleteReport, getReport, listReports, processReport, updateReport, uploadReport } from '../controllers/reportsController.js';
import { requireAuth } from '../middleware/auth.js';
import { protectedLimiter } from '../middleware/rateLimit.js';
import { upload } from '../middleware/upload.js';
import { handleValidation } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const reportRouter = Router();

reportRouter.use(protectedLimiter);
reportRouter.use(requireAuth);
reportRouter.post('/upload', upload.single('file'), asyncHandler(uploadReport));
reportRouter.post('/', body('patient_id').notEmpty(), body('filename').notEmpty(), handleValidation, asyncHandler(createReport));
reportRouter.post('/process', body('reportId').optional().isString(), handleValidation, asyncHandler(processReport));
reportRouter.get('/', asyncHandler(listReports));
reportRouter.get('/:id', asyncHandler(getReport));
reportRouter.patch('/:id', asyncHandler(updateReport));
reportRouter.delete('/:id', asyncHandler(deleteReport));
