import React, { useState, useEffect, useMemo } from 'react';
import {
  X, Database, Server, Table, Columns, Search, ChevronDown, ChevronRight,
  Eye, EyeOff, RefreshCw, CheckCircle, XCircle, AlertCircle, Activity, Folder, Cloud, Zap
} from 'lucide-react';
import styles from './ConnectionExplorerModal.module.css';

export default function ConnectionExplorerModal({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedConnections, setExpandedConnections] = useState({});
  const [expandedSchemas, setExpandedSchemas] = useState({});
  const [expandedTables, setExpandedTables] = useState({});
  const [enabledStates, setEnabledStates] = useState({});
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [showEnabledOnly, setShowEnabledOnly] = useState(false);

  // Mock data structure representing connections, schemas, tables, and columns
  const [connections, setConnections] = useState([
    {
      id: 'minio-1',
      name: 'MinIO Principal',
      type: 'MinIO',
      status: 'connected',
      host: 'minio.datacenter.com',
      port: 9000,
      description: 'Armazenamento de objetos principal',
      lastSync: '2024-01-15T10:30:00Z',
      schemas: [
        {
          id: 'medical-images',
          name: 'medical-images',
          description: 'Imagens médicas organizadas por tipo',
          tables: [
            {
              id: 'skin-cancer-light',
              name: 'skin-cancer-light',
              type: 'bucket',
              description: 'Imagens de câncer de pele - pele clara',
              rowCount: 15420,
              size: '2.3 GB',
              columns: [
                { id: 'image_id', name: 'image_id', type: 'string', nullable: false, description: 'Identificador único da imagem' },
                { id: 'patient_id', name: 'patient_id', type: 'string', nullable: false, description: 'ID do paciente' },
                { id: 'diagnosis', name: 'diagnosis', type: 'string', nullable: true, description: 'Diagnóstico da lesão' },
                { id: 'image_path', name: 'image_path', type: 'string', nullable: false, description: 'Caminho da imagem' },
                { id: 'upload_date', name: 'upload_date', type: 'datetime', nullable: false, description: 'Data de upload' }
              ]
            },
            {
              id: 'skin-cancer-dark',
              name: 'skin-cancer-dark',
              type: 'bucket',
              description: 'Imagens de câncer de pele - pele escura',
              rowCount: 8760,
              size: '1.8 GB',
              columns: [
                { id: 'image_id', name: 'image_id', type: 'string', nullable: false, description: 'Identificador único da imagem' },
                { id: 'patient_id', name: 'patient_id', type: 'string', nullable: false, description: 'ID do paciente' },
                { id: 'diagnosis', name: 'diagnosis', type: 'string', nullable: true, description: 'Diagnóstico da lesão' },
                { id: 'image_path', name: 'image_path', type: 'string', nullable: false, description: 'Caminho da imagem' },
                { id: 'metadata', name: 'metadata', type: 'json', nullable: true, description: 'Metadados da imagem' }
              ]
            }
          ]
        },
        {
          id: 'backup-data',
          name: 'backup-data',
          description: 'Dados de backup e arquivos históricos',
          tables: [
            {
              id: 'daily-backups',
              name: 'daily-backups',
              type: 'bucket',
              description: 'Backups diários do sistema',
              rowCount: 365,
              size: '12.4 GB',
              columns: [
                { id: 'backup_id', name: 'backup_id', type: 'string', nullable: false, description: 'ID do backup' },
                { id: 'backup_date', name: 'backup_date', type: 'date', nullable: false, description: 'Data do backup' },
                { id: 'file_path', name: 'file_path', type: 'string', nullable: false, description: 'Caminho do arquivo' },
                { id: 'file_size', name: 'file_size', type: 'bigint', nullable: false, description: 'Tamanho do arquivo' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'postgres-1',
      name: 'PostgreSQL Analytics',
      type: 'PostgreSQL',
      status: 'connected',
      host: 'postgres.datacenter.com',
      port: 5432,
      description: 'Banco de dados principal para análises',
      lastSync: '2024-01-15T09:15:00Z',
      schemas: [
        {
          id: 'clinical_data',
          name: 'clinical_data',
          description: 'Dados clínicos dos pacientes',
          tables: [
            {
              id: 'patients',
              name: 'patients',
              type: 'table',
              description: 'Informações básicas dos pacientes',
              rowCount: 25600,
              size: '4.2 MB',
              columns: [
                { id: 'patient_id', name: 'patient_id', type: 'uuid', nullable: false, description: 'ID único do paciente' },
                { id: 'age', name: 'age', type: 'integer', nullable: true, description: 'Idade do paciente' },
                { id: 'gender', name: 'gender', type: 'varchar(10)', nullable: true, description: 'Gênero do paciente' },
                { id: 'skin_type', name: 'skin_type', type: 'integer', nullable: true, description: 'Tipo de pele (escala 1-6)' },
                { id: 'family_history', name: 'family_history', type: 'boolean', nullable: true, description: 'Histórico familiar de câncer' },
                { id: 'created_at', name: 'created_at', type: 'timestamp', nullable: false, description: 'Data de criação do registro' }
              ]
            },
            {
              id: 'diagnoses',
              name: 'diagnoses',
              type: 'table',
              description: 'Diagnósticos médicos',
              rowCount: 18300,
              size: '2.8 MB',
              columns: [
                { id: 'diagnosis_id', name: 'diagnosis_id', type: 'uuid', nullable: false, description: 'ID único do diagnóstico' },
                { id: 'patient_id', name: 'patient_id', type: 'uuid', nullable: false, description: 'ID do paciente' },
                { id: 'diagnosis_type', name: 'diagnosis_type', type: 'varchar(100)', nullable: false, description: 'Tipo de diagnóstico' },
                { id: 'severity', name: 'severity', type: 'integer', nullable: true, description: 'Gravidade (1-5)' },
                { id: 'diagnosis_date', name: 'diagnosis_date', type: 'date', nullable: false, description: 'Data do diagnóstico' },
                { id: 'doctor_id', name: 'doctor_id', type: 'uuid', nullable: false, description: 'ID do médico' }
              ]
            }
          ]
        },
        {
          id: 'analytics',
          name: 'analytics',
          description: 'Dados processados para análise',
          tables: [
            {
              id: 'ml_predictions',
              name: 'ml_predictions',
              type: 'table',
              description: 'Predições do modelo de ML',
              rowCount: 45200,
              size: '8.7 MB',
              columns: [
                { id: 'prediction_id', name: 'prediction_id', type: 'uuid', nullable: false, description: 'ID da predição' },
                { id: 'image_id', name: 'image_id', type: 'varchar(100)', nullable: false, description: 'ID da imagem analisada' },
                { id: 'model_version', name: 'model_version', type: 'varchar(20)', nullable: false, description: 'Versão do modelo' },
                { id: 'confidence_score', name: 'confidence_score', type: 'decimal(5,4)', nullable: false, description: 'Pontuação de confiança' },
                { id: 'prediction_result', name: 'prediction_result', type: 'varchar(50)', nullable: false, description: 'Resultado da predição' },
                { id: 'created_at', name: 'created_at', type: 'timestamp', nullable: false, description: 'Data da predição' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'airflow-1',
      name: 'Airflow Pipeline',
      type: 'Airflow',
      status: 'running',
      host: 'airflow.datacenter.com',
      port: 8080,
      description: 'Pipeline de processamento de dados',
      lastSync: '2024-01-15T10:45:00Z',
      schemas: [
        {
          id: 'workflows',
          name: 'workflows',
          description: 'Fluxos de trabalho automatizados',
          tables: [
            {
              id: 'etl_clinical_data',
              name: 'etl_clinical_data',
              type: 'dag',
              description: 'ETL para dados clínicos',
              rowCount: 0,
              size: '0 KB',
              columns: [
                { id: 'dag_id', name: 'dag_id', type: 'string', nullable: false, description: 'ID do DAG' },
                { id: 'execution_date', name: 'execution_date', type: 'datetime', nullable: false, description: 'Data de execução' },
                { id: 'state', name: 'state', type: 'string', nullable: false, description: 'Estado da execução' },
                { id: 'start_date', name: 'start_date', type: 'datetime', nullable: true, description: 'Data de início' },
                { id: 'end_date', name: 'end_date', type: 'datetime', nullable: true, description: 'Data de fim' }
              ]
            }
          ]
        }
      ]
    }
  ]);

   
  useEffect(() => {
    const initialStates = {};
    connections.forEach(conn => {
      initialStates[`connection-${conn.id}`] = true;
      conn.schemas.forEach(schema => {
        initialStates[`schema-${conn.id}-${schema.id}`] = true;
        schema.tables.forEach(table => {
          initialStates[`table-${conn.id}-${schema.id}-${table.id}`] = true;
          table.columns.forEach(column => {
            initialStates[`column-${conn.id}-${schema.id}-${table.id}-${column.id}`] = true;
          });
        });
      });
    });
    setEnabledStates(initialStates);
  }, [connections]);

  // Get icon for connection type
  const getConnectionIcon = (type) => {
    switch (type) {
      case 'MinIO': return <Cloud className={styles.connectionTypeIcon} />;
      case 'PostgreSQL': return <Database className={styles.connectionTypeIcon} />;
      case 'Airflow': return <Zap className={styles.connectionTypeIcon} />;
      default: return <Server className={styles.connectionTypeIcon} />;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className={styles.textGreen} />;
      case 'running': return <Activity className={styles.textBlue} />;
      case 'disconnected': return <XCircle className={styles.textRed} />;
      default: return <AlertCircle className={styles.textYellow} />;
    }
  };

  // Toggle functions
  const toggleConnection = (connectionId) => {
    setExpandedConnections(prev => ({
      ...prev,
      [connectionId]: !prev[connectionId]
    }));
  };
  const toggleSchema = (connectionId, schemaId) => {
    const key = `${connectionId}-${schemaId}`;
    setExpandedSchemas(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  const toggleTable = (connectionId, schemaId, tableId) => {
    const key = `${connectionId}-${schemaId}-${tableId}`;
    setExpandedTables(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Enable/disable functions
  const toggleEnabled = (key, type, connectionId, schemaId, tableId) => {
    setEnabledStates(prev => {
      const newStates = { ...prev };
      const newValue = !prev[key];
      newStates[key] = newValue;
      // Handle cascading disable/enable
      if (type === 'connection') {
        const conn = connections.find(c => c.id === connectionId);
        conn.schemas.forEach(schema => {
          const schemaKey = `schema-${connectionId}-${schema.id}`;
          newStates[schemaKey] = newValue;
          schema.tables.forEach(table => {
            const tableKey = `table-${connectionId}-${schema.id}-${table.id}`;
            newStates[tableKey] = newValue;
            table.columns.forEach(column => {
              const columnKey = `column-${connectionId}-${schema.id}-${table.id}-${column.id}`;
              newStates[columnKey] = newValue;
            });
          });
        });
      } else if (type === 'schema') {
        const conn = connections.find(c => c.id === connectionId);
        const schema = conn.schemas.find(s => s.id === schemaId);
        schema.tables.forEach(table => {
          const tableKey = `table-${connectionId}-${schemaId}-${table.id}`;
          newStates[tableKey] = newValue;
          table.columns.forEach(column => {
            const columnKey = `column-${connectionId}-${schemaId}-${table.id}-${column.id}`;
            newStates[columnKey] = newValue;
          });
        });
      } else if (type === 'table') {
        const conn = connections.find(c => c.id === connectionId);
        const schema = conn.schemas.find(s => s.id === schemaId);
        const table = schema.tables.find(t => t.id === tableId);
        table.columns.forEach(column => {
          const columnKey = `column-${connectionId}-${schemaId}-${tableId}-${column.id}`;
          newStates[columnKey] = newValue;
        });
      }
      return newStates;
    });
  };

  // Filter connections based on search and filters
  const filteredConnections = useMemo(() => {
    return connections.filter(conn => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = conn.name.toLowerCase().includes(search) ||
        conn.type.toLowerCase().includes(search) ||
        conn.description.toLowerCase().includes(search);

      const matchesType = filterType === 'all' || conn.type === filterType;
      const matchesEnabled = !showEnabledOnly || enabledStates[`connection-${conn.id}`];

      return matchesSearch && matchesType && matchesEnabled;
    });
  }, [connections, searchTerm, filterType, showEnabledOnly, enabledStates]);

  // Refresh connection data
  const refreshConnections = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  // Get enabled counts
  const getEnabledCounts = () => {
    let totalConnections = 0, enabledConnections = 0;
    let totalSchemas = 0, enabledSchemas = 0;
    let totalTables = 0, enabledTables = 0;
    let totalColumns = 0, enabledColumns = 0;

    connections.forEach(conn => {
      totalConnections++;
      if (enabledStates[`connection-${conn.id}`]) enabledConnections++;
      conn.schemas.forEach(schema => {
        totalSchemas++;
        if (enabledStates[`schema-${conn.id}-${schema.id}`]) enabledSchemas++;
        schema.tables.forEach(table => {
          totalTables++;
          if (enabledStates[`table-${conn.id}-${schema.id}-${table.id}`]) enabledTables++;
          table.columns.forEach(column => {
            totalColumns++;
            if (enabledStates[`column-${conn.id}-${schema.id}-${table.id}-${column.id}`]) enabledColumns++;
          });
        });
      });
    });

    return {
      connections: `${enabledConnections}/${totalConnections}`,
      schemas: `${enabledSchemas}/${totalSchemas}`,
      tables: `${enabledTables}/${totalTables}`,
      columns: `${enabledColumns}/${totalColumns}`
    };
  };

  const enabledCounts = getEnabledCounts();

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <div className={styles.headerTitleBlock}>
              <Database className={styles.modalIcon} />
              <h2 className={styles.modalTitle}>Explorador de Conexões</h2>
            </div>
            <div className={styles.modalSummary}>
              <span className={styles.summaryBadge}><Database className={styles.connectionTypeIcon} />{enabledCounts.connections}</span>
              <span className={styles.summaryBadge}><Folder className={styles.connectionTypeIcon} />{enabledCounts.schemas}</span>
              <span className={styles.summaryBadge}><Table className={styles.connectionTypeIcon} />{enabledCounts.tables}</span>
              <span className={styles.summaryBadge}><Columns className={styles.connectionTypeIcon} />{enabledCounts.columns}</span>
            </div>
          </div>
          <div className={styles.modalActions}>
            <button
              onClick={refreshConnections}
              disabled={loading}
              className={`${styles.refreshButton} ${loading ? styles.bgDisabled : ''}`}
            >
              <RefreshCw className={loading ? styles.spin : ''} />
              Atualizar
            </button>
            <button
              onClick={onClose}
              className={styles.modalCloseButton}
              title="Fechar"
            >
              <X />
            </button>
          </div>
        </div>
        {/* Controls */}
        <div className={styles.modalControls}>
          <div className={styles.modalSearchBlock}>
            <div className={styles.searchContainer}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Pesquisar conexões, esquemas, tabelas..."
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
              <option value="MinIO">MinIO</option>
              <option value="PostgreSQL">PostgreSQL</option>
              <option value="Airflow">Airflow</option>
            </select>
          </div>
          <label className={styles.enabledCheckboxLabel}>
            <input
              type="checkbox"
              checked={showEnabledOnly}
              onChange={e => setShowEnabledOnly(e.target.checked)}
              className={styles.enabledCheckbox}
            />
            Mostrar apenas habilitados
          </label>
        </div>
        {/* Content */}
        <div className={styles.modalContent}>
          {filteredConnections.length === 0 ? (
            <div className={styles.emptyConnections}>
              <AlertCircle />
              <span>Nenhuma conexão encontrada para os filtros atuais.</span>
            </div>
          ) : (
            filteredConnections.map(connection => (
              <div key={connection.id} className={styles.connectionCard}>
                {/* Connection Header */}
                <div className={styles.connectionHeader}>
                  <div className={styles.connectionHeaderLeft}>
                    <button
                      onClick={() => toggleConnection(connection.id)}
                      className={styles.expandButton}
                    >
                      {expandedConnections[connection.id] ? <ChevronDown /> : <ChevronRight />}
                    </button>
                    {getConnectionIcon(connection.type)}
                    <span className={styles.connectionName}>{connection.name}</span>
                    <span className={styles.connectionType}>({connection.type})</span>
                    {getStatusIcon(connection.status)}
                  </div>
                  <div className={styles.connectionHeaderRight}>
                    <span className={styles.connectionHost}>{connection.host}:{connection.port}</span>
                    <button
                      onClick={() => toggleEnabled(`connection-${connection.id}`, 'connection', connection.id)}
                      className={styles.toggleButton}
                    >
                      {enabledStates[`connection-${connection.id}`]
                        ? <Eye />
                        : <EyeOff />}
                    </button>
                  </div>
                </div>
                {/* Connection Content */}
                {expandedConnections[connection.id] && (
                  <div style={{ padding: "1.2rem" }}>
                    <div className={styles.connectionDescription}>{connection.description}</div>
                    <div className={styles.lastSync}>
                      Última sincronização: {new Date(connection.lastSync).toLocaleString()}
                    </div>
                    {/* Schemas */}
                    <div className={styles.schemasBlock}>
                      {connection.schemas.map(schema => (
                        <div key={schema.id} className={styles.schemaCard}>
                          <div className={styles.schemaHeader}>
                            <div className={styles.schemaHeaderLeft}>
                              <button
                                onClick={() => toggleSchema(connection.id, schema.id)}
                                className={styles.schemaChevron}
                              >
                                {expandedSchemas[`${connection.id}-${schema.id}`]
                                  ? <ChevronDown />
                                  : <ChevronRight />}
                              </button>
                              <Folder className={styles.schemaIcon} />
                              <span className={styles.schemaName}>{schema.name}</span>
                            </div>
                            <button
                              onClick={() => toggleEnabled(`schema-${connection.id}-${schema.id}`, 'schema', connection.id, schema.id)}
                              className={styles.schemaToggle}
                            >
                              {enabledStates[`schema-${connection.id}-${schema.id}`]
                                ? <Eye />
                                : <EyeOff />}
                            </button>
                          </div>
                          {expandedSchemas[`${connection.id}-${schema.id}`] && (
                            <div style={{ padding: "0.9rem" }}>
                              <div className={styles.schemaDescription}>{schema.description}</div>
                              {/* Tables */}
                              <div className={styles.tablesBlock}>
                                {schema.tables.map(table => (
                                  <div key={table.id} className={styles.tableCard}>
                                    <div className={styles.tableHeader}>
                                      <div className={styles.tableHeaderLeft}>
                                        <button
                                          onClick={() => toggleTable(connection.id, schema.id, table.id)}
                                          className={styles.tableChevron}
                                        >
                                          {expandedTables[`${connection.id}-${schema.id}-${table.id}`]
                                            ? <ChevronDown />
                                            : <ChevronRight />}
                                        </button>
                                        <Table className={styles.tableIcon} />
                                        <span className={styles.tableName}>{table.name}</span>
                                        <span className={styles.tableType}>({table.type})</span>
                                      </div>
                                      <div className={styles.tableHeaderRight}>
                                        <span className={styles.tableRows}>
                                          {table.rowCount?.toLocaleString()} linhas · {table.size}
                                        </span>
                                        <button
                                          onClick={() => toggleEnabled(`table-${connection.id}-${schema.id}-${table.id}`, 'table', connection.id, schema.id, table.id)}
                                          className={styles.tableToggle}
                                        >
                                          {enabledStates[`table-${connection.id}-${schema.id}-${table.id}`]
                                            ? <Eye />
                                            : <EyeOff />}
                                        </button>
                                      </div>
                                    </div>
                                    {expandedTables[`${connection.id}-${schema.id}-${table.id}`] && (
                                      <div style={{ padding: "0.85rem" }}>
                                        <div className={styles.tableDescription}>{table.description}</div>
                                        {/* Columns */}
                                        <div className={styles.columnsBlock}>
                                          {table.columns.map(column => (
                                            <div key={column.id} className={styles.columnRow}>
                                              <div className={styles.columnLeft}>
                                                <Columns className={styles.columnIcon} />
                                                <div className={styles.columnInfo}>
                                                  <span className={styles.columnName}>{column.name}</span>
                                                  <span className={styles.columnType}>{column.type}</span>
                                                  {column.nullable ? (
                                                    <span className={styles.nullable}>NULL</span>
                                                  ) : (
                                                    <span className={styles.notNull}>NOT NULL</span>
                                                  )}
                                                </div>
                                              </div>
                                              <div style={{ display: 'flex', alignItems: 'center', gap: "0.6rem" }}>
                                                <span className={styles.columnDescription}>{column.description}</span>
                                                <button
                                                  onClick={() =>
                                                    toggleEnabled(
                                                      `column-${connection.id}-${schema.id}-${table.id}-${column.id}`,
                                                      'column',
                                                      connection.id,
                                                      schema.id,
                                                      table.id
                                                    )
                                                  }
                                                  className={styles.columnToggle}
                                                >
                                                  {enabledStates[
                                                    `column-${connection.id}-${schema.id}-${table.id}-${column.id}`
                                                  ] ? (
                                                    <Eye />
                                                  ) : (
                                                    <EyeOff />
                                                  )}
                                                </button>
                                              </div>
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
        {/* Footer */}
        <div className={styles.modalFooter}>
          <button
            onClick={onClose}
            className={styles.footerCloseButton}
          >
            <X style={{ marginRight: 8 }} />
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}