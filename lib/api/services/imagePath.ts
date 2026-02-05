/**
 * Image Path API Service
 * Endpoints for managing image path columns and their storage connections
 */

import { apiClient } from '../client';
import type {
  UpdateImagePathRequest,
  UpdateImagePathResponse,
  ImagePathColumnResponse,
} from '@/types/api/imagePath';

const BASE_PATH = '/api/image-paths';

/**
 * Update a column's image path status and optionally associate it with an image connection
 */
export async function updateColumnImagePath(
  columnId: number,
  data: UpdateImagePathRequest
): Promise<UpdateImagePathResponse> {
  return apiClient.put<UpdateImagePathResponse>(
    `${BASE_PATH}/columns/${columnId}/image-path`,
    data
  );
}

/**
 * List columns in a table that are marked as image paths, or optionally all columns
 * @param tableId - The table ID to list columns from
 * @param includeAll - If true, returns all columns; if false, only image path columns
 */
export async function listTableImagePathColumns(
  tableId: number,
  includeAll: boolean = false
): Promise<ImagePathColumnResponse[]> {
  const queryParam = includeAll ? '?include_all=true' : '';
  return apiClient.get<ImagePathColumnResponse[]>(
    `${BASE_PATH}/tables/${tableId}/image-path-columns${queryParam}`
  );
}

// Export as object for namespaced usage
export const imagePathService = {
  updateColumn: updateColumnImagePath,
  listTableColumns: listTableImagePathColumns,
};
