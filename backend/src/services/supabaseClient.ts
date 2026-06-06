/**
 * Supabase client factory for the backend.
 * Exports `supabaseAdmin` (service-role client) for storage uploads and RLS-bypassing
 * admin operations, and `createUserClient(accessToken)` which attaches the caller's
 * JWT so that Supabase RLS policies are enforced per-user on all DB queries.
 * Never expose supabaseAdmin or the service-role key to the frontend.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;

// Service-role client: used for storage uploads and admin operations.
// Never expose this client to the frontend or attach user JWTs to it.
export const supabaseAdmin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!);

// Anon client factory: attach the user's JWT so RLS policies apply.
export function createUserClient(accessToken: string) {
  return createClient(url, process.env.SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
