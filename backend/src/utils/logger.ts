/**
 * Structured JSON logger with PHI redaction, used throughout the backend.
 * Exports `logger` with `info`, `warn`, and `error` methods. Each call serialises
 * metadata to JSON, redacts dates (YYYY-MM-DD) and name-like patterns before logging,
 * and forwards to Sentry (captureMessage for info/warn, captureException for error).
 */
import * as Sentry from '@sentry/node';

const PHI_PATTERN = /\b\d{4}-\d{2}-\d{2}\b|\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(PHI_PATTERN, '[REDACTED]');
  }
  return value;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    const sanitized = sanitize(meta);
    console.log(JSON.stringify({ level: 'info', msg, ...sanitized }));
    Sentry.captureMessage(msg, 'info');
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    const sanitized = sanitize(meta);
    console.warn(JSON.stringify({ level: 'warn', msg, ...sanitized }));
    Sentry.captureMessage(msg, 'warning');
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    const sanitized = sanitize(meta);
    console.error(JSON.stringify({ level: 'error', msg, ...sanitized }));
    Sentry.captureException(new Error(msg), { extra: sanitized });
  },
};

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  return Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, redact(v)])
  );
}
