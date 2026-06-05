import { captureLogError } from './sentry';

const PHI_PATTERN = /\b\d{4}-\d{2}-\d{2}\b|\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

function redact(value: unknown): unknown {
  if (typeof value === 'string') {
    return value.replace(PHI_PATTERN, '[REDACTED]');
  }
  return value;
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(JSON.stringify({ level: 'info', msg, ...sanitize(meta) }));
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', msg, ...sanitize(meta) }));
  },
  error: (msg: string, meta?: Record<string, unknown>) => {
    const sanitizedMeta = sanitize(meta);
    console.error(JSON.stringify({ level: 'error', msg, ...sanitizedMeta }));
    captureLogError(msg, meta, sanitizedMeta);
  },
};

function sanitize(meta?: Record<string, unknown>): Record<string, unknown> {
  if (!meta) return {};
  return Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, redact(v)])
  );
}
