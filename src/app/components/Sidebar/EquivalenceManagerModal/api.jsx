const API_BASE = "http://localhost:8004/api/equivalence/";

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// Semantic Domains
export async function api_getSemanticDomains() {
  return fetchJson(`${API_BASE}semantic-domains`);
}
export async function api_postSemanticDomain(data) {
  return fetchJson(`${API_BASE}semantic-domains`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_putSemanticDomain(id, data) {
  return fetchJson(`${API_BASE}semantic-domains/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_deleteSemanticDomain(id) {
  return fetchJson(`${API_BASE}semantic-domains/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
export async function api_searchSemanticDomains(body) {
  return fetchJson(`${API_BASE}semantic-domains/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// Data Dictionary
export async function api_getDataDictionary() {
  return fetchJson(`${API_BASE}data-dictionary`);
}
export async function api_postDataDictionary(data) {
  return fetchJson(`${API_BASE}data-dictionary`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_putDataDictionary(id, data) {
  return fetchJson(`${API_BASE}data-dictionary/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_deleteDataDictionary(id) {
  return fetchJson(`${API_BASE}data-dictionary/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
export async function api_searchDataDictionary(body) {
  return fetchJson(`${API_BASE}data-dictionary/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// Column Groups
export async function api_getColumnGroups(params = {}) {
  let url = `${API_BASE}column-groups`;
  const qs = [];
  if (params.semantic_domain_id) qs.push(`semantic_domain_id=${params.semantic_domain_id}`);
  if (params.data_dictionary_term_id) qs.push(`data_dictionary_term_id=${params.data_dictionary_term_id}`);
  if (qs.length) url += "?" + qs.join("&");
  return fetchJson(url);
}
export async function api_postColumnGroup(data) {
  return fetchJson(`${API_BASE}column-groups`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_putColumnGroup(id, data) {
  return fetchJson(`${API_BASE}column-groups/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_deleteColumnGroup(id) {
  return fetchJson(`${API_BASE}column-groups/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
export async function api_getColumnGroup(id) {
  return fetchJson(`${API_BASE}column-groups/${id}`);
}
export async function api_searchColumnGroups(body) {
  return fetchJson(`${API_BASE}column-groups/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// Column Mappings
export async function api_postColumnMapping(data) {
  return fetchJson(`${API_BASE}column-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_putColumnMapping(id, data) {
  return fetchJson(`${API_BASE}column-mappings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_deleteColumnMapping(id) {
  return fetchJson(`${API_BASE}column-mappings/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
export async function api_searchColumnMappings(body) {
  return fetchJson(`${API_BASE}column-mappings/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}

// Value Mappings
export async function api_postValueMapping(data) {
  return fetchJson(`${API_BASE}value-mappings`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_putValueMapping(id, data) {
  return fetchJson(`${API_BASE}value-mappings/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(data),
  });
}
export async function api_deleteValueMapping(id) {
  return fetchJson(`${API_BASE}value-mappings/${id}`, {
    method: "DELETE",
    headers: { accept: "application/json" },
  });
}
export async function api_searchValueMappings(body) {
  return fetchJson(`${API_BASE}value-mappings/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
}
export async function api_getValueMappingsByGroup(group_id, source_column_id) {
  let url = `${API_BASE}column-groups/${group_id}/value-mappings`;
  if (source_column_id) url += `?source_column_id=${source_column_id}`;
  return fetchJson(url);
}

// Available Columns (from connections/tables)
export async function api_getAvailableColumns(params) {
  let url = `${API_BASE}available-columns?connection_id=${params.connection_id}&schema_id=${params.schema_id}&table_id=${params.table_id}`;
  if (params.exclude_mapped) url += "&exclude_mapped=true";
  return fetchJson(url);
}

















