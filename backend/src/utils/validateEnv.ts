/**
 * Startup environment validation — called before any other module initialisation in index.ts.
 * Exports `validateEnv()` which checks that all required environment variables
 * (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, ANTHROPIC_API_KEY,
 * STORAGE_BUCKET, FRONTEND_URL) are present and exits the process with an error
 * message listing any missing ones if they are not.
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
    console.error(`Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
}
