export async function getJsonBody(req) {
  try {
    return await req.json();
  } catch (error) {
    throw new Error('Invalid JSON body');
  }
}

/**
 * Extracts a required header, throws if missing.
 */
export function getRequiredHeader(req, headerName) {
  const value = req.headers.get(headerName);
  if (!value) throw new Error(`Missing required header: ${headerName}`);
  return value;
}

/**
 * Extracts a header, returns undefined if missing.
 */
export function getOptionalHeader(req, headerName) {
  return req.headers.get(headerName) || undefined;
}