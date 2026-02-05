/**
 * API Configuration
 * Centralized configuration for backend API connection
 */

const isBrowser = typeof window !== 'undefined';

export const API_CONFIG = {
  // Use proxy in browser to avoid CORS, direct connection on server
  baseUrl: isBrowser 
    ? '/api/proxy' 
    : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004'),
  backendUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8004',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
} as const;

/**
 * Build full API endpoint URL
 * In browser: /api/proxy/connection/search (goes through Next.js proxy)
 * On server: http://localhost:8004/api/connection/search (direct)
 */
export function getApiUrl(endpoint: string): string {
  const base = API_CONFIG.baseUrl.replace(/\/$/, '');
  
  // Remove /api prefix if present since proxy adds it
  let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // In browser mode (using proxy), strip the /api prefix since proxy route adds it
  if (isBrowser && path.startsWith('/api/')) {
    path = path.slice(4); // Remove '/api'
  }
  
  return `${base}${path}`;
}
