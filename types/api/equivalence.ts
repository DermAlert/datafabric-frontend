import { PaginationParams, PaginatedResponse } from './connection';

// ==================== SEMANTIC DOMAINS ====================

export interface SemanticDomain {
  id: number;
  name: string;
  description?: string;
  parent_domain_id?: number | null;
  color?: string;
  domain_rules?: Record<string, any>;
  data_criacao?: string;
  data_atualizacao?: string;
  terms_count?: number;
}

export interface SemanticDomainCreate {
  name: string;
  description?: string;
  parent_domain_id?: number | null;
  color?: string;
  domain_rules?: Record<string, any>;
}

export interface SemanticDomainUpdate extends Partial<SemanticDomainCreate> {}

export interface SearchSemanticDomainRequest {
  pagination?: PaginationParams;
  name?: string;
  parent_domain_id?: number;
}

// ==================== DATA DICTIONARY ====================

export interface DataDictionary {
  id: number;
  name: string;
  display_name: string;
  description: string;
  semantic_domain_id?: number | null;
  data_type: string;
  standard_values?: string[] | null;
  validation_rules?: Record<string, any>;
  example_values?: Record<string, any>;
  synonyms?: string[] | null;
  data_criacao?: string;
  data_atualizacao?: string;
  // Augmented fields from joins
  semantic_domain_name?: string;
  semantic_domain_color?: string;
  column_groups_count?: number;
}

export interface DataDictionaryCreate {
  name: string;
  display_name: string;
  description: string;
  semantic_domain_id?: number | null;
  data_type: string;
  standard_values?: string[];
  validation_rules?: Record<string, any>;
  example_values?: Record<string, any>;
  synonyms?: string[];
}

export interface DataDictionaryUpdate extends Partial<DataDictionaryCreate> {}

export interface SearchDataDictionaryRequest {
  pagination?: PaginationParams;
  name?: string;
  semantic_domain_id?: number;
  data_type?: string;
}

// ==================== COLUMN GROUPS ====================

export interface ColumnGroup {
  id: number;
  name: string;
  description?: string;
  semantic_domain_id?: number | null;
  data_dictionary_term_id?: number | null;
  properties?: Record<string, any>;
  data_criacao?: string;
  data_atualizacao?: string;
  // Augmented fields
  data_dictionary_term_name?: string;
  data_dictionary_term_display_name?: string;
  standard_values?: string[];
  semantic_domain_name?: string;
  semantic_domain_color?: string;
  columns_count?: number;
  value_mappings_count?: number;
}

export interface ColumnGroupCreate {
  name: string;
  description?: string;
  semantic_domain_id?: number | null;
  data_dictionary_term_id?: number | null;
  properties?: Record<string, any>;
}

export interface ColumnGroupUpdate extends Partial<ColumnGroupCreate> {}

export interface SearchColumnGroupRequest {
  pagination?: PaginationParams;
  name?: string;
  semantic_domain_id?: number;
  data_dictionary_term_id?: number;
}

// ==================== COLUMN MAPPINGS ====================

export interface ColumnMapping {
  id: number;
  group_id: number;
  column_id: number;
  transformation_rule?: string;
  confidence_score?: number;
  notes?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  // Augmented fields
  column_name?: string;
  table_name?: string;
  schema_name?: string;
  data_type?: string;
  data_source_name?: string;
  data_source_type?: string;
  sample_values?: any[];
}

export interface ColumnMappingCreate {
  group_id: number;
  column_id: number;
  transformation_rule?: string;
  confidence_score?: number;
  notes?: string;
}

export interface ColumnMappingUpdate {
  transformation_rule?: string;
  confidence_score?: number;
  notes?: string;
}

export interface BulkColumnMappingCreate {
  group_id: number;
  mappings: ColumnMappingCreate[];
}

export interface SearchColumnMappingRequest {
  pagination?: PaginationParams;
  group_id?: number;
  column_id?: number;
}

// ==================== VALUE MAPPINGS ====================

export interface ValueMapping {
  id: number;
  group_id: number;
  source_column_id: number;
  source_value: string;
  standard_value: string;
  description?: string;
  record_count?: number;
  data_criacao?: string;
  data_atualizacao?: string;
  // Augmented fields
  source_column_name?: string;
  table_name?: string;
  data_source_name?: string;
}

export interface ValueMappingCreate {
  group_id: number;
  source_column_id: number;
  source_value: string;
  standard_value: string;
  description?: string;
}

export interface ValueMappingUpdate {
  source_value?: string;
  standard_value?: string;
  description?: string;
  record_count?: number;
}

export interface BulkValueMappingCreate {
  group_id: number;
  mappings: ValueMappingCreate[];
}

export interface SearchValueMappingRequest {
  pagination?: PaginationParams;
  group_id?: number;
  source_column_id?: number;
  source_value?: string;
}

// ==================== STATISTICS & HELPERS ====================

export interface MappingCoverageStats {
  total_columns: number;
  mapped_columns: number;
  unmapped_columns: number;
  coverage_percentage: number;
  data_type_breakdown: {
    data_type: string;
    total_columns: number;
    mapped_columns: number;
    coverage_percentage: number;
  }[];
}

export interface AvailableColumn {
  id: number;
  column_name: string;
  data_type: string;
  table_name: string;
  schema_name: string;
  data_source_name: string;
  table_id: number;
  description?: string;
  is_nullable?: boolean;
  sample_values?: any[];
}

export interface UnmappedColumnSearchRequest {
  pagination?: PaginationParams;
  query?: string;
  semantic_domain_id?: number;
  data_type?: string;
  confidence_threshold?: number;
}