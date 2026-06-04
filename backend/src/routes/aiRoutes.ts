import { Router } from 'express';
import { body } from 'express-validator';
import { analyzeReport, compare, consolidate, summary } from '../controllers/aiController.js';
import { requireAuth } from '../middleware/auth.js';
import { handleValidation } from '../middleware/validation.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const aiRouter = Router();

aiRouter.use(requireAuth);
aiRouter.post('/analyze-report', body('pdf_text').isString(), handleValidation, asyncHandler(analyzeReport));
aiRouter.post('/generate-summary', body('extracted_json').exists(), handleValidation, asyncHandler(summary));
aiRouter.post('/consolidate-reports', body('reports').isArray(), handleValidation, asyncHandler(consolidate));
aiRouter.post('/compare-treatments', body('treatment_options').isArray(), handleValidation, asyncHandler(compare));
