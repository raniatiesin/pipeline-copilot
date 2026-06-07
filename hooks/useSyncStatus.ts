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
  let status;
  
  // Layer 1: Try to call useStatus() — may fail if context not ready
  try {
    status = useStatus();
  } catch (error) {
    console.debug('[useSyncStatus] Failed to call useStatus():', error instanceof Error ? error.message : String(error));
    return 'offline';
  }

  // Layer 2: Verify status object exists and is valid
  if (!status || typeof status !== 'object') {
    console.debug('[useSyncStatus] Status is invalid:', typeof status);
    return 'offline';
  }

  // Layer 3: Safe property access with fallback
  try {
    const connected = Boolean(status.connected);
    return connected ? 'online' : 'offline';
  } catch (error) {
    console.debug('[useSyncStatus] Error accessing status.connected:', error instanceof Error ? error.message : String(error));
    return 'offline';
  }
}