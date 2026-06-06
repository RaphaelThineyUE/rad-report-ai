/**
 * Reports routes — mounted at /api/reports. All routes require requireAuth.
 * POST /upload           — single PDF upload via multer memory storage (uploadReport)
 * POST /batch-upload     — upload up to 50 PDFs at once (batchUploadReports)
 * GET  /:id/url          — retrieve a signed Supabase Storage URL (getReportSignedUrl)
 * GET  /:id/export       — export report as JSON (exportReportJson)
 * POST /:id/process      — trigger AI processing on a stored report (processReport)
 * Standard CRUD: POST /, GET /, GET /:id, PATCH /:id, DELETE /:id → reportController.
 * File size limit is read from MAX_FILE_SIZE_MB env var (default 20 MB).
 */
import { IRouter, NextFunction, Request, Response, Router } from 'express';
import multer from 'multer';
import { body } from 'express-validator';
import { requireAuth, AuthRequest } from '../middleware/auth.js';
import {
  createReport,
  deleteReport,
  getReport,
  getReportSignedUrl,
  listReports,
  updateReport,
  uploadReport,
  batchUploadReports,
  processReport,
  exportReportJson,
} from '../controllers/reportController.js';

const maxFileSizeMb = Number(process.env.MAX_FILE_SIZE_MB ?? 20);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeMb * 1024 * 1024 },
});

const createValidators = [
  body('patient_id').isUUID().withMessage('patient_id must be a UUID'),
  body('filename').isString().notEmpty(),
  body('file_url').isString().notEmpty(),
  body('file_size').isInt({ gt: 0 }),
];

function wrapAuth(handler: (req: AuthRequest, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req as AuthRequest, res).catch(next);
  };
}

const router: IRouter = Router();

// Single file upload
router.post('/upload', requireAuth, upload.single('file'), wrapAuth(uploadReport));

// Batch file upload (MIG-67)
router.post('/batch-upload', requireAuth, upload.array('files', 50), wrapAuth(batchUploadReports));

// Get signed URL for report
router.get('/:id/url', requireAuth, wrapAuth(getReportSignedUrl));

router.post('/', requireAuth, createValidators, wrapAuth(createReport));
router.get('/', requireAuth, wrapAuth(listReports));
router.get('/:id/export', requireAuth, wrapAuth(exportReportJson));
router.get('/:id', requireAuth, wrapAuth(getReport));
router.post('/:id/process', requireAuth, wrapAuth(processReport));
router.patch('/:id', requireAuth, wrapAuth(updateReport));
router.delete('/:id', requireAuth, wrapAuth(deleteReport));

export default router;
