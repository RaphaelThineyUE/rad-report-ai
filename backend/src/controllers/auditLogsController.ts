/**
 * Audit logs controller — read-only endpoint for users to view their own audit logs.
 * Exports: listAuditLogs.
 * Uses the caller's JWT client; RLS enforces that users see only their own logs (user_id = auth.uid()).
 */
import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { createUserClient } from '../services/supabaseClient.js';
import { logger } from '../utils/logger.js';
import { Errors } from '../utils/AppError.js';

export async function listAuditLogs(req: AuthRequest, res: Response): Promise<void> {
  const limit = Math.min(parseInt(req.query.limit as string) || 100, 1000);
  const offset = parseInt(req.query.offset as string) || 0;
  const action = req.query.action as string | undefined;
  const resourceType = req.query.resource_type as string | undefined;

  const client = createUserClient(req.accessToken);
  let query = client
    .from('audit_logs')
    .select('*', { count: 'exact' })
    .eq('user_id', req.userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (action) {
    query = query.eq('action', action);
  }

  if (resourceType) {
    query = query.eq('resource_type', resourceType);
  }

  const { data, error, count } = await query;

  if (error) {
    logger.error('listAuditLogs error', { userId: req.userId, error: error.message });
    throw Errors.internal('Failed to fetch audit logs');
  }

  res.json({
    logs: data ?? [],
    total_count: count ?? 0,
    limit,
    offset,
  });
}
