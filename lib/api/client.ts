/**
 * API Client
 * Simple fetch wrapper for backend communication
 */

import { API_CONFIG, getApiUrl } from './config';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

interface ApiError {
  message: string;
  status: number;
  data?: unknown;
}

class ApiClient {
  private defaultHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = getApiUrl(endpoint);
    const timeout = options?.timeout || API_CONFIG.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: {
          ...this.defaultHeaders,
          ...options?.headers,
        },
        body: data ? JSON.stringify(data) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const error: ApiError = {
          message: errorData?.message || errorData?.detail || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data: errorData,
        };
        throw error;
      }

      // Handle 204 No Content responses (common for DELETE)
      if (response.status === 204) {
        return undefined as T;
      }

      // Handle empty responses
      const text = await response.text();
      if (!text || text.trim() === '') {
        return undefined as T;
      }
      
      return JSON.parse(text) as T;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw { message: 'Request timeout', status: 408 } as ApiError;
      }
      
      // If it's already an ApiError, just re-throw
      if (typeof error === 'object' && error !== null && 'message' in error && 'status' in error) {
        throw error;
      }
      
      // Handle network errors or other fetch failures
      if (error instanceof Error) {
        throw { 
          message: error.message || 'Network error occurred', 
          status: 0,
          data: { originalError: error.name }
        } as ApiError;
      }
      
      // Fallback for unknown error types
      throw { 
        message: 'An unexpected error occurred', 
        status: 0,
        data: error 
      } as ApiError;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }

  /**
   * Set authorization token for authenticated requests
   */
  setAuthToken(token: string) {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Remove authorization token
   */
  clearAuthToken() {
    delete this.defaultHeaders['Authorization'];
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for custom instances if needed
export { ApiClient };
