/**
 * ============================================
 * API BARREL EXPORT
 * ============================================
 * 
 * Central export point for API clients and services.
 * Import from '@/lib/api' to access backend integrations.
 * 
 * Services:
 * - n8n.ts      → N8N workflow automation API
 * - supabase.ts → Supabase database client
 * 
 * @example
 * ```typescript
 * import { generateStyleImages, supabase } from '@/lib/api';
 * ```
 * 
 * @module lib/api
 */

// ============================================
// N8N WORKFLOW API
// ============================================

export { generateStyleImages } from './n8n';
export type { StyleGenerationRequest } from './n8n';

// ============================================
// SUPABASE CLIENT
// ============================================

export {
    createStyleSelection,
    getStyleSelectionsByClient,
    supabase,
    updateStyleSelection
} from './supabase';
export type { StyleSelection } from './supabase';

