/**
 * ============================================
 * SUPABASE CLIENT
 * ============================================
 *
 * Supabase client configured for anonymous auth.
 * Used by the PowerSync connector to obtain a JWT.
 *
 * On web/SSR (Node.js < 22) the native WebSocket is absent, so we pass
 * the `ws` package as the realtime transport to avoid the startup error.
 *
 * env vars (set in .env / Replit Secrets):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   EXPO_PUBLIC_SUPABASE_ANON_KEY
 *
 * @module lib/supabase
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

const isNodeSSR = typeof window === 'undefined';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const wsTransport = isNodeSSR ? require('ws') : undefined;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false, // Disable auto-refresh to avoid network calls on init
    persistSession: false,
    detectSessionInUrl: false,
  },
  ...(isNodeSSR && {
    realtime: {
      transport: wsTransport,
    },
  }),
});

/**
 * Returns the current Supabase access token, or null if no session.
 * Called by the PowerSync connector before each sync cycle.
 * Returns null gracefully if network is unavailable.
 */
export async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[Supabase] getSession error:', error.message);
      return null;
    }
    return data.session?.access_token ?? null;
  } catch (error) {
    // Network error or other failure — return null gracefully
    console.warn('[Supabase] getSession failed (network unavailable?):', error);
    return null;
  }
}
