/**
 * ============================================
 * SYNC STATUS HOOK
 * ============================================
 *
 * Returns the current PowerSync connection status.
 * Wired to real PowerSync status via useStatus() hook from @powersync/react.
 *
 * @module hooks/useSyncStatus
 */

import { useStatus } from '@powersync/react';

export type SyncStatusResult = 'online' | 'offline';

/**
 * Returns `'online'` when PowerSync is connected to the backend,
 * `'offline'` otherwise.
 * 
 * Wrapped in multiple layers of error handling to ensure:
 * - PowerSyncContext initialization timing issues don't crash the component
 * - Missing context doesn't break the UI
 * - App always defaults to offline mode if anything goes wrong
 */
export function useSyncStatus(): SyncStatusResult {
  try {
    const status = useStatus();
    // Safely check if connected, default to offline
    return status?.connected === true ? 'online' : 'offline';
  } catch (error) {
    // If useStatus() fails for any reason (context not ready, etc),
    // default to offline — app works fully offline anyway
    console.debug('[useSyncStatus] useStatus error, defaulting to offline:', error instanceof Error ? error.message : 'unknown error');
    return 'offline';
  }
}