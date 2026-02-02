/**
 * Delta Sharing API Types
 * Types for managing shares, schemas, tables, and recipients
 */

// =============================================
// Dataset Integration Types
// =============================================

export type SourceType = 'bronze' | 'silver';

export interface AvailableDataset {
  config_id: number;
  name: string;
  description: string | null;
  source_type: SourceType;
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
  description: string | null;
  schema_id: number;
  schema_name: string;
  share_id: number;
  share_name: string;
  dataset_id: number;
  dataset_name: string;
  status: string;
  share_mode: ShareMode;
  filter_condition: string | null;
  current_version: number | null;
  table_format: string;
  partition_columns: string | null;
  storage_location: string;
  data_criacao: string;
  data_atualizacao: string;
  // Campos derivados para compatibilidade com UI
  table_id?: number;
  table_name?: string;
  source_type?: SourceType;
  source_config_id?: number;
  source_config_name?: string;
}

export interface CreateTableFromBronzeRequest {
  bronze_config_id: number;
  name: string;
  description?: string;
  share_mode?: ShareMode;
  path_index?: number;
}

export interface CreateTableFromSilverRequest {
  silver_config_id: number;
  name: string;
  description?: string;
  share_mode?: ShareMode;
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
