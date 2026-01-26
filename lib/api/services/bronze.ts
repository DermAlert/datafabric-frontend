/**
 * Bronze API Service
 * Functions for managing Bronze layer persistent and virtualized configs
 */

import { apiClient } from '../client';
import type {
  PersistentConfig,
  CreatePersistentConfigRequest,
  UpdatePersistentConfigRequest,
  ExecuteConfigResponse,
  PreviewConfigResponse,
  QueryDataParams,
  QueryDataResponse,
  VersionHistoryResponse,
  ExecutionHistoryResponse,
  VirtualizedConfig,
  CreateVirtualizedConfigRequest,
  UpdateVirtualizedConfigRequest,
  QueryVirtualizedRequest,
  QueryVirtualizedResponse,
} from '@/types/api/bronze';

const PERSISTENT_BASE_PATH = '/api/bronze/configs/persistent';
const VIRTUALIZED_BASE_PATH = '/api/bronze/configs/virtualized';

// ===========================================
// Persistent Config Endpoints
// ===========================================

/**
 * List all persistent configs
 */
export async function listPersistentConfigs(): Promise<PersistentConfig[]> {
  return apiClient.get<PersistentConfig[]>(PERSISTENT_BASE_PATH);
}

/**
 * Get a persistent config by ID
 */
export async function getPersistentConfig(id: number): Promise<PersistentConfig> {
  return apiClient.get<PersistentConfig>(`${PERSISTENT_BASE_PATH}/${id}`);
}

/**
 * Create a new persistent config
 */
export async function createPersistentConfig(
  data: CreatePersistentConfigRequest
): Promise<PersistentConfig> {
  return apiClient.post<PersistentConfig>(PERSISTENT_BASE_PATH, data);
}

/**
 * Update a persistent config
 */
export async function updatePersistentConfig(
  id: number,
  data: UpdatePersistentConfigRequest
): Promise<PersistentConfig> {
  return apiClient.put<PersistentConfig>(`${PERSISTENT_BASE_PATH}/${id}`, data);
}

/**
 * Delete a persistent config
 */
export async function deletePersistentConfig(id: number): Promise<void> {
  return apiClient.delete(`${PERSISTENT_BASE_PATH}/${id}`);
}

/**
 * Execute ingestion for a persistent config
 */
export async function executePersistentConfig(id: number): Promise<ExecuteConfigResponse> {
  return apiClient.post<ExecuteConfigResponse>(`${PERSISTENT_BASE_PATH}/${id}/execute`);
}

/**
 * Preview data for a persistent config without saving
 */
export async function previewPersistentConfig(id: number): Promise<PreviewConfigResponse> {
  return apiClient.post<PreviewConfigResponse>(`${PERSISTENT_BASE_PATH}/${id}/preview`);
}

/**
 * Query data from a persistent config
 */
export async function queryPersistentConfigData(
  id: number,
  params?: QueryDataParams
): Promise<QueryDataResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());
  if (params?.version !== undefined) queryParams.set('version', params.version.toString());
  if (params?.path_index !== undefined) queryParams.set('path_index', params.path_index.toString());
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${PERSISTENT_BASE_PATH}/${id}/data?${queryString}`
    : `${PERSISTENT_BASE_PATH}/${id}/data`;
  
  return apiClient.get<QueryDataResponse>(url);
}

/**
 * Get version history for a persistent config
 */
export async function getPersistentConfigVersions(
  id: number,
  limit?: number
): Promise<VersionHistoryResponse> {
  const url = limit 
    ? `${PERSISTENT_BASE_PATH}/${id}/versions?limit=${limit}`
    : `${PERSISTENT_BASE_PATH}/${id}/versions`;
  
  return apiClient.get<VersionHistoryResponse>(url);
}

/**
 * Get execution history for a persistent config
 */
export async function getPersistentConfigExecutions(
  id: number,
  limit?: number,
  offset?: number
): Promise<ExecutionHistoryResponse> {
  const queryParams = new URLSearchParams();
  if (limit !== undefined) queryParams.set('limit', limit.toString());
  if (offset !== undefined) queryParams.set('offset', offset.toString());
  
  const queryString = queryParams.toString();
  const url = queryString 
    ? `${PERSISTENT_BASE_PATH}/${id}/executions?${queryString}`
    : `${PERSISTENT_BASE_PATH}/${id}/executions`;
  
  return apiClient.get<ExecutionHistoryResponse>(url);
}

// ===========================================
// Virtualized Config Endpoints
// ===========================================

/**
 * List all virtualized configs
 */
export async function listVirtualizedConfigs(): Promise<VirtualizedConfig[]> {
  return apiClient.get<VirtualizedConfig[]>(VIRTUALIZED_BASE_PATH);
}

/**
 * Get a virtualized config by ID
 */
export async function getVirtualizedConfig(id: number): Promise<VirtualizedConfig> {
  return apiClient.get<VirtualizedConfig>(`${VIRTUALIZED_BASE_PATH}/${id}`);
}

/**
 * Create a new virtualized config
 */
export async function createVirtualizedConfig(
  data: CreateVirtualizedConfigRequest
): Promise<VirtualizedConfig> {
  return apiClient.post<VirtualizedConfig>(VIRTUALIZED_BASE_PATH, data);
}

/**
 * Update a virtualized config
 */
export async function updateVirtualizedConfig(
  id: number,
  data: UpdateVirtualizedConfigRequest
): Promise<VirtualizedConfig> {
  return apiClient.put<VirtualizedConfig>(`${VIRTUALIZED_BASE_PATH}/${id}`, data);
}

/**
 * Delete a virtualized config
 */
export async function deleteVirtualizedConfig(id: number): Promise<void> {
  return apiClient.delete(`${VIRTUALIZED_BASE_PATH}/${id}`);
}

/**
 * Execute query for a virtualized config
 */
export async function queryVirtualizedConfig(
  id: number,
  params?: QueryVirtualizedRequest
): Promise<QueryVirtualizedResponse> {
  return apiClient.post<QueryVirtualizedResponse>(
    `${VIRTUALIZED_BASE_PATH}/${id}/query`,
    params || {}
  );
}

// ===========================================
// Export as Service Object
// ===========================================

export const bronzeService = {
  // Persistent Configs
  persistent: {
    list: listPersistentConfigs,
    get: getPersistentConfig,
    create: createPersistentConfig,
    update: updatePersistentConfig,
    delete: deletePersistentConfig,
    execute: executePersistentConfig,
    preview: previewPersistentConfig,
    queryData: queryPersistentConfigData,
    getVersions: getPersistentConfigVersions,
    getExecutions: getPersistentConfigExecutions,
  },
  // Virtualized Configs
  virtualized: {
    list: listVirtualizedConfigs,
    get: getVirtualizedConfig,
    create: createVirtualizedConfig,
    update: updateVirtualizedConfig,
    delete: deleteVirtualizedConfig,
    query: queryVirtualizedConfig,
  },
};
