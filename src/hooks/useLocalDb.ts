import { useState, useEffect } from 'react';
import { getDb } from '../db/client';
import { getTableRowCount } from '../db/queries';

export interface UseLocalDbReturn {
  isReady: boolean;
  isPersistent: boolean;
  error: string | null;
  rowCount: number;
}

export function useLocalDb(): UseLocalDbReturn {
  const [isReady, setIsReady] = useState(false);
  const [isPersistent, setIsPersistent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState(0);

  useEffect(() => {
    let mounted = true;
    getDb()
      .then(async (dbState) => {
        if (!mounted) return;
        setIsPersistent(dbState.isPersistent);
        const count = await getTableRowCount();
        if (!mounted) return;
        setRowCount(count);
        setIsReady(true);
      })
      .catch((err) => {
        if (!mounted) return;
        console.error('[useLocalDb] Database initialization error:', err);
        setError(err instanceof Error ? err.message : String(err));
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { isReady, isPersistent, error, rowCount };
}
