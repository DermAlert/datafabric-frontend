import { useState, useEffect } from "react";
import { Columns,Plus, Edit, Trash2, Save, X, AlertTriangle, Info, Search, Eye, ChevronDown, ChevronRight, Link2, CheckCircle, Database } from "lucide-react";
import styles from './ColumnMappingsSection.module.css';
import {
  api_searchColumnMappings,
  api_postColumnMapping,
  api_putColumnMapping,
  api_deleteColumnMapping,
  api_searchColumnGroups,
  api_getAvailableColumns,
  api_getColumnGroup,
  api_getValueMappingsByGroup,
  api_postValueMapping,
  api_putValueMapping,
  api_deleteValueMapping,
} from '../api'

// Fetch functions for connection explorer
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
function ConnectionExplorerModal({ isOpen, onClose, onColumnSelect }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedConnections, setExpandedConnections] = useState({});
  const [expandedCatalogs, setExpandedCatalogs] = useState({});
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Selection state
  const [selectedConnectionType, setSelectedConnectionType] = useState("");
  const [selectedConnection, setSelectedConnection] = useState("");
  const [selectedCatalog, setSelectedCatalog] = useState("");
  const [selectedSchema, setSelectedSchema] = useState("");
  const [selectedTable, setSelectedTable] = useState("");
  const [selectedColumn, setSelectedColumn] = useState("");

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
    setSelectedColumn("");
    
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
    setSelectedColumn("");

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
    setSelectedColumn("");

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
    setSelectedColumn("");

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
    setSelectedColumn("");

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
    const catalog = catalogsByConn[selectedConnection]?.find(c => c.id == selectedCatalog);
    const schema = schemasByCatalog[selectedCatalog]?.find(s => s.id == selectedSchema);
    const table = tablesBySchema[selectedSchema]?.find(t => t.id == selectedTable);
    
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
              <h2 className={styles.modalTitle}>Explorador de Conexões</h2>
            </div>
          </div>
          <div className={styles.modalActions}>
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

        {/* Selection Flow */}
        <div className={styles.selectionFlow}>
          <div className={styles.selectionStep}>
            <label className={styles.selectionLabel}>1. Tipo de Conexão:</label>
            <select
              value={selectedConnectionType}
              onChange={(e) => setSelectedConnectionType(e.target.value)}
              className={styles.selectionSelect}
            >
              <option value="">Selecione um tipo de conexão</option>
              {connectionTypes.map((type) => (
                <option value={type.id} key={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>

          {selectedConnectionType && (
            <div className={styles.selectionStep}>
              <label className={styles.selectionLabel}>2. Conexão de Dados:</label>
              <select
                value={selectedConnection}
                onChange={(e) => setSelectedConnection(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Selecione uma conexão</option>
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
              <label className={styles.selectionLabel}>3. Catálogo:</label>
              <select
                value={selectedCatalog}
                onChange={(e) => setSelectedCatalog(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Selecione um catálogo</option>
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
                <option value="">Selecione um schema</option>
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
              <label className={styles.selectionLabel}>5. Tabela:</label>
              <select
                value={selectedTable}
                onChange={(e) => setSelectedTable(e.target.value)}
                className={styles.selectionSelect}
                disabled={loading}
              >
                <option value="">Selecione uma tabela</option>
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
              <label className={styles.selectionLabel}>6. Coluna:</label>
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
                    <button className={styles.selectButton}>Selecionar</button>
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
            <span>Carregando...</span>
          </div>
        )}

        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.footerCloseButton}>
            <X style={{ marginRight: 8 }} />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;

export default function ColumnMappingsSection() {
  const [groups, setGroups] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMapping, setModalMapping] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showValueModal, setShowValueModal] = useState(false);
  const [modalValue, setModalValue] = useState(null);
  const [valueMappings, setValueMappings] = useState([]);
  const [valueGroup, setValueGroup] = useState(null);
  const [valueColumnId, setValueColumnId] = useState(null);
  const [expandedMapping, setExpandedMapping] = useState(null);

  // Connection Explorer Modal state
  const [showConnectionExplorer, setShowConnectionExplorer] = useState(false);

  useEffect(() => {
    api_searchColumnGroups({ pagination: { limit: 1000, query_total: false, skip: 0 } })
      .then(g => setGroups(g.items || []))
      .catch(() => setGroups([]));
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        pagination: { limit: PAGE_SIZE, query_total: true, skip: page * PAGE_SIZE }
      };
      if (filterGroup) body.group_id = Number(filterGroup);
      if (filterColumn) body.column_id = Number(filterColumn);
      if (search.trim()) body.notes = search.trim();
      const res = await api_searchColumnMappings(body);
      setMappings(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError("Falha ao carregar mapeamentos: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMappings(); }, [search, filterGroup, filterColumn, page]);

  const doFetchAvailableColumns = async (group_id) => {
    try {
      const group = await api_getColumnGroup(group_id);
      if (!group.table_id || !group.connection_id || !group.schema_id) {
        setAvailableColumns([]);
        return;
      }
      const resp = await api_getAvailableColumns({
        connection_id: group.connection_id,
        schema_id: group.schema_id,
        table_id: group.table_id,
        exclude_mapped: true,
        fl_ativo: true, // Add fl_ativo=true flag
      });
      setAvailableColumns(resp.columns || []);
    } catch {
      setAvailableColumns([]);
    }
  };

  function openAdd() {
    setModalMapping({
      group_id: "",
      column_id: "",
      transformation_rule: "",
      confidence_score: 1,
      notes: "",
    });
    setShowModal(true);
    setAvailableColumns([]);
  }

  function openEdit(mapping) {
    setModalMapping({ ...mapping });
    setShowModal(true);
    setAvailableColumns([]);
    if (mapping.group_id) doFetchAvailableColumns(mapping.group_id);
  }

  function closeModal() { setShowModal(false); setModalMapping(null); setAvailableColumns([]); }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalMapping.id) {
        await api_putColumnMapping(modalMapping.id, {
          transformation_rule: modalMapping.transformation_rule,
          confidence_score: Number(modalMapping.confidence_score),
          notes: modalMapping.notes,
        });
      } else {
        await api_postColumnMapping({
          group_id: Number(modalMapping.group_id),
          column_id: Number(modalMapping.column_id),
          transformation_rule: modalMapping.transformation_rule,
          confidence_score: Number(modalMapping.confidence_score),
          notes: modalMapping.notes,
        });
      }
      closeModal();
      fetchMappings();
    } catch (e) {
      setError("Falha ao salvar mapeamento: " + e.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteColumnMapping(confirmDelete.id);
      setConfirmDelete(null);
      fetchMappings();
    } catch (e) {
      setError("Falha ao excluir mapeamento: " + e.message);
      setLoading(false);
    }
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  // Value mappings
  const openValueMappings = async (group_id, column_id) => {
    setValueGroup(group_id);
    setValueColumnId(column_id);
    setShowValueModal(true);
    setModalValue(null);
    setLoading(true);
    try {
      const values = await api_getValueMappingsByGroup(group_id, column_id);
      setValueMappings(values || []);
    } catch {
      setValueMappings([]);
    }
    setLoading(false);
  };

  const closeValueModal = () => {
    setShowValueModal(false);
    setValueMappings([]);
    setValueGroup(null);
    setValueColumnId(null);
    setModalValue(null);
  };

  const handleValueSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalValue.id) {
        await api_putValueMapping(modalValue.id, {
          source_value: modalValue.source_value,
          standard_value: modalValue.standard_value,
          description: modalValue.description,
        });
      } else {
        await api_postValueMapping({
          group_id: valueGroup,
          source_column_id: valueColumnId,
          source_value: modalValue.source_value,
          standard_value: modalValue.standard_value,
          description: modalValue.description,
        });
      }
      setModalValue(null);
      const values = await api_getValueMappingsByGroup(valueGroup, valueColumnId);
      setValueMappings(values || []);
    } catch (e) {
      setError("Falha ao salvar mapeamento de valor: " + e.message);
      setLoading(false);
    }
  };

  const handleValueDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteValueMapping(id);
      const values = await api_getValueMappingsByGroup(valueGroup, valueColumnId);
      setValueMappings(values || []);
    } catch (e) {
      setError("Falha ao excluir mapeamento de valor: " + e.message);
      setLoading(false);
    }
  };

  const toggleMappingExpand = (mappingId) => {
    setExpandedMapping(expandedMapping === mappingId ? null : mappingId);
  };

const handleColumnSelect = (selectionData) => {
  // Handle the selected column data
  console.log('Selected column data:', selectionData);
  
  if (modalMapping && selectionData.column) {
    setModalMapping(prev => ({
      ...prev,
      column_id: selectionData.column.id.toString(), // Convert to string to match the select value format
      // Optionally, you can also update notes with selection context
      notes: prev.notes + (prev.notes ? '\n' : '') + 
             `Selected from: ${selectionData.connectionType?.name} > ${selectionData.connection?.name} > ` +
             `${selectionData.catalog?.catalog_name} > ${selectionData.schema?.schema_name} > ` +
             `${selectionData.table?.table_name} > ${selectionData.column.column_name}`
    }));
    
    // Update available columns to include the selected one if it's not already there
    setAvailableColumns(prev => {
      const exists = prev.some(col => col.id === selectionData.column.id);
      if (!exists) {
        return [...prev, selectionData.column];
      }
      return prev;
    });
  }
};

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Database className={styles.titleIcon} />
            Mapeamentos de Colunas
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {total} Mapeamentos
            </span>
            <span className={styles.groupBadge}>
              {groups.length} Grupos
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            Novo Mapeamento
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Pesquisar mapeamentos..."
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        
        <select 
          className={styles.filterSelect} 
          value={filterGroup} 
          onChange={e => { setFilterGroup(e.target.value); setPage(0); }}
        >
          <option value="">Todos os Grupos</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        
        <input
          className={styles.filterInput}
          type="number"
          value={filterColumn}
          onChange={e => { setFilterColumn(e.target.value); setPage(0); }}
          placeholder="ID da Coluna"
          min={0}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Carregando mapeamentos...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : mappings.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>Nenhum mapeamento encontrado</p>
          <button 
            className={styles.secondaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            Criar seu primeiro mapeamento
          </button>
        </div>
      ) : (
        <div className={styles.mappingsContainer}>
          {mappings.map(mapping => (
            <div key={mapping.id} className={styles.mappingCard}>
              <div 
                className={styles.mappingHeader}
                onClick={() => toggleMappingExpand(mapping.id)}
              >
                <div className={styles.mappingTitle}>
                  {expandedMapping === mapping.id ? (
                    <ChevronDown className={styles.chevronIcon} />
                  ) : (
                    <ChevronRight className={styles.chevronIcon} />
                  )}
                  <h3 className={styles.mappingName}>
                    {groups.find(g => g.id === mapping.group_id)?.name || `Grupo ${mapping.group_id}`}
                    <span className={styles.columnId}>ID da Coluna: {mapping.column_id}</span>
                  </h3>
                </div>
                <div className={styles.mappingActions}>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(mapping);
                    }}
                    title="Editar"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: mapping.id, column_id: mapping.column_id });
                    }}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openValueMappings(mapping.group_id, mapping.column_id);
                    }}
                    title="Mapeamentos de Valores"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {expandedMapping === mapping.id && (
                <div className={styles.mappingDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Regra de Transformação:</span>
                    <span className={styles.detailValue}>
                      {mapping.transformation_rule || <em>Nenhuma definida</em>}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Confiança:</span>
                    <span className={styles.confidenceBadge}>
                      {mapping.confidence_score}
                    </span>
                  </div>
                  {mapping.notes && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Observações:</span>
                      <span className={styles.detailValue}>
                        {mapping.notes}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton}
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(p - 1, 0))}
            >
              Anterior
            </button>
            <span className={styles.pageInfo}>
              Página {page + 1} de {pageCount || 1}
            </span>
            <button 
              className={styles.paginationButton}
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalMapping.id ? "Editar Mapeamento" : "Criar Novo Mapeamento"}
              </h3>
              <button 
                className={styles.modalCloseButton}
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Grupo *</label>
                <select
                  className={styles.formInput}
                  required
                  value={modalMapping.group_id || ""}
                  onChange={e => {
                    setModalMapping(mm => ({ ...mm, group_id: e.target.value }));
                    if (e.target.value) doFetchAvailableColumns(Number(e.target.value));
                  }}
                  disabled={!!modalMapping.id}
                >
                  <option value="">Selecione um grupo</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coluna *</label>
                <div className={styles.columnSelectContainer}>
                  <select
                    className={styles.formInput}
                    required
                    value={modalMapping.column_id || ""}
                    onChange={e => setModalMapping(mm => ({ ...mm, column_id: e.target.value }))}
                    disabled={!!modalMapping.id}
                  >
                    <option value="">Selecione uma coluna</option>
                    {availableColumns.map(col => (
                      <option key={col.id} value={col.id}>
                        {col.column_name} (ID: {col.id}) [{col.data_type}]
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className={styles.explorerButton}
                    onClick={() => setShowConnectionExplorer(true)}
                    title="Explorar Conexões"
                  >
                    <Search size={16} />
                    Explorar
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Regra de Transformação</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={modalMapping.transformation_rule}
                  onChange={e => setModalMapping(mm => ({ ...mm, transformation_rule: e.target.value }))}
                  placeholder="ex: UPPER({column})"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Pontuação de Confiança (0-1) *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  required
                  min="0"
                  max="1"
                  step="0.01"
                  value={modalMapping.confidence_score}
                  onChange={e => setModalMapping(mm => ({ ...mm, confidence_score: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Observações</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalMapping.notes}
                  onChange={e => setModalMapping(mm => ({ ...mm, notes: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeModal}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  <Save size={16} className={styles.buttonIcon} />
                  {modalMapping.id ? "Atualizar" : "Criar"} Mapeamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirmar Exclusão</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmDelete(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.alertBox}>
                <AlertTriangle className={styles.alertIcon} />
                <p>
                  Tem certeza de que deseja excluir o mapeamento para a coluna ID <strong>{confirmDelete.column_id}</strong>?
                  Esta ação não pode ser desfeita.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setConfirmDelete(null)}
              >
                Cancelar
              </button>
              <button
                className={styles.dangerButton}
                onClick={handleDelete}
              >
                <Trash2 size={16} className={styles.buttonIcon} />
                Excluir Mapeamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Value Mappings Modal */}
      {showValueModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.largeModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Mapeamentos de Valores</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={closeValueModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.valueMappingsHeader}>
                <h4 className={styles.subtitle}>
                  ID da Coluna: {valueColumnId}
                  {valueGroup && (
                    <span className={styles.groupName}>
                      {groups.find(g => g.id === valueGroup)?.name || `Grupo ${valueGroup}`}
                    </span>
                  )}
                </h4>
                <button
                  className={styles.primaryButton}
                  onClick={() => setModalValue({ source_value: "", standard_value: "", description: "" })}
                >
                  <Plus className={styles.buttonIcon} />
                  Novo Mapeamento de Valor
                </button>
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Carregando mapeamentos de valores...</p>
                </div>
              ) : valueMappings.length === 0 ? (
                <div className={styles.emptyState}>
                  <Info className={styles.emptyIcon} />
                  <p>Nenhum mapeamento de valor definido para esta coluna</p>
                </div>
              ) : (
                <div className={styles.valueMappingsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Valor de Origem</th>
                        <th>Valor Padrão</th>
                        <th>Descrição</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valueMappings.map(vm => (
                        <tr key={vm.id}>
                          <td>{vm.source_value}</td>
                          <td>{vm.standard_value}</td>
                          <td>{vm.description || '-'}</td>
                          <td>
                            <button
                              className={styles.iconButton}
                              onClick={() => setModalValue(vm)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleValueDelete(vm.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Value Mapping Edit Modal */}
      {modalValue && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalValue.id ? "Editar Mapeamento de Valor" : "Criar Mapeamento de Valor"}
              </h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setModalValue(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleValueSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Valor de Origem *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalValue.source_value}
                  onChange={e => setModalValue(mv => ({ ...mv, source_value: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Valor Padrão *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalValue.standard_value}
                  onChange={e => setModalValue(mv => ({ ...mv, standard_value: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Descrição</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalValue.description}
                  onChange={e => setModalValue(mv => ({ ...mv, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setModalValue(null)}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  <Save size={16} className={styles.buttonIcon} />
                  {modalValue.id ? "Atualizar" : "Criar"} Mapeamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connection Explorer Modal */}
      <ConnectionExplorerModal
        isOpen={showConnectionExplorer}
        onClose={() => setShowConnectionExplorer(false)}
        onColumnSelect={handleColumnSelect}
      />
    </div>
  );
}
