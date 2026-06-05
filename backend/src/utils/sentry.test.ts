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
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
    process.env.NODE_ENV = 'test';

    const { initSentry } = await import('./sentry');
    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example@sentry.io/1',
        environment: 'test',
      })
    );
  });

  it('captures errors through centralized logging', async () => {
    process.env.SENTRY_DSN = 'https://example@sentry.io/1';
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
