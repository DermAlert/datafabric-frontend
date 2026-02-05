/**
 * Hook for managing Delta Sharing data
 * Handles shares, schemas, tables, recipients, and available datasets
 */

import { useState, useEffect, useCallback } from 'react';
import { deltaSharingService } from '@/lib/api/services/deltaSharing';
import type {
  Share,
  Schema,
  Table,
  Recipient,
  AvailableDataset,
  SourceType,
  CreateShareRequest,
  CreateSchemaRequest,
  CreateTableFromBronzeRequest,
  CreateTableFromSilverRequest,
  CreateRecipientRequest,
  UpdateRecipientRequest,
  ShareWithDetails,
  SchemaWithTables,
} from '@/types/api/deltaSharing';

interface UseDeltaSharingOptions {
  autoFetch?: boolean;
}

interface UseDeltaSharingReturn {
  // Data
  shares: ShareWithDetails[];
  recipients: Recipient[];
  availableDatasets: AvailableDataset[];
  
  // Loading states
  isLoading: boolean;
  isLoadingDatasets: boolean;
  isLoadingRecipients: boolean;
  
  // Error state
  error: string | null;
  
  // Refresh functions
  refresh: () => Promise<void>;
  refreshRecipients: () => Promise<void>;
  refreshDatasets: (sourceType?: SourceType) => Promise<void>;
  
  // Share operations
  createShare: (data: CreateShareRequest) => Promise<Share | null>;
  updateShare: (shareId: number, data: Partial<CreateShareRequest>) => Promise<Share | null>;
  deleteShare: (shareId: number) => Promise<boolean>;
  
  // Schema operations
  createSchema: (shareId: number, data: CreateSchemaRequest) => Promise<Schema | null>;
  deleteSchema: (shareId: number, schemaId: number) => Promise<boolean>;
  
  // Table operations
  addTableFromBronze: (
    shareId: number,
    schemaId: number,
    data: CreateTableFromBronzeRequest
  ) => Promise<Table | null>;
  addTableFromSilver: (
    shareId: number,
    schemaId: number,
    data: CreateTableFromSilverRequest
  ) => Promise<Table | null>;
  removeTable: (shareId: number, schemaId: number, tableId: number) => Promise<boolean>;
  
  // Recipient operations
  createRecipient: (data: CreateRecipientRequest) => Promise<Recipient | null>;
  updateRecipient: (recipientId: number, data: UpdateRecipientRequest) => Promise<Recipient | null>;
  deleteRecipient: (recipientId: number) => Promise<boolean>;
  associateRecipientToShares: (recipientId: number, shareIds: number[]) => Promise<boolean>;
  removeRecipientFromShare: (recipientId: number, shareId: number) => Promise<boolean>;
  regenerateToken: (recipientId: number) => Promise<string | null>;
  
  // Utility
  getShareWithDetails: (shareId: number) => Promise<ShareWithDetails | null>;
  clearError: () => void;
}

export function useDeltaSharing(
  options: UseDeltaSharingOptions = {}
): UseDeltaSharingReturn {
  const { autoFetch = true } = options;

  const [shares, setShares] = useState<ShareWithDetails[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [availableDatasets, setAvailableDatasets] = useState<AvailableDataset[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(false);
  const [isLoadingRecipients, setIsLoadingRecipients] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (err: unknown, fallbackMessage: string): string => {
    const message =
      err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? fallbackMessage;
    setError(message);
    return message;
  };

  const clearError = useCallback(() => setError(null), []);

  // =============================================
  // Fetch Functions
  // =============================================

  const fetchShares = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await deltaSharingService.shares.search({ page_size: 100 });
      
      // Enrich shares with schemas and tables
      const enrichedShares = await Promise.all(
        response.items.map(async (share) => {
          try {
            const schemasResponse = await deltaSharingService.schemas.search(share.id, { page_size: 100 });
            
            // Buscar tables de cada schema
            const schemasWithTables = await Promise.all(
              schemasResponse.items.map(async (schema) => {
                try {
                  // Buscar tables do schema via API
                  const tablesResponse = await deltaSharingService.schemas.searchTables(share.id, schema.id);
                  // Normalizar os dados das tables para compatibilidade com UI
                  const normalizedTables = (tablesResponse.items || []).map((table) => ({
                    ...table,
                    table_id: table.id,
                    table_name: table.name,
                    source_type: table.dataset_name?.startsWith('bronze_') ? 'bronze' as const : 'silver' as const,
                    source_config_id: table.dataset_id,
                    source_config_name: table.dataset_name,
                  }));
                  return {
                    ...schema,
                    tables: normalizedTables,
                  };
                } catch {
                  // Se falhar, tentar usar tables que vieram com o schema
                  return { 
                    ...schema, 
                    tables: (schema as SchemaWithTables).tables || [] 
                  };
                }
              })
            );
            
            const totalTables = schemasWithTables.reduce((acc, s) => acc + (s.tables?.length || 0), 0);
            
            return {
              ...share,
              schemas: schemasWithTables,
              table_count: totalTables,
            };
          } catch {
            return { ...share, schemas: [], table_count: 0 };
          }
        })
      );
      
      setShares(enrichedShares);
    } catch (err) {
      handleError(err, 'Failed to fetch shares');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchRecipients = useCallback(async () => {
    setIsLoadingRecipients(true);
    try {
      const response = await deltaSharingService.recipients.search({ size: 100 });
      setRecipients(response.items);
    } catch (err) {
      handleError(err, 'Failed to fetch recipients');
    } finally {
      setIsLoadingRecipients(false);
    }
  }, []);

  const fetchDatasets = useCallback(async (sourceType?: SourceType) => {
    setIsLoadingDatasets(true);
    try {
      const datasets = await deltaSharingService.datasets.list(sourceType);
      setAvailableDatasets(datasets);
    } catch (err) {
      handleError(err, 'Failed to fetch available datasets');
    } finally {
      setIsLoadingDatasets(false);
    }
  }, []);

  // =============================================
  // Share Operations
  // =============================================

  const createShare = useCallback(async (data: CreateShareRequest): Promise<Share | null> => {
    try {
      const share = await deltaSharingService.shares.create(data);
      setShares((prev) => [...prev, { ...share, schemas: [], table_count: 0 }]);
      return share;
    } catch (err) {
      handleError(err, 'Failed to create share');
      return null;
    }
  }, []);

  const updateShare = useCallback(
    async (shareId: number, data: Partial<CreateShareRequest>): Promise<Share | null> => {
      try {
        const updated = await deltaSharingService.shares.update(shareId, data);
        setShares((prev) =>
          prev.map((s) => (s.id === shareId ? { ...s, ...updated } : s))
        );
        return updated;
      } catch (err) {
        handleError(err, 'Failed to update share');
        return null;
      }
    },
    []
  );

  const deleteShare = useCallback(async (shareId: number): Promise<boolean> => {
    try {
      await deltaSharingService.shares.delete(shareId);
      setShares((prev) => prev.filter((s) => s.id !== shareId));
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete share');
      return false;
    }
  }, []);

  // =============================================
  // Schema Operations
  // =============================================

  const createSchema = useCallback(
    async (shareId: number, data: CreateSchemaRequest): Promise<Schema | null> => {
      try {
        const schema = await deltaSharingService.schemas.create(shareId, data);
        setShares((prev) =>
          prev.map((s) =>
            s.id === shareId
              ? { ...s, schemas: [...(s.schemas || []), { ...schema, tables: [] }] }
              : s
          )
        );
        return schema;
      } catch (err) {
        handleError(err, 'Failed to create schema');
        return null;
      }
    },
    []
  );

  const deleteSchema = useCallback(
    async (shareId: number, schemaId: number): Promise<boolean> => {
      try {
        await deltaSharingService.schemas.delete(shareId, schemaId);
        setShares((prev) =>
          prev.map((s) =>
            s.id === shareId
              ? { ...s, schemas: (s.schemas || []).filter((sc) => sc.id !== schemaId) }
              : s
          )
        );
        return true;
      } catch (err) {
        handleError(err, 'Failed to delete schema');
        return false;
      }
    },
    []
  );

  // =============================================
  // Table Operations
  // =============================================

  const addTableFromBronze = useCallback(
    async (
      shareId: number,
      schemaId: number,
      data: CreateTableFromBronzeRequest
    ): Promise<Table | null> => {
      try {
        const table = await deltaSharingService.tables.createFromBronze(shareId, schemaId, data);
        // Refresh shares to get updated data
        await fetchShares();
        return table;
      } catch (err) {
        handleError(err, 'Failed to add table from Bronze');
        return null;
      }
    },
    [fetchShares]
  );

  const addTableFromSilver = useCallback(
    async (
      shareId: number,
      schemaId: number,
      data: CreateTableFromSilverRequest
    ): Promise<Table | null> => {
      try {
        const table = await deltaSharingService.tables.createFromSilver(shareId, schemaId, data);
        // Refresh shares to get updated data
        await fetchShares();
        return table;
      } catch (err) {
        handleError(err, 'Failed to add table from Silver');
        return null;
      }
    },
    [fetchShares]
  );

  const removeTable = useCallback(
    async (shareId: number, schemaId: number, tableId: number): Promise<boolean> => {
      try {
        await deltaSharingService.tables.delete(shareId, schemaId, tableId);
        // Refresh shares to get updated data
        await fetchShares();
        return true;
      } catch (err) {
        handleError(err, 'Failed to remove table');
        return false;
      }
    },
    [fetchShares]
  );

  // =============================================
  // Recipient Operations
  // =============================================

  const createRecipient = useCallback(
    async (data: CreateRecipientRequest): Promise<Recipient | null> => {
      try {
        const recipient = await deltaSharingService.recipients.create(data);
        setRecipients((prev) => [...prev, recipient]);
        return recipient;
      } catch (err) {
        handleError(err, 'Failed to create recipient');
        return null;
      }
    },
    []
  );

  const updateRecipient = useCallback(
    async (recipientId: number, data: UpdateRecipientRequest): Promise<Recipient | null> => {
      try {
        const updated = await deltaSharingService.recipients.update(recipientId, data);
        setRecipients((prev) =>
          prev.map((r) => (r.id === recipientId ? { ...r, ...updated } : r))
        );
        return updated;
      } catch (err) {
        handleError(err, 'Failed to update recipient');
        return null;
      }
    },
    []
  );

  const deleteRecipient = useCallback(async (recipientId: number): Promise<boolean> => {
    try {
      await deltaSharingService.recipients.delete(recipientId);
      setRecipients((prev) => prev.filter((r) => r.id !== recipientId));
      return true;
    } catch (err) {
      handleError(err, 'Failed to delete recipient');
      return false;
    }
  }, []);

  const associateRecipientToShares = useCallback(
    async (recipientId: number, shareIds: number[]): Promise<boolean> => {
      try {
        await deltaSharingService.recipients.associateShares(recipientId, { share_ids: shareIds });
        await fetchRecipients();
        return true;
      } catch (err) {
        handleError(err, 'Failed to associate recipient to shares');
        return false;
      }
    },
    [fetchRecipients]
  );

  const removeRecipientFromShare = useCallback(
    async (recipientId: number, shareId: number): Promise<boolean> => {
      try {
        await deltaSharingService.recipients.removeShare(recipientId, shareId);
        await fetchRecipients();
        return true;
      } catch (err) {
        handleError(err, 'Failed to remove recipient from share');
        return false;
      }
    },
    [fetchRecipients]
  );

  const regenerateToken = useCallback(
    async (recipientId: number): Promise<string | null> => {
      try {
        const response = await deltaSharingService.recipients.regenerateToken(recipientId);
        await fetchRecipients();
        return response.token;
      } catch (err) {
        handleError(err, 'Failed to regenerate token');
        return null;
      }
    },
    [fetchRecipients]
  );

  // =============================================
  // Utility Functions
  // =============================================

  const getShareWithDetails = useCallback(
    async (shareId: number): Promise<ShareWithDetails | null> => {
      try {
        const share = await deltaSharingService.shares.get(shareId);
        const schemasResponse = await deltaSharingService.schemas.search(shareId, { page_size: 100 });
        return {
          ...share,
          schemas: schemasResponse.items as SchemaWithTables[],
        };
      } catch (err) {
        handleError(err, 'Failed to get share details');
        return null;
      }
    },
    []
  );

  // =============================================
  // Effects
  // =============================================

  useEffect(() => {
    if (autoFetch) {
      fetchShares();
      fetchRecipients();
      fetchDatasets();
    }
  }, [autoFetch, fetchShares, fetchRecipients, fetchDatasets]);

  return {
    // Data
    shares,
    recipients,
    availableDatasets,
    
    // Loading states
    isLoading,
    isLoadingDatasets,
    isLoadingRecipients,
    
    // Error
    error,
    
    // Refresh
    refresh: fetchShares,
    refreshRecipients: fetchRecipients,
    refreshDatasets: fetchDatasets,
    
    // Share operations
    createShare,
    updateShare,
    deleteShare,
    
    // Schema operations
    createSchema,
    deleteSchema,
    
    // Table operations
    addTableFromBronze,
    addTableFromSilver,
    removeTable,
    
    // Recipient operations
    createRecipient,
    updateRecipient,
    deleteRecipient,
    associateRecipientToShares,
    removeRecipientFromShare,
    regenerateToken,
    
    // Utility
    getShareWithDetails,
    clearError,
  };
}
