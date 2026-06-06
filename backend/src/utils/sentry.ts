/**
 * Sentry error-monitoring setup for the Express backend.
 * Exports `initSentry()` — initialises the SDK with profiling, configurable sample
 * rates, and a beforeSend hook that redacts PHI (dates, names) from all events.
 * Exports `sentryRequestHandler()` and `sentryErrorHandler()` Express middlewares,
 * mounted first and last respectively in index.ts. No-ops when SENTRY_DSN is unset.
 */
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import type { Request, Response, NextFunction } from 'express';

let initialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!dsn) {
    console.log('Sentry DSN not configured. Sentry disabled.');
    return;
  }

  if (initialized) return;
  initialized = true;

  Sentry.init({
    dsn,
    environment,
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'),
    profilesSampleRate: parseFloat(process.env.SENTRY_PROFILES_SAMPLE_RATE || '0.1'),
    integrations: [
      nodeProfilingIntegration(),
    ],
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

      return event;
    },
  });

  console.log(`Sentry initialized for environment: ${environment}`);
}

export function sentryRequestHandler() {
  return (req: Request, res: Response, next: NextFunction) => {
    Sentry.setContext('http', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
    next();
  };
}

export function sentryErrorHandler() {
  return (err: Error, req: Request, res: Response, next: NextFunction) => {
    Sentry.captureException(err);
    next(err);
  };
}
