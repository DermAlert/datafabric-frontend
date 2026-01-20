'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Info, 
  Table2, 
  Columns, 
  Code2, 
  GitMerge, 
  Filter, 
  Eye, 
  Sparkles, 
  Zap, 
  Database, 
  Layers, 
  Plus, 
  X, 
  ArrowRightLeft, 
  ChevronDown, 
  Search
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Select Columns', icon: Columns },
  { id: 3, title: 'Transformations', icon: Code2 },
  { id: 4, title: 'Equivalence', icon: GitMerge },
  { id: 5, title: 'Filters', icon: Filter },
  { id: 6, title: 'Review', icon: Eye },
];

const MOCK_BRONZE_DATASETS = [
  { id: 'bronze_1', name: 'patients_raw', tables: 2, rows: 125430 },
  { id: 'bronze_2', name: 'orders_unified', tables: 3, rows: 456789 },
  { id: 'bronze_3', name: 'customer_360', tables: 2, rows: 89234 },
  { id: 'bronze_4', name: 'inventory_snapshot', tables: 1, rows: 12500 },
];

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

const MOCK_COLUMNS = [
  { id: 1, name: 'id', type: 'INTEGER', tableId: 1 },
  { id: 2, name: 'name', type: 'VARCHAR', tableId: 1 },
  { id: 3, name: 'email', type: 'VARCHAR', tableId: 1 },
  { id: 4, name: 'cpf', type: 'VARCHAR', tableId: 1 },
  { id: 5, name: 'phone', type: 'VARCHAR', tableId: 1 },
  { id: 6, name: 'gender', type: 'VARCHAR', tableId: 1 },
  { id: 7, name: 'birthdate', type: 'DATE', tableId: 1 },
  { id: 8, name: 'cep', type: 'VARCHAR', tableId: 1 },
  { id: 9, name: 'created_at', type: 'TIMESTAMP', tableId: 1 },
];

const MOCK_COLUMN_GROUPS = [
  { id: 1, name: 'sex_group', description: 'Unified gender column', termCount: 3 },
  { id: 2, name: 'country_unified', description: 'Standardized country codes', termCount: 5 },
  { id: 3, name: 'status_unified', description: 'Common status values', termCount: 4 },
];

const FILTER_OPERATORS = [
  { value: '=', label: 'equals' },
  { value: '!=', label: 'not equals' },
  { value: '>', label: 'greater than' },
  { value: '>=', label: 'greater or equal' },
  { value: '<', label: 'less than' },
  { value: '<=', label: 'less or equal' },
  { value: 'LIKE', label: 'contains' },
  { value: 'IS NULL', label: 'is null' },
  { value: 'IS NOT NULL', label: 'is not null' },
];

const MOCK_RULES = [
  { id: 1, name: 'CPF Format', template: '{d3}.{d3}.{d3}-{d2}' },
  { id: 2, name: 'Phone BR', template: '({d2}) {d5}-{d4}' },
  { id: 3, name: 'CEP Format', template: '{d5}-{d3}' },
];

const TRANSFORMATION_TYPES = [
  { value: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase' },
  { value: 'uppercase', label: 'Uppercase', description: 'Convert to uppercase' },
  { value: 'trim', label: 'Trim', description: 'Remove leading/trailing spaces' },
  { value: 'normalize_spaces', label: 'Normalize Spaces', description: 'Collapse multiple spaces' },
  { value: 'remove_accents', label: 'Remove Accents', description: 'Convert á→a, é→e, etc.' },
  { value: 'template', label: 'Template Rule', description: 'Apply normalization rule' },
];

export default function NewSilverDatasetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  const [datasetType, setDatasetType] = useState('persistent');
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBronze, setSourceBronze] = useState('');
  const [selectedTables, setSelectedTables] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState([MOCK_CONNECTIONS[0].id]);
  const [tableSearch, setTableSearch] = useState('');
  
  const [columnSelections, setColumnSelections] = useState([]);
  const [expandedTables, setExpandedTables] = useState([]);
  
  const [transformations, setTransformations] = useState([]);
  
  const [selectedColumnGroups, setSelectedColumnGroups] = useState([]);
  const [excludeSourceColumns, setExcludeSourceColumns] = useState(false);
  
  const [filterConditions, setFilterConditions] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');

  const toggleConnection = (connId) => {
    setExpandedConnections(prev => 
      prev.includes(connId) ? prev.filter(id => id !== connId) : [...prev, connId]
    );
  };

  const getTableInfo = (tableId) => {
    for (const conn of MOCK_CONNECTIONS) {
      const table = conn.tables.find(t => t.id === tableId);
      if (table) return { table, connection: conn };
    }
    return null;
  };

  const toggleTable = (tableId) => {
    setExpandedTables(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const toggleColumnSelection = (tableId, columnId, allColumns) => {
    setColumnSelections(prev => {
      const existing = prev.find(s => s.tableId === tableId);
      if (existing) {
        const newColumnIds = existing.columnIds.includes(columnId)
          ? existing.columnIds.filter(id => id !== columnId)
          : [...existing.columnIds, columnId];
        
        if (newColumnIds.length === 0) {
          return prev.filter(s => s.tableId !== tableId);
        }
        
        return prev.map(s => 
          s.tableId === tableId 
            ? { ...s, columnIds: newColumnIds, selectAll: newColumnIds.length === allColumns.length }
            : s
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

  const totalSelectedColumns = columnSelections.reduce((sum, s) => sum + s.columnIds.length, 0);

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (datasetType === 'persistent') {
          return datasetName && sourceBronze;
        }
        return datasetName && selectedTables.length > 0;
      case 2:
        return totalSelectedColumns > 0;
      default:
        return true;
    }
  };

  const handleAddTransformation = () => {
    setTransformations([
      ...transformations,
      { id: String(Date.now()), columnId: 0, columnName: '', type: 'lowercase' }
    ]);
  };

  const handleRemoveTransformation = (id) => {
    setTransformations(transformations.filter(t => t.id !== id));
  };

  const handleTransformationChange = (id, field, value) => {
    setTransformations(transformations.map(t => {
      if (t.id !== id) return t;
      if (field === 'columnId') {
        const column = MOCK_COLUMNS.find(c => c.id === value);
        return { ...t, columnId: value, columnName: column?.name || '' };
      }
      return { ...t, [field]: value };
    }));
  };

  const handleAddFilterCondition = () => {
    setFilterConditions([
      ...filterConditions,
      { id: String(Date.now()), column: '', operator: '=', value: '' }
    ]);
  };

  const handleRemoveFilterCondition = (id) => {
    setFilterConditions(filterConditions.filter(c => c.id !== id));
  };

  const handleFilterConditionChange = (id, field, value) => {
    setFilterConditions(filterConditions.map(c => 
      c.id === id ? { ...c, [field]: value } : c
    ));
  };

  const availableColumnsForFilter = selectedTables.flatMap(tableId => {
    const info = getTableInfo(tableId);
    if (!info) return [];
    return info.table.columns.map(col => ({
      id: `${info.table.name}.${col.name}`,
      label: `${info.table.name}.${col.name}`,
      type: col.type
    }));
  });

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link 
              href="/silver"
              className={styles.backButton}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className={styles.titleIconBox}>
              <Sparkles className={styles.titleIcon} />
            </div>
            <div>
              <h1 className={styles.title}>New Silver Dataset</h1>
              <p className={styles.description}>
                Configure data transformation or virtualized view
              </p>
            </div>
          </div>
        </div>

        <div className={styles.header}>
          <div className={styles.stepper}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <React.Fragment key={step.id}>
                  <div className="flex flex-col items-center gap-2">
                    <div className={clsx(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isCompleted ? "bg-green-500 text-white" :
                      isActive ? "bg-purple-500 text-white" :
                      "bg-gray-100 dark:bg-zinc-800 text-gray-400"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={clsx(
                      "text-xs font-medium",
                      isActive ? "text-purple-600 dark:text-purple-400" :
                      isCompleted ? "text-green-600 dark:text-green-400" :
                      "text-gray-400"
                    )}>
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={clsx(
                      "flex-1 h-0.5 mx-2",
                      currentStep > step.id ? "bg-green-500" : "bg-gray-200 dark:bg-zinc-700"
                    )} />
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
                        <div className={clsx(styles.typeIconBox, styles.boxPurple)}>
                          <Sparkles className={clsx(styles.typeIcon, styles.iconPurple)} />
                        </div>
                        <span className={clsx(styles.typeLabel, styles.labelPurple)}>Persistent</span>
                      </div>
                      <p className={styles.typeDesc}>
                        Persist data to Silver Delta Lake. Best for ETL pipelines.
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
                        <div className={clsx(styles.typeIconBox, styles.boxCyan)}>
                          <Zap className={clsx(styles.typeIcon, styles.iconCyan)} />
                        </div>
                        <span className={clsx(styles.typeLabel, styles.labelCyan)}>Virtualized</span>
                      </div>
                      <p className={styles.typeDesc}>
                        Query source data on-demand. Best for exploration and APIs.
                      </p>
                    </button>
                  </div>

                  <div className={styles.formStack}>
                    <div>
                      <label className={styles.label}>
                        Dataset Name <span className={styles.required}>*</span>
                      </label>
                      <input 
                        type="text"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="e.g., patients_normalized"
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
                  <h2 className={styles.cardTitle}>
                    {datasetType === 'persistent' ? 'Select Bronze Dataset' : 'Select Source Tables'}
                  </h2>
                  
                  {datasetType === 'persistent' ? (
                    <div className={styles.typeGrid}>
                      {MOCK_BRONZE_DATASETS.map((dataset) => (
                        <button
                          key={dataset.id}
                          onClick={() => setSourceBronze(dataset.id)}
                          className={clsx(
                            styles.typeButton,
                            sourceBronze === dataset.id
                              ? styles.typePersistent
                              : styles.typePersistentInactive
                          )}
                        >
                          <div className={styles.typeHeader}>
                            <Layers className={clsx(styles.typeIcon, styles.iconAmber)} />
                            <span className={clsx(styles.typeLabel, styles.labelGray)}>
                              {dataset.name}
                            </span>
                          </div>
                          <div className={styles.typeDesc}>
                            {dataset.tables} tables • {dataset.rows.toLocaleString()} rows
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className={styles.sectionHeader}>
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
                                      onClick={() => {
                                        if (selectedTables.includes(table.id)) {
                                          setSelectedTables(selectedTables.filter(id => id !== table.id));
                                        } else {
                                          setSelectedTables([...selectedTables, table.id]);
                                        }
                                      }}
                                      className={clsx(
                                        styles.tableRow,
                                        selectedTables.includes(table.id)
                                          ? styles.tableRowSelected
                                          : ""
                                      )}
                                    >
                                      <div className={styles.tableInfo}>
                                        <div className={clsx(
                                          styles.checkboxBox,
                                          selectedTables.includes(table.id)
                                            ? styles.checkSelected
                                            : styles.checkUnselected
                                        )}>
                                          {selectedTables.includes(table.id) && <Check className={styles.checkIcon} />}
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
                    </>
                  )}
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
                  {selectedTables.map((tableId) => {
                    const info = getTableInfo(tableId);
                    if (!info) return null;
                    const { table, connection } = info;
                    const isExpanded = expandedTables.includes(table.id);
                    const selection = columnSelections.find(s => s.tableId === table.id);
                    const selectedCount = selection?.columnIds.length || 0;
                    
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
                            <span className={styles.selectionCount} style={{color: '#7e22ce'}}>
                              {selectedCount}/{table.columns.length} selected
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
                                const allSelected = selectedCount === table.columns.length;
                                setColumnSelections(prev => {
                                  const existing = prev.find(s => s.tableId === table.id);
                                  if (allSelected) {
                                    return prev.filter(s => s.tableId !== table.id);
                                  }
                                  if (existing) {
                                    return prev.map(s => 
                                      s.tableId === table.id
                                        ? { ...s, selectAll: true, columnIds: table.columns.map(c => c.id) }
                                        : s
                                    );
                                  }
                                  return [...prev, {
                                    tableId: table.id,
                                    selectAll: true,
                                    columnIds: table.columns.map(c => c.id),
                                  }];
                                });
                              }}
                              className={styles.selectAllRow}
                            >
                              <div className={clsx(
                                styles.checkboxBox,
                                selectedCount === table.columns.length
                                  ? styles.checkSelected
                                  : styles.checkUnselected
                              )}>
                                {selectedCount === table.columns.length && <Check className={styles.checkIcon} />}
                              </div>
                              <span className={styles.selectAllText}>
                                Select All
                              </span>
                            </div>

                            {table.columns.map((column) => {
                              const isSelected = selection?.columnIds.includes(column.id) || false;
                              return (
                                <div
                                  key={column.id}
                                  onClick={() => toggleColumnSelection(table.id, column.id, table.columns)}
                                  className={clsx(
                                    styles.columnRow,
                                    isSelected && styles.columnRowSelected
                                  )}
                                >
                                  <div className={styles.columnInfo}>
                                    <div className={clsx(
                                      styles.checkboxBox,
                                      isSelected
                                        ? styles.checkSelected
                                        : styles.checkUnselected
                                    )}>
                                      {isSelected && <Check className={styles.checkIcon} />}
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
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {selectedTables.length === 0 && (
                  <div className={styles.emptyList}>
                    <Columns className={styles.emptyListIcon} />
                    <p className={styles.description}>No tables selected</p>
                    <p className={styles.helperText}>Go back and select source tables first</p>
                  </div>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.cardTitle} style={{marginBottom: 0}}>
                      Column Transformations
                    </h2>
                    <p className={styles.description}>
                      Apply text transformations to specific columns
                    </p>
                  </div>
                  <button
                    onClick={handleAddTransformation}
                    className={clsx(styles.newButton, styles.btnPurple)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Transformation
                  </button>
                </div>
                
                {transformations.length === 0 ? (
                  <div className={styles.emptyList}>
                    <Code2 className={styles.emptyListIcon} />
                    <p className={styles.description}>No transformations configured</p>
                    <p className={styles.helperText}>Click "Add Transformation" to get started</p>
                  </div>
                ) : (
                  <div className={styles.formStack}>
                    {transformations.map((t) => (
                      <div 
                        key={t.id}
                        className={styles.item}
                      >
                        <div style={{display: 'flex', gap: '0.75rem', alignItems: 'center'}}>
                          <div style={{position: 'relative', flex: 1}}>
                            <select
                              value={t.columnId}
                              onChange={(e) => handleTransformationChange(t.id, 'columnId', Number(e.target.value))}
                              className={styles.select}
                            >
                              <option value={0}>Select column...</option>
                              {MOCK_COLUMNS.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                              ))}
                            </select>
                            <ChevronDown className={styles.searchIcon} style={{right: '0.75rem', left: 'auto', pointerEvents: 'none'}} />
                          </div>
                          
                          <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                          
                          <div style={{position: 'relative', flex: 1}}>
                            <select
                              value={t.type}
                              onChange={(e) => handleTransformationChange(t.id, 'type', e.target.value)}
                              className={styles.select}
                            >
                              {TRANSFORMATION_TYPES.map(type => (
                                <option key={type.value} value={type.value}>{type.label}</option>
                              ))}
                            </select>
                            <ChevronDown className={styles.searchIcon} style={{right: '0.75rem', left: 'auto', pointerEvents: 'none'}} />
                          </div>
                          
                          {t.type === 'template' && (
                            <div style={{position: 'relative', flex: 1}}>
                              <select
                                value={t.ruleId || ''}
                                onChange={(e) => handleTransformationChange(t.id, 'ruleId', Number(e.target.value))}
                                className={styles.select}
                              >
                                <option value="">Select rule...</option>
                                {MOCK_RULES.map(r => (
                                  <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                              </select>
                              <ChevronDown className={styles.searchIcon} style={{right: '0.75rem', left: 'auto', pointerEvents: 'none'}} />
                            </div>
                          )}
                          
                          <button
                            onClick={() => handleRemoveTransformation(t.id)}
                            className={styles.menuButton}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className={styles.relSummary} style={{marginTop: '1.5rem', backgroundColor: '#eff6ff', borderColor: '#dbeafe'}}>
                  <p className={styles.description} style={{color: '#1d4ed8'}}>
                    <strong>Tip:</strong> For value mappings (e.g., M → Masculino), use Column Groups in the next step instead of transformations.
                  </p>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>
                  Column Groups (Semantic Unification)
                </h2>
                <p className={styles.description} style={{marginBottom: '1.5rem'}}>
                  Apply column unification and value mappings from the Equivalence layer
                </p>
                
                <div className={styles.formStack}>
                  {MOCK_COLUMN_GROUPS.map((group) => (
                    <label
                      key={group.id}
                      className={clsx(
                        styles.item,
                        selectedColumnGroups.includes(group.id) && styles.itemActive
                      )}
                      style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0}}
                    >
                      <input 
                        type="checkbox"
                        checked={selectedColumnGroups.includes(group.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedColumnGroups([...selectedColumnGroups, group.id]);
                          } else {
                            setSelectedColumnGroups(selectedColumnGroups.filter(id => id !== group.id));
                          }
                        }}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <GitMerge className="w-4 h-4 text-purple-500" />
                      <div className="flex-1">
                        <span className={styles.itemName}>
                          {group.name}
                        </span>
                        <p className={styles.description}>
                          {group.description} • {group.termCount} mappings
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                
                {selectedColumnGroups.length > 0 && (
                  <label className={clsx(styles.item, styles.relSummary)} style={{display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem', cursor: 'pointer'}}>
                    <input 
                      type="checkbox"
                      checked={excludeSourceColumns}
                      onChange={(e) => setExcludeSourceColumns(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <div>
                      <span className={styles.itemName}>
                        Exclude Source Columns
                      </span>
                      <p className={styles.description}>
                        Only show unified columns, hide original source columns
                      </p>
                    </div>
                  </label>
                )}
                
                <Link 
                  href="/equivalence"
                  className={styles.emptyList}
                  style={{marginTop: '1.5rem', display: 'block', textDecoration: 'none', border: '2px dashed #e5e7eb', borderRadius: '0.75rem'}}
                >
                  <GitMerge className={styles.emptyListIcon} />
                  <span className={styles.description}>
                    Manage Column Groups in Equivalence →
                  </span>
                </Link>
              </div>
            )}

            {currentStep === 5 && (
              <div className={styles.card}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h2 className={styles.cardTitle} style={{marginBottom: 0}}>
                      Filter Conditions
                    </h2>
                    <p className={styles.description}>
                      Define WHERE conditions to filter your data (optional)
                    </p>
                  </div>
                  <button
                    onClick={handleAddFilterCondition}
                    className={clsx(styles.newButton, styles.btnPurple)}
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </button>
                </div>

                {filterConditions.length === 0 ? (
                  <div className={styles.emptyList}>
                    <Filter className={styles.emptyListIcon} />
                    <p className={styles.description}>No filter conditions</p>
                    <p className={styles.helperText}>Click "Add Condition" to filter your data</p>
                  </div>
                ) : (
                  <div className={styles.formStack}>
                    {/* Logic selector */}
                    {filterConditions.length > 1 && (
                      <div className={styles.relSummary} style={{display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
                        <span className={styles.description}>Combine conditions with:</span>
                        <div style={{display: 'flex', gap: '0.5rem'}}>
                          <button
                            onClick={() => setFilterLogic('AND')}
                            className={clsx(
                              styles.stepButton,
                              filterLogic === 'AND' ? styles.stepActive : styles.stepInactive
                            )}
                            style={{cursor: 'pointer'}}
                          >
                            AND
                          </button>
                          <button
                            onClick={() => setFilterLogic('OR')}
                            className={clsx(
                              styles.stepButton,
                              filterLogic === 'OR' ? styles.stepActive : styles.stepInactive
                            )}
                            style={{cursor: 'pointer'}}
                          >
                            OR
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conditions */}
                    <div className={styles.formStack}>
                      {filterConditions.map((condition, index) => (
                        <div 
                          key={condition.id}
                          className={styles.item}
                          style={{display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'default'}}
                        >
                          {index > 0 && (
                            <span className={styles.itemName} style={{color: '#7e22ce', width: '2.5rem'}}>
                              {filterLogic}
                            </span>
                          )}
                          {index === 0 && filterConditions.length > 1 && (
                            <span style={{width: '2.5rem'}}></span>
                          )}
                          
                          <div style={{position: 'relative', flex: 1}}>
                            <select
                              value={condition.column}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'column', e.target.value)}
                              className={styles.select}
                            >
                              <option value="">Select column...</option>
                              {availableColumnsForFilter.map(col => (
                                <option key={col.id} value={col.id}>{col.label}</option>
                              ))}
                            </select>
                            <ChevronDown className={styles.searchIcon} style={{right: '0.75rem', left: 'auto', pointerEvents: 'none'}} />
                          </div>

                          <div style={{position: 'relative', width: '10rem'}}>
                            <select
                              value={condition.operator}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'operator', e.target.value)}
                              className={styles.select}
                            >
                              {FILTER_OPERATORS.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>
                            <ChevronDown className={styles.searchIcon} style={{right: '0.75rem', left: 'auto', pointerEvents: 'none'}} />
                          </div>

                          {!['IS NULL', 'IS NOT NULL'].includes(condition.operator) && (
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'value', e.target.value)}
                              placeholder="Value..."
                              className={styles.input}
                              style={{flex: 1}}
                            />
                          )}

                          <button
                            onClick={() => handleRemoveFilterCondition(condition.id)}
                            className={styles.menuButton}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* SQL Preview */}
                    {filterConditions.some(c => c.column && c.operator) && (
                      <div className={styles.relSummary} style={{backgroundColor: '#18181b', borderColor: '#27272a'}}>
                        <div className={styles.sectionHeader} style={{marginBottom: '0.5rem', color: '#9ca3af'}}>
                          <Code2 className="w-4 h-4" />
                          <span className={styles.description} style={{fontSize: '0.75rem', fontWeight: 500}}>Generated WHERE clause</span>
                        </div>
                        <code className={styles.exampleCell} style={{color: '#4ade80', fontSize: '0.875rem'}}>
                          WHERE {filterConditions
                            .filter(c => c.column && c.operator)
                            .map(c => {
                              if (['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                                return `${c.column} ${c.operator}`;
                              }
                              return `${c.column} ${c.operator} '${c.value}'`;
                            })
                            .join(` ${filterLogic} `)}
                        </code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className={styles.formStack}>
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>
                    Review Configuration
                  </h2>
                  
                  <div className={styles.formStack}>
                    <div className={styles.typeGrid} style={{borderBottom: '1px solid #e5e7eb', paddingBottom: '1.5rem'}}>
                      <div>
                        <span className={styles.description} style={{fontSize: '0.75rem'}}>Dataset Name</span>
                        <p className={styles.itemName}>{datasetName}</p>
                      </div>
                      <div>
                        <span className={styles.description} style={{fontSize: '0.75rem'}}>Type</span>
                        <p className={styles.itemName} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                          {datasetType === 'persistent' ? (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              Persistent
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-cyan-500" />
                              Virtualized
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className={styles.label}>Source</h3>
                      <div className={styles.relSummary}>
                        {datasetType === 'persistent' ? (
                          <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                            <Layers className="w-4 h-4 text-amber-500" />
                            <span className={styles.itemName}>
                              {MOCK_BRONZE_DATASETS.find(d => d.id === sourceBronze)?.name}
                            </span>
                            <span className={styles.description}>(Bronze Dataset)</span>
                          </div>
                        ) : (
                          <div className={styles.formStack} style={{gap: '0.5rem'}}>
                            {selectedTables.map(id => {
                              const info = getTableInfo(id);
                              if (!info) return null;
                              return (
                                <div key={id} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                  <div 
                                    className={styles.connDot} 
                                    style={{ backgroundColor: info.connection.color, width: '0.75rem', height: '0.75rem' }}
                                  />
                                  <span className={styles.itemName}>
                                    {info.table.name}
                                  </span>
                                  <span className={styles.description}>
                                    {info.connection.name} • {info.table.columns.length} columns
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className={styles.label}>Columns</h3>
                      <div className={styles.relSummary}>
                        <span className={styles.itemName}>
                          {totalSelectedColumns} columns selected
                        </span>
                        {columnSelections.length > 0 && (
                          <div style={{marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem'}}>
                            {columnSelections.map(sel => {
                              const info = getTableInfo(sel.tableId);
                              if (!info) return null;
                              return (
                                <div key={sel.tableId} className={styles.description} style={{fontSize: '0.75rem'}}>
                                  {info.table.name}: {sel.columnIds.length} columns
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {transformations.length > 0 && (
                      <div>
                        <h3 className={styles.label}>
                          Transformations ({transformations.length})
                        </h3>
                        <div className={styles.formStack} style={{gap: '0.5rem'}}>
                          {transformations.map(t => (
                            <div key={t.id} className={styles.relSummary} style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem'}}>
                              <code className={styles.codeCell} style={{backgroundColor: '#e5e7eb', color: '#374151'}}>{t.columnName || '(column)'}</code>
                              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                              <span className={styles.codeCell}>
                                {t.type}
                              </span>
                              {t.ruleId && (
                                <span className={styles.description} style={{fontSize: '0.75rem'}}>
                                  → {MOCK_RULES.find(r => r.id === t.ruleId)?.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedColumnGroups.length > 0 && (
                      <div>
                        <h3 className={styles.label}>
                          Column Groups ({selectedColumnGroups.length})
                        </h3>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '0.5rem'}}>
                          {selectedColumnGroups.map(id => (
                            <span key={id} className={styles.codeCell} style={{display: 'flex', alignItems: 'center', gap: '0.375rem'}}>
                              <GitMerge className="w-3.5 h-3.5" />
                              {MOCK_COLUMN_GROUPS.find(g => g.id === id)?.name}
                            </span>
                          ))}
                        </div>
                        {excludeSourceColumns && (
                          <p className={styles.description} style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>• Source columns will be hidden</p>
                        )}
                      </div>
                    )}

                    {filterConditions.length > 0 && (
                      <div>
                        <h3 className={styles.label}>
                          Filter Conditions ({filterConditions.length})
                        </h3>
                        <div className={styles.relSummary} style={{backgroundColor: '#18181b', borderColor: '#27272a'}}>
                          <code className={styles.exampleCell} style={{color: '#4ade80', fontSize: '0.875rem'}}>
                            WHERE {filterConditions
                              .filter(c => c.column && c.operator)
                              .map(c => {
                                if (['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                                  return `${c.column} ${c.operator}`;
                                }
                                return `${c.column} ${c.operator} '${c.value}'`;
                              })
                              .join(` ${filterLogic} `)}
                          </code>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.modalFooter}>
          <div style={{flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '56rem', margin: '0 auto'}}>
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className={clsx(
                styles.backButton,
                currentStep === 1 ? styles.stepInactive : "",
                "flex items-center gap-2"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className={styles.description}>
              Step {currentStep} of {STEPS.length}
            </div>
            
            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className={clsx(
                  styles.createButton,
                  !canProceed() ? styles.stepInactive : styles.btnPurple,
                  "flex items-center gap-2"
                )}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className={styles.gridBtns}>
                <button className={styles.previewBtn}>
                  <Eye className="w-4 h-4" />
                  Preview SQL
                </button>
                <button className={clsx(styles.createButton, styles.btnPurple, "flex items-center gap-2")}>
                  <Check className="w-4 h-4" />
                  {datasetType === 'persistent' ? 'Create & Execute' : 'Create Dataset'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}