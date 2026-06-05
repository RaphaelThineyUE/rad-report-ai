import * as Sentry from '@sentry/node';

let initialized = false;

export function initSentry(): void {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn || initialized) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'development',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
  });
  initialized = true;
}

export function captureLogError(
  msg: string,
  meta?: Record<string, unknown>,
  sanitizedMeta?: Record<string, unknown>
): void {
  if (!process.env.SENTRY_DSN) return;

  const error = meta?.error;
  const context = {
    contexts: {
      log: {
        msg,
        ...sanitizedMeta,
      },
    },
  };

  if (error instanceof Error) {
    Sentry.captureException(error, context);
    return;
  }

  Sentry.captureMessage(msg, {
    level: 'error',
    ...context,
  });
}
