
import config from '../../config';

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

/**
 * @param {Object} options
 * @param {string} options.url 
 * @param {string} options.method 
 * @param {object} [options.headers] 
 * @param {object} [options.body] 
 * @returns {Promise<any>} 
 * @throws {ApiError}
 */
export async function apiRequest({
  url,
  method = 'GET',
  headers = {},
  body = undefined,
  external = true, 
}) {
  const endpoint = external ? `${config.API_EXTERNA}${url}` : url;

  try {
    const response = await fetch(endpoint, {
      method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...headers,
      },
      ...(body && { body: JSON.stringify(body) }),
    });

    let data;
    try {
      data = await response.json();
    } catch (_) {
      data = null;
    }

    if (!response.ok) {
      console.error(`[API Error] ${method} ${endpoint} - Status: ${response.status}`, data);
      throw new ApiError(`API request failed: ${method} ${endpoint}`, response.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    console.error(`[API Fatal Error] ${method} ${endpoint}`, err);
    throw new ApiError('API request encountered a fatal error', 500, { error: err.message });
  }
}