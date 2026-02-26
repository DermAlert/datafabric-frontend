/**
 * Delta Sharing API Types
 * Types for managing shares, schemas, tables, and recipients
 */

// =============================================
// Dataset Integration Types
// =============================================

export type SourceType = 'bronze' | 'silver';
export type ShareTableSourceType =
  | 'delta'
  | 'bronze'
  | 'silver'
  | 'bronze_virtualized'
  | 'silver_virtualized';
export type DatasetConfigType = 'persistent' | 'virtualized';
export type DataApiFormat = 'json' | 'csv' | 'ndjson';

export interface AvailableDataset {
  config_id: number;
  name: string;
  description: string | null;
  source_type: SourceType;
  config_type?: DatasetConfigType;
  output_path: string;
  current_version: number;
  last_execution_status: string;
  last_execution_at: string;
  total_rows: number;
}

// =============================================
// Share Types
// =============================================

export interface Share {
  id: number;
  name: string;
  description: string | null;
  organization_id?: number;
  status?: string;
  owner_email?: string | null;
  contact_info?: string | null;
  terms_of_use?: string | null;
  data_criacao?: string;
  data_atualizacao?: string;
  schemas_count?: number;
  tables_count?: number;
  recipients_count?: number;
  // Alias para compatibilidade
  created_at?: string;
  updated_at?: string;
}

export interface CreateShareRequest {
  name: string;
  description?: string;
}

export interface UpdateShareRequest {
  name?: string;
  description?: string;
}

export interface ShareSearchRequest {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface ShareSearchResponse {
  items: Share[];
  total: number;
  page: number;
  page_size: number;
}

// =============================================
// Schema Types
// =============================================

export interface Schema {
  id: number;
  name: string;
  description: string | null;
  share_id: number;
  share_name?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  tables_count?: number;
  // Alias para compatibilidade
  created_at?: string;
  updated_at?: string;
}

export interface CreateSchemaRequest {
  name: string;
  description?: string;
}

export interface UpdateSchemaRequest {
  name?: string;
  description?: string;
}

export interface SchemaSearchRequest {
  page?: number;
  page_size?: number;
  search?: string;
}

export interface SchemaSearchResponse {
  items: Schema[];
  total: number;
  page: number;
  page_size: number;
}

// =============================================
// Table Types
// =============================================

export type ShareMode = 'full' | 'filtered' | 'aggregated';

export interface Table {
  id: number;
  name: string;
  protocol_table_name?: string | null;
  description: string | null;
  schema_id: number;
  schema_name: string;
  share_id: number;
  share_name: string;
  dataset_id: number | null;
  dataset_name: string | null;
  status: string;
  share_mode: ShareMode;
  filter_condition: string | null;
  current_version: number | null;
  pinned_delta_version: number | null;
  table_format: string;
  partition_columns: string | null;
  storage_location: string | null;
  data_criacao: string;
  data_atualizacao: string;
  // Campos do backend para identificar config de origem
  bronze_persistent_config_id?: number | null;
  silver_persistent_config_id?: number | null;
  bronze_virtualized_config_id?: number | null;
  silver_virtualized_config_id?: number | null;
  // Campos derivados para compatibilidade com UI
  table_id?: number;
  table_name?: string;
  source_type?: ShareTableSourceType;
  source_config_id?: number | null;
  source_config_name?: string;
  config_type?: DatasetConfigType;
}

export interface CreateTableFromBronzeRequest {
  bronze_config_id: number;
  name: string;
  description?: string;
  share_mode?: ShareMode;
  path_index?: number;
  pinned_delta_version?: number | null;
}

export interface CreateTableFromSilverRequest {
  silver_config_id: number;
  name: string;
  description?: string;
  share_mode?: ShareMode;
  pinned_delta_version?: number | null;
}

export interface UpdateTableRequest {
  pinned_delta_version?: number | null;
}

export interface PinVersionRequest {
  delta_version: number;
}

export interface UnpinVersionResponse {
  message: string;
  table_id: number;
  table_name: string;
}

export interface CreateTableFromBronzeVirtualizedRequest {
  bronze_virtualized_config_id: number;
  name: string;
  description?: string;
}

export interface CreateTableFromSilverVirtualizedRequest {
  silver_virtualized_config_id: number;
  name: string;
  description?: string;
}

export interface TableDataApiColumn {
  name: string;
  type: string | null;
}

export interface TableDataApiJsonResponse {
  share: string;
  schema_name: string;
  table: string;
  source_type: ShareTableSourceType;
  columns: TableDataApiColumn[];
  data: Record<string, unknown>[];
  row_count: number;
  has_more: boolean;
  execution_time_seconds: number;
}

export interface TableDataApiRequest {
  format?: DataApiFormat;
  limit?: number;
  offset?: number;
}

export interface TableDataApiResponse {
  contentType: string;
  rowCount: number | null;
  hasMore: boolean | null;
  payload: TableDataApiJsonResponse | string;
}

// =============================================
// Recipient Types
// =============================================

export interface Recipient {
  id: number;
  identifier: string;
  name: string;
  email: string | null;
  organization_name: string | null;
  bearer_token?: string;
  token_expiry: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  shares?: RecipientShare[];
}

export interface RecipientShare {
  id: number;
  name: string;
}

export interface CreateRecipientRequest {
  identifier: string;
  name: string;
  email?: string;
  organization_name?: string;
}

export interface UpdateRecipientRequest {
  name?: string;
  email?: string;
  organization_name?: string;
  is_active?: boolean;
}

export interface RecipientSearchRequest {
  page?: number;
  size?: number;
  search?: string;
  is_active?: boolean;
}

export interface RecipientSearchResponse {
  items: Recipient[];
  total: number;
  page: number;
  size: number;
}

export interface AssociateSharesRequest {
  share_ids: number[];
}

export interface RegenerateTokenResponse {
  message: string;
  token: string;
}

// =============================================
// Enriched Types for UI
// =============================================

export interface ShareWithDetails extends Share {
  schemas?: SchemaWithTables[];
  recipients?: Recipient[];
  table_count?: number;
  recipient_count?: number;
}

export interface SchemaWithTables extends Schema {
  tables?: Table[];
}
