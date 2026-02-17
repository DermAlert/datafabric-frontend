/**
 * Metadata API Types
 * Types for catalog, schema, table, and column metadata
 */

// Catalog - top level container (usually database name)
export interface MetadataCatalog {
  id: number;
  connection_id: number;
  catalog_name: string;
  catalog_type: string;
  external_reference: string;
  properties: Record<string, unknown>;
  fl_ativo: boolean;
}

// Schema - database schema within a catalog
export interface MetadataSchema {
  id: number;
  catalog_id: number;
  connection_id: number;
  schema_name: string;
  external_reference: string;
  properties: Record<string, unknown>;
  fl_ativo: boolean;
  is_system_schema?: boolean;
}

// Table - database table within a schema
export interface MetadataTable {
  id: number;
  schema_id: number;
  connection_id: number;
  table_name: string;
  external_reference: string;
  table_type: 'table' | 'view' | string;
  estimated_row_count: number;
  total_size_bytes: number;
  last_analyzed: string | null;
  properties: Record<string, unknown>;
  description: string | null;
  fl_ativo: boolean;
}

// Table with additional details
export interface MetadataTableDetails extends MetadataTable {
  schema_name: string;
  columns: MetadataColumn[];
  primary_key_count: number;
  column_count: number;
}

// Column - database column within a table
export interface MetadataColumn {
  id: number;
  table_id: number;
  column_name: string;
  external_reference: string | null;
  data_type: string;
  is_nullable: boolean;
  column_position: number;
  max_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
  is_primary_key: boolean;
  is_unique: boolean;
  is_indexed: boolean;
  is_foreign_key: boolean;
  fk_referenced_table_id: number | null;
  fk_referenced_column_id: number | null;
  fk_constraint_name: string | null;
  default_value: string | null;
  description: string | null;
  statistics: Record<string, unknown>;
  sample_values: string[];
  properties: Record<string, unknown>;
  fl_ativo: boolean;
}

// Distinct values response
export interface DistinctValuesResponse {
  column_id: number;
  column_name: string;
  connection_type: string;
  distinct_values: Array<string | number | boolean | null>;
  distinct_values_with_count?: Array<{
    value: string | number | boolean | null;
    count: number;
  }>;
  total_distinct: number;  // Total de valores distintos na coluna
  total_returned: number;  // Quantos foram retornados (com limit)
  search_filter: string | null;
  limit: number;
  offset?: number;
  next_offset?: number | null;
  has_more?: boolean;
  order_by?: 'value_asc' | 'frequency_desc' | 'frequency_asc' | string;
}

// Table sample column info
export interface SampleColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  is_primary_key: boolean;
}

// Table sample response
export interface TableSampleResponse {
  table_id: number;
  table_name: string;
  schema_name: string;
  catalog_name: string;
  connection_type: string;
  columns: SampleColumnInfo[];
  sample_data: Record<string, unknown>[];
  total_returned: number;
  max_samples: number;
}
