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
