import { supabaseAdmin } from './supabaseClient';
import { logger } from '../utils/logger';
import { redactMetadata } from '../utils/auditLogger';

interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}


/**
 * Helper to normalize string|string[] to string|undefined
 */
function normalizeValue(val: unknown): string | undefined {
  if (Array.isArray(val)) return val[0];
  return typeof val === 'string' ? val : undefined;
}
/**
 * Helper function to log audit entries with PHI redaction
 * RAD-M8-3: Uses auditLogger for automatic PHI redaction
 */
async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    // Redact sensitive data from metadata to prevent PHI exposure
    const safeMetadata = entry.metadata ? redactMetadata(entry.metadata) : undefined;

    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        user_id: entry.user_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        ip_address: normalizeValue(entry.ip_address),
        user_agent: normalizeValue(entry.user_agent),
        metadata: safeMetadata,
      });

    if (error) {
      logger.error('Failed to create audit log', {
        action: entry.action,
        userId: entry.user_id,
        resourceType: entry.resource_type,
        error: error.message,
      });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Audit log creation error', {
      action: entry.action,
      error: message,
    });
  }
}

/**
 * Log file upload action
 * Action: POST /api/reports/upload
 * Logs: filename, patient_id, file_size
 */
export async function logUpload(
  userId: string,
  filename: string,
  patientId: string,
  fileSize: number,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: 'FILE_UPLOAD',
    resource_type: 'radiology_report',
    resource_id: patientId,
    metadata: {
      filename,
      patient_id: patientId,
      file_size_bytes: fileSize,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log report view action
 * Action: GET /api/reports/:id
 * Logs: user, report_id, timestamp
 */
export async function logView(
  userId: string,
  reportId: string,
  patientId?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: 'REPORT_VIEW',
    resource_type: 'radiology_report',
    resource_id: reportId,
    metadata: {
      report_id: reportId,
      patient_id: patientId,
      timestamp: new Date().toISOString(),
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log report deletion action
 * Action: DELETE /api/reports/:id
 * Logs: user, resource_id, action reason
 */
export async function logDelete(
  userId: string,
  reportId: string,
  patientId?: string,
  reason?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: 'REPORT_DELETE',
    resource_type: 'radiology_report',
    resource_id: reportId,
    metadata: {
      report_id: reportId,
      patient_id: patientId,
      reason: reason || 'User requested deletion',
      timestamp: new Date().toISOString(),
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log patient data changes
 * Action: POST/PATCH /api/patients
 * Logs: user, patient_id, fields changed
 */
export async function logPatientChange(
  userId: string,
  patientId: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE',
  changes?: Record<string, { old?: unknown; new?: unknown }>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: `PATIENT_${action}`,
    resource_type: 'patient',
    resource_id: patientId,
    metadata: {
      patient_id: patientId,
      changes: changes ? Object.keys(changes) : [],
      timestamp: new Date().toISOString(),
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log AI processing action
 * Action: POST /api/reports/:id/process
 * Logs: user, report_id, processing status
 */
export async function logProcessing(
  userId: string,
  reportId: string,
  patientId: string,
  status: 'started' | 'completed' | 'failed',
  details?: Record<string, unknown>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: 'REPORT_PROCESS',
    resource_type: 'radiology_report',
    resource_id: reportId,
    metadata: {
      report_id: reportId,
      patient_id: patientId,
      status,
      timestamp: new Date().toISOString(),
      ...details,
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log account deletion action
 * Action: DELETE /api/auth/me
 * Logs: user_id, timestamp
 */
export async function logAccountAction(
  userId: string,
  action: 'PASSWORD_CHANGE' | 'ACCOUNT_DELETE' | 'EMAIL_CHANGE',
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await createAuditLog({
    user_id: userId,
    action: `AUTH_${action}`,
    resource_type: 'user',
    resource_id: userId,
    metadata: {
      user_id: userId,
      timestamp: new Date().toISOString(),
    },
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

/**
 * Log password change action
 * Action: PATCH /api/auth/me (password field)
 * Logs: user_id, timestamp
 */
export async function logPasswordChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAccountAction(userId, 'PASSWORD_CHANGE', ipAddress, userAgent);
}

/**
 * Log account deletion action
 * Wrapper for logAccountAction
 */
export async function logAccountDeletion(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAccountAction(userId, 'ACCOUNT_DELETE', ipAddress, userAgent);
}

/**
 * Log email change action
 * Action: PATCH /api/auth/me (email field)
 * Logs: user_id, timestamp
 */
export async function logEmailChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  await logAccountAction(userId, 'EMAIL_CHANGE', ipAddress, userAgent);
}
