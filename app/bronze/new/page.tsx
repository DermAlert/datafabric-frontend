'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft,
  ArrowRight,
  Check,
  Table2,
  Columns,
  Link2,
  Eye,
  Play,
  ChevronDown,
  ChevronRight,
  Search,
  Info,
  Zap,
  Layers,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock connections with tables and columns
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

// Mock relationships
const MOCK_RELATIONSHIPS = [
  { id: 1, leftTable: 'patients', leftColumn: 'id', rightTable: 'medical_records', rightColumn: 'patient_id', type: '1:N' },
  { id: 2, leftTable: 'orders', leftColumn: 'id', rightTable: 'transactions', rightColumn: 'order_id', type: '1:N' },
  { id: 3, leftTable: 'patients', leftColumn: 'email', rightTable: 'users', rightColumn: 'email', type: '1:1', isCrossConnection: true },
];

type TableSelection = {
  tableId: number;
  selectAll: boolean;
  columnIds: number[];
};

const STEPS = [
  { id: 1, title: 'Basic Info', icon: Info },
  { id: 2, title: 'Select Tables', icon: Table2 },
  { id: 3, title: 'Select Columns', icon: Columns },
  { id: 4, title: 'Relationships', icon: Link2 },
  { id: 5, title: 'Review', icon: Eye },
];

export default function NewBronzeDatasetPage() {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Basic Info
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Step 2 & 3: Table and Column Selection
  const [selectedTables, setSelectedTables] = useState<TableSelection[]>([]);
  const [expandedConnections, setExpandedConnections] = useState<string[]>([MOCK_CONNECTIONS[0].id]);
  const [expandedTables, setExpandedTables] = useState<number[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  
  // Step 4: Relationships
  const [selectedRelationships, setSelectedRelationships] = useState<number[]>([]);
  const [enableFederatedJoins, setEnableFederatedJoins] = useState(false);

  const toggleConnection = (connId: string) => {
    setExpandedConnections(prev => 
      prev.includes(connId) ? prev.filter(id => id !== connId) : [...prev, connId]
    );
  };

  const toggleTable = (tableId: number) => {
    setExpandedTables(prev => 
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    );
  };

  const isTableSelected = (tableId: number) => {
    return selectedTables.some(t => t.tableId === tableId);
  };

  const toggleTableSelection = (tableId: number, columns: { id: number }[]) => {
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

  const toggleColumnSelection = (tableId: number, columnId: number, allColumns: { id: number }[]) => {
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

  const toggleRelationship = (relId: number) => {
    setSelectedRelationships(prev => 
      prev.includes(relId) ? prev.filter(id => id !== relId) : [...prev, relId]
    );
  };

  const getTableById = (tableId: number) => {
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
      case 1: return name.trim().length > 0;
      case 2: return selectedTables.length > 0;
      case 3: return selectedTables.every(t => t.columnIds.length > 0);
      case 4: return true; // Relationships are optional
      case 5: return true;
      default: return false;
    }
  };

  const totalSelectedColumns = selectedTables.reduce((sum, t) => sum + t.columnIds.length, 0);

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <Link 
              href="/bronze"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">New Bronze Dataset</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Configure raw data ingestion from source systems
                </p>
              </div>
            </div>
          </div>

          {/* Steps Progress */}
          <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-2">
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
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap",
                      isActive && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
                      isCompleted && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/50",
                      !isActive && !isCompleted && "bg-gray-100 dark:bg-zinc-800 text-gray-400 cursor-not-allowed"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    {step.title}
                  </button>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Basic Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dataset Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., patients_raw"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Use lowercase with underscores. This will be used as the dataset identifier.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe the purpose and contents of this dataset..."
                      rows={3}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Select Tables */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Source Tables
                  </h2>
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

                <div className="space-y-2 max-h-[400px] overflow-auto">
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
                          "w-4 h-4 text-gray-400 transition-transform",
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
                                onClick={() => toggleTableSelection(table.id, table.columns)}
                                className={clsx(
                                  "flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors",
                                  isTableSelected(table.id)
                                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                    : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={clsx(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                                    isTableSelected(table.id)
                                      ? "bg-amber-500 border-amber-500"
                                      : "border-gray-300 dark:border-zinc-600"
                                  )}>
                                    {isTableSelected(table.id) && <Check className="w-3 h-3 text-white" />}
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
              </div>
            )}

            {/* Step 3: Select Columns */}
            {currentStep === 3 && (
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
                  {selectedTables.map((selection) => {
                    const result = getTableById(selection.tableId);
                    if (!result) return null;
                    const { table, connection } = result;
                    const isExpanded = expandedTables.includes(table.id);
                    
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
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {selection.columnIds.length}/{table.columns.length} selected
                            </span>
                            <ChevronDown className={clsx(
                              "w-4 h-4 text-gray-400 transition-transform",
                              isExpanded && "rotate-180"
                            )} />
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-3 space-y-1">
                            {/* Select All */}
                            <div
                              onClick={() => {
                                const allSelected = selection.columnIds.length === table.columns.length;
                                setSelectedTables(prev => prev.map(t => 
                                  t.tableId === table.id
                                    ? { ...t, selectAll: !allSelected, columnIds: allSelected ? [] : table.columns.map(c => c.id) }
                                    : t
                                ));
                              }}
                              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 mb-2"
                            >
                              <div className={clsx(
                                "w-5 h-5 rounded border-2 flex items-center justify-center",
                                selection.selectAll
                                  ? "bg-amber-500 border-amber-500"
                                  : "border-gray-300 dark:border-zinc-600"
                              )}>
                                {selection.selectAll && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select All
                              </span>
                            </div>

                            {/* Columns */}
                            {table.columns.map((column) => (
                              <div
                                key={column.id}
                                onClick={() => toggleColumnSelection(table.id, column.id, table.columns)}
                                className={clsx(
                                  "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                  selection.columnIds.includes(column.id)
                                    ? "bg-amber-50 dark:bg-amber-900/20"
                                    : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={clsx(
                                    "w-5 h-5 rounded border-2 flex items-center justify-center",
                                    selection.columnIds.includes(column.id)
                                      ? "bg-amber-500 border-amber-500"
                                      : "border-gray-300 dark:border-zinc-600"
                                  )}>
                                    {selection.columnIds.includes(column.id) && <Check className="w-3 h-3 text-white" />}
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
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Relationships */}
            {currentStep === 4 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Configure Relationships
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Select relationships to use for joining tables during ingestion
                    </p>
                  </div>
                </div>

                {/* Federated Joins Toggle */}
                <div className="p-4 mb-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          Enable Federated Joins
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
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

                {/* Available Relationships */}
                <div className="space-y-2">
                  {getAvailableRelationships().length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Link2 className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No relationships available for selected tables</p>
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
                          "flex items-center justify-between p-4 rounded-lg border transition-colors",
                          rel.isCrossConnection && !enableFederatedJoins
                            ? "bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 opacity-50 cursor-not-allowed"
                            : selectedRelationships.includes(rel.id)
                              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 cursor-pointer"
                              : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 hover:border-amber-200 dark:hover:border-amber-800 cursor-pointer"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={clsx(
                            "w-5 h-5 rounded border-2 flex items-center justify-center",
                            selectedRelationships.includes(rel.id)
                              ? "bg-amber-500 border-amber-500"
                              : "border-gray-300 dark:border-zinc-600"
                          )}>
                            {selectedRelationships.includes(rel.id) && <Check className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-mono text-gray-900 dark:text-white">
                                {rel.leftTable}.{rel.leftColumn}
                              </span>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                              <span className="font-mono text-gray-900 dark:text-white">
                                {rel.rightTable}.{rel.rightColumn}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-500">{rel.type}</span>
                              {rel.isCrossConnection && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
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

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Review Configuration
                  </h2>

                  <div className="space-y-6">
                    {/* Basic Info */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Basic Info</h3>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="font-semibold text-gray-900 dark:text-white">{name}</div>
                        {description && <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{description}</p>}
                      </div>
                    </div>

                    {/* Tables & Columns */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                        Source Tables ({selectedTables.length})
                      </h3>
                      <div className="space-y-2">
                        {selectedTables.map((selection) => {
                          const result = getTableById(selection.tableId);
                          if (!result) return null;
                          return (
                            <div key={selection.tableId} className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: result.connection.color }}
                                />
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.table.name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {selection.columnIds.length} columns
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Relationships */}
                    {selectedRelationships.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Relationships ({selectedRelationships.length})
                        </h3>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {selectedRelationships.length} relationship(s) configured
                          </div>
                          {enableFederatedJoins && (
                            <div className="flex items-center gap-2 mt-2 text-purple-600 dark:text-purple-400 text-sm">
                              <Zap className="w-4 h-4" />
                              Federated joins enabled
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg">
                    <Eye className="w-4 h-4" />
                    Preview Data
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg">
                    <Play className="w-4 h-4" />
                    Create & Run Ingestion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="max-w-4xl mx-auto flex justify-between">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                currentStep === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            
            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                disabled={!canProceed()}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  canProceed()
                    ? "text-white bg-amber-500 hover:bg-amber-600"
                    : "text-gray-400 bg-gray-200 dark:bg-zinc-700 cursor-not-allowed"
                )}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg"
              >
                <Check className="w-4 h-4" />
                Save Configuration
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
