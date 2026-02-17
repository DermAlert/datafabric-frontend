/**
 * Silver API Service
 * Functions for managing Silver layer persistent and virtualized configs
 */

import { apiClient } from '../client';
import type {
  SilverPersistentConfig,
  CreateSilverPersistentConfigRequest,
  UpdateSilverPersistentConfigRequest,
  SilverExecuteResponse,
  SilverVersionHistoryResponse,
  SilverQueryDataParams,
  SilverQueryDataResponse,
  SilverVirtualizedConfig,
  CreateSilverVirtualizedConfigRequest,
  UpdateSilverVirtualizedConfigRequest,
  SilverVirtualizedQueryParams,
  SilverVirtualizedQueryResponse,
  NormalizationRule,
  CreateNormalizationRuleRequest,
  UpdateNormalizationRuleRequest,
  TestNormalizationRuleRequest,
  TestNormalizationRuleResponse,
  TransformationType,
  FilterOperator,
  LLMExtractionTestRequest,
  LLMExtractionTestResponse,
  DataQueryRequest,
  DataQueryResponse,
} from '@/types/api/silver';

const PERSISTENT_BASE_PATH = '/api/silver/persistent/configs';
const VIRTUALIZED_BASE_PATH = '/api/silver/virtualized/configs';
const NORMALIZATION_RULES_PATH = '/api/silver/normalization-rules';

// ===========================================
// Persistent Config Endpoints
// ===========================================

/**
 * List all persistent configs
 */
export async function listSilverPersistentConfigs(): Promise<SilverPersistentConfig[]> {
  return apiClient.get<SilverPersistentConfig[]>(PERSISTENT_BASE_PATH);
}

/**
 * Get a persistent config by ID
 */
export async function getSilverPersistentConfig(id: number): Promise<SilverPersistentConfig> {
  return apiClient.get<SilverPersistentConfig>(`${PERSISTENT_BASE_PATH}/${id}`);
}

/**
 * Create a new persistent config
 */
export async function createSilverPersistentConfig(
  data: CreateSilverPersistentConfigRequest
): Promise<SilverPersistentConfig> {
  return apiClient.post<SilverPersistentConfig>(PERSISTENT_BASE_PATH, data);
}

/**
 * Update a persistent config
 */
export async function updateSilverPersistentConfig(
  id: number,
  data: UpdateSilverPersistentConfigRequest
): Promise<SilverPersistentConfig> {
  return apiClient.put<SilverPersistentConfig>(`${PERSISTENT_BASE_PATH}/${id}`, data);
}

/**
 * Delete a persistent config
 */
export async function deleteSilverPersistentConfig(id: number): Promise<void> {
  return apiClient.delete(`${PERSISTENT_BASE_PATH}/${id}`);
}

/**
 * Execute transformation for a persistent config
 */
export async function executeSilverPersistentConfig(id: number): Promise<SilverExecuteResponse> {
  return apiClient.post<SilverExecuteResponse>(`${PERSISTENT_BASE_PATH}/${id}/execute`);
}

/**
 * Get version history for a persistent config
 */
export async function getSilverPersistentConfigVersions(
  id: number,
  limit?: number
): Promise<SilverVersionHistoryResponse> {
  const url = limit
    ? `${PERSISTENT_BASE_PATH}/${id}/versions?limit=${limit}`
    : `${PERSISTENT_BASE_PATH}/${id}/versions`;
  
  return apiClient.get<SilverVersionHistoryResponse>(url);
}

/**
 * Query data from a persistent config with time travel support
 */
export async function querySilverPersistentConfigData(
  id: number,
  params?: SilverQueryDataParams
): Promise<SilverQueryDataResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());
  if (params?.version !== undefined) queryParams.set('version', params.version.toString());
  if (params?.as_of_timestamp) queryParams.set('as_of_timestamp', params.as_of_timestamp);
  if (params?.path_index !== undefined) queryParams.set('path_index', params.path_index.toString());
  
  const queryString = queryParams.toString();
  const url = queryString
    ? `${PERSISTENT_BASE_PATH}/${id}/data?${queryString}`
    : `${PERSISTENT_BASE_PATH}/${id}/data`;
  
  return apiClient.get<SilverQueryDataResponse>(url);
}

// ===========================================
// Virtualized Config Endpoints
// ===========================================

/**
 * List all virtualized configs
 */
export async function listSilverVirtualizedConfigs(): Promise<SilverVirtualizedConfig[]> {
  return apiClient.get<SilverVirtualizedConfig[]>(VIRTUALIZED_BASE_PATH);
}

/**
 * Get a virtualized config by ID
 */
export async function getSilverVirtualizedConfig(id: number): Promise<SilverVirtualizedConfig> {
  return apiClient.get<SilverVirtualizedConfig>(`${VIRTUALIZED_BASE_PATH}/${id}`);
}

/**
 * Create a new virtualized config
 */
export async function createSilverVirtualizedConfig(
  data: CreateSilverVirtualizedConfigRequest
): Promise<SilverVirtualizedConfig> {
  return apiClient.post<SilverVirtualizedConfig>(VIRTUALIZED_BASE_PATH, data);
}

/**
 * Update a virtualized config
 */
export async function updateSilverVirtualizedConfig(
  id: number,
  data: UpdateSilverVirtualizedConfigRequest
): Promise<SilverVirtualizedConfig> {
  return apiClient.put<SilverVirtualizedConfig>(`${VIRTUALIZED_BASE_PATH}/${id}`, data);
}

/**
 * Delete a virtualized config
 */
export async function deleteSilverVirtualizedConfig(id: number): Promise<void> {
  return apiClient.delete(`${VIRTUALIZED_BASE_PATH}/${id}`);
}

/**
 * Execute query for a virtualized config
 */
export async function querySilverVirtualizedConfig(
  id: number,
  params?: SilverVirtualizedQueryParams
): Promise<SilverVirtualizedQueryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());
  
  const queryString = queryParams.toString();
  const url = queryString
    ? `${VIRTUALIZED_BASE_PATH}/${id}/query?${queryString}`
    : `${VIRTUALIZED_BASE_PATH}/${id}/query`;
  
  return apiClient.post<SilverVirtualizedQueryResponse>(url);
}

// ===========================================
// Normalization Rules Endpoints
// ===========================================

/**
 * List all normalization rules
 */
export async function listNormalizationRules(): Promise<NormalizationRule[]> {
  return apiClient.get<NormalizationRule[]>(NORMALIZATION_RULES_PATH);
}

/**
 * Get a normalization rule by ID
 */
export async function getNormalizationRule(id: number): Promise<NormalizationRule> {
  return apiClient.get<NormalizationRule>(`${NORMALIZATION_RULES_PATH}/${id}`);
}

/**
 * Create a new normalization rule
 */
export async function createNormalizationRule(
  data: CreateNormalizationRuleRequest
): Promise<NormalizationRule> {
  return apiClient.post<NormalizationRule>(NORMALIZATION_RULES_PATH, data);
}

/**
 * Update a normalization rule
 */
export async function updateNormalizationRule(
  id: number,
  data: UpdateNormalizationRuleRequest
): Promise<NormalizationRule> {
  return apiClient.put<NormalizationRule>(`${NORMALIZATION_RULES_PATH}/${id}`, data);
}

/**
 * Delete a normalization rule
 */
export async function deleteNormalizationRule(id: number): Promise<void> {
  return apiClient.delete(`${NORMALIZATION_RULES_PATH}/${id}`);
}

/**
 * Test a normalization rule
 */
export async function testNormalizationRule(
  data: TestNormalizationRuleRequest
): Promise<TestNormalizationRuleResponse> {
  return apiClient.post<TestNormalizationRuleResponse>(
    `${NORMALIZATION_RULES_PATH}/test`,
    data
  );
}

/**
 * Get normalization rule templates
 */
export async function getNormalizationRuleTemplates(): Promise<string[]> {
  return apiClient.get<string[]>(`${NORMALIZATION_RULES_PATH}/templates`);
}

// ===========================================
// Server-Side Query with Filters
// ===========================================

/**
 * Query data from a persistent config with server-side filters, sorting and pagination
 */
export async function queryPersistentDataWithFilters(
  id: number,
  data: DataQueryRequest
): Promise<DataQueryResponse> {
  return apiClient.post<DataQueryResponse>(
    `${PERSISTENT_BASE_PATH}/${id}/data/query`,
    data
  );
}

// ===========================================
// LLM Extraction Endpoints
// ===========================================

const LLM_EXTRACTION_PATH = '/api/silver/llm-extraction';

/**
 * Test an LLM extraction prompt against sample text
 */
export async function testLLMExtraction(
  data: LLMExtractionTestRequest
): Promise<LLMExtractionTestResponse> {
  return apiClient.post<LLMExtractionTestResponse>(
    `${LLM_EXTRACTION_PATH}/test`,
    data
  );
}

// ===========================================
// Auxiliary Endpoints
// ===========================================

/**
 * Get available transformation types
 */
export async function getTransformationTypes(): Promise<TransformationType[]> {
  return apiClient.get<TransformationType[]>('/api/silver/transformation-types');
}

/**
 * Get available filter operators
 */
export async function getFilterOperators(): Promise<FilterOperator[]> {
  return apiClient.get<FilterOperator[]>('/api/silver/filter-operators');
}

// ===========================================
// Export as Service Object
// ===========================================

export const silverService = {
  // Persistent Configs
  persistent: {
    list: listSilverPersistentConfigs,
    get: getSilverPersistentConfig,
    create: createSilverPersistentConfig,
    update: updateSilverPersistentConfig,
    delete: deleteSilverPersistentConfig,
    execute: executeSilverPersistentConfig,
    getVersions: getSilverPersistentConfigVersions,
    queryData: querySilverPersistentConfigData,
    queryWithFilters: queryPersistentDataWithFilters,
  },
  // Virtualized Configs
  virtualized: {
    list: listSilverVirtualizedConfigs,
    get: getSilverVirtualizedConfig,
    create: createSilverVirtualizedConfig,
    update: updateSilverVirtualizedConfig,
    delete: deleteSilverVirtualizedConfig,
    query: querySilverVirtualizedConfig,
  },
  // Normalization Rules
  normalizationRules: {
    list: listNormalizationRules,
    get: getNormalizationRule,
    create: createNormalizationRule,
    update: updateNormalizationRule,
    delete: deleteNormalizationRule,
    test: testNormalizationRule,
    getTemplates: getNormalizationRuleTemplates,
  },
  // LLM Extraction
  llmExtraction: {
    test: testLLMExtraction,
  },
  // Auxiliary
  getTransformationTypes,
  getFilterOperators,
};
