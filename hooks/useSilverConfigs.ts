/**
 * Hook for fetching Silver configs from the API
 */

import { useState, useEffect, useCallback } from 'react';
import { silverService } from '@/lib/api/services/silver';
import type {
  SilverPersistentConfig,
  SilverVirtualizedConfig,
  SilverExecuteResponse,
  SilverVersionHistoryResponse,
  SilverQueryDataResponse,
  SilverVirtualizedQueryResponse,
  ColumnTransformation,
  SilverFilters,
} from '@/types/api/silver';

interface UseSilverConfigsOptions {
  /** Auto-fetch on mount */
  autoFetch?: boolean;
}

// Combined type for UI
export interface SilverConfigItem {
  id: number;
  name: string;
  description?: string;
  type: 'persistent' | 'virtualized';
  sourceBronzeConfigId?: number;
  sourceBronzeConfigName?: string;
  sourceBronzeVersion?: number | null;
  columnGroupIds?: number[];
  filters?: SilverFilters;
  columnTransformations?: ColumnTransformation[];
  excludeUnifiedSourceColumns?: boolean;
  currentDeltaVersion?: number | null;
  lastExecutionStatus?: 'success' | 'failed' | 'running' | null;
  isActive?: boolean;
  tables?: { table_id: number; select_all?: boolean }[];
  // Computed status for UI display
  status: 'completed' | 'running' | 'failed' | 'pending' | 'active' | 'success';
  created_at: string;
  updated_at: string;
}

interface UseSilverConfigsReturn {
  /** List of all configs (both persistent and virtualized) */
  configs: SilverConfigItem[];
  /** Persistent configs only */
  persistentConfigs: SilverPersistentConfig[];
  /** Virtualized configs only */
  virtualizedConfigs: SilverVirtualizedConfig[];
  /** Loading state */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually trigger fetch */
  refresh: () => Promise<void>;
  /** Delete a config */
  deleteConfig: (id: number, type: 'persistent' | 'virtualized') => Promise<boolean>;
  /** Execute a persistent config */
  executeConfig: (id: number) => Promise<SilverExecuteResponse | null>;
  /** Get version history for a persistent config */
  getVersions: (id: number, limit?: number) => Promise<SilverVersionHistoryResponse | null>;
  /** Query data from a persistent config */
  queryPersistentData: (id: number, params?: { limit?: number; offset?: number; version?: number }) => Promise<SilverQueryDataResponse | null>;
  /** Query data from a virtualized config */
  queryVirtualizedData: (id: number, params?: { limit?: number; offset?: number }) => Promise<SilverVirtualizedQueryResponse | null>;
}

function mapExecutionStatusToUIStatus(status: string | null | undefined): SilverConfigItem['status'] {
  switch (status) {
    case 'success':
      return 'completed';
    case 'failed':
      return 'failed';
    case 'running':
      return 'running';
    default:
      return 'pending';
  }
}

export function useSilverConfigs(
  options: UseSilverConfigsOptions = {}
): UseSilverConfigsReturn {
  const { autoFetch = true } = options;

  const [persistentConfigs, setPersistentConfigs] = useState<SilverPersistentConfig[]>([]);
  const [virtualizedConfigs, setVirtualizedConfigs] = useState<SilverVirtualizedConfig[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [persistent, virtualized] = await Promise.all([
        silverService.persistent.list(),
        silverService.virtualized.list(),
      ]);
      setPersistentConfigs(persistent);
      setVirtualizedConfigs(virtualized);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message ?? 'Failed to fetch Silver configs';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteConfig = useCallback(
    async (id: number, type: 'persistent' | 'virtualized'): Promise<boolean> => {
      try {
        if (type === 'persistent') {
          await silverService.persistent.delete(id);
          setPersistentConfigs((prev) => prev.filter((c) => c.id !== id));
        } else {
          await silverService.virtualized.delete(id);
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
    async (id: number): Promise<SilverExecuteResponse | null> => {
      try {
        const result = await silverService.persistent.execute(id);
        // Update local state with new execution status
        setPersistentConfigs((prev) =>
          prev.map((c) =>
            c.id === id
              ? {
                  ...c,
                  last_execution_status: result.status,
                  current_delta_version: result.delta_version,
                }
              : c
          )
        );
        return result;
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
    async (id: number, limit?: number): Promise<SilverVersionHistoryResponse | null> => {
      try {
        return await silverService.persistent.getVersions(id, limit);
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
    ): Promise<SilverQueryDataResponse | null> => {
      try {
        return await silverService.persistent.queryData(id, params);
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
    ): Promise<SilverVirtualizedQueryResponse | null> => {
      try {
        return await silverService.virtualized.query(id, params);
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
  const configs: SilverConfigItem[] = [
    ...persistentConfigs.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: 'persistent' as const,
      sourceBronzeConfigId: c.source_bronze_config_id,
      sourceBronzeConfigName: c.source_bronze_config_name,
      sourceBronzeVersion: c.source_bronze_version,
      columnGroupIds: c.column_group_ids,
      filters: c.filters,
      columnTransformations: c.column_transformations,
      excludeUnifiedSourceColumns: c.exclude_unified_source_columns,
      currentDeltaVersion: c.current_delta_version,
      lastExecutionStatus: c.last_execution_status,
      isActive: c.is_active,
      status: mapExecutionStatusToUIStatus(c.last_execution_status),
      created_at: c.created_at,
      updated_at: c.updated_at,
    })),
    ...virtualizedConfigs.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      type: 'virtualized' as const,
      tables: c.tables,
      filters: c.filters,
      columnTransformations: c.column_transformations,
      status: 'active' as const,
      created_at: c.created_at,
      updated_at: c.updated_at,
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
