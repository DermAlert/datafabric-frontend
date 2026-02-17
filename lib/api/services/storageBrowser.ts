/**
 * Storage Browser API Service
 * Endpoints for browsing files and folders in Object Storage connections
 */

import { apiClient } from '../client';
import type {
  BucketsResponse,
  ObjectsResponse,
  ObjectsParams,
  ObjectInfoResponse,
  ObjectInfoParams,
  DownloadUrlResponse,
  DownloadUrlParams,
} from '@/types/api/storageBrowser';

const BASE_PATH = '/api/storage-browser';

/**
 * List all buckets/containers for a connection
 */
export async function listBuckets(connectionId: number): Promise<BucketsResponse> {
  return apiClient.get<BucketsResponse>(`${BASE_PATH}/${connectionId}/buckets`);
}

/**
 * List objects (files and folders) in a bucket
 */
export async function listObjects(
  connectionId: number,
  params?: ObjectsParams
): Promise<ObjectsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.bucket) searchParams.set('bucket', params.bucket);
  if (params?.prefix) searchParams.set('prefix', params.prefix);
  if (params?.delimiter) searchParams.set('delimiter', params.delimiter);
  if (params?.max_keys) searchParams.set('max_keys', String(params.max_keys));
  if (params?.continuation_token) searchParams.set('continuation_token', params.continuation_token);

  const query = searchParams.toString();
  const url = `${BASE_PATH}/${connectionId}/objects${query ? `?${query}` : ''}`;
  return apiClient.get<ObjectsResponse>(url);
}

/**
 * Get detailed info about a specific file
 */
export async function getObjectInfo(
  connectionId: number,
  params: ObjectInfoParams
): Promise<ObjectInfoResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('bucket', params.bucket);
  searchParams.set('key', params.key);

  return apiClient.get<ObjectInfoResponse>(
    `${BASE_PATH}/${connectionId}/object-info?${searchParams.toString()}`
  );
}

/**
 * Generate a pre-signed download URL for a file
 */
export async function getDownloadUrl(
  connectionId: number,
  params: DownloadUrlParams
): Promise<DownloadUrlResponse> {
  const searchParams = new URLSearchParams();
  searchParams.set('bucket', params.bucket);
  searchParams.set('key', params.key);
  if (params.expires) searchParams.set('expires', String(params.expires));

  return apiClient.get<DownloadUrlResponse>(
    `${BASE_PATH}/${connectionId}/download-url?${searchParams.toString()}`
  );
}

// Export as object for namespaced usage
export const storageBrowserService = {
  listBuckets,
  listObjects,
  getObjectInfo,
  getDownloadUrl,
};
