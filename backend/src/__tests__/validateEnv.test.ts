import { validateEnv } from '../utils/validateEnv';

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'ANTHROPIC_API_KEY',
  'STORAGE_BUCKET',
  'FRONTEND_URL',
] as const;

describe('validateEnv', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    for (const key of REQUIRED_VARS) {
      process.env[key] = 'test-value';
    }
    delete process.env.VERCEL;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('does not throw or exit when all required vars are present', () => {
    expect(() => validateEnv()).not.toThrow();
  });

  it('throws on Vercel when required vars are missing, instead of exiting the process', () => {
    process.env.VERCEL = '1';
    delete process.env.SUPABASE_URL;
    delete process.env.ANTHROPIC_API_KEY;

    expect(() => validateEnv()).toThrow(/Missing required environment variables: SUPABASE_URL, ANTHROPIC_API_KEY/);
  });

  it('exits the process when required vars are missing outside Vercel', () => {
    const exitSpy = jest.spyOn(process, 'exit').mockImplementation(() => undefined as never);
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    delete process.env.STORAGE_BUCKET;

    validateEnv();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('STORAGE_BUCKET'));
    expect(exitSpy).toHaveBeenCalledWith(1);

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
