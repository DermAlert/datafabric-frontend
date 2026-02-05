/**
 * Bronze API Types
 * Types for persistent and virtualized configs in the Bronze layer
 */

// ===========================================
// Common Types
// ===========================================

export interface BronzeTableSelection {
  table_id: number;
  select_all?: boolean;
  column_ids?: number[];
}

export interface BronzeConfigBase {
  id: number;
  name: string;
  description?: string;
  tables: BronzeTableSelection[];
  enable_federated_joins: boolean;
  created_at: string;
  updated_at: string;
}

// ===========================================
// Persistent Config Types
// ===========================================

export interface PersistentConfig extends BronzeConfigBase {
  type: 'persistent';
}

export interface CreatePersistentConfigRequest {
  name: string;
  description?: string;
  tables: BronzeTableSelection[];
  enable_federated_joins?: boolean;
}

export interface UpdatePersistentConfigRequest {
  name?: string;
  description?: string;
  tables?: BronzeTableSelection[];
  enable_federated_joins?: boolean;
}

export interface ExecutionGroupResult {
  group_name: string;
  status: 'success' | 'partial' | 'failed';
  output_path: string;
  rows_ingested: number;
  error?: string;
}

export interface ExecuteConfigResponse {
  config_id: number;
  status: 'success' | 'partial' | 'failed';
  delta_version: number;
  total_rows_ingested: number;
  groups: ExecutionGroupResult[];
  error?: string;
}

export interface PreviewConfigResponse {
  config_id: number;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
}

export interface QueryDataParams {
  limit?: number;
  offset?: number;
  version?: number;
  path_index?: number;
}

export interface QueryDataResponse {
  config_id: number;
  config_name?: string;
  version?: number;
  as_of_timestamp?: string;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
  total_rows?: number;
  execution_time_seconds?: number;
  delta_version?: number;
}

export interface DeltaVersionInfo {
  version: number;
  operation: 'WRITE' | 'MERGE' | 'DELETE' | 'UPDATE';
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  timestamp: string;
  operation_parameters?: Record<string, unknown>;
}

export interface VersionHistoryResponse {
  current_version: number;
  versions: DeltaVersionInfo[];
}

export interface ExecutionHistoryItem {
  id: number;
  config_id: number;
  status: 'success' | 'partial' | 'failed';
  started_at: string;
  completed_at?: string;
  delta_version?: number;
  total_rows_ingested: number;
  error?: string;
}

export interface ExecutionHistoryResponse {
  executions: ExecutionHistoryItem[];
  total: number;
}

// ===========================================
// Virtualized Config Types
// ===========================================

export interface VirtualizedConfig extends BronzeConfigBase {
  type: 'virtualized';
}

export interface CreateVirtualizedConfigRequest {
  name: string;
  description?: string;
  tables: BronzeTableSelection[];
  enable_federated_joins?: boolean;
}

export interface UpdateVirtualizedConfigRequest {
  name?: string;
  description?: string;
  tables?: BronzeTableSelection[];
  enable_federated_joins?: boolean;
}

export interface QueryVirtualizedRequest {
  limit?: number;
  offset?: number;
}

export interface VirtualizedQueryGroup {
  group_name: string;
  connection_name: string;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
  sql_executed?: string;
}

export interface QueryVirtualizedResponse {
  config_id: number;
  config_name: string;
  total_tables: number;
  total_columns: number;
  groups: VirtualizedQueryGroup[];
  total_rows: number;
  execution_time_seconds: number;
  warnings?: string[];
  // Flat structure fallback
  columns?: string[];
  data?: Record<string, unknown>[];
  row_count?: number;
}

// ===========================================
// Unified Config Type for UI
// ===========================================

export type BronzeConfig = 
  | (PersistentConfig & { type: 'persistent' })
  | (VirtualizedConfig & { type: 'virtualized' });

// ===========================================
// Extended UI Types (with additional frontend state)
// ===========================================

export interface BronzeDatasetUI {
  id: number;
  name: string;
  description?: string;
  type: 'persistent' | 'virtualized';
  status: 'completed' | 'running' | 'failed' | 'pending' | 'active';
  tables: {
    id: number;
    name: string;
    connection: string;
    columnCount: number;
  }[];
  relationshipCount: number;
  outputFormat?: string;
  outputBucket?: string;
  federatedJoins: boolean;
  lastIngestion?: string;
  rowCount: number;
  sizeBytes: number;
  createdAt: string;
  version?: number;
  error?: string;
  versionHistory?: {
    version: number;
    timestamp: string;
    operation: string;
    rowsAffected: number;
  }[];
}
