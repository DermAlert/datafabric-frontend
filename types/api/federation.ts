/**
 * Federation API Types
 * Types for managing federations across connections
 */

/**
 * Connection info within a federation (with color and icon)
 */
export interface FederationConnection {
  id: number;
  name: string;
  type: string;
  color: string;
  icon: string;
}

/**
 * Table info within a federation
 */
export interface FederationTable {
  id: number;
  table_name: string;
  schema_name: string;
  connection_id: number;
  connection_name: string;
}

/**
 * Federation entity
 */
export interface Federation {
  id: number;
  name: string;
  description?: string;
  connections: FederationConnection[];
  tables?: FederationTable[];
  tables_count: number;
  relationships_count: number;
  data_criacao: string;
}

/**
 * Request to create a new federation
 */
export interface CreateFederationRequest {
  name: string;
  description?: string;
}

/**
 * Request to update an existing federation
 */
export interface UpdateFederationRequest {
  name?: string;
  description?: string;
}

/**
 * Request to add connections to a federation
 */
export interface AddConnectionsRequest {
  connection_ids: number[];
}

/**
 * Request to add specific tables to a federation
 */
export interface AddTablesRequest {
  table_ids: number[];
}

/**
 * Paginated federations response
 */
export interface FederationsListResponse {
  items: Federation[];
  total: number;
  page: number;
  size: number;
  pages?: number;
}

/**
 * Pagination parameters for listing federations
 */
export interface FederationsPaginationParams {
  page?: number;
  size?: number;
}
