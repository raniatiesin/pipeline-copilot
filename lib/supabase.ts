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
 * 
 * Falls back to null if:
 * - Network is offline
 * - Session doesn't exist
 * - getSession() throws any error
 */
export async function getSupabaseToken(): Promise<string | null> {
  try {
    // This call may fail if network is unavailable
    // We catch all errors and return null to allow offline operation
    const { data, error } = await supabase.auth.getSession();
    
    // If there was an error, log and return null
    if (error) {
      console.debug('[Supabase] getSession error:', error.message);
      return null;
    }
    
    // Return token if session exists, otherwise null
    const token = data?.session?.access_token;
    if (!token) {
      console.debug('[Supabase] No active session token available');
      return null;
    }
    
    return token;
  } catch (error) {
    // Network error, timeout, or any other failure
    // Return null gracefully — app continues in offline mode
    console.debug('[Supabase] getSession failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
