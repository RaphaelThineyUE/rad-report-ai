import { IRouter, Router } from 'express';
import { body } from 'express-validator';
import { requireAuth } from '../middleware/auth';
import {
  listPatients,
  createPatient,
  getPatient,
  updatePatient,
  deletePatient,
} from '../controllers/patientController';
import { AuthRequest } from '../middleware/auth';
import { Request, Response, NextFunction } from 'express';

const router: IRouter = Router();

const createValidators = [
  body('name')
    .notEmpty().withMessage('Name is required')
    .isLength({ max: 200 }).withMessage('Name must be at most 200 characters'),
  body('date_of_birth').optional({ nullable: true }).isISO8601().withMessage('Invalid date format'),
  body('sex').optional({ nullable: true }).isIn(['M', 'F', 'Other']).withMessage('Sex must be M, F, or Other'),
  body('stage').optional({ nullable: true }).isString(),
  body('mrn').optional({ nullable: true }).isString(),
  body('notes').optional({ nullable: true }).isString(),
];

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

router.get('/', requireAuth, wrapAuth(listPatients));
router.post('/', requireAuth, createValidators, wrapAuth(createPatient));
router.get('/:id', requireAuth, wrapAuth(getPatient));
router.patch('/:id', requireAuth, wrapAuth(updatePatient));
router.delete('/:id', requireAuth, wrapAuth(deletePatient));

export default router;
