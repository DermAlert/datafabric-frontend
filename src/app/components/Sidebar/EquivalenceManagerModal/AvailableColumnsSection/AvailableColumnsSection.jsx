import { useState, useEffect } from "react";
import { Search, AlertTriangle, Info, Eye, EyeOff, ChevronDown, ChevronRight, Database } from "lucide-react";
import styles from "./AvailableColumnsSection.module.css";
import { api_getAvailableColumns } from '../api'

// These lists should come from your app context or props
const connectionsList = [];
const schemasList = [];
const tablesList = [];

export default function AvailableColumnsSection() {
  const [connectionId, setConnectionId] = useState("");
  const [schemaId, setSchemaId] = useState("");
  const [tableId, setTableId] = useState("");
  const [excludeMapped, setExcludeMapped] = useState(true);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (!connectionId || !schemaId || !tableId) {
      setColumns([]);
      return;
    }
    setLoading(true);
    setError(null);
    api_getAvailableColumns({
      connection_id: Number(connectionId),
      schema_id: Number(schemaId),
      table_id: Number(tableId),
      exclude_mapped: excludeMapped,
    })
      .then(resp => setColumns(resp.columns || []))
      .catch(e => setError("Failed to load columns: " + e.message))
      .finally(() => setLoading(false));
  }, [connectionId, schemaId, tableId, excludeMapped]);

  const filtered = columns.filter(col =>
    (!search.trim() ||
      col.column_name.toLowerCase().includes(search.trim().toLowerCase()) ||
      (col.description || "").toLowerCase().includes(search.trim().toLowerCase()) ||
      (col.data_type || "").toLowerCase().includes(search.trim().toLowerCase()))
  );

  const toggleExpand = id =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Database className={styles.titleIcon} />
            Available Columns
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {filtered.length} Columns
            </span>
            {connectionId && (
              <span className={styles.connectionBadge}>
                Connection {connectionId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchRow}>
        <select 
          className={styles.filterSelect} 
          value={connectionId} 
          onChange={e => {
            setConnectionId(e.target.value);
            setSchemaId("");
            setTableId("");
          }}
        >
          <option value="">Select Connection...</option>
          {connectionsList.map(conn => (
            <option key={conn.id} value={conn.id}>{conn.name}</option>
          ))}
        </select>
        
        <select 
          className={styles.filterSelect} 
          value={schemaId} 
          onChange={e => {
            setSchemaId(e.target.value);
            setTableId("");
          }}
        >
          <option value="">Select Schema...</option>
          {schemasList.filter(s => s.connection_id == connectionId).map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        
        <select 
          className={styles.filterSelect} 
          value={tableId} 
          onChange={e => setTableId(e.target.value)}
        >
          <option value="">Select Table...</option>
          {tablesList.filter(t => t.schema_id == schemaId).map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search columns..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <label className={styles.checkboxContainer}>
          <input 
            type="checkbox" 
            checked={excludeMapped} 
            onChange={e => setExcludeMapped(e.target.checked)} 
          />
          <span className={styles.checkboxLabel}>Exclude mapped</span>
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>Loading columns...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No columns found</p>
          {!connectionId && (
            <p className={styles.emptyHint}>Select a connection, schema, and table to view available columns</p>
          )}
        </div>
      ) : (
        <div className={styles.columnsContainer}>
          {filtered.map(col => (
            <div key={col.id} className={styles.columnCard}>
              <div 
                className={styles.columnHeader}
                onClick={() => toggleExpand(col.id)}
              >
                <div className={styles.columnTitle}>
                  {expanded[col.id] ? (
                    <ChevronDown className={styles.chevronIcon} />
                  ) : (
                    <ChevronRight className={styles.chevronIcon} />
                  )}
                  <h3 className={styles.columnName}>
                    {col.column_name}
                    <span className={styles.columnType}>{col.data_type}</span>
                  </h3>
                </div>
                <div className={styles.columnMeta}>
                  {col.is_nullable ? (
                    <Eye className={styles.nullableIcon} title="Nullable" />
                  ) : (
                    <EyeOff className={styles.notNullIcon} title="Not Nullable" />
                  )}
                  <span className={styles.tableInfo}>
                    {col.table_name}.{col.schema_name}
                  </span>
                </div>
              </div>

              {expanded[col.id] && (
                <div className={styles.columnDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>ID:</span>
                    <span className={styles.detailValue}>{col.id}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Data Type:</span>
                    <span className={styles.detailValue}>{col.data_type}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Nullable:</span>
                    <span className={styles.detailValue}>
                      {col.is_nullable ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Table:</span>
                    <span className={styles.detailValue}>{col.table_name}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Schema:</span>
                    <span className={styles.detailValue}>{col.schema_name}</span>
                  </div>
                  {col.description && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Description:</span>
                      <span className={styles.detailValue}>{col.description}</span>
                    </div>
                  )}
                  {col.sample_values && col.sample_values.length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Sample Values:</span>
                      <div className={styles.sampleValues}>
                        {col.sample_values.map((value, i) => (
                          <span key={i} className={styles.sampleValue}>
                            {String(value)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

