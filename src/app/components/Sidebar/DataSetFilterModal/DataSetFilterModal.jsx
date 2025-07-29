"use client";
import { useState, useEffect } from 'react';
import { X, PlusCircle, Search, ChevronDown, Database, Table, Columns, 
  CheckCircle, AlertCircle, Eye, EyeOff, Info, Cloud, Folder, RefreshCw } from 'lucide-react';
import styles from './DataSetFilterModal.module.css';

export default function DataSetFilterModal({ isOpen, onClose }) {
  const [filterExpanded, setFilterExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dataset form state
  const [datasetForm, setDatasetForm] = useState({
    name: "",
    description: "",
    storage_type: "virtual_view",
    refresh_type: "on_demand",
    refresh_schedule: "",
    version: "1.0",
    properties: {},
    selection_mode: "tables",
    selected_tables: [],
    selected_columns: [],
    auto_include_mapped_columns: true,
    apply_value_mappings: true,
    storage_properties: {}
  });

  // Connection explorer states
  const [connections, setConnections] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState({});
  const [expandedCatalogs, setExpandedCatalogs] = useState({});
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [catalogsByConn, setCatalogsByConn] = useState({});
  const [schemasByCatalog, setSchemasByCatalog] = useState({});
  const [tablesBySchema, setTablesBySchema] = useState({});
  const [columnsByTable, setColumnsByTable] = useState({});

  // Mock data for semantic groups, dictionary, and groups
  const mockData = {
    "semantic_groups": [
      {
        "name": "Paciente",
        "description": "Dados relacionados ao paciente, como identificação, perfil e histórico.",
        "id": 1
      },
      {
        "name": "Exame",
        "description": "Informações sobre exames clínicos, laboratoriais e de imagem.",
        "id": 2
      }
    ],
    "dictionary": [
      {
        "name": "nome_completo",
        "display_name": "Nome Completo",
        "description": "Nome completo do paciente, incluindo sobrenome.",
        "data_type": "string",
        "id": 10
      },
      {
        "name": "idade",
        "display_name": "Idade",
        "description": "Idade do paciente em anos completos.",
        "data_type": "integer",
        "id": 11
      }
    ],
    "groups": [
      {
        "name": "Grupo Pacientes Jovens",
        "description": "Pacientes com idade entre 0 e 18 anos.",
        "id": 100
      },
      {
        "name": "Grupo Exames de Imagem",
        "description": "Todos exames do tipo imagem (raio-x, ressonância, tomografia).",
        "id": 101
      }
    ]
  };

  useEffect(() => {
    if (isOpen) {
      fetchConnections();
    }
  }, [isOpen]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      // Simulating API call - replace with real fetch in production
      const response = await fetch("http://localhost:8004/api/data-connections/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagination: { limit: 100, query_total: false, skip: 0 }
        })
      });
      
      if (!response.ok) throw new Error('Failed to fetch connections');
      
      const data = await response.json();
      setConnections(data.items || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExpandConnection = async (connId) => {
    setExpandedConnections(prev => ({ ...prev, [connId]: !prev[connId] }));
    
    if (!catalogsByConn[connId]) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8004/api/metadata/connections/${connId}/catalogs`);
        if (!response.ok) throw new Error('Failed to fetch catalogs');
        
        const catalogs = await response.json();
        setCatalogsByConn(prev => ({ ...prev, [connId]: catalogs }));
      } catch (err) {
        setError('Error fetching catalogs');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpandCatalog = async (connId, catalogId) => {
    const key = `${connId}-${catalogId}`;
    setExpandedCatalogs(prev => ({ ...prev, [key]: !prev[key] }));
    
    if (!schemasByCatalog[catalogId]) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8004/api/metadata/connections/${connId}/schemas?catalog_id=${catalogId}`);
        if (!response.ok) throw new Error('Failed to fetch schemas');
        
        const schemas = await response.json();
        setSchemasByCatalog(prev => ({ ...prev, [catalogId]: schemas }));
      } catch (err) {
        setError('Error fetching schemas');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpandSchema = async (schemaId) => {
    setExpandedSchemas(prev => ({ ...prev, [schemaId]: !prev[schemaId] }));
    
    if (!tablesBySchema[schemaId]) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8004/api/metadata/schemas/${schemaId}/tables`);
        if (!response.ok) throw new Error('Failed to fetch tables');
        
        const tables = await response.json();
        setTablesBySchema(prev => ({ ...prev, [schemaId]: tables }));
      } catch (err) {
        setError('Error fetching tables');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpandTable = async (tableId) => {
    setExpandedTables(prev => ({ ...prev, [tableId]: !prev[tableId] }));
    
    if (!columnsByTable[tableId]) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:8004/api/metadata/tables/${tableId}`);
        if (!response.ok) throw new Error('Failed to fetch table details');
        
        const tableDetails = await response.json();
        setColumnsByTable(prev => ({ ...prev, [tableId]: tableDetails.columns || [] }));
      } catch (err) {
        setError('Error fetching columns');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectTable = (tableId) => {
    const { selected_tables } = datasetForm;
    
    if (datasetForm.selection_mode !== 'tables') {
      setDatasetForm({
        ...datasetForm,
        selection_mode: 'tables',
        selected_columns: [], // Clear selected columns
        selected_tables: [tableId]
      });
      return;
    }
    
    if (selected_tables.includes(tableId)) {
      setDatasetForm({
        ...datasetForm,
        selected_tables: selected_tables.filter(id => id !== tableId)
      });
    } else {
      setDatasetForm({
        ...datasetForm,
        selected_tables: [...selected_tables, tableId]
      });
    }
  };

  const handleSelectColumn = (columnId) => {
    const { selected_columns } = datasetForm;
    
    if (datasetForm.selection_mode !== 'columns') {
      setDatasetForm({
        ...datasetForm,
        selection_mode: 'columns',
        selected_tables: [], // Clear selected tables
        selected_columns: [columnId]
      });
      return;
    }
    
    if (selected_columns.includes(columnId)) {
      setDatasetForm({
        ...datasetForm,
        selected_columns: selected_columns.filter(id => id !== columnId)
      });
    } else {
      setDatasetForm({
        ...datasetForm,
        selected_columns: [...selected_columns, columnId]
      });
    }
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDatasetForm({
      ...datasetForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSelectionModeChange = (mode) => {
    setDatasetForm({
      ...datasetForm,
      selection_mode: mode,
      selected_tables: mode === 'tables' ? datasetForm.selected_tables : [],
      selected_columns: mode === 'columns' ? datasetForm.selected_columns : []
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Create a clean payload, removing empty arrays based on selection mode
      const payload = { ...datasetForm };
      
      // If in tables mode, don't send empty selected_columns
      if (datasetForm.selection_mode === 'tables' && datasetForm.selected_columns.length === 0) {
        delete payload.selected_columns;
      }
      
      // If in columns mode, don't send empty selected_tables
      if (datasetForm.selection_mode === 'columns' && datasetForm.selected_tables.length === 0) {
        delete payload.selected_tables;
      }
      
      const response = await fetch("http://localhost:8004/api/datasets/unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create dataset: ${errorText}`);
      }
      
      // Success! Close modal and show confirmation
      onClose();
      alert("Dataset criado com sucesso!");
    } catch (err) {
      setError(`Error creating dataset: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar Novo Dataset</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.twoColGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Nome do Dataset</label>
              <input 
                type="text" 
                name="name"
                placeholder="Digite o nome do dataset" 
                className={styles.formInput}
                value={datasetForm.name}
                onChange={handleFormChange}
              />
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tipo de Armazenamento</label>
              <select 
                name="storage_type" 
                className={styles.formSelect}
                value={datasetForm.storage_type}
                onChange={handleFormChange}
              >
                <option value="virtual_view">Vista Virtual</option>
                <option value="materialized">Materializado</option>
                <option value="copy_to_minio">Copiar para MinIO</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Descrição</label>
            <textarea 
              name="description"
              placeholder="Digite uma descrição para o dataset" 
              className={styles.formTextarea}
              value={datasetForm.description}
              onChange={handleFormChange}
            ></textarea>
          </div>
          
          <div className={styles.twoColGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Tipo de Atualização</label>
              <select 
                name="refresh_type"
                className={styles.formSelect}
                value={datasetForm.refresh_type}
                onChange={handleFormChange}
              >
                <option value="on_demand">Sob Demanda</option>
                <option value="scheduled">Agendada</option>
                <option value="real_time">Tempo Real</option>
              </select>
            </div>
            {datasetForm.refresh_type === 'scheduled' && (
              <div className={styles.formField}>
                <label className={styles.formLabel}>Cronograma de Atualização</label>
                <input 
                  type="text" 
                  name="refresh_schedule"
                  placeholder="Cron expression (ex: 0 0 * * *)" 
                  className={styles.formInput}
                  value={datasetForm.refresh_schedule}
                  onChange={handleFormChange}
                />
              </div>
            )}
          </div>
          
          <div className={styles.selectionModeContainer}>
            <label className={styles.formLabel}>Modo de Seleção</label>
            <div className={styles.selectionModeToggle}>
              <button 
                type="button" 
                className={`${styles.selectionModeButton} ${datasetForm.selection_mode === 'tables' ? styles.selected : ''}`}
                onClick={() => handleSelectionModeChange('tables')}
              >
                <Table size={18} />
                Tabelas ({datasetForm.selected_tables.length})
              </button>
              <button 
                type="button" 
                className={`${styles.selectionModeButton} ${datasetForm.selection_mode === 'columns' ? styles.selected : ''}`}
                onClick={() => handleSelectionModeChange('columns')}
              >
                <Columns size={18} />
                Colunas ({datasetForm.selected_columns.length})
              </button>
            </div>
          </div>
          
          <div className={styles.checkboxGroup}>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox" 
                name="auto_include_mapped_columns"
                checked={datasetForm.auto_include_mapped_columns} 
                onChange={handleFormChange}
              />
              Incluir automaticamente colunas mapeadas
            </label>
            <label className={styles.checkboxLabel}>
              <input 
                type="checkbox"
                name="apply_value_mappings" 
                checked={datasetForm.apply_value_mappings} 
                onChange={handleFormChange}
              />
              Aplicar mapeamentos de valor
            </label>
          </div>
          
          <div className={styles.filterSection}>
            <div className={styles.filterHeader} onClick={() => setFilterExpanded(!filterExpanded)}>
              <h3 className={styles.filterTitle}>
                {datasetForm.selection_mode === 'tables' ? 'Selecionar Tabelas' : 'Selecionar Colunas'}
              </h3>
              <ChevronDown 
                className={`${styles.filterChevron} ${!filterExpanded ? styles.filterChevronCollapsed : ''}`} 
              />
            </div>
            
            {filterExpanded && (
              <div className={styles.filterContent}>
                <div className={styles.searchInputContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Buscar conexões, tabelas ou colunas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>
                
                {error && (
                  <div className={styles.errorMessage}>
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}
                
                <div className={styles.selectionArea}>
                  {loading ? (
                    <div className={styles.loadingState}>
                      <RefreshCw className={styles.spinningIcon} />
                      <span>Carregando...</span>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className={styles.emptyState}>
                      Nenhuma conexão encontrada. Verifique as configurações.
                    </div>
                  ) : (
                    <div className={styles.connectionsList}>
                      {connections.filter(conn => 
                        conn.name.toLowerCase().includes(searchTerm.toLowerCase())
                      ).map(connection => (
                        <div key={connection.id} className={styles.connectionCard}>
                          <div 
                            className={styles.connectionHeader}
                            onClick={() => handleExpandConnection(connection.id)}
                          >
                            <div className={styles.connectionInfo}>
                              {expandedConnections[connection.id] ? 
                                <ChevronDown className={styles.expandIcon} /> : 
                                <ChevronDown className={`${styles.expandIcon} ${styles.collapsed}`} />
                              }
                              <Database className={styles.connectionIcon} />
                              <span className={styles.connectionName}>{connection.name}</span>
                              <span className={styles.connectionType}>({connection.type})</span>
                            </div>
                          </div>
                          
                          {expandedConnections[connection.id] && (
                            <div className={styles.catalogsList}>
                              {(catalogsByConn[connection.id] || []).filter(catalog =>
                                catalog.catalog_name.toLowerCase().includes(searchTerm.toLowerCase())
                              ).map(catalog => (
                                <div key={catalog.id} className={styles.catalogCard}>
                                  <div 
                                    className={styles.catalogHeader}
                                    onClick={() => handleExpandCatalog(connection.id, catalog.id)}
                                  >
                                    <div className={styles.catalogInfo}>
                                      {expandedCatalogs[`${connection.id}-${catalog.id}`] ? 
                                        <ChevronDown className={styles.expandIcon} /> : 
                                        <ChevronDown className={`${styles.expandIcon} ${styles.collapsed}`} />
                                      }
                                      <Cloud className={styles.catalogIcon} />
                                      <span className={styles.catalogName}>{catalog.catalog_name}</span>
                                    </div>
                                  </div>
                                  
                                  {expandedCatalogs[`${connection.id}-${catalog.id}`] && (
                                    <div className={styles.schemasList}>
                                      {(schemasByCatalog[catalog.id] || []).filter(schema =>
                                        schema.schema_name.toLowerCase().includes(searchTerm.toLowerCase())
                                      ).map(schema => (
                                        <div key={schema.id} className={styles.schemaCard}>
                                          <div 
                                            className={styles.schemaHeader}
                                            onClick={() => handleExpandSchema(schema.id)}
                                          >
                                            <div className={styles.schemaInfo}>
                                              {expandedSchemas[schema.id] ? 
                                                <ChevronDown className={styles.expandIcon} /> : 
                                                <ChevronDown className={`${styles.expandIcon} ${styles.collapsed}`} />
                                              }
                                              <Folder className={styles.schemaIcon} />
                                              <span className={styles.schemaName}>{schema.schema_name}</span>
                                            </div>
                                          </div>
                                          
                                          {expandedSchemas[schema.id] && (
                                            <div className={styles.tablesList}>
                                              {(tablesBySchema[schema.id] || []).filter(table =>
                                                table.table_name.toLowerCase().includes(searchTerm.toLowerCase())
                                              ).map(table => (
                                                <div key={table.id} className={styles.tableCard}>
                                                  <div className={styles.tableHeader}>
                                                    <div 
                                                      className={styles.tableInfo}
                                                      onClick={() => handleExpandTable(table.id)}
                                                    >
                                                      {expandedTables[table.id] ? 
                                                        <ChevronDown className={styles.expandIcon} /> : 
                                                        <ChevronDown className={`${styles.expandIcon} ${styles.collapsed}`} />
                                                      }
                                                      <Table className={styles.tableIcon} />
                                                      <span className={styles.tableName}>{table.table_name}</span>
                                                      <span className={styles.tableRows}>
                                                        {table.estimated_row_count ? `(${table.estimated_row_count} linhas)` : ''}
                                                      </span>
                                                    </div>
                                                    {datasetForm.selection_mode === 'tables' && (
                                                      <button 
                                                        className={`${styles.selectButton} ${
                                                          datasetForm.selected_tables.includes(table.id) ? styles.selected : ''
                                                        }`}
                                                        onClick={() => handleSelectTable(table.id)}
                                                        type="button"
                                                      >
                                                        {datasetForm.selected_tables.includes(table.id) ? (
                                                          <CheckCircle className={styles.selectIcon} />
                                                        ) : (
                                                          'Selecionar'
                                                        )}
                                                      </button>
                                                    )}
                                                  </div>
                                                  
                                                  {expandedTables[table.id] && datasetForm.selection_mode === 'columns' && (
                                                    <div className={styles.columnsList}>
                                                      {(columnsByTable[table.id] || []).filter(column =>
                                                        column.column_name.toLowerCase().includes(searchTerm.toLowerCase())
                                                      ).map(column => (
                                                        <div key={column.id} className={styles.columnCard}>
                                                          <div className={styles.columnInfo}>
                                                            <Columns className={styles.columnIcon} />
                                                            <span className={styles.columnName}>{column.column_name}</span>
                                                            <span className={styles.columnType}>{column.data_type}</span>
                                                          </div>
                                                          <button 
                                                            className={`${styles.selectButton} ${
                                                              datasetForm.selected_columns.includes(column.id) ? styles.selected : ''
                                                            }`}
                                                            onClick={() => handleSelectColumn(column.id)}
                                                            type="button"
                                                          >
                                                            {datasetForm.selected_columns.includes(column.id) ? (
                                                              <CheckCircle className={styles.selectIcon} />
                                                            ) : (
                                                              'Selecionar'
                                                            )}
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {/* Render the static sections (SemanticGroups, Dictionary, Groups) */}
                      <div className={styles.staticMetadataSection}>
                        <div className={styles.sectionTitle}>
                          <h4>Grupos Semânticos</h4>
                          <span className={styles.badge}>Estrutural</span>
                        </div>
                        <div className={styles.metadataItems}>
                          {mockData.semantic_groups.filter(group => 
                            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            group.description.toLowerCase().includes(searchTerm.toLowerCase())
                          ).map(group => (
                            <div key={group.id} className={styles.metadataItem}>
                              <div className={styles.metadataInfo}>
                                <span className={styles.metadataName}>{group.name}</span>
                                <p className={styles.metadataDescription}>{group.description}</p>
                              </div>
                              {datasetForm.selection_mode === 'tables' && (
                                <button 
                                  className={`${styles.selectButton} ${
                                    datasetForm.selected_tables.includes(group.id) ? styles.selected : ''
                                  }`}
                                  onClick={() => handleSelectTable(group.id)}
                                  type="button"
                                >
                                  {datasetForm.selected_tables.includes(group.id) ? (
                                    <CheckCircle className={styles.selectIcon} />
                                  ) : (
                                    'Selecionar'
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className={styles.staticMetadataSection}>
                        <div className={styles.sectionTitle}>
                          <h4>Dicionário de Dados</h4>
                          <span className={styles.badgeClinical}>Integrado</span>
                        </div>
                        <div className={styles.metadataItems}>
                          {mockData.dictionary.filter(item => 
                            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            item.display_name.toLowerCase().includes(searchTerm.toLowerCase())
                          ).map(item => (
                            <div key={item.id} className={styles.metadataItem}>
                              <div className={styles.metadataInfo}>
                                <span className={styles.metadataName}>{item.display_name}</span>
                                <span className={styles.metadataType}>({item.data_type})</span>
                                <p className={styles.metadataDescription}>{item.description}</p>
                              </div>
                              {datasetForm.selection_mode === 'columns' && (
                                <button 
                                  className={`${styles.selectButton} ${
                                    datasetForm.selected_columns.includes(item.id) ? styles.selected : ''
                                  }`}
                                  onClick={() => handleSelectColumn(item.id)}
                                  type="button"
                                >
                                  {datasetForm.selected_columns.includes(item.id) ? (
                                    <CheckCircle className={styles.selectIcon} />
                                  ) : (
                                    'Selecionar'
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className={styles.staticMetadataSection}>
                        <div className={styles.sectionTitle}>
                          <h4>Grupos de Dados</h4>
                          <span className={styles.badgeUser}>Usuário</span>
                        </div>
                        <div className={styles.metadataItems}>
                          {mockData.groups.filter(group => 
                            group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            group.description.toLowerCase().includes(searchTerm.toLowerCase())
                          ).map(group => (
                            <div key={group.id} className={styles.metadataItem}>
                              <div className={styles.metadataInfo}>
                                <span className={styles.metadataName}>{group.name}</span>
                                <p className={styles.metadataDescription}>{group.description}</p>
                              </div>
                              {datasetForm.selection_mode === 'tables' && (
                                <button 
                                  className={`${styles.selectButton} ${
                                    datasetForm.selected_tables.includes(group.id) ? styles.selected : ''
                                  }`}
                                  onClick={() => handleSelectTable(group.id)}
                                  type="button"
                                >
                                  {datasetForm.selected_tables.includes(group.id) ? (
                                    <CheckCircle className={styles.selectIcon} />
                                  ) : (
                                    'Selecionar'
                                  )}
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className={styles.selectionSummary}>
                  <h4 className={styles.summaryTitle}>Itens Selecionados</h4>
                  {datasetForm.selection_mode === 'tables' ? (
                    <div className={styles.selectedItems}>
                      {datasetForm.selected_tables.length === 0 ? (
                        <p className={styles.emptySelection}>Nenhuma tabela selecionada</p>
                      ) : (
                        <div className={styles.selectedCount}>
                          {datasetForm.selected_tables.length} tabela(s) selecionada(s)
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.selectedItems}>
                      {datasetForm.selected_columns.length === 0 ? (
                        <p className={styles.emptySelection}>Nenhuma coluna selecionada</p>
                      ) : (
                        <div className={styles.selectedCount}>
                          {datasetForm.selected_columns.length} coluna(s) selecionada(s)
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className={styles.formActions}>
            <button 
              className={styles.secondaryButton} 
              onClick={onClose}
              disabled={loading}
            >
              Cancelar
            </button>
            <button 
              className={styles.primaryButton}
              onClick={handleSubmit}
              disabled={loading || (datasetForm.selection_mode === 'tables' && datasetForm.selected_tables.length === 0) || 
                        (datasetForm.selection_mode === 'columns' && datasetForm.selected_columns.length === 0)}
            >
              {loading ? 'Processando...' : 'Criar Dataset'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}