'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Table2,
  Columns,
  Link2,
  Eye,
  ChevronDown,
  ChevronRight,
  Search,
  Info,
  Zap,
  Layers,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_CONNECTIONS = [
  {
    id: 'conn_1',
    name: 'PostgreSQL Production',
    type: 'postgresql',
    color: '#3b82f6',
    tables: [
      { 
        id: 1, 
        name: 'patients', 
        columns: [
          { id: 101, name: 'id', type: 'INTEGER', isPK: true },
          { id: 102, name: 'name', type: 'VARCHAR(255)', isPK: false },
          { id: 103, name: 'email', type: 'VARCHAR(255)', isPK: false },
          { id: 104, name: 'birth_date', type: 'DATE', isPK: false },
          { id: 105, name: 'sex', type: 'CHAR(1)', isPK: false },
          { id: 106, name: 'created_at', type: 'TIMESTAMP', isPK: false },
        ]
      },
      { 
        id: 2, 
        name: 'medical_records', 
        columns: [
          { id: 201, name: 'id', type: 'INTEGER', isPK: true },
          { id: 202, name: 'patient_id', type: 'INTEGER', isPK: false },
          { id: 203, name: 'diagnosis', type: 'TEXT', isPK: false },
          { id: 204, name: 'treatment', type: 'TEXT', isPK: false },
          { id: 205, name: 'date', type: 'DATE', isPK: false },
        ]
      },
      { 
        id: 3, 
        name: 'orders', 
        columns: [
          { id: 301, name: 'id', type: 'INTEGER', isPK: true },
          { id: 302, name: 'customer_id', type: 'INTEGER', isPK: false },
          { id: 303, name: 'total', type: 'DECIMAL(10,2)', isPK: false },
          { id: 304, name: 'status', type: 'VARCHAR(50)', isPK: false },
          { id: 305, name: 'created_at', type: 'TIMESTAMP', isPK: false },
        ]
      },
    ]
  },
  {
    id: 'conn_2',
    name: 'MySQL Analytics',
    type: 'mysql',
    color: '#22c55e',
    tables: [
      { 
        id: 4, 
        name: 'transactions', 
        columns: [
          { id: 401, name: 'id', type: 'INT', isPK: true },
          { id: 402, name: 'order_id', type: 'INT', isPK: false },
          { id: 403, name: 'amount', type: 'DECIMAL(10,2)', isPK: false },
          { id: 404, name: 'status', type: 'VARCHAR(50)', isPK: false },
          { id: 405, name: 'processed_at', type: 'DATETIME', isPK: false },
        ]
      },
      { 
        id: 5, 
        name: 'inventory', 
        columns: [
          { id: 501, name: 'id', type: 'INT', isPK: true },
          { id: 502, name: 'product_id', type: 'INT', isPK: false },
          { id: 503, name: 'quantity', type: 'INT', isPK: false },
          { id: 504, name: 'location', type: 'VARCHAR(100)', isPK: false },
        ]
      },
    ]
  },
  {
    id: 'conn_3',
    name: 'MongoDB UserData',
    type: 'mongodb',
    color: '#a855f7',
    tables: [
      { 
        id: 6, 
        name: 'users', 
        columns: [
          { id: 601, name: '_id', type: 'ObjectId', isPK: true },
          { id: 602, name: 'name', type: 'String', isPK: false },
          { id: 603, name: 'email', type: 'String', isPK: false },
          { id: 604, name: 'gender', type: 'String', isPK: false },
          { id: 605, name: 'preferences', type: 'Object', isPK: false },
        ]
      },
    ]
  },
];

const MOCK_RELATIONSHIPS = [
  { id: 1, leftTable: 'patients', leftColumn: 'id', rightTable: 'medical_records', rightColumn: 'patient_id', type: '1:N' },
  { id: 2, leftTable: 'orders', leftColumn: 'id', rightTable: 'transactions', rightColumn: 'order_id', type: '1:N' },
  { id: 3, leftTable: 'patients', leftColumn: 'email', rightTable: 'users', rightColumn: 'email', type: '1:1', isCrossConnection: true },
];

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Select Columns', icon: Columns },
  { id: 3, title: 'Relationships', icon: Link2 },
  { id: 4, title: 'Review', icon: Eye },
];

export default function NewBronzeDatasetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [datasetType, setDatasetType] = useState('persistent');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  const [selectedTables, setSelectedTables] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState([MOCK_CONNECTIONS[0].id]);
  const [expandedTables, setExpandedTables] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  
  const [selectedRelationships, setSelectedRelationships] = useState([]);
  const [enableFederatedJoins, setEnableFederatedJoins] = useState(false);

  const toggleConnection = (connId) => {
    setExpandedConnections(prev => 
      prev.includes(connId) ? prev.filter(id => id !== connId) : [...prev, connId]
    );
  };

  const toggleTable = (tableId) => {
    setExpandedTables(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const isTableSelected = (tableId) => {
    return selectedTables.some(t => t.tableId === tableId);
  };

  const toggleTableSelection = (tableId, columns) => {
    if (isTableSelected(tableId)) {
      setSelectedTables(prev => prev.filter(t => t.tableId !== tableId));
    } else {
      setSelectedTables(prev => [...prev, {
        tableId,
        selectAll: true,
        columnIds: columns.map(c => c.id),
      }]);
    }
  };

  const toggleColumnSelection = (tableId, columnId, allColumns) => {
    setSelectedTables(prev => {
      const existing = prev.find(t => t.tableId === tableId);
      if (existing) {
        const newColumnIds = existing.columnIds.includes(columnId)
          ? existing.columnIds.filter(id => id !== columnId)
          : [...existing.columnIds, columnId];
        
        if (newColumnIds.length === 0) {
          return prev.filter(t => t.tableId !== tableId);
        }
        
        return prev.map(t => 
          t.tableId === tableId 
            ? { ...t, columnIds: newColumnIds, selectAll: newColumnIds.length === allColumns.length }
            : t
        );
      } else {
        return [...prev, {
          tableId,
          selectAll: false,
          columnIds: [columnId],
        }];
      }
    });
  };

  const toggleRelationship = (relId) => {
    setSelectedRelationships(prev => 
      prev.includes(relId) ? prev.filter(id => id !== relId) : [...prev, relId]
    );
  };

  const getTableById = (tableId) => {
    for (const conn of MOCK_CONNECTIONS) {
      const table = conn.tables.find(t => t.id === tableId);
      if (table) return { table, connection: conn };
    }
    return null;
  };

  const getAvailableRelationships = () => {
    const selectedTableIds = selectedTables.map(t => t.tableId);
    const selectedTableNames = selectedTableIds.map(id => {
      const result = getTableById(id);
      return result?.table.name;
    }).filter(Boolean);

    return MOCK_RELATIONSHIPS.filter(rel => 
      selectedTableNames.includes(rel.leftTable) && selectedTableNames.includes(rel.rightTable)
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0 && selectedTables.length > 0;
      case 2: return selectedTables.every(t => t.columnIds.length > 0);
      case 3: return true; 
      case 4: return true;
      default: return false;
    }
  };

  const totalSelectedColumns = selectedTables.reduce((sum, t) => sum + t.columnIds.length, 0);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link 
              href="/bronze"
              className={styles.backButton}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className={styles.titleIconBox}>
              <Layers className={styles.titleIcon} />
            </div>
            <div>
              <h1 className={styles.title}>New Bronze Dataset</h1>
              <p className={styles.description}>
                Configure raw data ingestion from source systems
              </p>
            </div>
          </div>

          <div className={styles.stepper}>
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => isCompleted && setCurrentStep(step.id)}
                    disabled={!isCompleted && !isActive}
                    className={clsx(
                      styles.stepButton,
                      isActive && styles.stepActive,
                      isCompleted && styles.stepCompleted,
                      !isActive && !isCompleted && styles.stepInactive
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className={styles.stepIcon} />
                    ) : (
                      <Icon className={styles.stepIcon} />
                    )}
                    {step.title}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className={styles.stepDivider} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className={styles.content}>
          <div className={styles.contentWrapper}>
            {currentStep === 1 && (
              <div className={styles.formStack}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    Choose Dataset Type
                  </h2>
                  
                  <div className={styles.typeGrid}>
                    <button
                      onClick={() => setDatasetType('persistent')}
                      className={clsx(
                        styles.typeButton,
                        datasetType === 'persistent'
                          ? styles.typePersistent
                          : styles.typePersistentInactive
                      )}
                    >
                      <div className={styles.typeHeader}>
                        <div className={clsx(
                          styles.typeIconBox,
                          datasetType === 'persistent' ? styles.boxAmber : styles.boxGray
                        )}>
                          <Sparkles className={clsx(
                            styles.typeIcon,
                            datasetType === 'persistent' ? styles.iconAmber : styles.iconGray
                          )} />
                        </div>
                        <span className={clsx(
                          styles.typeLabel,
                          datasetType === 'persistent' ? styles.labelAmber : styles.labelGray
                        )}>
                          Persistent
                        </span>
                      </div>
                      <p className={styles.typeDesc}>
                        Ingest and save data to Delta Lake. Best for ETL pipelines and batch processing.
                      </p>
                    </button>

                    <button
                      onClick={() => setDatasetType('virtualized')}
                      className={clsx(
                        styles.typeButton,
                        datasetType === 'virtualized'
                          ? styles.typeVirtualized
                          : styles.typeVirtualizedInactive
                      )}
                    >
                      <div className={styles.typeHeader}>
                        <div className={clsx(
                          styles.typeIconBox,
                          datasetType === 'virtualized' ? styles.boxCyan : styles.boxGray
                        )}>
                          <Zap className={clsx(
                            styles.typeIcon,
                            datasetType === 'virtualized' ? styles.iconCyan : styles.iconGray
                          )} />
                        </div>
                        <span className={clsx(
                          styles.typeLabel,
                          datasetType === 'virtualized' ? styles.labelCyan : styles.labelGray
                        )}>
                          Virtualized
                        </span>
                      </div>
                      <p className={styles.typeDesc}>
                        Query source data on-demand. Best for exploration and APIs.
                      </p>
                    </button>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.formStack}>
                    <div>
                      <label className={styles.label}>
                        Dataset Name <span className={styles.required}>*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., patients_raw"
                        className={styles.input}
                      />
                    </div>

                    <div>
                      <label className={styles.label}>
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the purpose of this dataset..."
                        rows={2}
                        className={styles.textarea}
                      />
                    </div>
                  </div>
                </div>

                <div className={styles.card}>
                  <div className={styles.sectionHeader}>
                    <h2 className={styles.cardTitle} style={{marginBottom: 0}}>
                      Select Source Tables
                    </h2>
                    <span className={styles.selectionCount}>
                      {selectedTables.length} table(s) selected
                    </span>
                  </div>

                  <div className={styles.searchBox}>
                    <Search className={styles.searchIcon} />
                    <input
                      type="text"
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      placeholder="Search tables..."
                      className={styles.searchInput}
                    />
                  </div>

                  <div className={styles.connectionList}>
                    {MOCK_CONNECTIONS.map((conn) => (
                      <div key={conn.id} className={styles.connectionItem}>
                        <button
                          onClick={() => toggleConnection(conn.id)}
                          className={styles.connectionHeader}
                        >
                          <div className={styles.connInfo}>
                            <div 
                              className={styles.connDot} 
                              style={{ backgroundColor: conn.color }}
                            />
                            <span className={styles.connName}>
                              {conn.name}
                            </span>
                            <span className={styles.tableCount}>
                              {conn.tables.length} tables
                            </span>
                          </div>
                          <ChevronDown className={clsx(
                            styles.chevron,
                            expandedConnections.includes(conn.id) && styles.rotate180
                          )} />
                        </button>
                        
                        {expandedConnections.includes(conn.id) && (
                          <div className={styles.tablesContainer}>
                            {conn.tables
                              .filter(t => !tableSearch || t.name.toLowerCase().includes(tableSearch.toLowerCase()))
                              .map((table) => (
                                <div
                                  key={table.id}
                                  onClick={() => toggleTableSelection(table.id, table.columns)}
                                  className={clsx(
                                    styles.tableRow,
                                    isTableSelected(table.id) && styles.tableRowSelected
                                  )}
                                >
                                  <div className={styles.tableInfo}>
                                    <div className={clsx(
                                      styles.checkboxBox,
                                      isTableSelected(table.id)
                                        ? styles.checkSelected
                                        : styles.checkUnselected
                                    )}>
                                      {isTableSelected(table.id) && <Check className={styles.checkIcon} />}
                                    </div>
                                    <Table2 className={styles.tableIcon} />
                                    <span className={styles.tableName}>
                                      {table.name}
                                    </span>
                                  </div>
                                  <span className={styles.columnCount}>
                                    {table.columns.length} columns
                                  </span>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.cardTitle} style={{marginBottom: 0}}>
                    Select Columns
                  </h2>
                  <span className={styles.selectionCount}>
                    {totalSelectedColumns} column(s) selected
                  </span>
                </div>

                <div className={styles.connectionList}>
                  {selectedTables.map((selection) => {
                    const result = getTableById(selection.tableId);
                    if (!result) return null;
                    const { table, connection } = result;
                    const isExpanded = expandedTables.includes(table.id);
                    
                    return (
                      <div key={table.id} className={styles.connectionItem}>
                        <button
                          onClick={() => toggleTable(table.id)}
                          className={styles.connectionHeader}
                        >
                          <div className={styles.connInfo}>
                            <div 
                              className={styles.connDot} 
                              style={{ backgroundColor: connection.color }}
                            />
                            <span className={styles.connName}>
                              {table.name}
                            </span>
                            <span className={styles.tableCount}>
                              {connection.name}
                            </span>
                          </div>
                          <div className={styles.tableInfo} style={{gap: '0.5rem'}}>
                            <span className={styles.selectionCount} style={{color: '#d97706'}}>
                              {selection.columnIds.length}/{table.columns.length} selected
                            </span>
                            <ChevronDown className={clsx(
                              styles.chevron,
                              isExpanded && styles.rotate180
                            )} />
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className={styles.columnsList}>
                            <div
                              onClick={() => {
                                const allSelected = selection.columnIds.length === table.columns.length;
                                setSelectedTables(prev => prev.map(t => 
                                  t.tableId === table.id
                                    ? { ...t, selectAll: !allSelected, columnIds: allSelected ? [] : table.columns.map(c => c.id) }
                                    : t
                                ));
                              }}
                              className={styles.selectAllRow}
                            >
                              <div className={clsx(
                                styles.checkboxBox,
                                selection.selectAll
                                  ? styles.checkSelected
                                  : styles.checkUnselected
                              )}>
                                {selection.selectAll && <Check className={styles.checkIcon} />}
                              </div>
                              <span className={styles.selectAllText}>
                                Select All
                              </span>
                            </div>

                            {table.columns.map((column) => (
                              <div
                                key={column.id}
                                onClick={() => toggleColumnSelection(table.id, column.id, table.columns)}
                                className={clsx(
                                  styles.columnRow,
                                  selection.columnIds.includes(column.id) && styles.columnRowSelected
                                )}
                              >
                                <div className={styles.columnInfo}>
                                  <div className={clsx(
                                    styles.checkboxBox,
                                    selection.columnIds.includes(column.id)
                                      ? styles.checkSelected
                                      : styles.checkUnselected
                                  )}>
                                    {selection.columnIds.includes(column.id) && <Check className={styles.checkIcon} />}
                                  </div>
                                  <span className={styles.columnName}>
                                    {column.name}
                                  </span>
                                  {column.isPK && (
                                    <span className={styles.pkBadge}>
                                      PK
                                    </span>
                                  )}
                                </div>
                                <span className={styles.columnType}>
                                  {column.type}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>
                      Configure Relationships
                    </h2>
                    <p className={styles.description}>
                      Select relationships to use for joining tables during ingestion
                    </p>
                  </div>
                </div>

                <div className={styles.relSummary} style={{marginBottom: '1rem'}}>
                  <div className={styles.sectionHeader} style={{marginBottom: 0}}>
                    <div className={styles.connInfo}>
                      <Zap className={styles.typeIcon} style={{color: '#9333ea'}} />
                      <div>
                        <div className={styles.connName}>
                          Enable Federated Joins
                        </div>
                        <div className={styles.tableCount}>
                          Allow joins between tables from different data sources
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setEnableFederatedJoins(!enableFederatedJoins)}
                      className={clsx(
                        "relative w-12 h-6 rounded-full transition-colors",
                        enableFederatedJoins ? "bg-purple-500" : "bg-gray-300 dark:bg-zinc-600"
                      )}
                    >
                      <div className={clsx(
                        "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                        enableFederatedJoins ? "left-7" : "left-1"
                      )} />
                    </button>
                  </div>
                </div>

                <div className={styles.relList}>
                  {getAvailableRelationships().length === 0 ? (
                    <div className={styles.emptyState} style={{padding: '2rem 0'}}>
                      <Link2 className={styles.emptyIcon} />
                      <p className={styles.description}>No relationships available for selected tables</p>
                    </div>
                  ) : (
                    getAvailableRelationships().map((rel) => (
                      <div
                        key={rel.id}
                        onClick={() => {
                          if (rel.isCrossConnection && !enableFederatedJoins) return;
                          toggleRelationship(rel.id);
                        }}
                        className={clsx(
                          styles.relItem,
                          rel.isCrossConnection && !enableFederatedJoins
                            ? "opacity-50 cursor-not-allowed"
                            : selectedRelationships.includes(rel.id)
                              ? styles.relItemSelected
                              : ""
                        )}
                      >
                        <div className={styles.relContent}>
                          <div className={clsx(
                            styles.checkboxBox,
                            selectedRelationships.includes(rel.id)
                              ? styles.checkSelected
                              : styles.checkUnselected
                          )}>
                            {selectedRelationships.includes(rel.id) && <Check className={styles.checkIcon} />}
                          </div>
                          <div>
                            <div className={styles.relInfo}>
                              <span className={styles.relTable}>
                                {rel.leftTable}.{rel.leftColumn}
                              </span>
                              <ArrowRight className={styles.relArrow} />
                              <span className={styles.relTable}>
                                {rel.rightTable}.{rel.rightColumn}
                              </span>
                            </div>
                            <div className={styles.relMeta}>
                              <span className={styles.relType}>{rel.type}</span>
                              {rel.isCrossConnection && (
                                <span className={styles.crossBadge}>
                                  Cross-connection
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className={styles.formStack}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    Review Configuration
                  </h2>

                  <div className={styles.formStack}>
                    <div>
                      <h3 className={styles.label}>Dataset Type</h3>
                      <div className={clsx(
                        styles.typeButton,
                        datasetType === 'persistent' ? styles.typePersistent : styles.typeVirtualized
                      )}>
                        {datasetType === 'persistent' ? (
                          <div className={styles.typeHeader}>
                            <Sparkles className={styles.typeIcon} style={{color: '#d97706'}} />
                            <div>
                              <div className={styles.connName} style={{color: '#b45309'}}>Persistent</div>
                              <div className={styles.tableCount} style={{color: '#d97706'}}>Data will be saved to Delta Lake</div>
                            </div>
                          </div>
                        ) : (
                          <div className={styles.typeHeader}>
                            <Zap className={styles.typeIcon} style={{color: '#0891b2'}} />
                            <div>
                              <div className={styles.connName} style={{color: '#0e7490'}}>Virtualized</div>
                              <div className={styles.tableCount} style={{color: '#0891b2'}}>Data queried on-demand, no storage</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className={styles.label}>Basic Info</h3>
                      <div className={styles.relSummary}>
                        <div className={styles.connName}>{name}</div>
                        {description && <p className={styles.description} style={{marginTop: '0.25rem'}}>{description}</p>}
                      </div>
                    </div>

                    <div>
                      <h3 className={styles.label}>
                        Source Tables ({selectedTables.length})
                      </h3>
                      <div className={styles.relList}>
                        {selectedTables.map((selection) => {
                          const result = getTableById(selection.tableId);
                          if (!result) return null;
                          return (
                            <div key={selection.tableId} className={styles.listItem} style={{padding: '0.75rem', cursor: 'default', border: 'none', backgroundColor: '#f9fafb'}}>
                              <div className={styles.tableInfo}>
                                <div 
                                  className={styles.connDot} 
                                  style={{ backgroundColor: result.connection.color, width: '0.75rem', height: '0.75rem' }}
                                />
                                <span className={styles.connName}>
                                  {result.table.name}
                                </span>
                              </div>
                              <span className={styles.tableCount}>
                                {selection.columnIds.length} columns
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {selectedRelationships.length > 0 && (
                      <div>
                        <h3 className={styles.label}>
                          Relationships ({selectedRelationships.length})
                        </h3>
                        <div className={styles.relSummary}>
                          <div className={styles.description} style={{color: '#4b5563'}}>
                            {selectedRelationships.length} relationship(s) configured
                          </div>
                          {enableFederatedJoins && (
                            <div className={styles.fedJoinRow}>
                              <Zap className={styles.stepIcon} />
                              Federated joins enabled
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.typeHeader} style={{justifyContent: 'flex-start', gap: '0.75rem'}}>
                  <button className={styles.cancelButton} style={{flex: 1, backgroundColor: 'white', border: '1px solid #e5e7eb'}}>
                    <Eye className={styles.stepIcon} />
                    Preview Data
                  </button>
                  <button className={clsx(
                    styles.createButton,
                    datasetType === 'persistent' ? "" : styles.boxCyan
                  )} style={{flex: 1, backgroundColor: datasetType === 'persistent' ? '#f59e0b' : '#06b6d4', color: 'white'}}>
                    <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'}}>
                      {datasetType === 'persistent' ? <Table2 className={styles.stepIcon} /> : <Zap className={styles.stepIcon} />}
                      {datasetType === 'persistent' ? 'Create & Run Ingestion' : 'Create Virtualized Query'}
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.footer}>
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className={clsx(
              styles.backBtn,
              currentStep === 1 ? styles.backBtnDisabled : styles.backBtnActive
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          
          {currentStep < 4 ? (
            <button
              onClick={() => setCurrentStep(prev => Math.min(4, prev + 1))}
              disabled={!canProceed()}
              className={clsx(
                styles.nextBtn,
                canProceed() ? styles.nextBtnActive : styles.nextBtnDisabled
              )}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              className={styles.saveBtn}
            >
              <Check className="w-4 h-4" />
              Save Configuration
            </button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}