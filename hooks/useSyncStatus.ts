/**
 * ============================================
 * SYNC STATUS HOOK
 * ============================================
 *
 * Returns the current PowerSync connection status.
 * Subscribes to live status changes — re-renders when connection
 * state toggles between online and offline.
 *
 * Must be called within a component tree that is wrapped by
 * PowerSyncProvider (i.e. inside app/_layout.tsx's provider).
 *
 * @module hooks/useSyncStatus
 */

import { useStatus } from '@powersync/react';

export type SyncStatus = 'online' | 'offline';

/**
 * Returns `'online'` when PowerSync is connected to the backend,
 * `'offline'` otherwise. Updates reactively on connection change.
 */
export function useSyncStatus(): SyncStatus {
  const status = useStatus();
  return status.connected ? 'online' : 'offline';
}
