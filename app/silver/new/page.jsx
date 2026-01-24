'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Select Columns', icon: Columns },
  { id: 3, title: 'Transformations', icon: Code2 },
  { id: 4, title: 'Equivalence', icon: GitMerge },
  { id: 5, title: 'Filters', icon: Filter },
  { id: 6, title: 'Review', icon: Eye },
];

// Mock data
const MOCK_BRONZE_DATASETS = [
  { id: 'bronze_1', name: 'patients_raw', tables: 2, rows: 125430 },
  { id: 'bronze_2', name: 'orders_unified', tables: 3, rows: 456789 },
  { id: 'bronze_3', name: 'customer_360', tables: 2, rows: 89234 },
  { id: 'bronze_4', name: 'inventory_snapshot', tables: 1, rows: 12500 },
];

// Mock connections with tables and columns (same pattern as Bronze)
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
  { value: 'remove_accents', label: 'Remove Accents', description: 'Convert a to a, e to e, etc.' },
  { value: 'template', label: 'Template Rule', description: 'Apply normalization rule' },
];

export default function NewSilverDatasetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Type & Source
  const [datasetType, setDatasetType] = useState('persistent');
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBronze, setSourceBronze] = useState('');
  const [selectedTables, setSelectedTables] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState([MOCK_CONNECTIONS[0].id]);
  const [tableSearch, setTableSearch] = useState('');
  
  // Step 2: Columns
  const [columnSelections, setColumnSelections] = useState([]);
  const [expandedTables, setExpandedTables] = useState([]);
  
  // Step 3: Transformations
  const [transformations, setTransformations] = useState([]);
  
  // Step 4: Equivalence
  const [selectedColumnGroups, setSelectedColumnGroups] = useState([]);
  const [excludeSourceColumns, setExcludeSourceColumns] = useState(false);
  
  // Step 5: Filters
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

  // Get all available columns for filter
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
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                href="/silver"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Silver Dataset</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure data transformation or virtualized view
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps Indicator */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Type & Source */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Choose Dataset Type
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <button
                      onClick={() => setDatasetType('persistent')}
                      className={clsx(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        datasetType === 'persistent'
                          ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                          : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Persistent</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Persist data to Silver Delta Lake. Best for ETL pipelines.
                      </p>
                    </button>
                    
                    <button
                      onClick={() => setDatasetType('virtualized')}
                      className={clsx(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        datasetType === 'virtualized'
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                          : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                          <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Virtualized</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Query source data on-demand. Best for exploration and APIs.
                      </p>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Dataset Name *
                      </label>
                      <input 
                        type="text"
                        value={datasetName}
                        onChange={(e) => setDatasetName(e.target.value)}
                        placeholder="e.g., patients_normalized"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Description
                      </label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the purpose of this dataset..."
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Source Selection */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {datasetType === 'persistent' ? 'Select Bronze Dataset' : 'Select Source Tables'}
                  </h2>
                  
                  {datasetType === 'persistent' ? (
                    <div className="grid grid-cols-2 gap-3">
                      {MOCK_BRONZE_DATASETS.map((dataset) => (
                        <button
                          key={dataset.id}
                          onClick={() => setSourceBronze(dataset.id)}
                          className={clsx(
                            "p-4 rounded-lg border-2 text-left transition-all",
                            sourceBronze === dataset.id
                              ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                              : "border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {dataset.name}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {dataset.tables} tables - {dataset.rows.toLocaleString()} rows
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">
                          {selectedTables.length} table(s) selected
                        </span>
                      </div>

                      <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={tableSearch}
                          onChange={(e) => setTableSearch(e.target.value)}
                          placeholder="Search tables..."
                          className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                        />
                      </div>

                      <div className="space-y-2 max-h-[350px] overflow-auto">
                        {MOCK_CONNECTIONS.map((conn) => (
                          <div key={conn.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                            <button
                              onClick={() => toggleConnection(conn.id)}
                              className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                            >
                              <div className="flex items-center gap-3">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: conn.color }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white text-sm">
                                  {conn.name}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {conn.tables.length} tables
                                </span>
                              </div>
                              <ChevronDown className={clsx(
                                "w-4 h-4 text-gray-400 transition-persistent",
                                expandedConnections.includes(conn.id) && "rotate-180"
                              )} />
                            </button>
                            
                            {expandedConnections.includes(conn.id) && (
                              <div className="p-2 space-y-1">
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
                                        "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                        selectedTables.includes(table.id)
                                          ? "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800"
                                          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={clsx(
                                          "w-5 h-5 rounded border-2 flex items-center justify-center",
                                          selectedTables.includes(table.id)
                                            ? "bg-cyan-500 border-cyan-500"
                                            : "border-gray-300 dark:border-zinc-600"
                                        )}>
                                          {selectedTables.includes(table.id) && <Check className="w-3 h-3 text-white" />}
                                        </div>
                                        <Table2 className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-white">
                                          {table.name}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
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

            {/* Step 2: Select Columns */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Columns
                  </h2>
                  <span className="text-sm text-gray-500">
                    {totalSelectedColumns} column(s) selected
                  </span>
                </div>

                <div className="space-y-4 max-h-[500px] overflow-auto">
                  {selectedTables.map((tableId) => {
                    const info = getTableInfo(tableId);
                    if (!info) return null;
                    const { table, connection } = info;
                    const isExpanded = expandedTables.includes(table.id);
                    const selection = columnSelections.find(s => s.tableId === table.id);
                    const selectedCount = selection?.columnIds.length || 0;
                    
                    return (
                      <div key={table.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTable(table.id)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: connection.color }}
                            />
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {table.name}
                            </span>
                            <span className="text-xs text-gray-500">
                              {connection.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-purple-600 dark:text-purple-400">
                              {selectedCount}/{table.columns.length} selected
                            </span>
                            <ChevronDown className={clsx(
                              "w-4 h-4 text-gray-400 transition-persistent",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-3 space-y-1">
                            {/* Select All */}
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
                              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 mb-2"
                            >
                              <div className={clsx(
                                "w-5 h-5 rounded border-2 flex items-center justify-center",
                                selectedCount === table.columns.length
                                  ? "bg-purple-500 border-purple-500"
                                  : "border-gray-300 dark:border-zinc-600"
                              )}>
                                {selectedCount === table.columns.length && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select All
                              </span>
                            </div>

                            {/* Columns */}
                            {table.columns.map((column) => {
                              const isSelected = selection?.columnIds.includes(column.id) || false;
                              return (
                                <div
                                  key={column.id}
                                  onClick={() => toggleColumnSelection(table.id, column.id, table.columns)}
                                  className={clsx(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                    isSelected
                                      ? "bg-purple-50 dark:bg-purple-900/20"
                                      : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={clsx(
                                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                                      isSelected
                                        ? "bg-purple-500 border-purple-500"
                                        : "border-gray-300 dark:border-zinc-600"
                                    )}>
                                      {isSelected && <Check className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm text-gray-900 dark:text-white font-mono">
                                      {column.name}
                                    </span>
                                    {column.isPK && (
                                      <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                        PK
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-xs text-gray-500 font-mono">
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
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <Columns className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No tables selected</p>
                    <p className="text-xs mt-1">Go back and select source tables first</p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Transformations */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Column Transformations
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Apply text transformations to specific columns
                    </p>
                  </div>
                  <button
                    onClick={handleAddTransformation}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Transformation
                  </button>
                </div>
                
                {transformations.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <Code2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No transformations configured</p>
                    <p className="text-xs mt-1">Click &quot;Add Transformation&quot; to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transformations.map((t) => (
                      <div 
                        key={t.id}
                        className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                      >
                        <div className="relative flex-1">
                          <select
                            value={t.columnId}
                            onChange={(e) => handleTransformationChange(t.id, 'columnId', Number(e.target.value))}
                            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                          >
                            <option value={0}>Select column...</option>
                            {MOCK_COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        
                        <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                        
                        <div className="relative flex-1">
                          <select
                            value={t.type}
                            onChange={(e) => handleTransformationChange(t.id, 'type', e.target.value)}
                            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                          >
                            {TRANSFORMATION_TYPES.map(type => (
                              <option key={type.value} value={type.value}>{type.label}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        
                        {t.type === 'template' && (
                          <div className="relative flex-1">
                            <select
                              value={t.ruleId || ''}
                              onChange={(e) => handleTransformationChange(t.id, 'ruleId', Number(e.target.value))}
                              className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            >
                              <option value="">Select rule...</option>
                              {MOCK_RULES.map(r => (
                                <option key={r.id} value={r.id}>{r.name}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>
                        )}
                        
                        <button
                          onClick={() => handleRemoveTransformation(t.id)}
                          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-red-500"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    <strong>Tip:</strong> For value mappings (e.g., M to Masculino), use Column Groups in the next step instead of transformations.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Equivalence */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Column Groups (Semantic Unification)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Apply column unification and value mappings from the Equivalence layer
                  </p>
                  
                  <div className="space-y-2">
                    {MOCK_COLUMN_GROUPS.map((group) => (
                      <label
                        key={group.id}
                        className={clsx(
                          "flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-all",
                          selectedColumnGroups.includes(group.id)
                            ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                            : "border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800"
                        )}
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
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {group.name}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {group.description} - {group.termCount} mappings
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  {selectedColumnGroups.length > 0 && (
                    <label className="flex items-center gap-3 mt-4 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={excludeSourceColumns}
                        onChange={(e) => setExcludeSourceColumns(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white text-sm">
                          Exclude Source Columns
                        </span>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Only show unified columns, hide original source columns
                        </p>
                      </div>
                    </label>
                  )}
                </div>
                
                <Link 
                  href="/equivalence"
                  className="block p-4 rounded-lg border border-dashed border-gray-300 dark:border-zinc-600 text-center hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  <GitMerge className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Manage Column Groups in Equivalence
                  </span>
                </Link>
              </div>
            )}

            {/* Step 5: Filters */}
            {currentStep === 5 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Filter Conditions
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Define WHERE conditions to filter your data (optional)
                    </p>
                  </div>
                  <button
                    onClick={handleAddFilterCondition}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                    Add Condition
                  </button>
                </div>

                {filterConditions.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                    <Filter className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No filter conditions</p>
                    <p className="text-xs mt-1">Click &quot;Add Condition&quot; to filter your data</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Logic selector */}
                    {filterConditions.length > 1 && (
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Combine conditions with:</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setFilterLogic('AND')}
                            className={clsx(
                              "px-3 py-1 text-sm font-medium rounded-lg transition-colors",
                              filterLogic === 'AND'
                                ? "bg-purple-500 text-white"
                                : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600"
                            )}
                          >
                            AND
                          </button>
                          <button
                            onClick={() => setFilterLogic('OR')}
                            className={clsx(
                              "px-3 py-1 text-sm font-medium rounded-lg transition-colors",
                              filterLogic === 'OR'
                                ? "bg-purple-500 text-white"
                                : "bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600"
                            )}
                          >
                            OR
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conditions */}
                    <div className="space-y-3">
                      {filterConditions.map((condition, index) => (
                        <div 
                          key={condition.id}
                          className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                        >
                          {index > 0 && (
                            <span className="text-xs font-medium text-purple-600 dark:text-purple-400 w-10">
                              {filterLogic}
                            </span>
                          )}
                          {index === 0 && filterConditions.length > 1 && (
                            <span className="w-10"></span>
                          )}
                          
                          <div className="relative flex-1">
                            <select
                              value={condition.column}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'column', e.target.value)}
                              className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            >
                              <option value="">Select column...</option>
                              {availableColumnsForFilter.map(col => (
                                <option key={col.id} value={col.id}>{col.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>

                          <div className="relative w-40">
                            <select
                              value={condition.operator}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'operator', e.target.value)}
                              className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            >
                              {FILTER_OPERATORS.map(op => (
                                <option key={op.value} value={op.value}>{op.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                          </div>

                          {!['IS NULL', 'IS NOT NULL'].includes(condition.operator) && (
                            <input
                              type="text"
                              value={condition.value}
                              onChange={(e) => handleFilterConditionChange(condition.id, 'value', e.target.value)}
                              placeholder="Value..."
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            />
                          )}

                          <button
                            onClick={() => handleRemoveFilterCondition(condition.id)}
                            className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* SQL Preview */}
                    {filterConditions.some(c => c.column && c.operator) && (
                      <div className="mt-4 p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950">
                        <div className="flex items-center gap-2 mb-2">
                          <Code2 className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-medium text-gray-400">Generated WHERE clause</span>
                        </div>
                        <code className="text-sm text-green-400 font-mono">
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

            {/* Step 6: Review */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Review Configuration
                  </h2>
                  
                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-200 dark:border-zinc-700">
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Dataset Name</span>
                        <p className="font-semibold text-gray-900 dark:text-white">{datasetName}</p>
                      </div>
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Type</span>
                        <p className="flex items-center gap-2">
                          {datasetType === 'persistent' ? (
                            <>
                              <Sparkles className="w-4 h-4 text-purple-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">Persistent</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-4 h-4 text-cyan-500" />
                              <span className="font-semibold text-gray-900 dark:text-white">Virtualized</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    {/* Source */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Source</h3>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        {datasetType === 'persistent' ? (
                          <div className="flex items-center gap-2">
                            <Layers className="w-4 h-4 text-amber-500" />
                            <span className="text-gray-900 dark:text-white">
                              {MOCK_BRONZE_DATASETS.find(d => d.id === sourceBronze)?.name}
                            </span>
                            <span className="text-xs text-gray-500">(Bronze Dataset)</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedTables.map(id => {
                              const info = getTableInfo(id);
                              if (!info) return null;
                              return (
                                <div key={id} className="flex items-center gap-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: info.connection.color }}
                                  />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {info.table.name}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {info.connection.name} - {info.table.columns.length} columns
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Columns */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Columns</h3>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <span className="text-gray-900 dark:text-white">
                          {totalSelectedColumns} columns selected
                        </span>
                        {columnSelections.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {columnSelections.map(sel => {
                              const info = getTableInfo(sel.tableId);
                              if (!info) return null;
                              return (
                                <div key={sel.tableId} className="text-xs text-gray-500">
                                  {info.table.name}: {sel.columnIds.length} columns
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Transformations */}
                    {transformations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Transformations ({transformations.length})
                        </h3>
                        <div className="space-y-2">
                          {transformations.map(t => (
                            <div key={t.id} className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                              <code className="text-sm font-mono">{t.columnName || '(column)'}</code>
                              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                              <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                                {t.type}
                              </span>
                              {t.ruleId && (
                                <span className="text-xs text-gray-500">
                                  {MOCK_RULES.find(r => r.id === t.ruleId)?.name}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Column Groups */}
                    {selectedColumnGroups.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Column Groups ({selectedColumnGroups.length})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedColumnGroups.map(id => (
                            <span key={id} className="px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm flex items-center gap-1.5">
                              <GitMerge className="w-3.5 h-3.5" />
                              {MOCK_COLUMN_GROUPS.find(g => g.id === id)?.name}
                            </span>
                          ))}
                        </div>
                        {excludeSourceColumns && (
                          <p className="text-xs text-gray-500 mt-2">Source columns will be hidden</p>
                        )}
                      </div>
                    )}
                    
                    {/* Filters */}
                    {filterConditions.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Filter Conditions ({filterConditions.length})
                        </h3>
                        <div className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950">
                          <code className="text-sm text-green-400 font-mono">
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

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
            
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep} of {STEPS.length}
            </div>
            
            {currentStep < STEPS.length ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">
                  <Eye className="w-4 h-4" />
                  Preview SQL
                </button>
                <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg">
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
