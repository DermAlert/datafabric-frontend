/**
 * Metadata API Service
 * Functions for fetching catalog, schema, table, and column metadata
 */

import { apiClient } from '../client';
import type {
  MetadataCatalog,
  MetadataSchema,
  MetadataTable,
  MetadataTableDetails,
  MetadataColumn,
  DistinctValuesResponse,
  TableSampleResponse,
} from '@/types/api/metadata';

const BASE_PATH = '/api/metadata';

/**
 * List all catalogs for a connection
 */
export async function listCatalogs(connectionId: number): Promise<MetadataCatalog[]> {
  return apiClient.get<MetadataCatalog[]>(`${BASE_PATH}/connections/${connectionId}/catalogs`);
}

/**
 * List all schemas for a connection
 */
export async function listSchemas(connectionId: number): Promise<MetadataSchema[]> {
  const schemas = await apiClient.get<MetadataSchema[]>(`${BASE_PATH}/connections/${connectionId}/schemas`);

  // System schemas should never be shown in user-facing selectors.
  return schemas.filter((schema) => schema?.is_system_schema !== true);
}

/**
 * List all tables for a schema
 */
export async function listTables(schemaId: number): Promise<MetadataTable[]> {
  return apiClient.get<MetadataTable[]>(`${BASE_PATH}/schemas/${schemaId}/tables`);
}

/**
 * Get table details including columns
 */
export async function getTableDetails(tableId: number): Promise<MetadataTableDetails> {
  return apiClient.get<MetadataTableDetails>(`${BASE_PATH}/tables/${tableId}`);
}

/**
 * List all columns for a table
 */
export async function listColumns(tableId: number): Promise<MetadataColumn[]> {
  return apiClient.get<MetadataColumn[]>(`${BASE_PATH}/tables/${tableId}/columns`);
}

/**
 * Get distinct values for a column
 */
export async function getDistinctValues(
  columnId: number,
  options: number | {
    limit?: number;
    offset?: number;
    orderBy?: 'value_asc' | 'frequency_desc' | 'frequency_asc';
  } = 10
): Promise<DistinctValuesResponse> {
  const params = new URLSearchParams();
  if (typeof options === 'number') {
    params.set('limit', options.toString());
  } else {
    if (options.limit !== undefined) params.set('limit', options.limit.toString());
    if (options.offset !== undefined) params.set('offset', options.offset.toString());
    if (options.orderBy) params.set('order_by', options.orderBy);
  }

  return apiClient.get<DistinctValuesResponse>(
    `${BASE_PATH}/columns/${columnId}/distinct-values?${params.toString()}`
  );
}

/**
 * Get sample data for a table
 */
export async function getTableSample(
  tableId: number, 
  maxSamples: number = 5
): Promise<TableSampleResponse> {
  return apiClient.get<TableSampleResponse>(
    `${BASE_PATH}/tables/${tableId}/sample?max_samples=${maxSamples}`
  );
}

// Export as object for convenient importing
export const metadataService = {
  listCatalogs,
  listSchemas,
  listTables,
  getTableDetails,
  listColumns,
  getDistinctValues,
  getTableSample,
};
