/**
 * Hook for fetching Bronze configs from the API
 */

import { useState, useEffect, useCallback } from 'react';
import { bronzeService } from '@/lib/api/services/bronze';
import type {
  PersistentConfig,
  VirtualizedConfig,
  ExecuteConfigResponse,
  VersionHistoryResponse,
  QueryDataResponse,
  QueryVirtualizedResponse,
} from '@/types/api/bronze';

interface UseBronzeConfigsOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

// Combined type for UI
export interface BronzeConfigItem {
  id: number;
  name: string;
  description?: string;
  type: 'persistent' | 'virtualized';
  tables: { table_id: number; select_all?: boolean; column_ids?: number[] }[];
  enable_federated_joins: boolean;
  created_at: string;
  updated_at: string;
  // Extended fields for UI state
  status?: 'completed' | 'running' | 'failed' | 'pending' | 'active';
  lastExecution?: {
    status: string;
    timestamp: string;
    rowsIngested: number;
  };
}

interface UseBronzeConfigsReturn {
  /** List of all configs (both persistent and virtualized) */
  configs: BronzeConfigItem[];
  /** Persistent configs only */
  persistentConfigs: PersistentConfig[];
  /** Virtualized configs only */
  virtualizedConfigs: VirtualizedConfig[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually trigger fetch */
  refresh: () => Promise<void>;
  /** Delete a config */
  deleteConfig: (id: number, type: 'persistent' | 'virtualized') => Promise<boolean>;
  /** Execute a persistent config */
  executeConfig: (id: number) => Promise<ExecuteConfigResponse | null>;
  /** Get version history for a persistent config */
  getVersions: (id: number) => Promise<VersionHistoryResponse | null>;
  /** Query data from a persistent config */
  queryPersistentData: (id: number, params?: { limit?: number; offset?: number; version?: number }) => Promise<QueryDataResponse | null>;
  /** Query data from a virtualized config */
  queryVirtualizedData: (id: number, params?: { limit?: number; offset?: number }) => Promise<QueryVirtualizedResponse | null>;
}

export function useBronzeConfigs(
  options: UseBronzeConfigsOptions = {}
): UseBronzeConfigsReturn {
  const { autoFetch = true } = options;

  const [persistentConfigs, setPersistentConfigs] = useState<PersistentConfig[]>([]);
  const [virtualizedConfigs, setVirtualizedConfigs] = useState<VirtualizedConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [persistent, virtualized] = await Promise.all([
        bronzeService.persistent.list(),
        bronzeService.virtualized.list(),
      ]);
      setPersistentConfigs(persistent);
      setVirtualizedConfigs(virtualized);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Failed to fetch Bronze configs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConfig = useCallback(
    async (id: number, type: 'persistent' | 'virtualized'): Promise<boolean> => {
      try {
        if (type === 'persistent') {
          await bronzeService.persistent.delete(id);
          setPersistentConfigs((prev) => prev.filter((c) => c.id !== id));
        } else {
          await bronzeService.virtualized.delete(id);
          setVirtualizedConfigs((prev) => prev.filter((c) => c.id !== id));
        }
        return true;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to delete config';
        setError(message);
        return false;
      }
    },
    []
  );

  const executeConfig = useCallback(
    async (id: number): Promise<ExecuteConfigResponse | null> => {
      try {
        return await bronzeService.persistent.execute(id);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to execute config';
        setError(message);
        return null;
      }
    },
    []
  );

  const getVersions = useCallback(
    async (id: number): Promise<VersionHistoryResponse | null> => {
      try {
        return await bronzeService.persistent.getVersions(id);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to fetch versions';
        setError(message);
        return null;
      }
    },
    []
  );

  const queryPersistentData = useCallback(
    async (
      id: number,
      params?: { limit?: number; offset?: number; version?: number }
    ): Promise<QueryDataResponse | null> => {
      try {
        return await bronzeService.persistent.queryData(id, params);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to query data';
        setError(message);
        return null;
      }
    },
    []
  );

  const queryVirtualizedData = useCallback(
    async (
      id: number,
      params?: { limit?: number; offset?: number }
    ): Promise<QueryVirtualizedResponse | null> => {
      try {
        return await bronzeService.virtualized.query(id, params);
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : (err as { message?: string })?.message ?? 'Failed to query data';
        setError(message);
        return null;
      }
    },
    []
  );

  useEffect(() => {
    if (autoFetch) {
      fetchConfigs();
    }
  }, [autoFetch, fetchConfigs]);

  // Combine configs for unified UI display
  const configs: BronzeConfigItem[] = [
    ...persistentConfigs.map((c) => ({
      ...c,
      type: 'persistent' as const,
      status: 'completed' as const, // Default status, will be updated from executions
    })),
    ...virtualizedConfigs.map((c) => ({
      ...c,
      type: 'virtualized' as const,
      status: 'active' as const,
    })),
  ];

  return {
    configs,
    persistentConfigs,
    virtualizedConfigs,
    isLoading,
    error,
    refresh: fetchConfigs,
    deleteConfig,
    executeConfig,
    getVersions,
    queryPersistentData,
    queryVirtualizedData,
  };
}
