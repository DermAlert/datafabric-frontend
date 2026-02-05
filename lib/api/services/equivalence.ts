import { apiClient } from '../client';
import type { PaginatedResponse } from '@/types/api/connection';
import type * as ET from '@/types/api/equivalence';

const BASE_PATH = '/api/equivalence';

export const equivalenceService = {
  // --- Semantic Domains ---
  listSemanticDomains: async (): Promise<ET.SemanticDomain[]> => {
    return apiClient.get(`${BASE_PATH}/semantic-domains`);
  },
  
  searchSemanticDomains: async (params: ET.SearchSemanticDomainRequest): Promise<PaginatedResponse<ET.SemanticDomain>> => {
    return apiClient.post(`${BASE_PATH}/semantic-domains/search`, params);
  },

  createSemanticDomain: async (data: ET.SemanticDomainCreate): Promise<ET.SemanticDomain> => {
    return apiClient.post(`${BASE_PATH}/semantic-domains`, data);
  },

  getSemanticDomain: async (id: number): Promise<ET.SemanticDomain> => {
    return apiClient.get(`${BASE_PATH}/semantic-domains/${id}`);
  },

  updateSemanticDomain: async (id: number, data: ET.SemanticDomainUpdate): Promise<ET.SemanticDomain> => {
    return apiClient.put(`${BASE_PATH}/semantic-domains/${id}`, data);
  },

  deleteSemanticDomain: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/semantic-domains/${id}`);
  },

  // --- Data Dictionary ---
  listDataDictionary: async (filters?: { semantic_domain_id?: number; data_type?: string }): Promise<ET.DataDictionary[]> => {
    // Construct query string manually or use a helper if available
    const params = new URLSearchParams();
    if (filters?.semantic_domain_id) params.append('semantic_domain_id', filters.semantic_domain_id.toString());
    if (filters?.data_type) params.append('data_type', filters.data_type);
    
    return apiClient.get(`${BASE_PATH}/data-dictionary?${params.toString()}`);
  },

  searchDataDictionary: async (params: ET.SearchDataDictionaryRequest): Promise<PaginatedResponse<ET.DataDictionary>> => {
    return apiClient.post(`${BASE_PATH}/data-dictionary/search`, params);
  },

  createDataDictionaryTerm: async (data: ET.DataDictionaryCreate): Promise<ET.DataDictionary> => {
    return apiClient.post(`${BASE_PATH}/data-dictionary`, data);
  },

  getDataDictionaryTerm: async (id: number): Promise<ET.DataDictionary> => {
    return apiClient.get(`${BASE_PATH}/data-dictionary/${id}`);
  },

  updateDataDictionaryTerm: async (id: number, data: ET.DataDictionaryUpdate): Promise<ET.DataDictionary> => {
    return apiClient.put(`${BASE_PATH}/data-dictionary/${id}`, data);
  },

  deleteDataDictionaryTerm: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/data-dictionary/${id}`);
  },

  // --- Column Groups ---
  listColumnGroups: async (filters?: { semantic_domain_id?: number; data_dictionary_term_id?: number }): Promise<ET.ColumnGroup[]> => {
    const params = new URLSearchParams();
    if (filters?.semantic_domain_id) params.append('semantic_domain_id', filters.semantic_domain_id.toString());
    if (filters?.data_dictionary_term_id) params.append('data_dictionary_term_id', filters.data_dictionary_term_id.toString());

    return apiClient.get(`${BASE_PATH}/column-groups?${params.toString()}`);
  },

  searchColumnGroups: async (params: ET.SearchColumnGroupRequest): Promise<PaginatedResponse<ET.ColumnGroup>> => {
    return apiClient.post(`${BASE_PATH}/column-groups/search`, params);
  },

  createColumnGroup: async (data: ET.ColumnGroupCreate): Promise<ET.ColumnGroup> => {
    return apiClient.post(`${BASE_PATH}/column-groups`, data);
  },

  getColumnGroup: async (id: number): Promise<ET.ColumnGroup & { column_mappings: ET.ColumnMapping[], value_mappings: ET.ValueMapping[] }> => {
    return apiClient.get(`${BASE_PATH}/column-groups/${id}`);
  },

  updateColumnGroup: async (id: number, data: ET.ColumnGroupUpdate): Promise<ET.ColumnGroup> => {
    return apiClient.put(`${BASE_PATH}/column-groups/${id}`, data);
  },

  deleteColumnGroup: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/column-groups/${id}`);
  },

  // --- Column Mappings ---
  listColumnMappings: async (groupId: number): Promise<ET.ColumnMapping[]> => {
    return apiClient.get(`${BASE_PATH}/column-groups/${groupId}/column-mappings`);
  },

  createColumnMapping: async (data: ET.ColumnMappingCreate): Promise<ET.ColumnMapping> => {
    return apiClient.post(`${BASE_PATH}/column-mappings`, data);
  },

  bulkCreateColumnMappings: async (data: ET.BulkColumnMappingCreate): Promise<ET.ColumnMapping[]> => {
    return apiClient.post(`${BASE_PATH}/column-mappings/bulk`, data);
  },

  updateColumnMapping: async (id: number, data: ET.ColumnMappingUpdate): Promise<ET.ColumnMapping> => {
    return apiClient.put(`${BASE_PATH}/column-mappings/${id}`, data);
  },

  deleteColumnMapping: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/column-mappings/${id}`);
  },

  // --- Value Mappings ---
  listValueMappings: async (groupId: number, sourceColumnId?: number): Promise<ET.ValueMapping[]> => {
    const params = new URLSearchParams();
    if (sourceColumnId) params.append('source_column_id', sourceColumnId.toString());
    return apiClient.get(`${BASE_PATH}/column-groups/${groupId}/value-mappings?${params.toString()}`);
  },

  createValueMapping: async (data: ET.ValueMappingCreate): Promise<ET.ValueMapping> => {
    return apiClient.post(`${BASE_PATH}/value-mappings`, data);
  },

  bulkCreateValueMappings: async (data: ET.BulkValueMappingCreate): Promise<ET.ValueMapping[]> => {
    return apiClient.post(`${BASE_PATH}/value-mappings/bulk`, data);
  },

  updateValueMapping: async (id: number, data: ET.ValueMappingUpdate): Promise<ET.ValueMapping> => {
    return apiClient.put(`${BASE_PATH}/value-mappings/${id}`, data);
  },

  deleteValueMapping: async (id: number): Promise<void> => {
    return apiClient.delete(`${BASE_PATH}/value-mappings/${id}`);
  },

  // --- Search & Utils ---
  searchUnmappedColumns: async (params: ET.UnmappedColumnSearchRequest): Promise<{ columns: ET.AvailableColumn[] }> => {
    return apiClient.post(`${BASE_PATH}/search/columns`, params);
  },

  getAvailableColumns: async (filters?: { connection_id?: number; schema_id?: number; table_id?: number; exclude_mapped?: boolean }): Promise<{ columns: ET.AvailableColumn[] }> => {
    const params = new URLSearchParams();
    if (filters?.connection_id) params.append('connection_id', filters.connection_id.toString());
    if (filters?.schema_id) params.append('schema_id', filters.schema_id.toString());
    if (filters?.table_id) params.append('table_id', filters.table_id.toString());
    if (filters?.exclude_mapped !== undefined) params.append('exclude_mapped', filters.exclude_mapped.toString());
    
    return apiClient.get(`${BASE_PATH}/available-columns?${params.toString()}`);
  },

  getMappingCoverageStats: async (connectionId?: number): Promise<ET.MappingCoverageStats> => {
    const params = new URLSearchParams();
    if (connectionId) params.append('connection_id', connectionId.toString());
    return apiClient.get(`${BASE_PATH}/statistics/mapping-coverage?${params.toString()}`);
  }
};