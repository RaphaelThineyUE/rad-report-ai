import { config } from 'dotenv';

config();

export const env = {
  PORT: Number(process.env.PORT ?? 3001),
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  SUPABASE_URL: process.env.SUPABASE_URL ?? 'https://ghdgkthminenqniqhjjx.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'development-service-role',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? 'development-anon-key',
  JWT_SECRET: process.env.JWT_SECRET ?? 'change-me-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? '7d',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY ?? 'development-anthropic-key',
  CLAUDE_MODEL: process.env.CLAUDE_MODEL ?? 'claude-sonnet-4-20250514',
  MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB ?? 20),
  STORAGE_BUCKET: process.env.STORAGE_BUCKET ?? 'reports',
};
