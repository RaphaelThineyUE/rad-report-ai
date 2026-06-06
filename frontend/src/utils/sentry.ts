/**
 * Sentry initialisation and error-reporting utilities for the frontend.
 * initSentry() configures the SDK with PHI scrubbing via a beforeSend hook that redacts
 * date patterns and proper-noun pairs from all event payloads before transmission.
 * No-ops silently when VITE_SENTRY_DSN is absent (e.g. local dev without a DSN configured).
 * Exports: initSentry, captureException, captureMessage.
 */
import * as Sentry from '@sentry/react';

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  const environment = import.meta.env.MODE || 'development';

  if (!dsn) {
    console.log('Sentry DSN not configured. Sentry disabled.');
    return;
  }

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: parseFloat(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    beforeSend(event) {
      const PHI_PATTERN = /\b\d{4}-\d{2}-\d{2}\b|\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;

      const sanitizeString = (str: string): string => {
        return str.replace(PHI_PATTERN, '[REDACTED]');
      };

      const sanitizeValue = (value: unknown): unknown => {
        if (typeof value === 'string') {
          return sanitizeString(value);
        }
        if (typeof value === 'object' && value !== null) {
          if (Array.isArray(value)) {
            return value.map(sanitizeValue);
          }
          return Object.fromEntries(
            Object.entries(value as Record<string, unknown>).map(([k, v]) => [
              k,
              sanitizeValue(v),
            ])
          );
        }
        return value;
      };

      if (event.message) {
        event.message = sanitizeString(event.message);
      }
      if (event.extra) {
        event.extra = sanitizeValue(event.extra) as typeof event.extra;
      }
      if (event.contexts) {
        event.contexts = sanitizeValue(event.contexts) as typeof event.contexts;
      }
      if (event.request) {
        event.request = sanitizeValue(event.request) as typeof event.request;
      }

      return event;
    },
  });

  console.log(`Sentry initialized for environment: ${environment}`);
}

export function captureException(error: Error, context?: Record<string, unknown>) {
  Sentry.captureException(error, { extra: context });
}

export function captureMessage(message: string, level: 'fatal' | 'error' | 'warning' | 'info' | 'debug' = 'info') {
  Sentry.captureMessage(message, level);
}
