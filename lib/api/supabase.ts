import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required variables:\n' +
    '- EXPO_PUBLIC_SUPABASE_URL\n' +
    '- EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
}

// Validate URL format
try {
  new URL(supabaseUrl);
} catch {
  throw new Error(`Invalid supabaseUrl: "${supabaseUrl}". Must be a valid HTTP or HTTPS URL.`);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Database operations for style selections
export interface StyleSelection {
  id?: string;
  client_name: string;
  style_prompt: string;
  selected_tags: string[];
  selected_image_url?: string;
  search_results?: any;
  created_at?: string;
  updated_at?: string;
}

export async function createStyleSelection(data: Omit<StyleSelection, 'id' | 'created_at' | 'updated_at'>) {
  const { data: result, error } = await supabase
    .from('style_selections')
    .insert([data])
    .select()
    .single();

  if (error) {
    console.error('Error creating style selection:', error);
    throw error;
  }

  return result;
}

export async function updateStyleSelection(id: string, updates: Partial<StyleSelection>) {
  const { data, error } = await supabase
    .from('style_selections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating style selection:', error);
    throw error;
  }

  return data;
}

export async function getStyleSelectionsByClient(clientName: string) {
  const { data, error } = await supabase
    .from('style_selections')
    .select('*')
    .eq('client_name', clientName)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching style selections:', error);
    throw error;
  }

  return data;
}

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('style_selections')
      .select('count(*)')
      .limit(1);

    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('✅ Supabase connection successful');
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return { success: false, error: (error as Error).message };
  }
}