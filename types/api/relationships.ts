export type JoinType = 'inner' | 'left' | 'right' | 'full';
export type Cardinality = 'one_to_one' | 'one_to_many' | 'many_to_one' | 'many_to_many';
export type RelationshipSource = 'auto_fk' | 'auto_name' | 'manual';
export type RelationshipScope = 'intra_connection' | 'inter_connection';

export interface ColumnRef {
  column_id: number;
  column_name: string;
  data_type?: string;
  table_id: number;
  table_name: string;
  schema_name?: string;
  connection_id: number;
  connection_name?: string;
}

export interface TableRelationship {
  id: number;
  
  left_column: ColumnRef;
  right_column: ColumnRef;
  
  name?: string;
  description?: string;
  scope?: RelationshipScope;
  source: RelationshipSource;
  
  cardinality: Cardinality;
  default_join_type: JoinType;
  
  confidence_score?: number;
  is_verified: boolean;
  is_active: boolean;
  
  data_criacao?: string;
  data_atualizacao?: string;
}

export interface RelationshipSuggestion {
  id: number;
  
  left_column: ColumnRef;
  right_column: ColumnRef;
  
  suggestion_reason: string;
  confidence_score: number;
  status: string;
  
  details?: any;
  generated_at?: string;
}

export interface CreateRelationshipRequest {
  left_table_id: number;
  left_column_id: number;
  right_table_id: number;
  right_column_id: number;
  cardinality?: Cardinality;
  default_join_type?: JoinType;
  name?: string;
  description?: string;
}

export interface UpdateRelationshipRequest {
  name?: string;
  description?: string;
  cardinality?: Cardinality;
  default_join_type?: JoinType;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface DiscoverRelationshipsRequest {
  connection_ids?: number[];
  table_ids?: number[];
  auto_accept?: boolean;
}

export interface DiscoverRelationshipsResponse {
  discovered_count: number;
  accepted_count: number;
  suggestions_count: number;
  details: string;
}

export interface SearchRelationshipsRequest {
  connection_id?: number;
  table_id?: number;
  scope?: RelationshipScope;
  source?: RelationshipSource;
  is_verified?: boolean;
  is_active?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page?: number;
  size?: number;
  pages?: number;
}
