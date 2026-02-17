/**
 * Connection Types API Types
 */

// JSON Schema property definition
export interface SchemaProperty {
  type: 'string' | 'integer' | 'number' | 'boolean' | 'object' | 'array';
  title?: string;
  description?: string;
  default?: string | number | boolean;
  enum?: string[];
  format?: 'password' | 'textarea' | string;
  // Nested object properties (used by tunnel)
  properties?: Record<string, SchemaProperty>;
}

// Connection params schema (JSON Schema format)
export interface ConnectionParamsSchema {
  type?: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

// SSH Tunnel configuration
export interface TunnelConfig {
  enabled: boolean;
  ssh_host?: string;
  ssh_port?: number;
  ssh_username?: string;
  auth_method?: 'password' | 'private_key';
  ssh_password?: string;
  ssh_private_key?: string;
  ssh_passphrase?: string;
}

// Sentinel value for encrypted fields returned by the API
export const ENCRYPTED_SENTINEL = '[ENCRYPTED]';

// Connection Type entity
export interface ConnectionType {
  id: number;
  name: string;
  description: string;
  icon: string;
  color_hex: string;
  connection_params_schema: ConnectionParamsSchema;
  metadata_extraction_method: 'trino' | 'direct_spark' | 'direct_query' | string;
}

// Pagination request params
export interface PaginationParams {
  limit?: number;
  skip?: number;
  query_total?: boolean;
}

// Search request body
export interface ConnectionSearchRequest {
  pagination?: PaginationParams;
}

// Paginated response
export interface PaginatedResponse<T> {
  total: number;
  items: T[];
}

// Connection search response
export type ConnectionSearchResponse = PaginatedResponse<ConnectionType>;

// =============================================
// Data Connection (instance) Types
// =============================================

export type ConnectionStatus = 'active' | 'inactive' | 'error';
export type SyncStatus = 'success' | 'failed' | 'running' | 'pending';
export type ContentType = 'metadata' | 'image';

// Request to create a new data connection
export interface CreateDataConnectionRequest {
  name: string;
  description?: string;
  connection_type_id: number;
  content_type: ContentType;
  connection_params: Record<string, unknown>;
  cron_expression?: string;
  sync_settings?: Record<string, unknown>;
  organization_id?: number;
}

// Request to update an existing data connection
export interface UpdateDataConnectionRequest {
  name?: string;
  description?: string;
  connection_params?: Record<string, unknown>;
  cron_expression?: string;
  sync_settings?: Record<string, unknown>;
}

// Request to test a connection before saving
export interface TestConnectionRequest {
  connection_type_id: number;
  connection_params: Record<string, unknown>;
}

// Response for test connection
export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

// Data Connection entity (saved connection instance)
export interface DataConnection {
  id: number;
  name: string;
  description?: string;
  connection_type_id: number;
  connection_params: Record<string, unknown>;
  content_type: ContentType;
  cron_expression?: string;
  sync_settings?: Record<string, unknown>;
  organization_id: number;
  status: ConnectionStatus;
  sync_status: SyncStatus;
  sync_progress: number;
  sync_progress_details?: string | null;
  last_sync_time?: string | null;
  next_sync_time?: string | null;
}
