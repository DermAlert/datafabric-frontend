/**
 * Hook for fetching connection types from the API
 */

import { useState, useEffect, useCallback } from 'react';
import { connectionService } from '@/lib/api';
import type { ConnectionType, PaginationParams } from '@/types/api';

interface UseConnectionTypesOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
  /** Initial pagination params */
  pagination?: PaginationParams;
}

interface UseConnectionTypesReturn {
  /** List of connection types */
  connectionTypes: ConnectionType[];
  /** Total count from server */
  total: number;
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually trigger fetch */
  fetch: (pagination?: PaginationParams) => Promise<void>;
  /** Get a single connection type by ID */
  fetchById: (id: number) => Promise<ConnectionType | null>;
}

export function useConnectionTypes(
  options: UseConnectionTypesOptions = {}
): UseConnectionTypesReturn {
  const { autoFetch = true, pagination } = options;

  const [connectionTypes, setConnectionTypes] = useState<ConnectionType[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async (paginationParams?: PaginationParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await connectionService.search(
        paginationParams ?? pagination
      );
      setConnectionTypes(response.items);
      setTotal(response.total);
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : (err as { message?: string })?.message ?? 'Failed to fetch connection types';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [pagination]);

  const fetchById = useCallback(async (id: number): Promise<ConnectionType | null> => {
    try {
      return await connectionService.getById(id);
    } catch (err) {
      const message = err instanceof Error 
        ? err.message 
        : (err as { message?: string })?.message ?? 'Failed to fetch connection type';
      setError(message);
      return null;
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetch();
    }
  }, [autoFetch, fetch]);

  return {
    connectionTypes,
    total,
    isLoading,
    error,
    fetch,
    fetchById,
  };
}
