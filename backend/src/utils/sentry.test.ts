import { afterAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import * as Sentry from '@sentry/node';

jest.mock('@sentry/node', () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  init: jest.fn(),
}));

describe('sentry instrumentation', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('initializes Sentry when a DSN is configured', async () => {
    process.env.SENTRY_DSN = 'https://f1c79f25ed46d6be4ec21e7a73527e62@o4511117899464704.ingest.us.sentry.io/4511509732720640';
    // https://f1c79f25ed46d6be4ec21e7a73527e62@o4511117899464704.ingest.us.sentry.io/4511509732720640
    process.env.NODE_ENV = 'development';


    const { initSentry } = await import('./sentry');
    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://f1c79f25ed46d6be4ec21e7a73527e62@o4511117899464704.ingest.us.sentry.io/4511509732720640',
        environment: 'development',
      })
    );
  });

  it('captures errors through centralized logging', async () => {
    process.env.SENTRY_DSN = 'https://f1c79f25ed46d6be4ec21e7a73527e62@o4511117899464704.ingest.us.sentry.io/4511509732720640';
    const error = new Error('Boom');

    const { logger } = await import('./logger');
    logger.error('Unhandled error', { error });

    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        contexts: expect.objectContaining({
          log: expect.objectContaining({ msg: 'Unhandled error' }),
        }),
      })
    );
  });
});
