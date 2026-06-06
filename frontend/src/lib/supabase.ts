/**
 * Supabase browser client (anon key) used exclusively for authentication in the frontend.
 * All data access goes through the backend API (lib/api.ts), not this client directly.
 * The JWT from this client's session is picked up by the Axios interceptor in lib/api.ts.
 * Export: supabase (SupabaseClient).
 */
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_ANON_KEY as string
);
