import { useState, useEffect } from "react";
import { Columns, X, AlertTriangle, Database } from "lucide-react";
import styles from "./ConnectionExplorer.module.css"; 

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export default function ConnectionExplorer({ isOpen, onClose, onColumnSelect }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [selectedConnectionType, setSelectedConnectionType] = useState("");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");

  const [connectionTypes, setConnectionTypes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [catalogsByConn, setCatalogsByConn] = useState({});
  const [schemasByCatalog, setSchemasByCatalog] = useState({});
  const [tablesBySchema, setTablesBySchema] = useState({});
  const [columnsByTable, setColumnsByTable] = useState({});

  // Load connection types on modal open
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

  // Load connections when connection type is selected
  useEffect(() => {
    if (!selectedConnectionType || selectedConnectionType === "all") {
      setConnections([]);
      return;
    }
    
    setLoading(true);
    setConnections([]);
    setSelectedConnection("");
    setSelectedCatalog("");
    setSelectedSchema("");
    setSelectedTable("");

    fetchJson("http://localhost:8004/api/data-connections/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pagination: { limit: 100, query_total: false, skip: 0 },
        connection_type_id: selectedConnectionType
      }),
    })
      .then((data) => setConnections(data.items || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedConnectionType]);

  // Load catalogs when connection is selected
  useEffect(() => {
    if (!selectedConnection) {
      setCatalogsByConn({});
      return;
    }

    setLoading(true);
    setSelectedCatalog("");
    setSelectedSchema("");
    setSelectedTable("");

    fetchJson(`http://localhost:8004/api/metadata/connections/${selectedConnection}/catalogs?fl_ativo=true`)
      .then((catalogs) => {
        setCatalogsByConn({ [selectedConnection]: catalogs });
      })
      .catch((e) => setError("Erro ao carregar catálogos."))
      .finally(() => setLoading(false));
  }, [selectedConnection]);

  // Load schemas when catalog is selected
  useEffect(() => {
    if (!selectedCatalog || !selectedConnection) {
      setSchemasByCatalog({});
      return;
    }

    setLoading(true);
    setSelectedSchema("");
    setSelectedTable("");

    fetchJson(`http://localhost:8004/api/metadata/connections/${selectedConnection}/schemas?catalog_id=${selectedCatalog}&fl_ativo=true`)
      .then((schemas) => {
        setSchemasByCatalog({ [selectedCatalog]: schemas });
      })
      .catch((e) => setError("Erro ao carregar schemas."))
      .finally(() => setLoading(false));
  }, [selectedCatalog, selectedConnection]);

  // Load tables when schema is selected
  useEffect(() => {
    if (!selectedSchema) {
      setTablesBySchema({});
      return;
    }

    setLoading(true);
    setSelectedTable("");

    fetchJson(`http://localhost:8004/api/metadata/schemas/${selectedSchema}/tables?fl_ativo=true`)
      .then((tables) => {
        setTablesBySchema({ [selectedSchema]: tables });
      })
      .catch((e) => setError("Erro ao carregar tabelas."))
      .finally(() => setLoading(false));
  }, [selectedSchema]);

  // Load columns when table is selected
  useEffect(() => {
    if (!selectedTable) {
      setColumnsByTable({});
      return;
    }

    setLoading(true);

    fetchJson(`http://localhost:8004/api/metadata/tables/${selectedTable}/columns?fl_ativo=true`)
      .then((columns) => {
        setColumnsByTable({ [selectedTable]: columns });
      })
      .catch((e) => setError("Erro ao carregar colunas."))
      .finally(() => setLoading(false));
  }, [selectedTable]);

  const handleColumnSelect = (column) => {
    const connectionType = connectionTypes.find(t => t.id == selectedConnectionType);
    const connection = connections.find(c => c.id == selectedConnection);
    const catalog = catalogsByConn[selectedConnection]?.[0]; // Assuming first catalog if multiple
    const schema = schemasByCatalog[selectedCatalog]?.[0]; // Assuming first schema if multiple
    const table = tablesBySchema[selectedSchema]?.[0]; // Assuming first table if multiple
    
    onColumnSelect({
      column,
      table,
      schema,
      catalog,
      connection,
      connectionType
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleBlock}>
              <Database className={styles.modalIcon} />
              <h2 className={styles.modalTitle}>Connection Explorer</h2>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              className={styles.modalCloseButton}
              title="Close"
            >
              <X />
            </button>
          </div>
        </div>

        {/* Selection Flow */}
        <div className={styles.selectionFlow}>
          <div className={styles.selectionStep}>
            <label className={styles.selectionLabel}>1. Connection Type:</label>
            <select
              value={selectedConnectionType}
              onChange={(e) => setSelectedConnectionType(e.target.value)}
              className={styles.selectionSelect}
            >
              <option value="">Select a connection type</option>
              {connectionTypes.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {selectedConnectionType && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>2. Data Connection:</label>
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Select a connection</option>
                {connections.map((conn) => (
                  <option value={conn.id} key={conn.id}>
                    {conn.name} ({conn.host}:{conn.port})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedConnection && catalogsByConn[selectedConnection] && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>3. Catalog:</label>
              <select
                value={selectedCatalog}
                onChange={(e) => setSelectedCatalog(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Select a catalog</option>
                {catalogsByConn[selectedConnection].map((catalog) => (
                  <option value={catalog.id} key={catalog.id}>
                    {catalog.catalog_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedCatalog && schemasByCatalog[selectedCatalog] && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>4. Schema:</label>
              <select
                value={selectedSchema}
                onChange={(e) => setSelectedSchema(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Select a schema</option>
                {schemasByCatalog[selectedCatalog].map((schema) => (
                  <option value={schema.id} key={schema.id}>
                    {schema.schema_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSchema && tablesBySchema[selectedSchema] && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>5. Table:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Select a table</option>
                {tablesBySchema[selectedSchema].map((table) => (
                  <option value={table.id} key={table.id}>
                    {table.table_name} ({table.table_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedTable && columnsByTable[selectedTable] && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>6. Column:</label>
              <div className={styles.columnsList}>
                {columnsByTable[selectedTable].map((column) => (
                  <div
                    key={column.id}
                    className={styles.columnItem}
                    onClick={() => handleColumnSelect(column)}
                  >
                    <Columns className={styles.columnIcon} />
                    <div className={styles.columnInfo}>
                      <span className={styles.columnName}>{column.column_name}</span>
                      <span className={styles.columnType}>({column.data_type})</span>
                    </div>
                    <button className={styles.selectButton}>Select</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <AlertTriangle />
            <span>{error}</span>
          </div>
        )}

        {loading && (
          <div className={styles.loadingState}>
            <div className={styles.spinner}></div>
            <span>Loading...</span>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.footerCloseButton}>
            <X style={{ marginRight: 8 }} />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

