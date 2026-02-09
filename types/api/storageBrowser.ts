/**
 * Storage Browser API Types
 * Types for navigating files and folders in Object Storage connections
 */

// =============================================
// Bucket Types
// =============================================

export interface StorageBucket {
  name: string;
  creation_date: string | null;
  region: string | null;
}

export interface BucketsResponse {
  connection_id: number;
  connection_name: string;
  storage_type: string;
  buckets: StorageBucket[];
  total: number;
}

// =============================================
// Object/Item Types
// =============================================

export interface StorageItem {
  name: string;
  path: string;
  type: 'file' | 'folder';
  size: number | null;
  last_modified: string | null;
  content_type: string | null;
  etag: string | null;
}

export interface ObjectsResponse {
  connection_id: number;
  connection_name: string;
  storage_type: string;
  bucket: string;
  prefix: string;
  items: StorageItem[];
  total_files: number;
  total_folders: number;
  is_truncated: boolean;
  next_continuation_token: string | null;
}

export interface ObjectsParams {
  bucket?: string;
  prefix?: string;
  delimiter?: string;
  max_keys?: number;
  continuation_token?: string;
}

// =============================================
// Object Info Types
// =============================================

export interface ObjectInfoResponse {
  connection_id: number;
  bucket: string;
  key: string;
  size: number;
  last_modified: string;
  content_type: string | null;
  etag: string | null;
  metadata: Record<string, string>;
  storage_class: string | null;
}

export interface ObjectInfoParams {
  bucket: string;
  key: string;
}

// =============================================
// Download URL Types
// =============================================

export interface DownloadUrlResponse {
  connection_id: number;
  bucket: string;
  key: string;
  url: string;
  expires_in: number;
}

export interface DownloadUrlParams {
  bucket: string;
  key: string;
  expires?: number;
}
