import { useState, useEffect } from "react";
import { Search, Loader2, AlertTriangle, Info, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
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
      .catch(e => setError("Erro ao buscar colunas: " + e.message))
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
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Info className={styles.sectionInfoIcon} /> Colunas Disponíveis</h3>
      </div>
      <div className={styles.sectionSearchRow}>
        <select className={styles.sectionSelect} value={connectionId} onChange={e => {
          setConnectionId(e.target.value);
          setSchemaId("");
          setTableId("");
        }}>
          <option value="">Conexão...</option>
          {connectionsList.map(conn => <option key={conn.id} value={conn.id}>{conn.name}</option>)}
        </select>
        <select className={styles.sectionSelect} value={schemaId} onChange={e => {
          setSchemaId(e.target.value);
          setTableId("");
        }}>
          <option value="">Schema...</option>
          {schemasList.filter(s => s.connection_id == connectionId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select className={styles.sectionSelect} value={tableId} onChange={e => setTableId(e.target.value)}>
          <option value="">Tabela...</option>
          {tablesList.filter(t => t.schema_id == schemaId).map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <div className={styles.sectionSearchBlock}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar coluna..."
            className={styles.sectionSearchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input type="checkbox" checked={excludeMapped} onChange={e => setExcludeMapped(e.target.checked)} />
          Excluir mapeadas
        </label>
      </div>
      {loading ? (
        <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
      ) : error ? (
        <div className={styles.sectionError}><AlertTriangle /> {error}</div>
      ) : filtered.length === 0 ? (
        <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhuma coluna encontrada.</div>
      ) : (
        <table className={styles.availableColumnsTable}>
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>Tipo</th>
              <th>NULL?</th>
              <th>Tabela</th>
              <th>Schema</th>
              <th>Descrição</th>
              <th>Amostras</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(col => (
              <>
                <tr key={col.id}>
                  <td>
                    <button className={styles.expandBtn} onClick={() => toggleExpand(col.id)}>
                      {expanded[col.id] ? <ChevronDown /> : <ChevronRight />}
                    </button>
                  </td>
                  <td><b>{col.column_name}</b></td>
                  <td>{col.data_type}</td>
                  <td>
                    {col.is_nullable ? <Eye className={styles.textGreen} /> : <EyeOff className={styles.textRed} />}
                  </td>
                  <td>{col.table_name}</td>
                  <td>{col.schema_name}</td>
                  <td style={{ maxWidth: 190, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                    {col.description}
                  </td>
                  <td>
                    {(col.sample_values || []).slice(0, 3).map((v, i) => (
                      <span key={i} className={styles.sampleValue}>{String(v)}</span>
                    ))}
                  </td>
                </tr>
                {expanded[col.id] && (
                  <tr>
                    <td colSpan={8} style={{ background: "#f1f5f9" }}>
                      <div style={{ fontSize: 13, color: "#1e293b", padding: 12 }}>
                        <div><b>ID:</b> {col.id}</div>
                        <div><b>Nome:</b> {col.column_name}</div>
                        <div><b>Tipo:</b> {col.data_type}</div>
                        <div><b>NULL?</b> {col.is_nullable ? "Sim" : "Não"}</div>
                        <div><b>Tabela:</b> {col.table_name}</div>
                        <div><b>Schema:</b> {col.schema_name}</div>
                        <div><b>Descrição:</b> {col.description || <i>—</i>}</div>
                        <div><b>Amostras:</b> {(col.sample_values || []).join(", ")}</div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}