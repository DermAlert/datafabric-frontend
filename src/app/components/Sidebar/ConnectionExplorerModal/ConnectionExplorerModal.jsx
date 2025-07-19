"use client";
import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X, Database, Server, Table, Columns, Search, ChevronDown, ChevronRight,
  Eye, EyeOff, RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Folder, Cloud, Zap, Info
} from "lucide-react";
import styles from "./ConnectionExplorerModal.module.css";

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function patchFlAtivo(url, fl_ativo) {
  const res = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", accept: "application/json" },
    body: JSON.stringify({ fl_ativo }),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function InfoModal({ isOpen, title, children, onClose }) {
  if (!isOpen) return null;
  return (
    <div className={styles.infoModalOverlay}>
      <div className={styles.infoModal}>
        <div className={styles.infoModalHeader}>
          <h3 className={styles.infoModalTitle}>{title}</h3>
          <button type="button" onClick={onClose} className={styles.infoModalClose}>
            <X size={20} />
          </button>
        </div>
        <div className={styles.infoModalContent}>{children}</div>
      </div>
    </div>
  );
}

export default function ConnectionExplorerModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedConnections, setExpandedConnections] = useState({});
  const [expandedCatalogs, setExpandedCatalogs] = useState({});
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);
  const [error, setError] = useState(null);

  const [connectionTypes, setConnectionTypes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [catalogsByConn, setCatalogsByConn] = useState({});
  const [schemasByCatalog, setSchemasByCatalog] = useState({});
  const [tablesBySchema, setTablesBySchema] = useState({});
  const [columnsByTable, setColumnsByTable] = useState({});
  const [tableDetails, setTableDetails] = useState({});
  const [distinctModal, setDistinctModal] = useState({ open: false, values: [], columnName: "", total: 0 });
  const [enabledStates, setEnabledStates] = useState({});
  const [modalInfo, setModalInfo] = useState({ open: false, content: null });
  const [refreshKey, setRefreshKey] = useState(Date.now());

  const scrollRefs = useRef({});

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    fetchJson("http://localhost:8004/api/connection/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pagination: { limit: 100, query_total: false, skip: 0 } }),
    })
      .then((data) => setConnectionTypes(data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    setConnections([]);
    fetchJson("http://localhost:8004/api/data-connections/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        filterType && filterType !== "all"
          ? { pagination: { limit: 100, query_total: false, skip: 0 }, connection_type_id: filterType }
          : { pagination: { limit: 100, query_total: false, skip: 0 } }
      ),
    })
      .then((data) => setConnections(data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isOpen, filterType, refreshKey]);

  const handleExpandConnection = async (connId) => {
    setExpandedConnections((prev) => ({ ...prev, [connId]: !prev[connId] }));
    if (!catalogsByConn[connId]) {
      setLoading(true);
      try {
        const catalogs = await fetchJson(
          `http://localhost:8004/api/metadata/connections/${connId}/catalogs`
        );
        setCatalogsByConn((prev) => ({ ...prev, [connId]: catalogs }));
        const es = {};
        catalogs.forEach((cat) => {
          es[`catalog-${cat.id}`] = cat.fl_ativo !== false;
        });
        setEnabledStates((prev) => ({ ...prev, ...es }));
      } catch (e) {
        setError("Erro ao carregar catálogos.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpandCatalog = async (connId, catalogId) => {
    const key = `${connId}-${catalogId}`;
    setExpandedCatalogs((prev) => ({ ...prev, [key]: !prev[key] }));
    if (!schemasByCatalog[catalogId]) {
      setLoading(true);
      try {
        const schemas = await fetchJson(
          `http://localhost:8004/api/metadata/connections/${connId}/schemas?catalog_id=${catalogId}`
        );
        setSchemasByCatalog((prev) => ({ ...prev, [catalogId]: schemas }));
        const es = {};
        schemas.forEach((s) => {
          es[`schema-${s.id}`] = s.fl_ativo !== false;
        });
        setEnabledStates((prev) => ({ ...prev, ...es }));
      } catch (e) {
        setError("Erro ao carregar schemas.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpandSchema = async (schemaId) => {
    setExpandedSchemas((prev) => ({ ...prev, [schemaId]: !prev[schemaId] }));
    setLoading(true);
    try {
      const tables = await fetchJson(
        `http://localhost:8004/api/metadata/schemas/${schemaId}/tables`
      );
      setTablesBySchema((prev) => ({ ...prev, [schemaId]: tables }));
      const es = {};
      tables.forEach((t) => {
        es[`table-${t.id}`] = t.fl_ativo !== false;
      });
      setEnabledStates((prev) => ({ ...prev, ...es }));
    } catch (e) {
      setError("Erro ao carregar tabelas.");
    } finally {
      setLoading(false);
    }
  };

  const handleExpandTable = async (tableId) => {
    setExpandedTables((prev) => ({ ...prev, [tableId]: !prev[tableId] }));
    setLoading(true);
    try {
      const detail = await fetchJson(
        `http://localhost:8004/api/metadata/tables/${tableId}`
      );
      setTableDetails((prev) => ({ ...prev, [tableId]: detail }));
      setColumnsByTable((prev) => ({ ...prev, [tableId]: detail.columns || [] }));
      const es = {};
      (detail.columns || []).forEach((col) => {
        es[`column-${col.id}`] = col.fl_ativo !== false;
      });
      setEnabledStates((prev) => ({ ...prev, ...es }));
    } catch (e) {
      setError("Erro ao carregar colunas.");
    } finally {
      setLoading(false);
    }
  };

  async function handleToggleFlAtivo(type, id, fl_ativo) {
    let url = "";
    if (type === "catalog") url = `http://localhost:8004/api/metadata/catalogs/${id}/fl_ativo`;
    else if (type === "schema") url = `http://localhost:8004/api/metadata/schemas/${id}/fl_ativo`;
    else if (type === "table") url = `http://localhost:8004/api/metadata/tables/${id}/fl_ativo`;
    else if (type === "column") url = `http://localhost:8004/api/metadata/columns/${id}/fl_ativo`;
    try {
      await patchFlAtivo(url, fl_ativo);
      setEnabledStates((es) => ({ ...es, [`${type}-${id}`]: fl_ativo }));
      setRefreshKey(Date.now());
    } catch (e) {
      alert("Falha ao atualizar: " + e.message);
    }
  }

  function handleShowTableInfo(tableId) {
    setLoading(true);
    fetchJson(`http://localhost:8004/api/metadata/tables/${tableId}`)
      .then((data) => {
        setModalInfo({
          open: true,
          content: (
            <div>
              <div><b>ID:</b> {data.id}</div>
              <div><b>Nome:</b> {data.table_name}</div>
              <div><b>Tipo:</b> {data.table_type}</div>
              <div><b>Linhas estimadas:</b> {data.estimated_row_count}</div>
              <div><b>Tamanho:</b> {data.total_size_bytes} bytes</div>
              <div><b>Chave primária:</b> {data.primary_key_count || 0}</div>
              <div><b>Colunas:</b> {data.column_count || (data.columns?.length ?? 0)}</div>
              <div><b>Descrição:</b> {data.description || <i>—</i>}</div>
              <div style={{ marginTop: 8 }}>
                <b>Propriedades:</b>
                <pre style={{ fontSize: 13 }}>
                  {JSON.stringify(data.properties, null, 2)}
                </pre>
              </div>
            </div>
          ),
        });
      })
      .finally(() => setLoading(false));
  }

  function handleShowDistinct(columnId, columnName) {
    setLoading(true);
    fetchJson(`http://localhost:8004/api/metadata/columns/${columnId}/distinct-values?limit=1000`)
      .then((data) => {
        setDistinctModal({ open: true, columnName, values: data.distinct_values || [], total: data.total_returned });
      })
      .finally(() => setLoading(false));
  }

  const getConnectionIcon = (type) => {
    switch ((type || "").toLowerCase()) {
      case "minio":
        return <Cloud className={styles.connectionTypeIcon} />;
      case "postgresql":
        return <Database className={styles.connectionTypeIcon} />;
      case "airflow":
        return <Zap className={styles.connectionTypeIcon} />;
      default:
        return <Server className={styles.connectionTypeIcon} />;
    }
  };
  const getStatusIcon = (status) => {
    switch (status) {
      case "connected":
      case "active":
      case "success":
        return <CheckCircle className={styles.textGreen} />;
      case "running":
        return <Activity className={styles.textBlue} />;
      case "disconnected":
        return <XCircle className={styles.textRed} />;
      case "error":
      case "failed":
        return <AlertCircle className={styles.textRed} />;
      default:
        return <AlertCircle className={styles.textGray} />;
    }
  };

  function filterList(list, prop = "name", type = "") {
    const search = searchTerm.trim().toLowerCase();
    let filtered = list.filter(item => item[prop]?.toLowerCase().includes(search));
    if (showEnabledOnly && type) {
      filtered = filtered.filter(item => enabledStates[`${type}-${item.id}`] !== false);
    }
    return filtered;
  }

  const getEnabledCounts = () => {
    let totalConnections = connections.length,
      enabledConnections = connections.filter(conn => enabledStates[`connection-${conn.id}`] !== false).length;
    let totalCatalogs = 0, enabledCatalogs = 0;
    let totalSchemas = 0, enabledSchemas = 0;
    let totalTables = 0, enabledTables = 0;
    let totalColumns = 0, enabledColumns = 0;

    Object.values(catalogsByConn).forEach(catalogs =>
      catalogs?.forEach(cat => {
        totalCatalogs++;
        if (enabledStates[`catalog-${cat.id}`] !== false) enabledCatalogs++;
      })
    );
    Object.values(schemasByCatalog).forEach(schemas =>
      schemas?.forEach(schema => {
        totalSchemas++;
        if (enabledStates[`schema-${schema.id}`] !== false) enabledSchemas++;
      })
    );
    Object.values(tablesBySchema).forEach(tables =>
      tables?.forEach(table => {
        totalTables++;
        if (enabledStates[`table-${table.id}`] !== false) enabledTables++;
      })
    );
    Object.values(columnsByTable).forEach(cols =>
      cols?.forEach(col => {
        totalColumns++;
        if (enabledStates[`column-${col.id}`] !== false) enabledColumns++;
      })
    );
    return {
      connections: `${enabledConnections}/${totalConnections}`,
      catalogs: `${enabledCatalogs}/${totalCatalogs}`,
      schemas: `${enabledSchemas}/${totalSchemas}`,
      tables: `${enabledTables}/${totalTables}`,
      columns: `${enabledColumns}/${totalColumns}`,
    };
  };
  const enabledCounts = getEnabledCounts();

  const refreshConnections = () => {
    setRefreshKey(Date.now());
    setCatalogsByConn({});
    setSchemasByCatalog({});
    setTablesBySchema({});
    setColumnsByTable({});
  };

  const scrollToRef = (key) => {
    setTimeout(() => {
      if (scrollRefs.current[key]) {
        scrollRefs.current[key].scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 0);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleBlock}>
              <Database className={styles.modalIcon} />
              <h2 className={styles.modalTitle}>Explorador de Conexões</h2>
            </div>
            <div className={styles.modalSummary}>
              <span className={styles.summaryBadge}>
                <Database className={styles.connectionTypeIcon} />
                {enabledCounts.connections}
              </span>
              <span className={styles.summaryBadge}>
                <Cloud className={styles.connectionTypeIcon} />
                {enabledCounts.catalogs}
              </span>
              <span className={styles.summaryBadge}>
                <Folder className={styles.connectionTypeIcon} />
                {enabledCounts.schemas}
              </span>
              <span className={styles.summaryBadge}>
                <Table className={styles.connectionTypeIcon} />
                {enabledCounts.tables}
              </span>
              <span className={styles.summaryBadge}>
                <Columns className={styles.connectionTypeIcon} />
                {enabledCounts.columns}
              </span>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={refreshConnections}
              disabled={loading}
              className={`${styles.refreshButton} ${loading ? styles.bgDisabled : ""}`}
            >
              <RefreshCw className={loading ? styles.spin : ""} />
              Atualizar
            </button>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCloseButton}
              title="Fechar"
            >
              <X />
            </button>
          </div>
        </div>
        <div className={styles.modalControls}>
          <div className={styles.modalSearchBlock}>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquisar conexões, catálogos, esquemas, tabelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Todos os Tipos</option>
              {connectionTypes.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <label className={styles.enabledCheckboxLabel}>
            <input
              type="checkbox"
              checked={showEnabledOnly}
              onChange={(e) => setShowEnabledOnly(e.target.checked)}
              className={styles.enabledCheckbox}
            />
            Mostrar apenas habilitados
          </label>
        </div>
        <div className={styles.modalContent}>
          {error && (
            <div className={styles.error}>
              <AlertCircle />
              <span>{error}</span>
            </div>
          )}
          {loading ? (
            <div className={styles.emptyConnections}>
              <Activity className={styles.textBlue} />
              <span>Carregando...</span>
            </div>
          ) : connections.length === 0 ? (
            <div className={styles.emptyConnections}>
              <AlertCircle />
              <span>Nenhuma conexão encontrada para os filtros atuais.</span>
            </div>
          ) : (
            filterList(connections, "name", "connection").map((connection, connIdx) => (
              <div
                key={connection.id}
                className={styles.connectionCard}
                ref={el => { scrollRefs.current[`connection-${connection.id}`] = el; }}
              >
                <div className={styles.connectionHeader}>
                  <div className={styles.connectionHeaderLeft}>
                    <button
                      type="button"
                      onClick={async () => {
                        await handleExpandConnection(connection.id);
                        scrollToRef(`connection-${connection.id}`);
                      }}
                      className={styles.expandButton}
                    >
                      {expandedConnections[connection.id] ? (
                        <ChevronDown />
                      ) : (
                        <ChevronRight />
                      )}
                    </button>
                    {getConnectionIcon(connection.type)}
                    <span className={styles.connectionName}>{connection.name}</span>
                    <span className={styles.connectionType}>({connection.type})</span>
                    {getStatusIcon(connection.status)}
                  </div>
                  <div className={styles.connectionHeaderRight}>
                    <span className={styles.connectionHost}>
                      {connection.host}:{connection.port}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleToggleFlAtivo("connection", connection.id, !(enabledStates[`connection-${connection.id}`]))
                      }
                      className={styles.toggleButton}
                    >
                      {enabledStates[`connection-${connection.id}`] ? (
                        <Eye />
                      ) : (
                        <EyeOff />
                      )}
                    </button>
                  </div>
                </div>
                {expandedConnections[connection.id] && (
                  <div style={{ padding: "1.2rem" }}>
                    <div className={styles.connectionDescription}>
                      {connection.description}
                    </div>
                    <div className={styles.lastSync}>
                      Última sincronização:{" "}
                      {connection.last_sync_time
                        ? new Date(connection.last_sync_time).toLocaleString()
                        : "-"}
                    </div>
                    <div className={styles.schemasBlock}>
                      {filterList(catalogsByConn[connection.id] || [], "catalog_name", "catalog").map((catalog) => (
                        <div
                          key={catalog.id}
                          className={styles.schemaCard}
                          ref={el => { scrollRefs.current[`catalog-${catalog.id}`] = el; }}
                        >
                          <div className={styles.schemaHeader}>
                            <div className={styles.schemaHeaderLeft}>
                              <button
                                type="button"
                                onClick={async () => {
                                  await handleExpandCatalog(connection.id, catalog.id);
                                  scrollToRef(`catalog-${catalog.id}`);
                                }}
                                className={styles.schemaChevron}
                              >
                                {expandedCatalogs[`${connection.id}-${catalog.id}`] ? (
                                  <ChevronDown />
                                ) : (
                                  <ChevronRight />
                                )}
                              </button>
                              <Cloud className={styles.schemaIcon} />
                              <span className={styles.schemaName}>{catalog.catalog_name}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleFlAtivo("catalog", catalog.id, !(enabledStates[`catalog-${catalog.id}`]))
                              }
                              className={styles.schemaToggle}
                            >
                              {enabledStates[`catalog-${catalog.id}`] ? (
                                <Eye />
                              ) : (
                                <EyeOff />
                              )}
                            </button>
                          </div>
                          {expandedCatalogs[`${connection.id}-${catalog.id}`] && (
                            <div style={{ padding: "0.9rem" }}>
                              <div className={styles.schemaDescription}>
                                {catalog.description}
                              </div>
                              <div className={styles.tablesBlock}>
                                {filterList(schemasByCatalog[catalog.id] || [], "schema_name", "schema").map((schema) => (
                                  <div
                                    key={schema.id}
                                    className={styles.tableCard}
                                    ref={el => { scrollRefs.current[`schema-${schema.id}`] = el; }}
                                  >
                                    <div className={styles.tableHeader}>
                                      <div className={styles.tableHeaderLeft}>
                                        <button
                                          type="button"
                                          onClick={async () => {
                                            await handleExpandSchema(schema.id);
                                            scrollToRef(`schema-${schema.id}`);
                                          }}
                                          className={styles.tableChevron}
                                        >
                                          {expandedSchemas[schema.id] ? (
                                            <ChevronDown />
                                          ) : (
                                            <ChevronRight />
                                          )}
                                        </button>
                                        <Folder className={styles.tableIcon} />
                                        <span className={styles.tableName}>{schema.schema_name}</span>
                                      </div>
                                      <div className={styles.tableHeaderRight}>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleToggleFlAtivo("schema", schema.id, !(enabledStates[`schema-${schema.id}`]))
                                          }
                                          className={styles.tableToggle}
                                        >
                                          {enabledStates[`schema-${schema.id}`] ? (
                                            <Eye />
                                          ) : (
                                            <EyeOff />
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                    {expandedSchemas[schema.id] && (
                                      <div style={{ padding: "0.85rem" }}>
                                        <div className={styles.tableDescription}>
                                          {schema.description}
                                        </div>
                                        <div className={styles.columnsBlock}>
                                          {filterList(tablesBySchema[schema.id] || [], "table_name", "table").map((table) => (
                                            <div
                                              key={table.id}
                                              className={styles.columnRow}
                                              ref={el => { scrollRefs.current[`table-${table.id}`] = el; }}
                                            >
                                              <div className={styles.columnLeft}>
                                                <Table className={styles.columnIcon} />
                                                <div className={styles.columnInfo}>
                                                  <span className={styles.columnName}>
                                                    {table.table_name}
                                                  </span>
                                                  <span className={styles.tableType}>
                                                    ({table.table_type})
                                                  </span>
                                                  <span className={styles.tableRows}>
                                                    {table.estimated_row_count !== undefined
                                                      ? `${table.estimated_row_count} linhas`
                                                      : ""}
                                                  </span>
                                                </div>
                                              </div>
                                              <div
                                                style={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  gap: "0.6rem",
                                                }}
                                              >
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleToggleFlAtivo("table", table.id, !(enabledStates[`table-${table.id}`]))
                                                  }
                                                  className={styles.columnToggle}
                                                >
                                                  {enabledStates[`table-${table.id}`] ? (
                                                    <Eye />
                                                  ) : (
                                                    <EyeOff />
                                                  )}
                                                </button>
                                                <button
                                                  type="button"
                                                  className={styles.infoButton}
                                                  onClick={() => handleShowTableInfo(table.id)}
                                                >
                                                  <Info size={15} />
                                                </button>
                                                <button
                                                  type="button"
                                                  className={styles.tableChevron}
                                                  onClick={async () => {
                                                    await handleExpandTable(table.id);
                                                    scrollToRef(`table-${table.id}`);
                                                  }}
                                                >
                                                  {expandedTables[table.id] ? <ChevronDown /> : <ChevronRight />}
                                                </button>
                                              </div>
                                              {expandedTables[table.id] && (
                                                <div style={{ marginLeft: 24, marginTop: 4 }}>
                                                  {filterList(columnsByTable[table.id] || [], "column_name", "column").map((column) => (
                                                    <div
                                                      key={column.id}
                                                      className={styles.columnRow}
                                                      style={{
                                                        borderLeft: "2px solid #ddd",
                                                        marginLeft: 12,
                                                        paddingLeft: 12,
                                                      }}
                                                    >
                                                      <div className={styles.columnLeft}>
                                                        <Columns className={styles.columnIcon} />
                                                        <div className={styles.columnInfo}>
                                                          <span className={styles.columnName}>
                                                            {column.column_name}
                                                          </span>
                                                          <span className={styles.columnType}>
                                                            {column.data_type}
                                                          </span>
                                                          <span className={column.is_nullable ? styles.nullable : styles.notNull}>
                                                            {column.is_nullable ? "NULL" : "NOT NULL"}
                                                          </span>
                                                        </div>
                                                      </div>
                                                      <div
                                                        style={{
                                                          display: "flex",
                                                          alignItems: "center",
                                                          gap: "0.6rem",
                                                        }}
                                                      >
                                                        <button
                                                          type="button"
                                                          onClick={() =>
                                                            handleToggleFlAtivo("column", column.id, !(enabledStates[`column-${column.id}`]))
                                                          }
                                                          className={styles.columnToggle}
                                                        >
                                                          {enabledStates[`column-${column.id}`] ? (
                                                            <Eye />
                                                          ) : (
                                                            <EyeOff />
                                                          )}
                                                        </button>
                                                        <button
                                                          type="button"
                                                          className={styles.distinctButton}
                                                          title="Valores distintos"
                                                          onClick={() => handleShowDistinct(column.id, column.column_name)}
                                                        >
                                                          <Search size={13} />
                                                        </button>
                                                      </div>
                                                    </div>
                                                  ))}
                                                </div>
                                              )}
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.footerCloseButton}>
            <X style={{ marginRight: 8 }} />
            Fechar
          </button>
        </div>
      </div>
      <InfoModal
        isOpen={modalInfo.open}
        title="Detalhes da Tabela"
        onClose={() => setModalInfo({ open: false, content: null })}
      >
        {modalInfo.content}
      </InfoModal>
      <InfoModal
        isOpen={distinctModal.open}
        title={`Valores distintos: ${distinctModal.columnName} (${distinctModal.total})`}
        onClose={() => setDistinctModal({ open: false, values: [], columnName: "", total: 0 })}
      >
        <div style={{ maxHeight: 250, overflow: "auto", fontSize: 13, background: "#f8fafc", borderRadius: 6, padding: 10 }}>
          {distinctModal.values.length === 0
            ? <i>Nenhum valor encontrado.</i>
            : <ul>{distinctModal.values.map((v, i) => <li key={i}>{String(v)}</li>)}</ul>}
        </div>
      </InfoModal>
    </div>
  );
}