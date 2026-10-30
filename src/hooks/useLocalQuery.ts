import { useState, useEffect, useCallback, useRef } from 'react';
import { dataRevisionEmitter } from './useSyncStatus';

export interface UseLocalQueryReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useLocalQuery<T>(
  queryFn: () => Promise<T>,
  deps: unknown[] = [],
  isDbReady = true
): UseLocalQueryReturn<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [revision, setRevision] = useState<number>(0);

  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  // Listen to background sync data modifications
  useEffect(() => {
    const handleDataChanged = () => {
      setRevision((r) => r + 1);
    };

    dataRevisionEmitter.addEventListener('change', handleDataChanged);
    return () => {
      dataRevisionEmitter.removeEventListener('change', handleDataChanged);
    };
  }, []);

  const execute = useCallback(async () => {
    if (!isDbReady) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await queryFnRef.current();
      setData(result);
    } catch (err) {
      console.error('[useLocalQuery] Query execution failed:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [isDbReady]);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute, revision, ...deps]);

  return {
    data,
    loading,
    error,
    refetch: execute,
  };
}
