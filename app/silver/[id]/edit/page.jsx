'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  GitCommit,
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
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { silverService } from '@/lib/api/services/silver';
import { bronzeService } from '@/lib/api/services/bronze';
import { metadataService } from '@/lib/api/services/metadata';
import { connectionService } from '@/lib/api/services/connection';
import { equivalenceService } from '@/lib/api/services/equivalence';

const STEPS = [
  { id: 1, title: 'Type & Source', icon: Info },
  { id: 2, title: 'Transformations', icon: Code2 },
  { id: 3, title: 'Equivalence', icon: GitMerge },
  { id: 4, title: 'Filters', icon: Filter },
  { id: 5, title: 'Review', icon: Eye },
];

const FILTER_OPERATORS = [
  { value: '=', label: 'equals', requiresValue: true },
  { value: '!=', label: 'not equals', requiresValue: true },
  { value: '>', label: 'greater than', requiresValue: true },
  { value: '>=', label: 'greater or equal', requiresValue: true },
  { value: '<', label: 'less than', requiresValue: true },
  { value: '<=', label: 'less or equal', requiresValue: true },
  { value: 'LIKE', label: 'contains', requiresValue: true },
  { value: 'ILIKE', label: 'contains (case insensitive)', requiresValue: true },
  { value: 'IN', label: 'in list', requiresValue: true },
  { value: 'NOT IN', label: 'not in list', requiresValue: true },
  { value: 'IS NULL', label: 'is null', requiresValue: false },
  { value: 'IS NOT NULL', label: 'is not null', requiresValue: false },
  { value: 'BETWEEN', label: 'between', requiresValue: true },
];

const TRANSFORMATION_TYPES = [
  { value: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase' },
  { value: 'uppercase', label: 'Uppercase', description: 'Convert to uppercase' },
  { value: 'trim', label: 'Trim', description: 'Remove leading/trailing spaces' },
  { value: 'normalize_spaces', label: 'Normalize Spaces', description: 'Collapse multiple spaces' },
  { value: 'remove_accents', label: 'Remove Accents', description: 'Convert á to a, é to e, etc.' },
  { value: 'template', label: 'Template Rule', description: 'Apply normalization rule' },
];

export default function EditSilverDatasetPage() {
  const router = useRouter();
  const params = useParams();

  // Parse config ID and type from URL (format: p_123 or v_456)
  const configId = params.id;
  const isVirtualized = configId?.startsWith('v_');
  const isPersistent = configId?.startsWith('p_');
  const actualId = configId?.replace(/^[pv]_/, '');

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Loading states
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isLoadingBronze, setIsLoadingBronze] = useState(true);
  const [isLoadingConnections, setIsLoadingConnections] = useState(true);
  const [isLoadingRules, setIsLoadingRules] = useState(true);

  // Original config
  const [originalConfig, setOriginalConfig] = useState(null);

  // Data from API
  const [bronzeDatasets, setBronzeDatasets] = useState([]);
  const [connections, setConnections] = useState([]);
  const [normalizationRules, setNormalizationRules] = useState([]);
  const [columnGroups, setColumnGroups] = useState([]);
  const [isLoadingColumnGroups, setIsLoadingColumnGroups] = useState(false);
  const [allColumnMappings, setAllColumnMappings] = useState({});

  // Step 1: Type & Source
  const [datasetType, setDatasetType] = useState('persistent');
  const [datasetName, setDatasetName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceBronzeId, setSourceBronzeId] = useState(null);
  const [useLatestVersion, setUseLatestVersion] = useState(true);
  const [sourceBronzeVersion, setSourceBronzeVersion] = useState(null);
  const [bronzeVersions, setBronzeVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [selectedTables, setSelectedTables] = useState([]);
  const [expandedConnections, setExpandedConnections] = useState([]);
  const [tableSearch, setTableSearch] = useState('');

  // Step 2: Transformations
  const [transformations, setTransformations] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);

  // Step 3: Equivalence
  const [selectedColumnGroups, setSelectedColumnGroups] = useState([]);
  const [excludeSourceColumns, setExcludeSourceColumns] = useState(false);

  // Step 4: Filters
  const [filterConditions, setFilterConditions] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');

  // Load existing config
  useEffect(() => {
    const loadConfig = async () => {
      if (!actualId) return;

      setIsLoadingConfig(true);
      setLoadError(null);

      try {
        const config = isVirtualized
          ? await silverService.virtualized.get(parseInt(actualId))
          : await silverService.persistent.get(parseInt(actualId));

        setOriginalConfig(config);
        setDatasetType(isVirtualized ? 'virtualized' : 'persistent');
        setDatasetName(config.name || '');
        setDescription(config.description || '');

        // Set source
        if (!isVirtualized) {
          setSourceBronzeId(config.source_bronze_config_id);
          if (config.source_bronze_version !== null && config.source_bronze_version !== undefined) {
            setUseLatestVersion(false);
            setSourceBronzeVersion(config.source_bronze_version);
          } else {
            setUseLatestVersion(true);
            setSourceBronzeVersion(null);
          }
        } else {
          // For virtualized, load selected tables
          if (config.tables) {
            setSelectedTables(config.tables.map((t) => t.table_id));
          }
        }

        // Load transformations
        if (config.column_transformations && config.column_transformations.length > 0) {
          setTransformations(
            config.column_transformations.map((t, idx) => ({
              id: String(idx),
              columnId: t.column_id,
              type: t.type,
              ruleId: t.rule_id || null,
            }))
          );
        }

        // Load filters
        if (config.filters && config.filters.conditions && config.filters.conditions.length > 0) {
          setFilterLogic(config.filters.logic || 'AND');
          setFilterConditions(
            config.filters.conditions.map((c, idx) => ({
              id: String(idx),
              columnId: c.column_id,
              operator: c.operator,
              value: c.value || '',
              valueMin: c.value_min || '',
              valueMax: c.value_max || '',
            }))
          );
        }

        // Load equivalence settings
        if (config.column_group_ids) {
          setSelectedColumnGroups(config.column_group_ids);
        }
        if (config.exclude_unified_source_columns) {
          setExcludeSourceColumns(true);
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

  // Load Bronze datasets
  useEffect(() => {
    const loadBronzeDatasets = async () => {
      setIsLoadingBronze(true);
      try {
        const data = await bronzeService.persistent.list();
        setBronzeDatasets(data);
      } catch (err) {
        console.error('Failed to load Bronze datasets:', err);
      } finally {
        setIsLoadingBronze(false);
      }
    };
    loadBronzeDatasets();
  }, []);

  // Load connections and tables for virtualized
  useEffect(() => {
    const loadConnections = async () => {
      setIsLoadingConnections(true);
      try {
        const conns = await connectionService.list();
        // Filter only metadata connections
        const metadataConnections = conns.filter(
          (conn) => conn.content_type === 'metadata'
        );
        
        // Load schemas and tables for each connection
        const connectionsWithTables = await Promise.all(
          metadataConnections.map(async (conn) => {
            try {
              // First get schemas for this connection
              const schemas = await metadataService.listSchemas(conn.id);
              
              // Then get tables for each schema
              const tablesPromises = schemas.map(async (schema) => {
                try {
                  const tables = await metadataService.listTables(schema.id);
                  return tables.map((t) => ({
                    id: t.id,
                    name: t.table_name || t.name,
                    schemaName: schema.schema_name,
                    columns: t.columns || [],
                  }));
                } catch (err) {
                  console.error(`Failed to load tables for schema ${schema.id}:`, err);
                  return [];
                }
              });
              
              const allTables = (await Promise.all(tablesPromises)).flat();
              
              return {
                ...conn,
                tables: allTables,
              };
            } catch (err) {
              console.error(`Failed to load schemas for connection ${conn.id}:`, err);
              return { ...conn, tables: [] };
            }
          })
        );
        setConnections(connectionsWithTables);
        if (connectionsWithTables.length > 0) {
          setExpandedConnections([connectionsWithTables[0].id]);
        }
      } catch (err) {
        console.error('Failed to load connections:', err);
      } finally {
        setIsLoadingConnections(false);
      }
    };
    loadConnections();
  }, []);

  // Load normalization rules
  useEffect(() => {
    const loadRules = async () => {
      setIsLoadingRules(true);
      try {
        const rules = await silverService.normalizationRules.list();
        setNormalizationRules(rules);
      } catch (err) {
        console.error('Failed to load normalization rules:', err);
      } finally {
        setIsLoadingRules(false);
      }
    };
    loadRules();
  }, []);

  // Load Bronze versions when a Bronze dataset is selected
  useEffect(() => {
    const loadBronzeVersions = async () => {
      if (!sourceBronzeId) {
        setBronzeVersions([]);
        return;
      }

      setIsLoadingVersions(true);
      try {
        const response = await bronzeService.persistent.getVersions(sourceBronzeId);
        setBronzeVersions(response.versions || []);
      } catch (err) {
        console.error('Failed to load Bronze versions:', err);
        setBronzeVersions([]);
      } finally {
        setIsLoadingVersions(false);
      }
    };
    loadBronzeVersions();
  }, [sourceBronzeId]);

  // Load columns when source changes
  useEffect(() => {
    const loadColumns = async () => {
      if (datasetType === 'persistent' && sourceBronzeId) {
        const bronzeConfig = bronzeDatasets.find((b) => b.id === sourceBronzeId);
        if (bronzeConfig && bronzeConfig.tables) {
          const allColumns = [];
          for (const tableSelection of bronzeConfig.tables) {
            try {
              const tableDetails = await metadataService.getTableDetails(tableSelection.table_id);
              if (tableDetails.columns) {
                allColumns.push(
                  ...tableDetails.columns.map((col) => ({
                    id: col.id,
                    name: col.column_name || col.name,
                    type: col.data_type || col.type,
                    tableId: tableSelection.table_id,
                    tableName: tableDetails.table_name,
                  }))
                );
              }
            } catch (err) {
              console.error(`Failed to load columns for table ${tableSelection.table_id}:`, err);
            }
          }
          setAvailableColumns(allColumns);
        }
      } else if (datasetType === 'virtualized' && selectedTables.length > 0) {
        const allColumns = [];
        for (const tableId of selectedTables) {
          for (const conn of connections) {
            const table = conn.tables.find((t) => t.id === tableId);
            if (table && table.columns) {
              allColumns.push(
                ...table.columns.map((col) => ({
                  id: col.id,
                  name: col.column_name || col.name,
                  type: col.data_type || col.type,
                  tableId: table.id,
                  tableName: table.name,
                }))
              );
            }
          }
        }
        setAvailableColumns(allColumns);
      }
    };
    loadColumns();
  }, [datasetType, sourceBronzeId, selectedTables, bronzeDatasets, connections]);

  // Load column groups and filter by available columns
  useEffect(() => {
    const loadColumnGroups = async () => {
      if (availableColumns.length === 0) {
        setColumnGroups([]);
        setAllColumnMappings({});
        return;
      }
      
      setIsLoadingColumnGroups(true);
      try {
        const groups = await equivalenceService.listColumnGroups();
        
        // Load mappings for each group
        const mappingsMap = {};
        const relevantGroups = [];
        
        for (const group of groups) {
          try {
            const mappings = await equivalenceService.listColumnMappings(group.id);
            mappingsMap[group.id] = mappings;
            
            // Check if any mapping column matches our available columns
            const hasRelevantColumn = mappings.some(mapping => 
              availableColumns.some(col => 
                col.id === mapping.column_id || 
                (col.name.toLowerCase() === mapping.column_name?.toLowerCase() && 
                 col.tableName?.toLowerCase() === mapping.table_name?.toLowerCase())
              )
            );
            
            if (hasRelevantColumn) {
              relevantGroups.push({
                ...group,
                mappings,
                matchedColumns: mappings.filter(mapping =>
                  availableColumns.some(col => 
                    col.id === mapping.column_id || 
                    (col.name.toLowerCase() === mapping.column_name?.toLowerCase() && 
                     col.tableName?.toLowerCase() === mapping.table_name?.toLowerCase())
                  )
                )
              });
            }
          } catch (err) {
            console.error(`Failed to load mappings for group ${group.id}:`, err);
          }
        }
        
        setColumnGroups(relevantGroups);
        setAllColumnMappings(mappingsMap);
      } catch (err) {
        console.error('Failed to load column groups:', err);
      } finally {
        setIsLoadingColumnGroups(false);
      }
    };
    loadColumnGroups();
  }, [availableColumns]);

  // Handlers
  const toggleConnection = (connId) => {
    setExpandedConnections((prev) =>
      prev.includes(connId) ? prev.filter((id) => id !== connId) : [...prev, connId]
    );
  };

  const getTableInfo = (tableId) => {
    for (const conn of connections) {
      const table = conn.tables.find((t) => t.id === tableId);
      if (table) return { table, connection: conn };
    }
    return null;
  };

  const handleAddTransformation = () => {
    setTransformations([
      ...transformations,
      { id: String(Date.now()), columnId: null, type: 'lowercase', ruleId: null },
    ]);
  };

  const handleRemoveTransformation = (id) => {
    setTransformations(transformations.filter((t) => t.id !== id));
  };

  const handleTransformationChange = (id, field, value) => {
    setTransformations(transformations.map((t) => (t.id === id ? { ...t, [field]: value } : t)));
  };

  const handleAddFilterCondition = () => {
    setFilterConditions([
      ...filterConditions,
      { id: String(Date.now()), columnId: null, operator: '=', value: '', valueMin: '', valueMax: '' },
    ]);
  };

  const handleRemoveFilterCondition = (id) => {
    setFilterConditions(filterConditions.filter((c) => c.id !== id));
  };

  const handleFilterConditionChange = (id, field, value) => {
    setFilterConditions(filterConditions.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        if (datasetType === 'persistent') {
          return datasetName && sourceBronzeId;
        }
        return datasetName && selectedTables.length > 0;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      if (datasetType === 'persistent') {
        const request = {
          name: datasetName,
          description: description || undefined,
          source_bronze_version: useLatestVersion ? null : sourceBronzeVersion,
          column_group_ids: selectedColumnGroups.length > 0 ? selectedColumnGroups : undefined,
          exclude_unified_source_columns: excludeSourceColumns || undefined,
          column_transformations:
            transformations.length > 0
              ? transformations
                  .filter((t) => t.columnId)
                  .map((t) => ({
                    column_id: t.columnId,
                    type: t.type,
                    rule_id: t.type === 'template' ? t.ruleId : undefined,
                  }))
              : undefined,
          filters:
            filterConditions.length > 0 && filterConditions.some((c) => c.columnId)
              ? {
                  logic: filterLogic,
                  conditions: filterConditions
                    .filter((c) => c.columnId && c.operator)
                    .map((c) => {
                      const condition = {
                        column_id: c.columnId,
                        operator: c.operator,
                      };
                      if (!['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                        if (c.operator === 'BETWEEN') {
                          condition.value_min = c.valueMin;
                          condition.value_max = c.valueMax;
                        } else {
                          condition.value = c.value;
                        }
                      }
                      return condition;
                    }),
                }
              : undefined,
        };

        await silverService.persistent.update(parseInt(actualId), request);
      } else {
        const request = {
          name: datasetName,
          description: description || undefined,
          tables: selectedTables.map((tableId) => ({
            table_id: tableId,
            select_all: true,
          })),
          column_transformations:
            transformations.length > 0
              ? transformations
                  .filter((t) => t.columnId)
                  .map((t) => ({
                    column_id: t.columnId,
                    type: t.type,
                    rule_id: t.type === 'template' ? t.ruleId : undefined,
                  }))
              : undefined,
          filters:
            filterConditions.length > 0 && filterConditions.some((c) => c.columnId)
              ? {
                  logic: filterLogic,
                  conditions: filterConditions
                    .filter((c) => c.columnId && c.operator)
                    .map((c) => {
                      const condition = {
                        column_id: c.columnId,
                        operator: c.operator,
                      };
                      if (!['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                        if (c.operator === 'BETWEEN') {
                          condition.value_min = c.valueMin;
                          condition.value_max = c.valueMax;
                        } else {
                          condition.value = c.value;
                        }
                      }
                      return condition;
                    }),
                }
              : undefined,
        };

        await silverService.virtualized.update(parseInt(actualId), request);
      }

      router.push('/silver');
    } catch (err) {
      console.error('Failed to update dataset:', err);
      setSubmitError(err.message || 'Failed to update dataset');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected Bronze dataset info
  const selectedBronze = bronzeDatasets.find((b) => b.id === sourceBronzeId);

  // Loading state
  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
            <span className="text-gray-500 dark:text-gray-400">Loading dataset configuration...</span>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (loadError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Failed to load dataset</h2>
            <p className="text-gray-500 dark:text-gray-400">{loadError}</p>
            <Link href="/silver" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              ← Back to Silver Layer
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              <div
                className={clsx(
                  'p-2 rounded-lg',
                  datasetType === 'persistent'
                    ? 'bg-purple-100 dark:bg-purple-900/30'
                    : 'bg-cyan-100 dark:bg-cyan-900/30'
                )}
              >
                {datasetType === 'persistent' ? (
                  <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                ) : (
                  <Zap className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Edit Silver Dataset</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {datasetType === 'persistent' ? 'Persistent' : 'Virtualized'}: {originalConfig?.name}
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
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className="flex flex-col items-center gap-2"
                  >
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 dark:bg-zinc-800 text-gray-400'
                      )}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span
                      className={clsx(
                        'text-xs font-medium',
                        isActive
                          ? 'text-purple-600 dark:text-purple-400'
                          : isCompleted
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </button>
                  {index < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'flex-1 h-0.5 mx-2',
                        currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-zinc-700'
                      )}
                    />
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
                {/* Dataset Type - Read Only */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dataset Type</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div
                      className={clsx(
                        'p-4 rounded-xl border-2 cursor-not-allowed',
                        datasetType === 'persistent'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                          : 'border-gray-200 dark:border-zinc-700 opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Persistent</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Persist data to Silver Delta Lake.
                      </p>
                    </div>

                    <div
                      className={clsx(
                        'p-4 rounded-xl border-2 cursor-not-allowed',
                        datasetType === 'virtualized'
                          ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20'
                          : 'border-gray-200 dark:border-zinc-700 opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/30">
                          <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-white">Virtualized</span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Query source data on-demand.
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Dataset type cannot be changed after creation.
                  </p>
                </div>

                {/* Basic Info */}
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>
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
                    {datasetType === 'persistent' ? 'Source Bronze Dataset' : 'Source Tables'}
                  </h2>

                  {datasetType === 'persistent' ? (
                    <>
                      {/* Bronze Source - Read Only for edit */}
                      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 mb-6">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                            <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="font-semibold text-amber-800 dark:text-amber-200">
                              {selectedBronze?.name || originalConfig?.source_bronze_config_name || `Bronze ID: ${sourceBronzeId}`}
                            </div>
                            <div className="text-xs text-amber-700 dark:text-amber-300">
                              Source cannot be changed after creation
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Version Strategy */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Bronze Version Strategy
                          </h3>
                          {!isLoadingVersions && bronzeVersions.length > 0 && (
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {bronzeVersions.length} version{bronzeVersions.length !== 1 ? 's' : ''} available
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Latest Version Card */}
                          <button
                            type="button"
                            onClick={() => {
                              setUseLatestVersion(true);
                              setSourceBronzeVersion(null);
                            }}
                            className={clsx(
                              'relative p-4 rounded-xl border-2 text-left transition-all',
                              useLatestVersion
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
                            )}
                          >
                            {useLatestVersion && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={clsx(
                                  'p-2 rounded-lg',
                                  useLatestVersion
                                    ? 'bg-green-100 dark:bg-green-900/40'
                                    : 'bg-gray-100 dark:bg-zinc-800'
                                )}
                              >
                                <RefreshCw
                                  className={clsx(
                                    'w-5 h-5',
                                    useLatestVersion
                                      ? 'text-green-600 dark:text-green-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                  )}
                                />
                              </div>
                              <div>
                                <span
                                  className={clsx(
                                    'font-semibold text-sm',
                                    useLatestVersion
                                      ? 'text-green-700 dark:text-green-300'
                                      : 'text-gray-900 dark:text-white'
                                  )}
                                >
                                  Always Latest
                                </span>
                                {!isLoadingVersions && bronzeVersions.length > 0 && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    (currently v{bronzeVersions[0]?.version})
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pl-11">
                              Auto-updates with each Bronze execution
                            </p>
                          </button>

                          {/* Pinned Version Card */}
                          <button
                            type="button"
                            onClick={() => setUseLatestVersion(false)}
                            disabled={isLoadingVersions || bronzeVersions.length === 0}
                            className={clsx(
                              'relative p-4 rounded-xl border-2 text-left transition-all',
                              !useLatestVersion
                                ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
                              (isLoadingVersions || bronzeVersions.length === 0) && 'opacity-50 cursor-not-allowed'
                            )}
                          >
                            {!useLatestVersion && (
                              <div className="absolute top-2 right-2">
                                <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              </div>
                            )}
                            <div className="flex items-center gap-3 mb-2">
                              <div
                                className={clsx(
                                  'p-2 rounded-lg',
                                  !useLatestVersion
                                    ? 'bg-amber-100 dark:bg-amber-900/40'
                                    : 'bg-gray-100 dark:bg-zinc-800'
                                )}
                              >
                                <GitCommit
                                  className={clsx(
                                    'w-5 h-5',
                                    !useLatestVersion
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-gray-500 dark:text-gray-400'
                                  )}
                                />
                              </div>
                              <span
                                className={clsx(
                                  'font-semibold text-sm',
                                  !useLatestVersion
                                    ? 'text-amber-700 dark:text-amber-300'
                                    : 'text-gray-900 dark:text-white'
                                )}
                              >
                                Pin to Version
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 pl-11">
                              {isLoadingVersions
                                ? 'Loading versions...'
                                : bronzeVersions.length === 0
                                ? 'No versions available yet'
                                : 'Lock to specific version for reproducibility'}
                            </p>
                          </button>
                        </div>

                        {/* Version Selector */}
                        {!useLatestVersion && bronzeVersions.length > 0 && (
                          <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                            <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                              Select Version to Pin
                            </label>
                            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-auto">
                              {bronzeVersions.map((v, idx) => (
                                <button
                                  key={`${v.version}-${v.timestamp}`}
                                  type="button"
                                  onClick={() => setSourceBronzeVersion(v.version)}
                                  className={clsx(
                                    'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                                    sourceBronzeVersion === v.version
                                      ? 'border-amber-500 bg-white dark:bg-zinc-800 shadow-sm'
                                      : 'border-amber-200 dark:border-amber-800/30 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800'
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={clsx(
                                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                                        sourceBronzeVersion === v.version
                                          ? 'bg-amber-500 text-white'
                                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                                      )}
                                    >
                                      {v.version}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-sm text-gray-900 dark:text-white">
                                          Version {v.version}
                                        </span>
                                        {idx === 0 && (
                                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                            LATEST
                                          </span>
                                        )}
                                      </div>
                                      <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {new Date(v.timestamp).toLocaleDateString()} at{' '}
                                        {new Date(v.timestamp).toLocaleTimeString()}
                                        {v.total_rows && ` • ${v.total_rows.toLocaleString()} rows`}
                                      </span>
                                    </div>
                                  </div>
                                  {sourceBronzeVersion === v.version && (
                                    <Check className="w-5 h-5 text-amber-500" />
                                  )}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Virtualized - Table Selection */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm text-gray-500">{selectedTables.length} table(s) selected</span>
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

                      {isLoadingConnections ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[350px] overflow-auto">
                          {connections.map((conn) => (
                            <div
                              key={conn.id}
                              className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden"
                            >
                              <button
                                onClick={() => toggleConnection(conn.id)}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                                  <span className="font-medium text-gray-900 dark:text-white text-sm">
                                    {conn.name}
                                  </span>
                                  <span className="text-xs text-gray-500">{conn.tables?.length || 0} tables</span>
                                </div>
                                <ChevronDown
                                  className={clsx(
                                    'w-4 h-4 text-gray-400 transition-transform',
                                    expandedConnections.includes(conn.id) && 'rotate-180'
                                  )}
                                />
                              </button>

                              {expandedConnections.includes(conn.id) && (
                                <div className="p-2 space-y-1">
                                  {(conn.tables || [])
                                    .filter(
                                      (t) =>
                                        !tableSearch || t.name.toLowerCase().includes(tableSearch.toLowerCase())
                                    )
                                    .map((table) => (
                                      <div
                                        key={table.id}
                                        onClick={() => {
                                          if (selectedTables.includes(table.id)) {
                                            setSelectedTables(selectedTables.filter((id) => id !== table.id));
                                          } else {
                                            setSelectedTables([...selectedTables, table.id]);
                                          }
                                        }}
                                        className={clsx(
                                          'flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors',
                                          selectedTables.includes(table.id)
                                            ? 'bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800'
                                            : 'hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent'
                                        )}
                                      >
                                        <div className="flex items-center gap-3">
                                          <div
                                            className={clsx(
                                              'w-5 h-5 rounded border-2 flex items-center justify-center',
                                              selectedTables.includes(table.id)
                                                ? 'bg-cyan-500 border-cyan-500'
                                                : 'border-gray-300 dark:border-zinc-600'
                                            )}
                                          >
                                            {selectedTables.includes(table.id) && (
                                              <Check className="w-3 h-3 text-white" />
                                            )}
                                          </div>
                                          <Table2 className="w-4 h-4 text-gray-400" />
                                          <span className="text-sm text-gray-900 dark:text-white">{table.name}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                          {table.columns?.length || 0} columns
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Transformations */}
            {currentStep === 2 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Column Transformations</h2>
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
                            value={t.columnId || ''}
                            onChange={(e) =>
                              handleTransformationChange(t.id, 'columnId', Number(e.target.value) || null)
                            }
                            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                          >
                            <option value="">Select column...</option>
                            {availableColumns.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.tableName}.{c.name}
                              </option>
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
                            {TRANSFORMATION_TYPES.map((type) => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>

                        {t.type === 'template' && (
                          <div className="relative flex-1">
                            <select
                              value={t.ruleId || ''}
                              onChange={(e) =>
                                handleTransformationChange(t.id, 'ruleId', Number(e.target.value) || null)
                              }
                              className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                            >
                              <option value="">Select rule...</option>
                              {normalizationRules.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name}
                                </option>
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
                    <strong>Tip:</strong> For value mappings (e.g., M to Masculino), use Column Groups in the
                    Equivalence step.
                  </p>
                </div>
              </div>
            )}

            {/* Step 3: Equivalence */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Column Groups (Semantic Unification)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Apply column unification and value mappings from the Equivalence layer.
                    {availableColumns.length > 0 && (
                      <span className="block mt-1">
                        Showing column groups that match your dataset&apos;s {availableColumns.length} columns.
                      </span>
                    )}
                  </p>

                  {isLoadingColumnGroups ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading column groups...</p>
                    </div>
                  ) : columnGroups.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                      <GitMerge className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-medium">No matching column groups found</p>
                      <p className="text-xs mt-1">
                        {availableColumns.length === 0 
                          ? 'Select a source in Step 1 to load available columns'
                          : 'Create column groups in the Equivalence module that include your dataset columns'}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {columnGroups.map((group) => {
                        const isSelected = selectedColumnGroups.includes(group.id);
                        return (
                          <div
                            key={group.id}
                            onClick={() => {
                              setSelectedColumnGroups(prev =>
                                isSelected
                                  ? prev.filter(id => id !== group.id)
                                  : [...prev, group.id]
                              );
                            }}
                            className={clsx(
                              'p-4 rounded-xl border-2 cursor-pointer transition-all',
                              isSelected
                                ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600 bg-white dark:bg-zinc-800'
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div className={clsx(
                                'w-5 h-5 rounded-md border-2 flex items-center justify-center mt-0.5 transition-colors',
                                isSelected
                                  ? 'bg-purple-500 border-purple-500'
                                  : 'border-gray-300 dark:border-zinc-600'
                              )}>
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium text-gray-900 dark:text-white">
                                    {group.name}
                                  </h3>
                                  {group.data_dictionary_term_display_name && (
                                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                      {group.data_dictionary_term_display_name}
                                    </span>
                                  )}
                                  {group.semantic_domain_name && (
                                    <span 
                                      className="px-2 py-0.5 text-xs font-medium rounded-full"
                                      style={{ 
                                        backgroundColor: group.semantic_domain_color ? `${group.semantic_domain_color}20` : '#8b5cf620',
                                        color: group.semantic_domain_color || '#8b5cf6'
                                      }}
                                    >
                                      {group.semantic_domain_name}
                                    </span>
                                  )}
                                </div>
                                {group.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                    {group.description}
                                  </p>
                                )}
                                
                                {/* Matched columns */}
                                <div className="mt-2">
                                  <p className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-1.5">
                                    Matching columns in your dataset:
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {group.matchedColumns.map((mapping) => (
                                      <span
                                        key={mapping.id}
                                        className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 dark:bg-zinc-700 rounded-md"
                                      >
                                        <span className="font-mono text-purple-600 dark:text-purple-400">
                                          {mapping.column_name}
                                        </span>
                                        <span className="text-gray-400 dark:text-gray-500">
                                          ({mapping.table_name})
                                        </span>
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                {/* Standard values preview */}
                                {group.standard_values && group.standard_values.length > 0 && (
                                  <div className="mt-2 pt-2 border-t border-gray-100 dark:border-zinc-700">
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Standard values: {' '}
                                      <span className="font-medium text-gray-700 dark:text-gray-300">
                                        {group.standard_values.join(', ')}
                                      </span>
                                    </p>
                                  </div>
                                )}

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                  <span>{group.columns_count} columns mapped</span>
                                  <span>{group.value_mappings_count} value mappings</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

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
              </div>
            )}

            {/* Step 4: Filters */}
            {currentStep === 4 && (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Conditions</h2>
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
                              'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                              filterLogic === 'AND'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600'
                            )}
                          >
                            AND
                          </button>
                          <button
                            onClick={() => setFilterLogic('OR')}
                            className={clsx(
                              'px-3 py-1 text-sm font-medium rounded-lg transition-colors',
                              filterLogic === 'OR'
                                ? 'bg-purple-500 text-white'
                                : 'bg-white dark:bg-zinc-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-zinc-600'
                            )}
                          >
                            OR
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Conditions */}
                    <div className="space-y-3">
                      {filterConditions.map((condition, index) => {
                        const selectedOperator = FILTER_OPERATORS.find((op) => op.value === condition.operator);
                        const requiresValue = selectedOperator?.requiresValue !== false;

                        return (
                          <div
                            key={condition.id}
                            className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                          >
                            {index > 0 && (
                              <span className="text-xs font-medium text-purple-600 dark:text-purple-400 w-10">
                                {filterLogic}
                              </span>
                            )}
                            {index === 0 && filterConditions.length > 1 && <span className="w-10"></span>}

                            <div className="relative flex-1">
                              <select
                                value={condition.columnId || ''}
                                onChange={(e) =>
                                  handleFilterConditionChange(condition.id, 'columnId', Number(e.target.value) || null)
                                }
                                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              >
                                <option value="">Select column...</option>
                                {availableColumns.map((col) => (
                                  <option key={col.id} value={col.id}>
                                    {col.tableName}.{col.name}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            <div className="relative w-40">
                              <select
                                value={condition.operator}
                                onChange={(e) =>
                                  handleFilterConditionChange(condition.id, 'operator', e.target.value)
                                }
                                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              >
                                {FILTER_OPERATORS.map((op) => (
                                  <option key={op.value} value={op.value}>
                                    {op.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>

                            {requiresValue && condition.operator !== 'BETWEEN' && (
                              <input
                                type="text"
                                value={condition.value}
                                onChange={(e) =>
                                  handleFilterConditionChange(condition.id, 'value', e.target.value)
                                }
                                placeholder="Value..."
                                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                              />
                            )}

                            {condition.operator === 'BETWEEN' && (
                              <>
                                <input
                                  type="text"
                                  value={condition.valueMin}
                                  onChange={(e) =>
                                    handleFilterConditionChange(condition.id, 'valueMin', e.target.value)
                                  }
                                  placeholder="Min..."
                                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                />
                                <span className="text-gray-400 text-sm">and</span>
                                <input
                                  type="text"
                                  value={condition.valueMax}
                                  onChange={(e) =>
                                    handleFilterConditionChange(condition.id, 'valueMax', e.target.value)
                                  }
                                  placeholder="Max..."
                                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                                />
                              </>
                            )}

                            <button
                              onClick={() => handleRemoveFilterCondition(condition.id)}
                              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-400 hover:text-red-500"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 5: Review */}
            {currentStep === 5 && (
              <div className="space-y-6">
                {submitError && (
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">Error saving changes</span>
                    </div>
                    <p className="mt-2 text-sm text-red-600 dark:text-red-300">{submitError}</p>
                  </div>
                )}

                <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Review Changes</h2>

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
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Layers className="w-4 h-4 text-amber-500" />
                              <span className="text-gray-900 dark:text-white">
                                {selectedBronze?.name || originalConfig?.source_bronze_config_name || `Bronze ID: ${sourceBronzeId}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Version:</span>
                              {useLatestVersion ? (
                                <span className="px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium">
                                  Always Latest
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium">
                                  Pinned to v{sourceBronzeVersion}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {selectedTables.map((id) => {
                              const info = getTableInfo(id);
                              if (!info) return null;
                              return (
                                <div key={id} className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                                    {info.table.name}
                                  </span>
                                  <span className="text-xs text-gray-500">{info.connection.name}</span>
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
                          {transformations.map((t) => {
                            const col = availableColumns.find((c) => c.id === t.columnId);
                            return (
                              <div
                                key={t.id}
                                className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800"
                              >
                                <code className="text-sm font-mono">
                                  {col ? `${col.tableName}.${col.name}` : '(column)'}
                                </code>
                                <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                                <span className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs">
                                  {t.type}
                                </span>
                                {t.ruleId && (
                                  <span className="text-xs text-gray-500">
                                    {normalizationRules.find((r) => r.id === t.ruleId)?.name}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Filters */}
                    {filterConditions.length > 0 && filterConditions.some((c) => c.columnId) && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Filter Conditions ({filterConditions.filter((c) => c.columnId).length})
                        </h3>
                        <div className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950">
                          <code className="text-sm text-green-400 font-mono">
                            WHERE{' '}
                            {filterConditions
                              .filter((c) => c.columnId && c.operator)
                              .map((c) => {
                                const col = availableColumns.find((col) => col.id === c.columnId);
                                const colName = col ? `${col.tableName}.${col.name}` : `column_${c.columnId}`;
                                if (['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                                  return `${colName} ${c.operator}`;
                                }
                                if (c.operator === 'BETWEEN') {
                                  return `${colName} BETWEEN ${c.valueMin} AND ${c.valueMax}`;
                                }
                                return `${colName} ${c.operator} '${c.value}'`;
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
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
