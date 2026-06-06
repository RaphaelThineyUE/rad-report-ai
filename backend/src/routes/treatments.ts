/**
 * Treatments routes — mounted at /api/treatments. All routes require requireAuth.
 * GET    /     — list treatments (listTreatments)
 * POST   /     — create treatment with type/outcome/date validation (createTreatment)
 * GET    /:id  — fetch single treatment (getTreatment)
 * PATCH  /:id  — partial update with validation (updateTreatment)
 * DELETE /:id  — delete treatment (deleteTreatment)
 * Validates treatment_type against Surgery|Chemotherapy|Radiation|Hormone Therapy|
 * Targeted Therapy|Immunotherapy|Other; outcome against 7 fixed outcome values.
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import { body } from 'express-validator';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import {
  createTreatment,
  deleteTreatment,
  getTreatment,
  listTreatments,
  updateTreatment,
} from '../controllers/treatmentController.js';

const TREATMENT_TYPES = [
  'Surgery',
  'Chemotherapy',
  'Radiation',
  'Hormone Therapy',
  'Targeted Therapy',
  'Immunotherapy',
  'Other',
] as const;

const TREATMENT_OUTCOMES = [
  'Complete Response',
  'Partial Response',
  'Stable Disease',
  'Progressive Disease',
  'Recurrence',
  'Remission',
  'Other',
] as const;

const TREATMENT_TYPE_OPTIONS = [...TREATMENT_TYPES];
const TREATMENT_OUTCOME_OPTIONS = [...TREATMENT_OUTCOMES];

const createValidators = [
  body('patient_id').isUUID().withMessage('patient_id must be a UUID'),
  body('treatment_type').isIn(TREATMENT_TYPE_OPTIONS),
  body('treatment_start_date').isISO8601().withMessage('treatment_start_date must be YYYY-MM-DD'),
  body('treatment_end_date').optional({ nullable: true }).isISO8601(),
  body('medication_details').optional({ nullable: true }).isString(),
  body('treatment_outcome').optional({ nullable: true }).isIn(TREATMENT_OUTCOME_OPTIONS),
  body('side_effects').optional({ nullable: true }).isString(),
  body('follow_up_date').optional({ nullable: true }).isISO8601(),
];

const updateValidators = [
  body('patient_id').optional().isUUID(),
  body('treatment_type').optional().isIn(TREATMENT_TYPE_OPTIONS),
  body('treatment_start_date').optional().isISO8601(),
  body('treatment_end_date').optional({ nullable: true }).isISO8601(),
  body('medication_details').optional({ nullable: true }).isString(),
  body('treatment_outcome').optional({ nullable: true }).isIn(TREATMENT_OUTCOME_OPTIONS),
  body('side_effects').optional({ nullable: true }).isString(),
  body('follow_up_date').optional({ nullable: true }).isISO8601(),
];

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

router.get('/', requireAuth, wrapAuth(listTreatments));
router.post('/', requireAuth, createValidators, wrapAuth(createTreatment));
router.get('/:id', requireAuth, wrapAuth(getTreatment));
router.patch('/:id', requireAuth, updateValidators, wrapAuth(updateTreatment));
router.delete('/:id', requireAuth, wrapAuth(deleteTreatment));

export default router;
