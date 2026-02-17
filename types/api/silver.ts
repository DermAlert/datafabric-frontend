/**
 * Silver API Types
 * Types for persistent and virtualized configs in the Silver layer
 */

// ===========================================
// Common Types
// ===========================================

export interface SilverTableSelection {
  table_id: number;
  select_all?: boolean;
}

export interface FilterCondition {
  column_id?: number;
  column_name?: string;
  operator: 
    | '=' 
    | '!=' 
    | '>' 
    | '>=' 
    | '<' 
    | '<=' 
    | 'LIKE' 
    | 'ILIKE' 
    | 'IN' 
    | 'NOT IN' 
    | 'IS NULL' 
    | 'IS NOT NULL' 
    | 'BETWEEN';
  value?: string | number | boolean | null;
  value_min?: number;
  value_max?: number;
}

export interface SilverFilters {
  logic: 'AND' | 'OR';
  conditions: FilterCondition[];
}

export interface ColumnTransformation {
  column_id: number;
  type: 
    | 'lowercase' 
    | 'uppercase' 
    | 'trim' 
    | 'normalize_spaces' 
    | 'remove_accents' 
    | 'template';
  rule_id?: number;
}

// ===========================================
// LLM Extraction Types
// ===========================================

export type LLMExtractionOutputType = 'bool' | 'enum';

export interface LLMExtractionDefinition {
  source_column_id: number;
  new_column_name: string;
  prompt: string;
  output_type: LLMExtractionOutputType;
  enum_values?: string[] | null;
}

export interface LLMExtractionTestRequest {
  text: string;
  prompt: string;
  output_type: LLMExtractionOutputType;
  enum_values?: string[] | null;
}

export interface LLMExtractionTestResponse {
  success: boolean;
  result: boolean | string | null;
  output_type: string;
  prompt_used: string;
  text_preview: string;
  model_used: string;
  error: string | null;
}

export interface LLMExtractionColumnResult {
  column_name: string;
  output_type: string;
  rows_processed: number;
  rows_success: number;
  rows_failed: number;
  error_rate: number;
}

// ===========================================
// Persistent Config Types
// ===========================================

export interface SilverPersistentConfig {
  id: number;
  name: string;
  description?: string;
  source_bronze_config_id: number;
  source_bronze_config_name?: string;
  source_bronze_version?: number | null;
  column_group_ids?: number[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
  llm_extractions?: LLMExtractionDefinition[] | null;
  exclude_unified_source_columns?: boolean;
  write_mode: 'overwrite';
  current_delta_version?: number | null;
  last_execution_status?: 'success' | 'failed' | 'running' | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSilverPersistentConfigRequest {
  name: string;
  description?: string;
  source_bronze_config_id: number;
  source_bronze_version?: number;
  column_group_ids?: number[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
  llm_extractions?: LLMExtractionDefinition[] | null;
  exclude_unified_source_columns?: boolean;
}

export interface UpdateSilverPersistentConfigRequest {
  name?: string;
  description?: string;
  source_bronze_version?: number;
  column_group_ids?: number[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
  llm_extractions?: LLMExtractionDefinition[] | null;
  exclude_unified_source_columns?: boolean;
}

export interface SilverExecuteResponse {
  config_id: number;
  config_name: string;
  execution_id: number;
  status: 'success' | 'failed' | 'running';
  rows_processed: number;
  rows_output: number;
  output_path: string;
  execution_time_seconds: number;
  write_mode_used: string;
  delta_version: number;
  error?: string;
  llm_extraction_results?: LLMExtractionColumnResult[] | null;
}

export interface SilverVersionInfo {
  version: number;
  timestamp: string;
  operation: 'WRITE' | 'MERGE' | 'DELETE' | 'UPDATE';
  rows_inserted?: number;
  rows_updated?: number;
  rows_deleted?: number;
  num_files?: number;
  config_snapshot?: Partial<SilverPersistentConfig>;
}

export interface SilverVersionHistoryResponse {
  config_id: number;
  config_name: string;
  current_version: number;
  output_path: string;
  versions: SilverVersionInfo[];
}

export interface SilverQueryDataParams {
  limit?: number;
  offset?: number;
  version?: number;
  as_of_timestamp?: string;
  path_index?: number;
}

// ===========================================
// Server-Side Column Filter Types
// ===========================================

export type ColumnFilterOperator =
  | 'eq'
  | 'neq'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'between'
  | 'is_null'
  | 'is_not_null'
  | 'in'
  | 'not_in';

export interface ColumnFilter {
  column: string;
  operator: ColumnFilterOperator;
  value?: string | number | boolean | (string | number)[] | null;
}

export interface DataQueryRequest {
  limit?: number;
  offset?: number;
  version?: number | null;
  as_of_timestamp?: string | null;
  path_index?: number;
  column_filters?: ColumnFilter[] | null;
  column_filters_logic?: 'AND' | 'OR';
  sort_by?: string | null;
  sort_order?: 'asc' | 'desc';
}

export interface DataQueryResponse {
  config_id: number;
  config_name: string;
  version?: number | null;
  as_of_timestamp?: string | null;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
  total_rows: number;
  execution_time_seconds: number;
}

export interface SilverQueryDataResponse {
  config_id: number;
  config_name: string;
  version?: number;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
  total_rows?: number;
  execution_time_seconds: number;
}

// ===========================================
// Virtualized Config Types
// ===========================================

export interface SilverVirtualizedConfig {
  id: number;
  name: string;
  description?: string;
  tables: SilverTableSelection[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
  created_at: string;
  updated_at: string;
}

export interface CreateSilverVirtualizedConfigRequest {
  name: string;
  description?: string;
  tables: SilverTableSelection[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
}

export interface UpdateSilverVirtualizedConfigRequest {
  name?: string;
  description?: string;
  tables?: SilverTableSelection[];
  filters?: SilverFilters;
  column_transformations?: ColumnTransformation[];
}

export interface SilverVirtualizedQueryParams {
  limit?: number;
  offset?: number;
}

export interface SilverVirtualizedQueryResponse {
  config_id: number;
  config_name: string;
  columns: string[];
  data: Record<string, unknown>[];
  row_count: number;
  total_rows?: number;
  execution_time_seconds: number;
}

// ===========================================
// Normalization Rules Types
// ===========================================

export interface NormalizationRule {
  id: number;
  name: string;
  template: string;
  example_input?: string;
  example_output?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNormalizationRuleRequest {
  name: string;
  template: string;
  example_input?: string;
  example_output?: string;
}

export interface UpdateNormalizationRuleRequest {
  name?: string;
  description?: string;
  template?: string;
  example_input?: string;
  example_output?: string;
}

export interface TestNormalizationRuleRequest {
  rule_id: number;
  value: string;
}

export interface TestNormalizationRuleResponse {
  success: boolean;
  original_value: string;
  normalized_value: string;
  rule_applied: string;
  error: string | null;
}

// ===========================================
// Transformation Types & Filter Operators
// ===========================================

export interface TransformationType {
  value: string;
  label: string;
  description: string;
  sql_template?: string;
}

export interface FilterOperator {
  value: string;
  label: string;
  requires_value: boolean;
  supports_array?: boolean;
}

// ===========================================
// Combined Type for UI
// ===========================================

export type SilverConfig = 
  | (SilverPersistentConfig & { type: 'persistent' })
  | (SilverVirtualizedConfig & { type: 'virtualized' });

// ===========================================
// Extended UI Types
// ===========================================

export interface SilverDatasetUI {
  id: number;
  name: string;
  description?: string;
  type: 'persistent' | 'virtualized';
  status: 'completed' | 'running' | 'failed' | 'pending' | 'active' | 'success';
  sourceBronzeConfigId?: number;
  sourceBronzeConfigName?: string;
  sourceBronzeVersion?: number | null;
  columnGroups?: number[];
  filters?: SilverFilters;
  transformations?: ColumnTransformation[];
  currentDeltaVersion?: number | null;
  lastExecutionStatus?: string | null;
  tables?: SilverTableSelection[];
  rowCount?: number;
  sizeBytes?: number;
  createdAt: string;
  updatedAt: string;
  error?: string;
}
