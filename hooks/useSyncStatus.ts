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
 * may not be initialized yet on first render.
 */
export function useSyncStatus(): SyncStatusResult {
  try {
    const status = useStatus();
    return status.connected ? 'online' : 'offline';
  } catch {
    // PowerSyncContext not ready yet or not in scope — default to offline
    return 'offline';
  }
}