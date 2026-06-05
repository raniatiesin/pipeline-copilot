/**
 * ============================================
 * SUPABASE CLIENT
 * ============================================
 *
 * Supabase client configured for anonymous auth.
 * Used by the PowerSync connector to obtain a JWT.
 *
 * env vars (set in .env):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Returns the current Supabase access token, or null if no session.
 * Called by the PowerSync connector before each sync cycle.
 */
export async function getSupabaseToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}
