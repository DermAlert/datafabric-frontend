/**
 * Connection API Service
 * Endpoints for managing connection types and data connections
 */

import { apiClient } from '../client';
import type {
  ConnectionType,
  ConnectionSearchRequest,
  ConnectionSearchResponse,
  PaginationParams,
  PaginatedResponse,
  CreateDataConnectionRequest,
  UpdateDataConnectionRequest,
  DataConnection,
  TestConnectionRequest,
  TestConnectionResponse,
} from '@/types/api/connection';

const BASE_PATH = '/api/connection';
const DATA_CONNECTIONS_PATH = '/api/data-connections';

/**
 * Search connection types with pagination
 */
export async function searchConnectionTypes(
  pagination?: PaginationParams
): Promise<ConnectionSearchResponse> {
  const body: ConnectionSearchRequest = {
    pagination: {
      limit: pagination?.limit ?? 10,
      skip: pagination?.skip ?? 0,
      query_total: pagination?.query_total ?? false,
    },
  };

  return apiClient.post<ConnectionSearchResponse>(`${BASE_PATH}/search`, body);
}

/**
 * Get a specific connection type by ID
 */
export async function getConnectionType(id: number): Promise<ConnectionType> {
  return apiClient.get<ConnectionType>(`${BASE_PATH}/${id}`);
}

/**
 * Get all connection types (fetches all with high limit)
 */
export async function getAllConnectionTypes(): Promise<ConnectionType[]> {
  const response = await searchConnectionTypes({ limit: 100, skip: 0 });
  return response.items;
}

// =============================================
// Data Connection Endpoints
// =============================================

/**
 * Test a connection before saving
 */
export async function testConnection(
  connectionTypeId: number,
  connectionParams: Record<string, unknown>
): Promise<TestConnectionResponse> {
  const body: TestConnectionRequest = {
    connection_type_id: connectionTypeId,
    connection_params: connectionParams,
  };

  return apiClient.post<TestConnectionResponse>(`${DATA_CONNECTIONS_PATH}/test`, body);
}

/**
 * Create a new data connection
 */
export async function createDataConnection(
  data: CreateDataConnectionRequest
): Promise<DataConnection> {
  return apiClient.post<DataConnection>(DATA_CONNECTIONS_PATH, data);
}

/**
 * Search data connections with pagination
 */
export async function searchDataConnections(
  pagination?: PaginationParams
): Promise<PaginatedResponse<DataConnection>> {
  const body: ConnectionSearchRequest = {
    pagination: {
      limit: pagination?.limit ?? 50,
      skip: pagination?.skip ?? 0,
      query_total: pagination?.query_total ?? true,
    },
  };

  return apiClient.post<PaginatedResponse<DataConnection>>(`${DATA_CONNECTIONS_PATH}/search`, body);
}

/**
 * Get all data connections (convenience method)
 */
export async function getDataConnections(): Promise<DataConnection[]> {
  const response = await searchDataConnections({ limit: 100, skip: 0 });
  return response.items;
}

/**
 * Get a specific data connection by ID
 */
export async function getDataConnection(id: number): Promise<DataConnection> {
  return apiClient.get<DataConnection>(`${DATA_CONNECTIONS_PATH}/${id}`);
}

/**
 * Delete a data connection
 */
export async function deleteDataConnection(id: number): Promise<void> {
  return apiClient.delete(`${DATA_CONNECTIONS_PATH}/${id}`);
}

/**
 * Update an existing data connection
 */
export async function updateDataConnection(
  id: number,
  data: UpdateDataConnectionRequest
): Promise<DataConnection> {
  return apiClient.put<DataConnection>(`${DATA_CONNECTIONS_PATH}/${id}`, data);
}

/**
 * Test an existing data connection by ID
 */
export async function testDataConnection(id: number): Promise<TestConnectionResponse> {
  return apiClient.post<TestConnectionResponse>(`${DATA_CONNECTIONS_PATH}/${id}/test`, {});
}

/**
 * Trigger metadata sync for a data connection
 */
export async function syncDataConnection(id: number): Promise<DataConnection> {
  return apiClient.post<DataConnection>(`${DATA_CONNECTIONS_PATH}/${id}/sync`, {});
}

// Export as object for namespaced usage
export const connectionService = {
  // Connection Types
  search: searchConnectionTypes,
  getById: getConnectionType,
  getAll: getAllConnectionTypes,
  // Data Connections
  test: testConnection,
  create: createDataConnection,
  update: updateDataConnection,
  list: getDataConnections,
  searchConnections: searchDataConnections,
  get: getDataConnection,
  delete: deleteDataConnection,
  testById: testDataConnection,
  sync: syncDataConnection,
};
