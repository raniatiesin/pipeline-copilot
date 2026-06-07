/**
 * ============================================
 * POWERSYNC CLIENT
 * ============================================
 *
 * PowerSync database + connector setup.
 *
 * Schema mirrors the Supabase `pipelines` table.
 * One row per project — stage state stored as JSON in card_statuses.
 *
 * env vars:
 *   EXPO_PUBLIC_POWERSYNC_URL  — your PowerSync instance endpoint
 *
 * @module lib/powersync
 */

import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/react-native';
import { PowerSyncDatabase, Schema, Table, column } from '@powersync/react-native';
import { getSupabaseToken, supabase } from './supabase';

// ============================================
// SCHEMA
// ============================================

/**
 * Mirrors the Supabase `pipelines` table.
 * Note: `id` is implicit in PowerSync — do not declare it here.
 */
const pipelines = new Table({
  prospect_name:        column.text,
  post_name:            column.text,
  script:               column.text,
  style_selection:      column.text,   // JSON — collage ID + tag tally
  beat_butcher_output:  column.text,   // JSON — Scene[] output
  entity_editor_output: column.text,   // JSON — SubjectCategory[] output
  arc_assembler_output: column.text,   // JSON — per-scene and per-subject briefs
  card_statuses:        column.text,   // JSON — { [moduleId]: StageCardStatus }
  created_at:           column.text,
  updated_at:           column.text,
});

export const AppSchema = new Schema({ pipelines });

// ============================================
// CONNECTOR
// ============================================

class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    try {
      const token = await getSupabaseToken();
      return {
        endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
        token: token ?? '',
      };
    } catch (error) {
      // Network error during token fetch — continue offline with empty token
      console.warn('[PowerSync] fetchCredentials failed:', error);
      return {
        endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
        token: '',
      };
    }
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
    try {
      const transaction = await database.getNextCrudTransaction();
      if (!transaction) return;

      try {
        for (const op of transaction.crud) {
          if (op.table !== 'pipelines') continue;

          switch (op.op) {
            case 'PUT': {
              const { error } = await supabase
                .from('pipelines')
                .upsert({ id: op.id, ...op.opData });
              if (error) throw error;
              break;
            }
            case 'PATCH': {
              const { error } = await supabase
                .from('pipelines')
                .update(op.opData ?? {})
                .eq('id', op.id);
              if (error) throw error;
              break;
            }
            case 'DELETE': {
              const { error } = await supabase
                .from('pipelines')
                .delete()
                .eq('id', op.id);
              if (error) throw error;
              break;
            }
          }
        }
        await transaction.complete();
      } catch (error) {
        console.error('[PowerSync] uploadData batch failed:', error);
        // Don't throw — let PowerSync handle retry logic
      }
    } catch (error) {
      console.error('[PowerSync] uploadData transaction failed:', error);
      // Non-blocking — will retry on next sync
    }
  }
}

// ============================================
// DATABASE INSTANCE + CONNECTOR
// ============================================

export const connector = new SupabaseConnector();

// Initialize lazily to avoid errors if native module isn't loaded yet
let powerSyncDbInstance: AbstractPowerSyncDatabase | null = null;

export function getPowerSyncDb(): AbstractPowerSyncDatabase {
  if (!powerSyncDbInstance) {
    try {
      powerSyncDbInstance = new PowerSyncDatabase({
        schema: AppSchema,
        database: { dbFilename: 'pipelines.db' },
      });
      console.log('[PowerSync] Database initialized');
    } catch (error) {
      console.error('[PowerSync] Failed to initialize database:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }
  return powerSyncDbInstance;
}

// Export a getter that initializes on first access
export const powerSyncDb = new Proxy(new Object(), {
  get: (_, prop: string | symbol) => {
    const db = getPowerSyncDb();
    const value = (db as any)[prop];
    // If it's a function, bind it to the database instance
    return typeof value === 'function' ? value.bind(db) : value;
  },
}) as unknown as AbstractPowerSyncDatabase;
