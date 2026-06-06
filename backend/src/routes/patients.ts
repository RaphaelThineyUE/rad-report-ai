/**
 * Patients routes — mounted at /api/patients. All routes require requireAuth.
 * GET    /              — list patients (listPatients)
 * POST   /              — create patient with full clinical validation (createPatient)
 * GET    /:id           — fetch single patient (getPatient)
 * PATCH  /:id           — partial update with validation (updatePatient)
 * DELETE /:id           — delete patient (deletePatient)
 * GET    /:id/export    — export full patient bundle (exportPatientBundle)
 * wrapAuth bridges typed AuthRequest handlers to standard Express middleware.
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import {
  createPatient,
  deletePatient,
  getPatient,
  listPatients,
  updatePatient,
  exportPatientBundle,
} from '../controllers/patientController.js';

const GENDERS = ['Male', 'Female', 'Other'] as const;
const CANCER_STAGES = ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Unknown'] as const;
const BIOMARKER_STATUSES = ['Positive', 'Negative', 'Unknown'] as const;

const createValidators = [
  body('full_name').isString().trim().notEmpty().withMessage('full_name is required'),
  body('date_of_birth').isISO8601().withMessage('date_of_birth must be YYYY-MM-DD'),
  body('gender').optional({ nullable: true }).isIn(GENDERS),
  body('ethnicity').optional({ nullable: true }).isString(),
  body('diagnosis_date').isISO8601().withMessage('diagnosis_date must be YYYY-MM-DD'),
  body('cancer_type').isString().trim().notEmpty().withMessage('cancer_type is required'),
  body('cancer_stage').optional({ nullable: true }).isIn(CANCER_STAGES),
  body('tumor_size_cm').optional({ nullable: true }).isFloat({ min: 0 }),
  body('lymph_node_positive').optional({ nullable: true }).isBoolean(),
  body('er_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('pr_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('her2_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('menopausal_status').optional({ nullable: true }).isString(),
  body('initial_treatment_plan').optional({ nullable: true }).isString(),
];

const updateValidators = [
  body('full_name').optional().isString().trim().notEmpty(),
  body('date_of_birth').optional().isISO8601(),
  body('gender').optional({ nullable: true }).isIn(GENDERS),
  body('ethnicity').optional({ nullable: true }).isString(),
  body('diagnosis_date').optional().isISO8601(),
  body('cancer_type').optional().isString().trim().notEmpty(),
  body('cancer_stage').optional({ nullable: true }).isIn(CANCER_STAGES),
  body('tumor_size_cm').optional({ nullable: true }).isFloat({ min: 0 }),
  body('lymph_node_positive').optional({ nullable: true }).isBoolean(),
  body('er_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('pr_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('her2_status').optional({ nullable: true }).isIn(BIOMARKER_STATUSES),
  body('menopausal_status').optional({ nullable: true }).isString(),
  body('initial_treatment_plan').optional({ nullable: true }).isString(),
];

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

router.get('/', requireAuth, wrapAuth(listPatients));
router.post('/', requireAuth, createValidators, wrapAuth(createPatient));
router.get('/:id/export', requireAuth, wrapAuth(exportPatientBundle));
router.get('/:id', requireAuth, wrapAuth(getPatient));
router.patch('/:id', requireAuth, updateValidators, wrapAuth(updatePatient));
router.delete('/:id', requireAuth, wrapAuth(deletePatient));

export default router;
