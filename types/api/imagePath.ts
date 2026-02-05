/**
 * Image Path API Types
 * Types for managing image path columns and their storage connections
 */

/**
 * Request to update a column's image path status
 */
export interface UpdateImagePathRequest {
  /** Whether the column should be marked as an image path */
  is_image_path: boolean;
  /** ID of the image storage connection to use (optional, only needed when is_image_path is true) */
  image_connection_id?: number | null;
}

/**
 * Response after updating a column's image path status
 */
export interface UpdateImagePathResponse {
  id: number;
  column_name: string;
  is_image_path: boolean;
  image_connection_id: number | null;
  message: string;
}

/**
 * Response for a column that may be marked as image path
 */
export interface ImagePathColumnResponse {
  id: number;
  column_name: string;
  data_type: string;
  is_image_path: boolean;
  image_connection_id: number | null;
  image_connection_name?: string | null;
  table_id: number;
  table_name: string;
}
