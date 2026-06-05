import * as Sentry from '@sentry/react';
import { initSentry } from '../utils/sentry';

vi.mock('@sentry/react', () => ({
  browserTracingIntegration: vi.fn(() => 'browser-tracing'),
  init: vi.fn(),
}));

describe('frontend Sentry instrumentation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_SENTRY_DSN', '');
    vi.stubEnv('MODE', 'test');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not initialize Sentry without a DSN', () => {
    initSentry();

    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('initializes Sentry when a DSN is configured', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://example@sentry.io/1');

    initSentry();

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://example@sentry.io/1',
        environment: 'test',
      })
    );
  });
});
