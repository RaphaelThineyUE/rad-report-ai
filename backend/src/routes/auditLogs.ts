/**
 * Audit logs routes — read-only endpoints for users to view their own audit logs.
 * GET /audit-logs — list user's own audit logs (supports pagination, filtering by action and resourceType)
 *
 * All endpoints require authentication (requireAuth middleware).
 * RLS enforces that users can only see their own logs.
 */
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listAuditLogs } from '../controllers/auditLogsController.js';
import { catchAsync } from '../utils/catchAsync.js';

const router = Router();

// Require auth for all audit log routes
router.use(requireAuth);

// GET /api/audit-logs?limit=100&offset=0&action=create_patient&resource_type=patient
router.get('/', catchAsync(listAuditLogs));

export default router;
