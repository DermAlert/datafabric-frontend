'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  CheckCircle2,
  Sparkles,
  HardDrive,
  Network,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { bronzeService } from '@/lib/api/services/bronze';
import { metadataService, connectionService, relationshipsService, federationService } from '@/lib/api/services';

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Select Columns', icon: Columns },
  { id: 3, title: 'Review', icon: Eye },
];

export default function NewBronzeDatasetPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Step 1: Type & Basic Info
  const [datasetType, setDatasetType] = useState('persistent');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  
  // Connections and Tables from API
  const [connections, setConnections] = useState([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  
  // Step 1 & 2: Table and Column Selection
  const [selectedTables, setSelectedTables] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState([]);
  const [expandedTables, setExpandedTables] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  
  // Federated Joins
  const [enableFederatedJoins, setEnableFederatedJoins] = useState(false);
  const [crossConnectionRelationships, setCrossConnectionRelationships] = useState([]);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);

  // Federations
  const [federations, setFederations] = useState([]);
  const [isLoadingFederations, setIsLoadingFederations] = useState(false);
  const [showFederationModal, setShowFederationModal] = useState(false);
  const [federationSearch, setFederationSearch] = useState('');

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load connections and their tables/schemas
  useEffect(() => {
    const loadConnectionsAndTables = async () => {
      setIsLoadingConnections(true);
      setConnectionError(null);
      
      try {
        // Get all data connections
        const dataConnections = await connectionService.list();
        
        // Filter only metadata connections (exclude image storage connections)
        const metadataConnections = dataConnections.filter(
          conn => conn.content_type === 'metadata'
        );
        
        // For each connection, load schemas, tables, and connection type color
        const connectionsWithTables = await Promise.all(
          metadataConnections.map(async (conn) => {
            try {
              // Fetch connection type to get the color
              let connectionColor = '#6B7280'; // Default gray
              try {
                const connectionType = await connectionService.getById(conn.connection_type_id);
                connectionColor = connectionType.color_hex || '#6B7280';
              } catch (err) {
                console.error(`Failed to load connection type ${conn.connection_type_id}:`, err);
              }
              
              const schemas = await metadataService.listSchemas(conn.id);
              
              // Get tables for each schema
              const tablesPromises = schemas.map(async (schema) => {
                try {
                  const tables = await metadataService.listTables(schema.id);
                  // Get column count for each table
                  const tablesWithColumns = await Promise.all(
                    tables.map(async (t) => {
                      try {
                        const columns = await metadataService.listColumns(t.id);
                        return {
                          ...t,
                          schemaName: schema.schema_name,
                          connectionId: conn.id,
                          connectionName: conn.name,
                          column_count: columns.length,
                        };
                      } catch {
                        return {
                          ...t,
                          schemaName: schema.schema_name,
                          connectionId: conn.id,
                          connectionName: conn.name,
                          column_count: 0,
                        };
                      }
                    })
                  );
                  return tablesWithColumns;
                } catch (err) {
                  console.error(`Failed to load tables for schema ${schema.id}:`, err);
                  return [];
                }
              });
              
              const allTables = (await Promise.all(tablesPromises)).flat();
              
              return {
                id: conn.id,
                name: conn.name,
                type: conn.connection_type_name || 'unknown',
                color: connectionColor,
                tables: allTables,
              };
            } catch (err) {
              console.error(`Failed to load schemas for connection ${conn.id}:`, err);
              // Try to get connection type color even on error
              let fallbackColor = '#6B7280';
              try {
                const connectionType = await connectionService.getById(conn.connection_type_id);
                fallbackColor = connectionType.color_hex || '#6B7280';
              } catch {
                // Use default color
              }
              return {
                id: conn.id,
                name: conn.name,
                type: conn.connection_type_name || 'unknown',
                color: fallbackColor,
                tables: [],
              };
            }
          })
        );
        
        setConnections(connectionsWithTables);
        // Expand first connection by default if available
        if (connectionsWithTables.length > 0) {
          setExpandedConnections([connectionsWithTables[0].id]);
        }
      } catch (err) {
        console.error('Failed to load connections:', err);
        setConnectionError(err?.message || 'Failed to load connections');
      } finally {
        setIsLoadingConnections(false);
      }
    };

    loadConnectionsAndTables();
  }, []);

  // Load federations
  useEffect(() => {
    const loadFederations = async () => {
      setIsLoadingFederations(true);
      try {
        console.log('Loading federations...');
        const allFederations = await federationService.getAll();
        console.log('Federations loaded:', allFederations);
        setFederations(allFederations);
      } catch (err) {
        console.error('Failed to load federations:', err);
      } finally {
        setIsLoadingFederations(false);
      }
    };

    loadFederations();
  }, []);

  // Check for cross-connection relationships when tables are selected
  useEffect(() => {
    const checkCrossConnectionRelationships = async () => {
      // Need at least 2 tables from different connections
      if (selectedTables.length < 2) {
        setCrossConnectionRelationships([]);
        setEnableFederatedJoins(false);
        return;
      }

      // Check if tables are from different connections
      const connectionIds = [...new Set(selectedTables.map(t => {
        const table = connections.flatMap(c => c.tables).find(ct => ct.id === t.tableId);
        return table?.connectionId;
      }))];

      if (connectionIds.length < 2) {
        setCrossConnectionRelationships([]);
        setEnableFederatedJoins(false);
        return;
      }

      setIsLoadingRelationships(true);
      try {
        // Get all table IDs
        const tableIds = selectedTables.map(t => t.tableId);
        
        // Fetch relationships for each table
        const relationshipPromises = tableIds.map(tableId => 
          relationshipsService.listForTable(tableId).catch(() => [])
        );
        
        const allRelationships = (await Promise.all(relationshipPromises)).flat();
        
        // Filter for cross-connection relationships where both tables are in our selection
        const crossConnRels = allRelationships.filter(rel => {
          const leftTableId = rel.left_column?.table_id;
          const rightTableId = rel.right_column?.table_id;
          
          // Both tables must be in our selection
          const bothTablesSelected = tableIds.includes(leftTableId) && tableIds.includes(rightTableId);
          
          // Must be cross-connection (inter_connection scope)
          const isCrossConnection = rel.scope === 'inter_connection';
          
          return bothTablesSelected && isCrossConnection;
        });
        
        // Remove duplicates (same relationship might appear from both tables)
        const uniqueRels = crossConnRels.filter((rel, index, self) => 
          index === self.findIndex(r => r.id === rel.id)
        );
        
        setCrossConnectionRelationships(uniqueRels);
        
        // Auto-disable federated joins if no relationships found
        if (uniqueRels.length === 0) {
          setEnableFederatedJoins(false);
        }
      } catch (err) {
        console.error('Failed to check relationships:', err);
        setCrossConnectionRelationships([]);
      } finally {
        setIsLoadingRelationships(false);
      }
    };

    checkCrossConnectionRelationships();
  }, [selectedTables, connections]);

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

  const toggleTableSelection = useCallback(async (table) => {
    const tableId = table.id;
    
    if (isTableSelected(tableId)) {
      setSelectedTables(prev => prev.filter(t => t.tableId !== tableId));
    } else {
      // Load columns for the table
      try {
        const columns = await metadataService.listColumns(tableId);
        setSelectedTables(prev => [...prev, {
          tableId,
          tableName: table.table_name,
          connectionName: table.connectionName,
          selectAll: true,
          columns: columns,
          columnIds: columns.map(c => c.id),
        }]);
      } catch (err) {
        console.error('Failed to load columns:', err);
        // Still add the table but with select_all flag
        setSelectedTables(prev => [...prev, {
          tableId,
          tableName: table.table_name,
          connectionName: table.connectionName,
          selectAll: true,
          columns: [],
          columnIds: [],
        }]);
      }
    }
  }, [selectedTables]);

  const toggleColumnSelection = (tableId, columnId) => {
    setSelectedTables(prev => {
      return prev.map(t => {
        if (t.tableId !== tableId) return t;
        
        const newColumnIds = t.columnIds.includes(columnId)
          ? t.columnIds.filter(id => id !== columnId)
          : [...t.columnIds, columnId];
        
        return {
          ...t,
          columnIds: newColumnIds,
          selectAll: newColumnIds.length === t.columns.length,
        };
      }).filter(t => t.columnIds.length > 0 || t.selectAll);
    });
  };

  // Apply federation - select all tables from the federation
  const applyFederation = async (federation) => {
    try {
      // Get detailed federation info with tables
      const detailedFederation = await federationService.get(federation.id);
      
      if (!detailedFederation.tables || detailedFederation.tables.length === 0) {
        console.warn('Federation has no tables');
        return;
      }

      // Clear current selection and select all tables from the federation
      setSelectedTables([]);
      
      // Load columns and add each table
      for (const table of detailedFederation.tables) {
        try {
          const columns = await metadataService.listColumns(table.id);
          setSelectedTables(prev => [...prev, {
            tableId: table.id,
            tableName: table.table_name,
            connectionName: table.connection_name,
            selectAll: true,
            columns: columns,
            columnIds: columns.map(c => c.id),
          }]);
        } catch (err) {
          console.error(`Failed to load columns for table ${table.id}:`, err);
          // Still add the table but with select_all flag
          setSelectedTables(prev => [...prev, {
            tableId: table.id,
            tableName: table.table_name,
            connectionName: table.connection_name,
            selectAll: true,
            columns: [],
            columnIds: [],
          }]);
        }
      }
      
      // Close modal
      setShowFederationModal(false);
      
      // Expand connections that have selected tables
      const connectionIds = [...new Set(detailedFederation.tables.map(t => t.connection_id))];
      setExpandedConnections(prev => [...new Set([...prev, ...connectionIds])]);
      
    } catch (err) {
      console.error('Failed to apply federation:', err);
    }
  };

  // Filter federations based on search
  const getFilteredFederations = () => {
    if (!federationSearch) return federations;
    return federations.filter(f => 
      f.name.toLowerCase().includes(federationSearch.toLowerCase()) ||
      (f.description && f.description.toLowerCase().includes(federationSearch.toLowerCase()))
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return name.trim().length > 0 && selectedTables.length > 0;
      case 2: return selectedTables.every(t => t.selectAll || t.columnIds.length > 0);
      case 3: return true;
      default: return false;
    }
  };

  const totalSelectedColumns = selectedTables.reduce((sum, t) => {
    return sum + (t.selectAll ? (t.columns?.length || 0) : t.columnIds.length);
  }, 0);

  // Handle form submission
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        tables: selectedTables.map(t => ({
          table_id: t.tableId,
          select_all: t.selectAll,
          column_ids: t.selectAll ? undefined : t.columnIds,
        })),
        enable_federated_joins: enableFederatedJoins,
      };
      
      let result;
      if (datasetType === 'persistent') {
        result = await bronzeService.persistent.create(payload);
      } else {
        result = await bronzeService.virtualized.create(payload);
      }
      
      // Navigate to the new config
      router.push(`/bronze/${datasetType === 'persistent' ? 'p' : 'v'}_${result.id}`);
    } catch (err) {
      console.error('Failed to create config:', err);
      setSubmitError(err?.message || 'Failed to create dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tables based on search
  const getFilteredTables = (tables) => {
    if (!tableSearch) return tables;
    return tables.filter(t => 
      t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.schemaName?.toLowerCase().includes(tableSearch.toLowerCase())
    );
  };

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
            {/* Step 1: Type & Source */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {/* Dataset Type Selection */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Choose Dataset Type
                  </h2>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {/* Persistent Option */}
                    <button
                      onClick={() => setDatasetType('persistent')}
                      className={clsx(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        datasetType === 'persistent'
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20"
                          : "border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={clsx(
                          "p-2 rounded-lg",
                          datasetType === 'persistent'
                            ? "bg-amber-100 dark:bg-amber-900/40"
                            : "bg-gray-100 dark:bg-zinc-800"
                        )}>
                          <Sparkles className={clsx(
                            "w-5 h-5",
                            datasetType === 'persistent'
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-gray-400"
                          )} />
                        </div>
                        <span className={clsx(
                          "font-semibold",
                          datasetType === 'persistent'
                            ? "text-amber-700 dark:text-amber-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          Persistent
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ingest and save data to Delta Lake. Best for ETL pipelines and batch processing.
                      </p>
                    </button>

                    {/* Virtualized Option */}
                    <button
                      onClick={() => setDatasetType('virtualized')}
                      className={clsx(
                        "p-4 rounded-xl border-2 text-left transition-all",
                        datasetType === 'virtualized'
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20"
                          : "border-gray-200 dark:border-zinc-700 hover:border-cyan-300 dark:hover:border-cyan-700"
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={clsx(
                          "p-2 rounded-lg",
                          datasetType === 'virtualized'
                            ? "bg-cyan-100 dark:bg-cyan-900/40"
                            : "bg-gray-100 dark:bg-zinc-800"
                        )}>
                          <Zap className={clsx(
                            "w-5 h-5",
                            datasetType === 'virtualized'
                              ? "text-cyan-600 dark:text-cyan-400"
                              : "text-gray-400"
                          )} />
                        </div>
                        <span className={clsx(
                          "font-semibold",
                          datasetType === 'virtualized'
                            ? "text-cyan-700 dark:text-cyan-300"
                            : "text-gray-700 dark:text-gray-300"
                        )}>
                          Virtualized
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Query source data on-demand. Best for exploration and APIs.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
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
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe the purpose of this dataset..."
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white resize-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quick Start from Federation */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Network className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Quick Start from Federation
                    </h2>
                    <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                      {federations.length} available
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Select a federation to pre-load its tables and relationships, or select tables manually below.
                  </p>

                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={federationSearch}
                      onChange={(e) => setFederationSearch(e.target.value)}
                      placeholder="Search by name..."
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    />
                  </div>

                  {/* Loading state */}
                  {isLoadingFederations ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading federations...
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                        {getFilteredFederations().slice(0, 3).map((federation) => (
                          <button
                            key={federation.id}
                            onClick={() => applyFederation(federation)}
                            className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-left transition-all"
                          >
                            <div className="flex items-center gap-2 mb-3">
                              <Network className="w-4 h-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                              <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                {federation.name}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {federation.connections.map((conn, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs">
                                  <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0" 
                                    style={{ backgroundColor: conn.color || '#6B7280' }}
                                  />
                                  <span className="text-gray-600 dark:text-gray-300">{conn.name}</span>
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{federation.tables_count} tables</span>
                              <span>{federation.relationships_count} relationships</span>
                            </div>
                          </button>
                        ))}
                      </div>
                      
                      {federations.length > 3 && (
                        <div className="flex justify-center">
                          <button
                            onClick={() => setShowFederationModal(true)}
                            className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-1"
                          >
                            +{federations.length - 3} more federations
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Select Tables */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <div className="flex items-center justify-between mb-4">
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

                  {/* Loading state */}
                  {isLoadingConnections ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">Loading connections...</p>
                    </div>
                  ) : connectionError ? (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                      <p className="text-red-600 dark:text-red-400 mb-2">{connectionError}</p>
                      <button 
                        onClick={() => window.location.reload()}
                        className="text-sm text-amber-600 hover:text-amber-700 underline"
                      >
                        Retry
                      </button>
                    </div>
                  ) : connections.length === 0 ? (
                    <div className="text-center py-8">
                      <Network className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400 mb-2">No connections found</p>
                      <Link href="/connections" className="text-sm text-amber-600 hover:text-amber-700">
                        Create a connection first
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-auto">
                      {connections.map((conn) => (
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
                              {getFilteredTables(conn.tables).length === 0 ? (
                                <p className="text-sm text-gray-500 text-center py-4">
                                  {conn.tables.length === 0 ? 'No tables found' : 'No tables match your search'}
                                </p>
                              ) : (
                                getFilteredTables(conn.tables).map((table) => (
                                  <div
                                    key={table.id}
                                    onClick={() => toggleTableSelection(table)}
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
                                      <div>
                                        <span className="text-sm text-gray-900 dark:text-white">
                                          {table.table_name}
                                        </span>
                                        {table.schemaName && (
                                          <span className="text-xs text-gray-500 ml-2">
                                            ({table.schemaName})
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                      {table.column_count || '–'} columns
                                    </span>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Federated Joins Toggle - Only show when cross-connection relationships exist */}
                {crossConnectionRelationships.length > 0 && (
                  <div className="bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800/50 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white text-sm">
                            Enable Federated Joins
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {crossConnectionRelationships.length} cross-database relationship(s) available
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
                    
                    {/* Show available relationships */}
                    {enableFederatedJoins && (
                      <div className="mt-4 pt-4 border-t border-purple-100 dark:border-purple-800/30 space-y-2">
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Available Relationships:
                        </div>
                        {crossConnectionRelationships.map(rel => (
                          <div 
                            key={rel.id}
                            className="flex items-center gap-2 text-xs bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2"
                          >
                            <span className="font-mono text-purple-700 dark:text-purple-300">
                              {rel.left_column?.table_name}.{rel.left_column?.column_name}
                            </span>
                            <span className="text-purple-400">↔</span>
                            <span className="font-mono text-purple-700 dark:text-purple-300">
                              {rel.right_column?.table_name}.{rel.right_column?.column_name}
                            </span>
                            <span className="ml-auto px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-800/50 text-purple-600 dark:text-purple-300 text-[10px]">
                              {rel.cardinality === 'one_to_one' ? '1:1' : rel.cardinality === 'one_to_many' ? '1:N' : 'M:N'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Loading indicator for relationships */}
                {isLoadingRelationships && selectedTables.length > 1 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking for cross-database relationships...
                  </div>
                )}
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
                  {selectedTables.map((selection) => {
                    const isExpanded = expandedTables.includes(selection.tableId);
                    
                    return (
                      <div key={selection.tableId} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleTable(selection.tableId)}
                          className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {selection.tableName}
                            </span>
                            <span className="text-xs text-gray-500">
                              {selection.connectionName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-amber-600 dark:text-amber-400">
                              {selection.selectAll ? 'All' : selection.columnIds.length}/{selection.columns?.length || '?'} columns
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
                                setSelectedTables(prev => prev.map(t => 
                                  t.tableId === selection.tableId
                                    ? { 
                                        ...t, 
                                        selectAll: !t.selectAll, 
                                        columnIds: !t.selectAll ? t.columns.map(c => c.id) : [] 
                                      }
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
                            {(selection.columns || []).map((column) => (
                              <div
                                key={column.id}
                                onClick={() => toggleColumnSelection(selection.tableId, column.id)}
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
                                    {column.column_name}
                                  </span>
                                  {column.is_primary_key && (
                                    <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
                                      PK
                                    </span>
                                  )}
                                </div>
                                <span className="text-xs text-gray-500 font-mono">
                                  {column.data_type}
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

            {/* Step 3: Review */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {submitError && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">{submitError}</span>
                    </div>
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                    Review Configuration
                  </h2>

                  <div className="space-y-6">
                    {/* Dataset Type */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Dataset Type</h3>
                      <div className={clsx(
                        "p-4 rounded-lg flex items-center gap-3",
                        datasetType === 'persistent'
                          ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          : "bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800"
                      )}>
                        {datasetType === 'persistent' ? (
                          <>
                            <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <div>
                              <div className="font-semibold text-amber-700 dark:text-amber-300">Persistent</div>
                              <div className="text-xs text-amber-600 dark:text-amber-400">Data will be saved to Delta Lake</div>
                            </div>
                          </>
                        ) : (
                          <>
                            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                            <div>
                              <div className="font-semibold text-cyan-700 dark:text-cyan-300">Virtualized</div>
                              <div className="text-xs text-cyan-600 dark:text-cyan-400">Data queried on-demand, no storage</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

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
                        {selectedTables.map((selection) => (
                          <div key={selection.tableId} className="p-3 rounded-lg bg-gray-50 dark:bg-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Table2 className="w-4 h-4 text-gray-400" />
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {selection.tableName}
                              </span>
                              <span className="text-xs text-gray-500">
                                ({selection.connectionName})
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {selection.selectAll ? 'All columns' : `${selection.columnIds.length} columns`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Settings */}
                    {enableFederatedJoins && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Settings</h3>
                        <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 text-sm">
                            <Zap className="w-4 h-4" />
                            Federated joins enabled
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button 
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
                      datasetType === 'persistent'
                        ? "bg-amber-500 hover:bg-amber-600"
                        : "bg-cyan-500 hover:bg-cyan-600"
                    )}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        {datasetType === 'persistent' ? 'Create Dataset' : 'Create Virtualized Query'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Federation Selection Modal */}
        {showFederationModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 max-w-2xl w-full max-h-[80vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-zinc-800">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                    <Network className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                      All Federations
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {federations.length} federation groups available
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFederationModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Search */}
              <div className="px-6 pt-6 pb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={federationSearch}
                    onChange={(e) => setFederationSearch(e.target.value)}
                    placeholder="Search by name..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Modal Content */}
              <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="space-y-3">
                  {getFilteredFederations().map((federation) => (
                    <div
                      key={federation.id}
                      onClick={() => {
                        applyFederation(federation);
                        setShowFederationModal(false);
                      }}
                      className="p-4 rounded-lg border border-gray-200 dark:border-zinc-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Network className="w-5 h-5 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {federation.name}
                          </h3>
                        </div>
                        <div className="text-right text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                          <div>{federation.tables_count} tables</div>
                          <div>{federation.relationships_count} rels</div>
                        </div>
                      </div>
                      
                      {federation.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                          {federation.description}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2">
                        {federation.connections.map((conn, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-1.5 px-2 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs"
                          >
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: conn.color || '#6B7280' }}
                            />
                            <span className="text-gray-600 dark:text-gray-300">{conn.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  
                  {getFilteredFederations().length === 0 && (
                    <div className="text-center py-12">
                      <Network className="w-12 h-12 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {federationSearch ? 'No federations match your search' : 'No federations available'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end">
                <button
                  onClick={() => setShowFederationModal(false)}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

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
            
            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
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
            ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
