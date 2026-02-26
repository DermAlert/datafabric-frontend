/**
 * Delta Sharing API Service
 * Endpoints for managing shares, schemas, tables, and recipients
 */

import { apiClient } from '../client';
import { getApiUrl } from '../config';
import type {
  // Dataset Integration
  AvailableDataset,
  SourceType,
  // Shares
  Share,
  CreateShareRequest,
  UpdateShareRequest,
  ShareSearchRequest,
  ShareSearchResponse,
  // Schemas
  Schema,
  CreateSchemaRequest,
  UpdateSchemaRequest,
  SchemaSearchRequest,
  SchemaSearchResponse,
  // Tables
  Table,
  CreateTableFromBronzeRequest,
  CreateTableFromSilverRequest,
  CreateTableFromBronzeVirtualizedRequest,
  CreateTableFromSilverVirtualizedRequest,
  UpdateTableRequest,
  PinVersionRequest,
  UnpinVersionResponse,
  TableDataApiRequest,
  TableDataApiResponse,
  TableDataApiJsonResponse,
  // Recipients
  Recipient,
  CreateRecipientRequest,
  UpdateRecipientRequest,
  RecipientSearchRequest,
  RecipientSearchResponse,
  AssociateSharesRequest,
  RegenerateTokenResponse,
} from '@/types/api/deltaSharing';

const BASE_PATH = '/api/delta-sharing';

// =============================================
// Dataset Integration Endpoints
// =============================================

/**
 * List all available datasets (Bronze/Silver configs ready for sharing)
 */
export async function listAvailableDatasets(
  sourceType?: SourceType,
  options?: { includeVirtualized?: boolean }
): Promise<AvailableDataset[]> {
  const queryParams = new URLSearchParams();
  if (sourceType) queryParams.set('source_type', sourceType);
  if (options?.includeVirtualized) queryParams.set('include_virtualized', 'true');
  const queryString = queryParams.toString();
  const params = queryString ? `?${queryString}` : '';
  return apiClient.get<AvailableDataset[]>(`${BASE_PATH}/integration/datasets${params}`);
}

/**
 * Get info about a specific Bronze config
 */
export async function getBronzeDataset(configId: number): Promise<AvailableDataset> {
  return apiClient.get<AvailableDataset>(`${BASE_PATH}/integration/datasets/bronze/${configId}`);
}

/**
 * Get info about a specific Silver config
 */
export async function getSilverDataset(configId: number): Promise<AvailableDataset> {
  return apiClient.get<AvailableDataset>(`${BASE_PATH}/integration/datasets/silver/${configId}`);
}

// =============================================
// Share Endpoints
// =============================================

/**
 * Create a new share
 */
export async function createShare(data: CreateShareRequest): Promise<Share> {
  return apiClient.post<Share>(`${BASE_PATH}/shares`, data);
}

/**
 * Search shares with pagination
 */
export async function searchShares(
  params?: ShareSearchRequest
): Promise<ShareSearchResponse> {
  return apiClient.post<ShareSearchResponse>(`${BASE_PATH}/shares/search`, params || {});
}

/**
 * Get a specific share by ID
 */
export async function getShare(shareId: number): Promise<Share> {
  return apiClient.get<Share>(`${BASE_PATH}/shares/${shareId}`);
}

/**
 * Update a share
 */
export async function updateShare(
  shareId: number,
  data: UpdateShareRequest
): Promise<Share> {
  return apiClient.put<Share>(`${BASE_PATH}/shares/${shareId}`, data);
}

/**
 * Delete a share
 */
export async function deleteShare(shareId: number): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/shares/${shareId}`);
}

// =============================================
// Schema Endpoints
// =============================================

/**
 * Create a schema within a share
 */
export async function createSchema(
  shareId: number,
  data: CreateSchemaRequest
): Promise<Schema> {
  return apiClient.post<Schema>(`${BASE_PATH}/shares/${shareId}/schemas`, data);
}

/**
 * Search schemas within a share
 */
export async function searchSchemas(
  shareId: number,
  params?: SchemaSearchRequest
): Promise<SchemaSearchResponse> {
  return apiClient.post<SchemaSearchResponse>(
    `${BASE_PATH}/shares/${shareId}/schemas/search`,
    params || {}
  );
}

/**
 * Update a schema
 */
export async function updateSchema(
  shareId: number,
  schemaId: number,
  data: UpdateSchemaRequest
): Promise<Schema> {
  return apiClient.put<Schema>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}`,
    data
  );
}

/**
 * Delete a schema
 */
export async function deleteSchema(shareId: number, schemaId: number): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/shares/${shareId}/schemas/${schemaId}`);
}

/**
 * Search tables in a schema
 */
export async function searchSchemaTables(
  shareId: number,
  schemaId: number
): Promise<{ total: number; items: Table[] }> {
  return apiClient.post<{ total: number; items: Table[] }>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/search`,
    {}
  );
}

// =============================================
// Table Endpoints
// =============================================

/**
 * Create table(s) from a Bronze config.
 * When path_index is omitted, creates one table per output path.
 */
export async function createTableFromBronze(
  shareId: number,
  schemaId: number,
  data: CreateTableFromBronzeRequest
): Promise<Table[]> {
  return apiClient.post<Table[]>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/from-bronze`,
    data
  );
}

/**
 * Create a table from a Silver config
 */
export async function createTableFromSilver(
  shareId: number,
  schemaId: number,
  data: CreateTableFromSilverRequest
): Promise<Table> {
  return apiClient.post<Table>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/from-silver`,
    data
  );
}

/**
 * Create a table from a Bronze virtualized config
 */
export async function createTableFromBronzeVirtualized(
  shareId: number,
  schemaId: number,
  data: CreateTableFromBronzeVirtualizedRequest
): Promise<Table> {
  return apiClient.post<Table>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/from-bronze-virtualized`,
    data
  );
}

/**
 * Create a table from a Silver virtualized config
 */
export async function createTableFromSilverVirtualized(
  shareId: number,
  schemaId: number,
  data: CreateTableFromSilverVirtualizedRequest
): Promise<Table> {
  return apiClient.post<Table>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/from-silver-virtualized`,
    data
  );
}

function parseBooleanHeader(value: string | null): boolean | null {
  if (value === null) return null;
  return value.toLowerCase() === 'true';
}

async function parseDataApiPayload(
  response: Response,
  format: NonNullable<TableDataApiRequest['format']>
): Promise<TableDataApiJsonResponse | string> {
  if (format === 'json') {
    return (await response.json()) as TableDataApiJsonResponse;
  }
  return await response.text();
}

/**
 * Query shared table data (GET) - JSON only
 */
export async function getSharedTableData(
  share: string,
  schema: string,
  table: string,
  params?: Omit<TableDataApiRequest, 'format'>
): Promise<TableDataApiJsonResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit !== undefined) queryParams.set('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.set('offset', params.offset.toString());
  const queryString = queryParams.toString();
  const url = queryString
    ? `${BASE_PATH}/shares/${share}/schemas/${schema}/tables/${table}/data?${queryString}`
    : `${BASE_PATH}/shares/${share}/schemas/${schema}/tables/${table}/data`;
  return apiClient.get<TableDataApiJsonResponse>(url);
}

/**
 * Query shared table data (POST) - supports json/csv/ndjson
 */
export async function postSharedTableData(
  share: string,
  schema: string,
  table: string,
  body?: TableDataApiRequest,
  options?: { bearerToken?: string }
): Promise<TableDataApiResponse> {
  const format = body?.format || 'json';
  const response = await fetch(
    getApiUrl(`${BASE_PATH}/shares/${share}/schemas/${schema}/tables/${table}/data`),
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.bearerToken ? { Authorization: `Bearer ${options.bearerToken}` } : {}),
      },
      body: JSON.stringify({
        format,
        limit: body?.limit,
        offset: body?.offset,
      }),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw {
      message:
        errorData?.message ||
        errorData?.detail ||
        `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
      data: errorData,
    };
  }

  return {
    contentType: response.headers.get('content-type') || 'application/json',
    rowCount: response.headers.get('X-Row-Count')
      ? Number(response.headers.get('X-Row-Count'))
      : null,
    hasMore: parseBooleanHeader(response.headers.get('X-Has-More')),
    payload: await parseDataApiPayload(response, format),
  };
}

/**
 * Update a table (e.g. set/unset pinned_delta_version)
 */
export async function updateTable(
  shareId: number,
  schemaId: number,
  tableId: number,
  data: UpdateTableRequest
): Promise<Table> {
  return apiClient.put<Table>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/${tableId}`,
    data
  );
}

/**
 * Pin a table to a specific Delta version
 */
export async function pinTableVersion(
  shareId: number,
  schemaId: number,
  tableId: number,
  data: PinVersionRequest
): Promise<Table> {
  return apiClient.put<Table>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/${tableId}/pin-version`,
    data
  );
}

/**
 * Unpin a table version (consumers receive latest data)
 */
export async function unpinTableVersion(
  shareId: number,
  schemaId: number,
  tableId: number
): Promise<UnpinVersionResponse> {
  return apiClient.delete<UnpinVersionResponse>(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/${tableId}/pin-version`
  );
}

/**
 * Delete a table
 */
export async function deleteTable(
  shareId: number,
  schemaId: number,
  tableId: number
): Promise<void> {
  return apiClient.delete(
    `${BASE_PATH}/shares/${shareId}/schemas/${schemaId}/tables/${tableId}`
  );
}

// =============================================
// Recipient Endpoints
// =============================================

/**
 * Create a new recipient
 */
export async function createRecipient(data: CreateRecipientRequest): Promise<Recipient> {
  return apiClient.post<Recipient>(`${BASE_PATH}/recipients`, data);
}

/**
 * Search recipients with pagination
 */
export async function searchRecipients(
  params?: RecipientSearchRequest
): Promise<RecipientSearchResponse> {
  return apiClient.post<RecipientSearchResponse>(
    `${BASE_PATH}/recipients/search`,
    params || {}
  );
}

/**
 * Get a specific recipient by ID
 */
export async function getRecipient(recipientId: number): Promise<Recipient> {
  return apiClient.get<Recipient>(`${BASE_PATH}/recipients/${recipientId}`);
}

/**
 * Update a recipient
 */
export async function updateRecipient(
  recipientId: number,
  data: UpdateRecipientRequest
): Promise<Recipient> {
  return apiClient.put<Recipient>(`${BASE_PATH}/recipients/${recipientId}`, data);
}

/**
 * Delete a recipient
 */
export async function deleteRecipient(recipientId: number): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/recipients/${recipientId}`);
}

/**
 * Associate a recipient with shares
 */
export async function associateRecipientShares(
  recipientId: number,
  data: AssociateSharesRequest
): Promise<void> {
  return apiClient.post(`${BASE_PATH}/recipients/${recipientId}/shares`, data);
}

/**
 * Remove a share association from a recipient
 */
export async function removeRecipientShare(
  recipientId: number,
  shareId: number
): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/recipients/${recipientId}/shares/${shareId}`);
}

/**
 * Regenerate a recipient's token
 */
export async function regenerateRecipientToken(
  recipientId: number
): Promise<RegenerateTokenResponse> {
  return apiClient.post<RegenerateTokenResponse>(
    `${BASE_PATH}/recipients/${recipientId}/regenerate-token`,
    {}
  );
}

// =============================================
// Export as service object
// =============================================

export const deltaSharingService = {
  // Datasets
  datasets: {
    list: listAvailableDatasets,
    getBronze: getBronzeDataset,
    getSilver: getSilverDataset,
  },
  // Shares
  shares: {
    create: createShare,
    search: searchShares,
    get: getShare,
    update: updateShare,
    delete: deleteShare,
  },
  // Schemas
  schemas: {
    create: createSchema,
    search: searchSchemas,
    update: updateSchema,
    delete: deleteSchema,
    searchTables: searchSchemaTables,
  },
  // Tables
  tables: {
    search: searchSchemaTables,
    createFromBronze: createTableFromBronze,
    createFromSilver: createTableFromSilver,
    createFromBronzeVirtualized: createTableFromBronzeVirtualized,
    createFromSilverVirtualized: createTableFromSilverVirtualized,
    update: updateTable,
    pinVersion: pinTableVersion,
    unpinVersion: unpinTableVersion,
    delete: deleteTable,
    getData: getSharedTableData,
    postData: postSharedTableData,
  },
  // Recipients
  recipients: {
    create: createRecipient,
    search: searchRecipients,
    get: getRecipient,
    update: updateRecipient,
    delete: deleteRecipient,
    associateShares: associateRecipientShares,
    removeShare: removeRecipientShare,
    regenerateToken: regenerateRecipientToken,
  },
};
