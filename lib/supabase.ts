/**
 * ============================================
 * SUPABASE CLIENT
 * ============================================
 *
 * Supabase client configured for anonymous auth.
 * Used by the PowerSync connector to obtain a JWT.
 *
 * @module lib/supabase
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Ensures an anonymous session exists and returns the access token.
 * Signs in anonymously if no session exists.
 * Returns null gracefully if network is unavailable.
 */
export async function getSupabaseToken(): Promise<string | null> {
  try {
    const { data: sessionData } = await supabase.auth.getSession();

    if (sessionData?.session?.access_token) {
      console.debug('[Supabase] getSupabaseToken: returning existing session token');
      return sessionData.session.access_token;
    }

    // No session — sign in anonymously
    const { data: signInData, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.debug('[Supabase] signInAnonymously error:', error.message);
      return null;
    }

    const token = signInData?.session?.access_token ?? null;
    console.debug('[Supabase] getSupabaseToken: anonymous sign-in token length =', token ? token.length : 0);
    return token;
  } catch (error) {
    console.debug('[Supabase] getSupabaseToken failed:', error instanceof Error ? error.message : String(error));
    return null;
  }
}
