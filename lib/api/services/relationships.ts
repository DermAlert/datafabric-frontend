import { apiClient } from '../client';
import type {
  TableRelationship,
  RelationshipSuggestion,
  CreateRelationshipRequest,
  UpdateRelationshipRequest,
  DiscoverRelationshipsRequest,
  DiscoverRelationshipsResponse,
  SearchRelationshipsRequest,
  SearchResult,
} from '@/types/api/relationships';

const BASE_PATH = '/api/relationships';

/**
 * Discover relationships automatically
 */
export async function discover(data: DiscoverRelationshipsRequest): Promise<DiscoverRelationshipsResponse> {
  return apiClient.post<DiscoverRelationshipsResponse>(`${BASE_PATH}/discover`, data);
}

/**
 * Create a new relationship manually
 */
export async function create(data: CreateRelationshipRequest): Promise<TableRelationship> {
  return apiClient.post<TableRelationship>(`${BASE_PATH}/`, data);
}

/**
 * Get a relationship by ID
 */
export async function get(id: number): Promise<TableRelationship> {
  return apiClient.get<TableRelationship>(`${BASE_PATH}/${id}`);
}

/**
 * Update a relationship
 */
export async function update(id: number, data: UpdateRelationshipRequest): Promise<TableRelationship> {
  return apiClient.put<TableRelationship>(`${BASE_PATH}/${id}`, data);
}

/**
 * Delete a relationship
 */
export async function remove(id: number): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${id}`);
}

/**
 * Search relationships
 */
export async function search(data: SearchRelationshipsRequest): Promise<TableRelationship[]> {
  const result = await apiClient.post<SearchResult<TableRelationship>>(`${BASE_PATH}/search`, data);
  return result.items || [];
}

/**
 * List suggestions with optional status filtering
 */
export async function listSuggestions(
  connectionId?: number,
  tableId?: number,
  minConfidence?: number,
  status?: 'pending' | 'accepted' | 'rejected'
): Promise<RelationshipSuggestion[]> {
  const params = new URLSearchParams();
  if (connectionId) params.append('connection_id', connectionId.toString());
  if (tableId) params.append('table_id', tableId.toString());
  if (minConfidence) params.append('min_confidence', minConfidence.toString());
  if (status) params.append('status', status);
  // Request all pages if needed, but for now we rely on default size (usually 20 or 50)
  params.append('size', '100'); 
  
  // Use the new generic endpoint if status is provided, otherwise fallback to pending for backward compatibility if needed
  // But based on user info, /api/relationships/suggestions handles filtering
  const result = await apiClient.get<SearchResult<RelationshipSuggestion>>(`${BASE_PATH}/suggestions?${params.toString()}`);
  return result.items || [];
}

/**
 * List pending suggestions (legacy wrapper around listSuggestions)
 */
export async function listPendingSuggestions(
  connectionId?: number,
  tableId?: number,
  minConfidence?: number
): Promise<RelationshipSuggestion[]> {
  return listSuggestions(connectionId, tableId, minConfidence, 'pending');
}

/**
 * Reset a suggestion (rejected/accepted -> pending)
 */
export async function resetSuggestion(suggestionId: number): Promise<RelationshipSuggestion> {
  return apiClient.post<RelationshipSuggestion>(`${BASE_PATH}/suggestions/${suggestionId}/reset`);
}

/**
 * Accept a suggestion
 */
export async function acceptSuggestion(
  suggestionId: number,
  options?: {
    cardinality?: string;
    default_join_type?: string;
    name?: string;
    description?: string;
  }
): Promise<TableRelationship> {
  const params = new URLSearchParams();
  if (options?.cardinality) params.append('cardinality', options.cardinality);
  if (options?.default_join_type) params.append('default_join_type', options.default_join_type);
  if (options?.name) params.append('name', options.name);
  if (options?.description) params.append('description', options.description);

  return apiClient.post<TableRelationship>(`${BASE_PATH}/suggestions/${suggestionId}/accept?${params.toString()}`);
}

/**
 * Reject a suggestion
 */
export async function rejectSuggestion(suggestionId: number): Promise<void> {
  return apiClient.post(`${BASE_PATH}/suggestions/${suggestionId}/reject`);
}

/**
 * Get all relationships for a specific connection
 */
export async function listForConnection(
  connectionId: number, 
  scope?: 'INTRA_CONNECTION' | 'INTER_CONNECTION',
  includeInactive: boolean = false
): Promise<TableRelationship[]> {
  const params = new URLSearchParams();
  if (scope) params.append('scope', scope);
  params.append('include_inactive', includeInactive.toString());
  
  return apiClient.get<TableRelationship[]>(`${BASE_PATH}/connection/${connectionId}?${params.toString()}`);
}

/**
 * Get all relationships for a specific table
 */
export async function listForTable(
  tableId: number,
  includeInactive: boolean = false
): Promise<TableRelationship[]> {
  const params = new URLSearchParams();
  params.append('include_inactive', includeInactive.toString());
  
  return apiClient.get<TableRelationship[]>(`${BASE_PATH}/table/${tableId}?${params.toString()}`);
}

export const relationshipsService = {
  discover,
  create,
  get,
  update,
  remove,
  search,
  listSuggestions,
  listPendingSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  resetSuggestion,
  listForConnection,
  listForTable,
};
