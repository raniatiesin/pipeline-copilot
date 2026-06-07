/**
 * ============================================
 * SYNC STATUS HOOK
 * ============================================
 *
 * Returns the current PowerSync connection status.
 * Uses direct PowerSyncContext access + registerListener
 * to avoid any indirection issues with useStatus().
 *
 * @module hooks/useSyncStatus
 */

import { PowerSyncContext } from '@powersync/react';
import { useContext, useEffect, useState } from 'react';

export type SyncStatusResult = 'online' | 'offline';

/**
 * Returns `'online'` when PowerSync is connected to the backend,
 * `'offline'` otherwise.
 */
export function useSyncStatus(): SyncStatusResult {
  const db = useContext(PowerSyncContext);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!db) return;

    const initial = db.currentStatus?.connected ?? false;
    console.log('[SyncStatus] initial connected:', initial);
    setConnected(initial);

    const unsubscribe = db.registerListener({
      statusChanged: (status) => {
        console.log('[SyncStatus] statusChanged:', status.connected);
        setConnected(status.connected ?? false);
      },
    });

    return () => unsubscribe?.();
  }, [db]);

  return connected ? 'online' : 'offline';
}
