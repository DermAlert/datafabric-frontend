'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
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
  HardDrive,
  Network,
  X,
  Loader2,
  AlertCircle,
  Save
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { bronzeService } from '@/lib/api/services/bronze';
import { metadataService, connectionService, relationshipsService } from '@/lib/api/services';

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Select Columns', icon: Columns },
  { id: 3, title: 'Review', icon: Eye },
];

export default function EditBronzeDatasetPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Parse config ID and type from URL (format: p_123 or v_456)
  const configId = params.id;
  const isVirtualized = configId?.startsWith('v_');
  const actualId = configId?.replace(/^[pv]_/, '');
  
  // Loading existing config
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [originalConfig, setOriginalConfig] = useState(null);
  
  // Step 1: Type & Basic Info
  const [datasetType, setDatasetType] = useState(isVirtualized ? 'virtualized' : 'persistent');
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

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      if (!actualId) return;
      
      setIsLoadingConfig(true);
      setLoadError(null);
      
      try {
        const config = isVirtualized 
          ? await bronzeService.virtualized.get(parseInt(actualId))
          : await bronzeService.persistent.get(parseInt(actualId));
        
        setOriginalConfig(config);
        setName(config.name || '');
        setDescription(config.description || '');
        setDatasetType(isVirtualized ? 'virtualized' : 'persistent');
        
        // Load federated joins state from config
        if (config.enable_federated_joins) {
          setEnableFederatedJoins(true);
        }
        
        // Store table info for later matching
        if (config.tables && config.tables.length > 0) {
          // We'll match these with the loaded connections
          setOriginalConfig(prev => ({ 
            ...prev, 
            tablesToMatch: config.tables 
          }));
        }
      } catch (err) {
        console.error('Failed to load config:', err);
        setLoadError(err?.message || 'Failed to load dataset configuration');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, [actualId, isVirtualized]);

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

  // Match original config tables with loaded connections
  useEffect(() => {
    if (!originalConfig?.tablesToMatch || connections.length === 0 || isLoadingConnections) return;
    
    const matchTables = async () => {
      const matched = [];
      
      for (const configTable of originalConfig.tablesToMatch) {
        // Find the table in connections
        for (const conn of connections) {
          const table = conn.tables.find(t => t.id === configTable.table_id);
          if (table) {
            // Load columns for this table
            try {
              const columns = await metadataService.listColumns(table.id);
              matched.push({
                tableId: table.id,
                tableName: table.table_name,
                connectionName: conn.name,
                selectAll: configTable.select_all || false,
                columns: columns,
                columnIds: configTable.column_ids || columns.map(c => c.id),
              });
            } catch (err) {
              console.error(`Failed to load columns for table ${table.id}:`, err);
              matched.push({
                tableId: table.id,
                tableName: table.table_name,
                connectionName: conn.name,
                selectAll: configTable.select_all || true,
                columns: [],
                columnIds: configTable.column_ids || [],
              });
            }
            break;
          }
        }
      }
      
      if (matched.length > 0) {
        setSelectedTables(matched);
        // Expand tables that are selected
        setExpandedTables(matched.map(t => t.tableId));
      }
    };
    
    matchTables();
  }, [originalConfig?.tablesToMatch, connections, isLoadingConnections]);

  // Check for cross-connection relationships when tables are selected
  useEffect(() => {
    const checkCrossConnectionRelationships = async () => {
      // Need at least 2 tables from different connections
      if (selectedTables.length < 2) {
        setCrossConnectionRelationships([]);
        // Only disable if there are no cross-connection relationships available
        // Don't override if user had it enabled from original config
        return;
      }

      // Check if tables are from different connections
      const connectionIds = [...new Set(selectedTables.map(t => {
        const table = connections.flatMap(c => c.tables).find(ct => ct.id === t.tableId);
        return table?.connectionId;
      }))];

      if (connectionIds.length < 2) {
        setCrossConnectionRelationships([]);
        // Only disable if there are no cross-connection relationships available
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
        
        // Don't auto-disable - let user control the toggle
        // Only disable if NO relationships exist (toggle won't even show)
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

  const handleTableSelect = async (table) => {
    const tableId = table.id;
    
    if (isTableSelected(tableId)) {
      // Remove table
      setSelectedTables(prev => prev.filter(t => t.tableId !== tableId));
    } else {
      // Add table - load columns first
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
  };

  const toggleColumnSelection = (tableId, columnId) => {
    setSelectedTables(prev => prev.map(t => {
      if (t.tableId !== tableId) return t;
      
      const isSelected = t.columnIds.includes(columnId);
      const newColumnIds = isSelected
        ? t.columnIds.filter(id => id !== columnId)
        : [...t.columnIds, columnId];
      
      return {
        ...t,
        columnIds: newColumnIds,
        selectAll: newColumnIds.length === t.columns.length,
      };
    }));
  };

  const totalSelectedColumns = selectedTables.reduce((sum, t) => 
    sum + (t.selectAll ? (t.columns?.length || 0) : t.columnIds.length), 0
  );

  const canProceedStep1 = name.trim() !== '' && selectedTables.length > 0;
  const canProceedStep2 = totalSelectedColumns > 0;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const tables = selectedTables.map(t => ({
        table_id: t.tableId,
        select_all: t.selectAll,
        column_ids: t.selectAll ? null : t.columnIds,
      }));

      // Backend auto-detects relationships, just send enable_federated_joins flag
      if (datasetType === 'persistent') {
        await bronzeService.persistent.update(parseInt(actualId), {
          name,
          description: description || undefined,
          tables,
          enable_federated_joins: enableFederatedJoins,
        });
      } else {
        await bronzeService.virtualized.update(parseInt(actualId), {
          name,
          description: description || undefined,
          tables,
          enable_federated_joins: enableFederatedJoins,
        });
      }

      // Navigate back to Bronze page
      router.push('/bronze');
    } catch (err) {
      console.error('Failed to update dataset:', err);
      setSubmitError(err?.message || 'Failed to update dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter tables based on search
  const filteredConnections = connections.map(conn => ({
    ...conn,
    tables: conn.tables.filter(t => 
      t.table_name?.toLowerCase().includes(tableSearch.toLowerCase()) ||
      t.schemaName?.toLowerCase().includes(tableSearch.toLowerCase())
    ),
  })).filter(conn => conn.tables.length > 0 || tableSearch === '');

  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <span className="text-gray-500 dark:text-gray-400">Loading dataset configuration...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load dataset</h2>
            <p className="text-gray-500 dark:text-gray-400">{loadError}</p>
            <Link 
              href="/bronze" 
              className="text-amber-600 hover:text-amber-700 dark:text-amber-400"
            >
              ← Back to Bronze Layer
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link 
              href="/bronze" 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Edit Bronze Dataset
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Modify dataset configuration: {originalConfig?.name}
                </p>
              </div>
            </div>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (step.id < currentStep) setCurrentStep(step.id);
                    if (step.id === 2 && canProceedStep1) setCurrentStep(step.id);
                    if (step.id === 3 && canProceedStep1 && canProceedStep2) setCurrentStep(step.id);
                  }}
                  disabled={
                    (step.id === 2 && !canProceedStep1) ||
                    (step.id === 3 && (!canProceedStep1 || !canProceedStep2))
                  }
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all',
                    currentStep === step.id
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : currentStep > step.id
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                      : 'bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400'
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <step.icon className="w-4 h-4" />
                  )}
                  {step.title}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Step 1: Type & Source */}
          {currentStep === 1 && (
            <div className="space-y-6">
              {/* Dataset Type - Readonly in edit mode */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Dataset Type
                </h2>
                <div className="flex gap-4">
                  <div className={clsx(
                    'flex-1 p-4 rounded-xl border-2 cursor-not-allowed opacity-70',
                    datasetType === 'persistent'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className={clsx(
                        'w-5 h-5',
                        datasetType === 'persistent' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                      )} />
                      <span className={clsx(
                        'font-medium',
                        datasetType === 'persistent' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'
                      )}>
                        Persistent
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ingest and save data to Delta Lake. Best for ETL pipelines and batch processing.
                    </p>
                  </div>
                  <div className={clsx(
                    'flex-1 p-4 rounded-xl border-2 cursor-not-allowed opacity-70',
                    datasetType === 'virtualized'
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                      : 'border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800'
                  )}>
                    <div className="flex items-center gap-2 mb-2">
                      <Network className={clsx(
                        'w-5 h-5',
                        datasetType === 'virtualized' ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400'
                      )} />
                      <span className={clsx(
                        'font-medium',
                        datasetType === 'virtualized' ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-400'
                      )}>
                        Virtualized
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Query source data on-demand. Best for exploration and APIs.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Dataset type cannot be changed after creation.
                </p>
              </div>

              {/* Basic Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Dataset Name *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., patients_raw"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
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
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Source Tables */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Select Source Tables
                  </h2>
                  <span className="text-sm text-gray-500">
                    {selectedTables.length} table(s) selected
                  </span>
                </div>

                {/* Search */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                    placeholder="Search tables..."
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
                  />
                </div>

                {/* Connections List */}
                <div className="space-y-2 max-h-[400px] overflow-auto">
                  {isLoadingConnections ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-amber-500 animate-spin mr-2" />
                      <span className="text-gray-500 dark:text-gray-400">Loading connections...</span>
                    </div>
                  ) : connectionError ? (
                    <div className="flex items-center justify-center py-8 text-red-500">
                      <AlertCircle className="w-5 h-5 mr-2" />
                      {connectionError}
                    </div>
                  ) : (
                    filteredConnections.map((conn) => (
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
                          <div className="p-2 space-y-1 bg-white dark:bg-zinc-900">
                            {conn.tables.length === 0 ? (
                              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                                No tables found
                              </p>
                            ) : (
                              conn.tables.map((table) => (
                                <div
                                  key={table.id}
                                  onClick={() => handleTableSelect(table)}
                                  className={clsx(
                                    "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                    isTableSelected(table.id)
                                      ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                                      : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                  )}
                                >
                                  <div className="flex items-center gap-2">
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
                                  <span className="text-xs text-gray-500">
                                    {table.column_count} columns
                                  </span>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Federated Joins Toggle - Only show when cross-connection relationships exist */}
                {crossConnectionRelationships.length > 0 && (
                  <div className="mt-4 bg-white dark:bg-zinc-900 rounded-xl border border-purple-200 dark:border-purple-800/50 p-4">
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
                  <div className="mt-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Checking for cross-database relationships...
                  </div>
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
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Error updating dataset</span>
                  </div>
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{submitError}</p>
                </div>
              )}

              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                  Review Changes
                </h2>

                <div className="space-y-4">
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 dark:text-gray-400">Dataset Name</span>
                    <span className="font-medium text-gray-900 dark:text-white">{name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 dark:text-gray-400">Type</span>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-full text-xs font-medium",
                      datasetType === 'persistent'
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                        : "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                    )}>
                      {datasetType === 'persistent' ? 'Persistent' : 'Virtualized'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 dark:text-gray-400">Tables</span>
                    <span className="font-medium text-gray-900 dark:text-white">{selectedTables.length}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                    <span className="text-gray-500 dark:text-gray-400">Total Columns</span>
                    <span className="font-medium text-gray-900 dark:text-white">{totalSelectedColumns}</span>
                  </div>
                  {enableFederatedJoins && crossConnectionRelationships.length > 0 && (
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-zinc-800">
                      <span className="text-gray-500 dark:text-gray-400">Federated Joins</span>
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        {crossConnectionRelationships.length} relationship(s)
                      </span>
                    </div>
                  )}
                  {description && (
                    <div className="py-2">
                      <span className="text-gray-500 dark:text-gray-400 block mb-1">Description</span>
                      <p className="text-gray-900 dark:text-white text-sm">{description}</p>
                    </div>
                  )}
                </div>

                {/* Tables Summary */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-zinc-800">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Selected Tables</h3>
                  <div className="space-y-2">
                    {selectedTables.map((t) => (
                      <div key={t.tableId} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2">
                          <Table2 className="w-4 h-4 text-gray-400" />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">{t.tableName}</span>
                          <span className="text-xs text-gray-500">from {t.connectionName}</span>
                        </div>
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          {t.selectAll ? 'All' : t.columnIds.length} columns
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-4">
            <button
              onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
              disabled={currentStep === 1}
              className={clsx(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
                currentStep === 1
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800"
              )}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {currentStep < 3 ? (
              <button
                onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
                className={clsx(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  (currentStep === 1 && !canProceedStep1) || (currentStep === 2 && !canProceedStep2)
                    ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
                    : "bg-amber-500 hover:bg-amber-600 text-white"
                )}
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={clsx(
                  "flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors",
                  isSubmitting
                    ? "bg-gray-200 dark:bg-zinc-700 text-gray-400 cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                )}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
