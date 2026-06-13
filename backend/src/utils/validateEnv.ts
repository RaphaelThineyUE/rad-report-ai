/**
 * Startup environment validation — called before any other module initialisation in index.ts.
 * Exports `validateEnv()` which checks that all required environment variables
 * (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY,
 * STORAGE_BUCKET, FRONTEND_URL) are present and exits the process with an error
 * message listing any missing ones if they are not.
 *
 * Optional: ANTHROPIC_MODEL overrides the Claude model used by claudeService.ts
 * (defaults to claude-sonnet-4-6 when unset). It is optional and therefore not
 * included in the required-vars check below.
 */
const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY',
  'ANTHROPIC_API_KEY',
  'STORAGE_BUCKET',
  'FRONTEND_URL',
] as const;

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const message = `Missing required environment variables: ${missing.join(', ')}`;
    // On Vercel, process.exit(1) kills the serverless function with no diagnostics —
    // clients just see a connection error. Throw instead so it's logged with a stack trace.
    if (process.env.VERCEL) {
      throw new Error(message);
    }
    console.error(message);
    process.exit(1);
  }
}
