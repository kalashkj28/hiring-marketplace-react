import { useState, useEffect, useCallback } from 'react';
import { SyncStatus, SyncOptions, syncFromGoogleSheet, getSyncMetadata } from '../sync/syncEngine';

export const dataRevisionEmitter = new EventTarget();

export function notifyDataChanged(): void {
  dataRevisionEmitter.dispatchEvent(new Event('change'));
}

export interface UseSyncStatusReturn {
  syncStatus: SyncStatus;
  lastSyncedAt: string;
  rowCount: number;
  isOnline: boolean;
  syncError: string | null;
  triggerSync: (options?: SyncOptions | boolean) => Promise<void>;
}

export function useSyncStatus(isDbReady: boolean): UseSyncStatusReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<string>('');
  const [rowCount, setRowCount] = useState<number>(0);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [syncError, setSyncError] = useState<string | null>(null);

  // Monitor online / offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[Sync] Network connection restored. Auto-syncing...');
      if (isDbReady) {
        triggerSync(false);
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
      console.log('[Sync] Network connection lost. Offline mode active.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isDbReady]);

  // Read initial metadata when DB is ready
  useEffect(() => {
    if (!isDbReady) return;
    getSyncMetadata().then((meta) => {
      setLastSyncedAt(meta.lastSyncedAt);
      setRowCount(meta.rowCount);
    });
  }, [isDbReady]);

  const triggerSync = useCallback(
    async (options?: SyncOptions | boolean) => {
      if (!isDbReady) return;

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        return;
      }

      setSyncStatus('syncing');
      setSyncError(null);

      try {
        const syncOpts: SyncOptions =
          typeof options === 'boolean'
            ? { forceReload: options }
            : options || {};

        const result = await syncFromGoogleSheet(syncOpts);
        if (result.status === 'offline') {
          setSyncStatus('offline');
          if (result.error) setSyncError(result.error);
        } else if (result.status === 'error') {
          setSyncStatus('error');
          setSyncError(result.error || 'Sync failed');
        } else {
          setSyncStatus('synced');
          setLastSyncedAt(result.lastSyncedAt);
          setRowCount(result.rowCount);
          notifyDataChanged();
        }
      } catch (err) {
        console.error('[Sync] Unexpected sync error:', err);
        setSyncStatus('error');
        setSyncError(err instanceof Error ? err.message : String(err));
      }
    },
    [isDbReady]
  );

  return {
    syncStatus,
    lastSyncedAt,
    rowCount,
    isOnline,
    syncError,
    triggerSync,
  };
}
