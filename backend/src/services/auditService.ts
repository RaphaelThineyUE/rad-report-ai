/**
 * Audit logging service for tracking all sensitive actions.
 * Logs are written asynchronously (fire-and-forget) to avoid blocking request handling.
 * Sensitive actions: login/logout, view patient, create/update/delete patient,
 * upload report, delete report, all AI analysis calls, sign/export operations.
 */
import { createUserClient } from './supabaseClient.js';
import { logger } from '../utils/logger.js';

export interface AuditLogEntry {
  userId: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  ipAddress?: string | string[];
  userAgent?: string;
}

/**
 * Write an audit log entry asynchronously (fire-and-forget).
 * Does not await or throw — failures are logged but do not affect the main operation.
 */
export function logAudit(entry: AuditLogEntry, accessToken: string): void {
  // Fire-and-forget: do not await or block
  (async () => {
    try {
      const client = createUserClient(accessToken);
      await client.from('audit_logs').insert({
        user_id: entry.userId,
        action: entry.action,
        resource_type: entry.resourceType,
        resource_id: entry.resourceId,
        ip_address: entry.ipAddress,
        user_agent: entry.userAgent,
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to write audit log', {
        action: entry.action,
        error: msg,
      });
      // Intentionally not throwing — audit log failures should not break the main operation
    }
  })();
}

/**
 * Convenience wrapper for auth-related audit logs (login, logout, password reset, etc.)
 */
export function logAuthAudit(
  userId: string,
  action: string,
  accessToken: string,
  ipAddress?: string | string[],
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'auth',
      ipAddress,
      userAgent,
    },
    accessToken
  );
}

/**
 * Convenience wrapper for patient-related audit logs (view, create, update, delete)
 */
export function logPatientAudit(
  userId: string,
  action: string,
  patientId: string,
  accessToken: string,
  ipAddress?: string | string[],
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'patient',
      resourceId: patientId,
      ipAddress,
      userAgent,
    },
    accessToken
  );
}

/**
 * Convenience wrapper for report-related audit logs
 */
export function logReportAudit(
  userId: string,
  action: string,
  reportId: string,
  accessToken: string,
  ipAddress?: string | string[],
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'report',
      resourceId: reportId,
      ipAddress,
      userAgent,
    },
    accessToken
  );
}

/**
 * Convenience wrapper for treatment-related audit logs
 */
export function logTreatmentAudit(
  userId: string,
  action: string,
  treatmentId: string,
  accessToken: string,
  ipAddress?: string | string[],
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'treatment',
      resourceId: treatmentId,
      ipAddress,
      userAgent,
    },
    accessToken
  );
}

/**
 * Convenience wrapper for AI analysis audit logs
 */
export function logAIAudit(
  userId: string,
  action: string,
  reportId: string,
  accessToken: string,
  ipAddress?: string | string[],
  userAgent?: string
): void {
  logAudit(
    {
      userId,
      action,
      resourceType: 'ai_analysis',
      resourceId: reportId,
      ipAddress,
      userAgent,
    },
    accessToken
  );
}
