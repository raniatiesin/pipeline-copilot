/**
 * ============================================
 * POWERSYNC CLIENT — WEB PLATFORM
 * ============================================
 *
 * Web-compatible PowerSync setup using WASQLite (WASM-based SQLite).
 * This file is automatically used instead of powersync.ts on web.
 *
 * @module lib/powersync.web
 */

import type { AbstractPowerSyncDatabase, PowerSyncBackendConnector } from '@powersync/web';
import { PowerSyncDatabase, Schema, Table, column, WASQLiteOpenFactory } from '@powersync/web';
import { supabase, getSupabaseToken } from './supabase';

// ============================================
// SCHEMA
// ============================================

const pipelines = new Table({
  prospect_name:        column.text,
  post_name:            column.text,
  script:               column.text,
  style_selection:      column.text,
  beat_butcher_output:  column.text,
  entity_editor_output: column.text,
  arc_assembler_output: column.text,
  card_statuses:        column.text,
  created_at:           column.text,
  updated_at:           column.text,
});

export const AppSchema = new Schema({ pipelines });

// ============================================
// CONNECTOR
// ============================================

class SupabaseConnector implements PowerSyncBackendConnector {
  async fetchCredentials() {
    const token = await getSupabaseToken();
    return {
      endpoint: process.env.EXPO_PUBLIC_POWERSYNC_URL ?? '',
      token: token ?? '',
    };
  }

  async uploadData(database: AbstractPowerSyncDatabase): Promise<void> {
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
      console.error('[PowerSync] uploadData failed:', error);
      throw error;
    }
  }
}

// ============================================
// DATABASE INSTANCE + CONNECTOR
// ============================================

export const connector = new SupabaseConnector();

export const powerSyncDb = new PowerSyncDatabase({
  schema: AppSchema,
  database: new WASQLiteOpenFactory({
    dbFilename: 'pipelines.db',
  }),
});
