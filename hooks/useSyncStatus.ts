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
 * Wrapped in try/catch to handle cases where PowerSyncContext
 * may not be initialized yet on first render or if context is destroyed.
 */
export function useSyncStatus(): SyncStatusResult {
  try {
    const status = useStatus();
    // Handle both undefined and falsy values
    if (!status) {
      return 'offline';
    }
    return status.connected ? 'online' : 'offline';
  } catch (error) {
    // PowerSyncContext not ready, destroyed, or error accessing status
    // Always safe to default to offline — app works fully offline anyway
    console.debug('[useSyncStatus] Error reading status:', error);
    return 'offline';
  }
}