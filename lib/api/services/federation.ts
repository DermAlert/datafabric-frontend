/**
 * Federation API Service
 * Endpoints for managing federations across connections
 */

import { apiClient } from '../client';
import type {
  Federation,
  FederationsListResponse,
  FederationsPaginationParams,
  CreateFederationRequest,
  UpdateFederationRequest,
  AddConnectionsRequest,
  AddTablesRequest,
} from '@/types/api/federation';

const BASE_PATH = '/api/federations';

/**
 * List federations with pagination
 */
export async function listFederations(
  params?: FederationsPaginationParams
): Promise<FederationsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.append('page', params.page.toString());
  if (params?.size) searchParams.append('size', params.size.toString());
  
  const queryString = searchParams.toString();
  const url = queryString ? `${BASE_PATH}?${queryString}` : BASE_PATH;
  
  return apiClient.get<FederationsListResponse>(url);
}

/**
 * Get all federations (convenience method that fetches all pages)
 */
export async function getAllFederations(): Promise<Federation[]> {
  const response = await listFederations({ page: 1, size: 100 });
  return response.items;
}

/**
 * Create a new federation
 */
export async function createFederation(
  data: CreateFederationRequest
): Promise<Federation> {
  return apiClient.post<Federation>(BASE_PATH, data);
}

/**
 * Get a federation by ID
 */
export async function getFederation(id: number): Promise<Federation> {
  return apiClient.get<Federation>(`${BASE_PATH}/${id}`);
}

/**
 * Update an existing federation
 */
export async function updateFederation(
  id: number,
  data: UpdateFederationRequest
): Promise<Federation> {
  return apiClient.put<Federation>(`${BASE_PATH}/${id}`, data);
}

/**
 * Delete a federation
 */
export async function deleteFederation(id: number): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Add connections to a federation
 */
export async function addConnections(
  federationId: number,
  data: AddConnectionsRequest
): Promise<Federation> {
  return apiClient.post<Federation>(`${BASE_PATH}/${federationId}/connections`, data);
}

/**
 * Remove a connection from a federation
 */
export async function removeConnection(
  federationId: number,
  connectionId: number
): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${federationId}/connections/${connectionId}`);
}

/**
 * Add specific tables to a federation
 * By default, all tables from connections are used.
 * Use this to restrict to specific tables only.
 */
export async function addTables(
  federationId: number,
  data: AddTablesRequest
): Promise<Federation> {
  return apiClient.post<Federation>(`${BASE_PATH}/${federationId}/tables`, data);
}

/**
 * Remove a table from a federation
 */
export async function removeTable(
  federationId: number,
  tableId: number
): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${federationId}/tables/${tableId}`);
}

// Export as object for namespaced usage
export const federationService = {
  list: listFederations,
  getAll: getAllFederations,
  create: createFederation,
  get: getFederation,
  update: updateFederation,
  delete: deleteFederation,
  addConnections,
  removeConnection,
  addTables,
  removeTable,
};
