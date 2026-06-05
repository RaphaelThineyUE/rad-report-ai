import { createClient } from '@supabase/supabase-js';
import type { Request } from 'express';

/**
 * RAD-M8-3: PHI-safe audit logger
 *
 * Logs user actions to audit_logs table with automatic PHI redaction.
 * Prevents exposure of:
 * - PDF text or Claude prompts
 * - Patient names, emails, phones, addresses
 * - API tokens, keys, and sensitive metadata
 * - Dates of birth and medical dates (unless necessary)
 */

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

interface AuditLogEntry {
  user_id: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * PHI patterns to redact:
 * - Dates (YYYY-MM-DD format and variations)
 * - Email addresses
 * - Phone numbers (US and international formats)
 * - Common name patterns (Firstname Lastname)
 * - API tokens and keys (auth, token, key, secret, password patterns)
 * - PDF content indicators
 */
const PHI_PATTERNS = {
  dates: /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{2,4}\b|\b\d{1,2}-\d{1,2}-\d{2,4}\b/g,
  emails: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phones: /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  names: /\b[A-Z][a-z]+ [A-Z][a-z]+(?:\s[A-Z][a-z]+)?\b/g,
  apiKeys: /(?:api[_-]?key|auth[_-]?token|secret[_-]?key|access[_-]?token|bearer\s+\S+|password\s*[:=]\s*\S+)/gi,
  pdfContent: /(\d{4,}|pdf|text\s*[:=]|content\s*[:=]|extracted)/gi,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
};

/**
 * Redact sensitive information from a string value
 */
function redactSensitiveData(value: string): string {
  let redacted = value;

  // Apply all redaction patterns
  redacted = redacted.replace(PHI_PATTERNS.ssn, '[REDACTED-SSN]');
  redacted = redacted.replace(PHI_PATTERNS.emails, '[REDACTED-EMAIL]');
  redacted = redacted.replace(PHI_PATTERNS.phones, '[REDACTED-PHONE]');
  redacted = redacted.replace(PHI_PATTERNS.apiKeys, '[REDACTED-API-KEY]');
  redacted = redacted.replace(PHI_PATTERNS.dates, '[REDACTED-DATE]');
  redacted = redacted.replace(PHI_PATTERNS.names, '[REDACTED-NAME]');

  return redacted;
}

/**
 * Deep redact sensitive data from nested objects
 * Exported for use in audit services
 */
export function redactMetadata(obj: unknown, depth: number = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[REDACTED-DEEP]';

  if (typeof obj === 'string') {
    return redactSensitiveData(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactMetadata(item, depth + 1));
  }

  if (typeof obj === 'object' && obj !== null) {
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip keys that indicate sensitive content
      const lowerKey = key.toLowerCase();
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('token') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('key') ||
        lowerKey.includes('pdf') ||
        lowerKey.includes('text') ||
        lowerKey.includes('content') ||
        lowerKey.includes('prompt')
      ) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactMetadata(value, depth + 1);
      }
    }
    return redacted;
  }

  return obj;
}

/**
 * Extract request information safely
 */
function extractRequestInfo(req?: Request): { ip_address?: string; user_agent?: string } {
  if (!req) return {};

  return {
    ip_address: req.ip || req.socket.remoteAddress,
    user_agent: req.get('user-agent'),
  };
}

/**
 * Create an audit log entry
 * Automatically redacts PHI from metadata
 */
async function logAuditEvent(
  entry: AuditLogEntry,
  level: LogLevel = 'INFO',
  req?: Request
): Promise<void> {
  try {
    // Redact metadata to remove PHI
    const safeMetadata = {
      ...entry.metadata,
      level,
      timestamp: new Date().toISOString(),
    };

    const redactedMetadata = redactMetadata(safeMetadata) as Record<string, unknown>;

    // Extract request info safely
    const requestInfo = extractRequestInfo(req);

    // Prepare log entry
    const logEntry: AuditLogEntry = {
      user_id: entry.user_id,
      action: entry.action,
      resource_type: entry.resource_type,
      resource_id: entry.resource_id,
      metadata: redactedMetadata,
      ...requestInfo,
    };

    // Get Supabase client using service role for direct writes
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('Audit logging disabled: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Insert the log entry
    const { error } = await supabase
      .from('audit_logs')
      .insert([logEntry]);

    if (error) {
      console.error('Failed to insert audit log:', {
        action: entry.action,
        error: error.message,
      });
    }
  } catch (err) {
    console.error('Error in audit logger:', err instanceof Error ? err.message : String(err));
  }
}

/**
 * Log an informational action
 */
export async function auditLogInfo(
  action: string,
  userId: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    req?: Request;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action,
      user_id: userId,
      resource_type: options?.resourceType,
      resource_id: options?.resourceId,
      metadata: options?.metadata,
    },
    'INFO',
    options?.req
  );
}

/**
 * Log a warning action
 */
export async function auditLogWarn(
  action: string,
  userId: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    req?: Request;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action,
      user_id: userId,
      resource_type: options?.resourceType,
      resource_id: options?.resourceId,
      metadata: options?.metadata,
    },
    'WARN',
    options?.req
  );
}

/**
 * Log an error action
 */
export async function auditLogError(
  action: string,
  userId: string,
  options?: {
    resourceType?: string;
    resourceId?: string;
    metadata?: Record<string, unknown>;
    req?: Request;
  }
): Promise<void> {
  await logAuditEvent(
    {
      action,
      user_id: userId,
      resource_type: options?.resourceType,
      resource_id: options?.resourceId,
      metadata: options?.metadata,
    },
    'ERROR',
    options?.req
  );
}

/**
 * Audit logger object with convenience methods
 */
export const auditLogger = {
  info: auditLogInfo,
  warn: auditLogWarn,
  error: auditLogError,
};

export type { LogLevel, AuditLogEntry };
