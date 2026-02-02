'use client';

import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Plus,
  Search,
  Database,
  Play,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Table2,
  Link2,
  Clock,
  Loader2,
  ChevronRight,
  ChevronDown,
  HardDrive,
  Layers,
  Zap,
  Image as ImageIcon,
  GitCommit,
  History,
  RotateCcw,
  ArrowRight,
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useDisclosure, useBronzeConfigs } from '@/hooks';
import { StatusBadge, TypeBadge, VersionBadge, DropdownMenu, DropdownItem, DropdownDivider, EmptyState } from '@/components/ui';
import { SearchInput } from '@/components/ui/Input';
import { formatBytes, formatDate } from '@/lib/utils';
import { bronzeService } from '@/lib/api/services/bronze';
import { metadataService } from '@/lib/api/services/metadata';
import { connectionService } from '@/lib/api/services/connection';
import { relationshipsService } from '@/lib/api/services/relationships';

// ===========================================
// Dataset List Item Component
// ===========================================

const DatasetListItem = memo(function DatasetListItem({
  dataset,
  isSelected,
  onSelect,
  onDelete,
  onExecute,
  onEdit,
  isExecuting,
}) {
  const menuDisclosure = useDisclosure();

  return (
    <div
      onClick={() => onSelect(dataset)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(dataset)}
      className={clsx(
        'p-4 rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {dataset.name}
            </span>
            <TypeBadge type={dataset.type} />
            {dataset.type === 'persistent' && dataset.version !== undefined && (
              <VersionBadge version={dataset.version} />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
            {dataset.description || 'No description'}
          </p>
          <div className="flex items-center gap-3">
            <StatusBadge status={dataset.status || 'active'} />
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Table2 className="w-3 h-3" />
              {dataset.tables?.length || 0}
            </span>
            {dataset.enable_federated_joins && (
              <span className="flex items-center gap-1 text-xs text-purple-500">
                <Zap className="w-3 h-3" />
                Federated
              </span>
            )}
          </div>
        </div>

        <DropdownMenu
          isOpen={menuDisclosure.isOpen}
          onClose={menuDisclosure.onClose}
          trigger={
            <button
              onClick={(e) => {
                e.stopPropagation();
                menuDisclosure.onToggle();
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
              aria-label="Menu de ações"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
        >
          <DropdownItem
            icon={<Eye className="w-3.5 h-3.5" />}
            href={`/bronze/${dataset.type === 'persistent' ? 'p' : 'v'}_${dataset.id}`}
          >
            {dataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
          </DropdownItem>
          {dataset.type === 'persistent' && dataset.status !== 'running' && (
            <DropdownItem 
              icon={isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                onExecute(dataset.id);
                menuDisclosure.onClose();
              }}
              disabled={isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Run Ingestion'}
            </DropdownItem>
          )}
          <DropdownDivider />
          <DropdownItem 
            icon={<Pencil className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              onEdit(dataset.id, dataset.type);
              menuDisclosure.onClose();
            }}
          >
            Edit
          </DropdownItem>
          <DropdownItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dataset.id, dataset.type);
              menuDisclosure.onClose();
            }}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </div>
    </div>
  );
});

// ===========================================
// Version History Component
// ===========================================

const VersionHistory = memo(function VersionHistory({
  dataset,
  currentConfig,
  versions,
  selectedVersion, // 'pending' or version number
  onSelectVersion,
  isLoading,
  isCollapsed,
  onToggle,
}) {
  const isViewingPending = selectedVersion === 'pending';
  const currentVersion = dataset?.current_delta_version ?? dataset?.version ?? 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronRight className={clsx(
          'w-4 h-4 text-gray-400 transition-transform duration-200',
          !isCollapsed && 'rotate-90'
        )} />
        <History className="w-4 h-4 text-gray-400" />
        Version History
        <span className="text-xs font-normal text-gray-500 ml-1">(Delta Lake)</span>
      </button>
      <div className={clsx(
        'overflow-hidden transition-all duration-200',
        isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
      )}>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
        </div>
      ) : (
      <>
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-zinc-700">
          {/* Pending (current config) - always shown at top */}
          <button
            onClick={() => onSelectVersion('pending')}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50',
              isViewingPending && 'bg-green-50/50 dark:bg-green-900/10'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-xs font-mono text-green-700 dark:text-green-400">
                <Sparkles className="w-3 h-3" />
                Pending
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-400">
                Current config
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <span>{currentConfig?.tables?.length || dataset?.tables?.length || 0} tables</span>
              <span>{formatDate(currentConfig?.data_atualizacao || currentConfig?.updated_at || dataset?.updated_at)}</span>
            </div>
          </button>
          
          {/* Executed versions */}
          {versions && versions.length > 0 && versions.slice(0, 5).map((entry) => (
            <button
              key={entry.version}
              onClick={() =>
                onSelectVersion(entry.version === selectedVersion ? 'pending' : entry.version)
              }
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50',
                entry.version === selectedVersion && !isViewingPending && 'bg-amber-50/50 dark:bg-amber-900/10'
              )}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 text-xs font-mono text-zinc-700 dark:text-zinc-300">
                  <GitCommit className="w-3 h-3" />
                  v{entry.version}
                </span>
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium',
                    (entry.operation === 'WRITE' || entry.operation === 'OVERWRITE') &&
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                    entry.operation === 'MERGE' &&
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                    entry.operation === 'DELETE' &&
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  )}
                >
                  {entry.operation}
                </span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{(entry.rows_inserted || entry.total_rows || 0).toLocaleString()} rows</span>
                <span>{formatDate(entry.timestamp)}</span>
              </div>
            </button>
          ))}
        </div>
        {versions && versions.length > 5 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
            <button className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium flex items-center gap-1">
              View all {versions.length} versions
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      </>
      )}
      </div>
    </div>
  );
});

// ===========================================
// Detail Panel Component
// ===========================================

const DetailPanel = memo(function DetailPanel({
  dataset,
  currentConfig, // Full config from GET /persistent/{id}
  versions,
  selectedVersion, // 'pending' or version number
  onSelectVersion,
  isLoadingVersions,
  isLoadingConfig,
  onExecute,
  isExecuting,
}) {
  const versionDropdown = useDisclosure();
  const [enrichedTables, setEnrichedTables] = useState([]);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [relationships, setRelationships] = useState([]);
  const [isLoadingRelationships, setIsLoadingRelationships] = useState(false);
  
  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState({
    sourceTables: false,
    relationships: false,
    versionHistory: false,
    configChanges: false,
  });
  
  const toggleSection = useCallback((section) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Get version data for selected version
  const versionHistory = versions?.versions || [];
  const currentVersion = versions?.current_version ?? dataset?.version ?? 0;
  
  // Check if viewing pending (current unsaved config) or a specific version
  const isViewingPending = selectedVersion === 'pending';
  const selectedVersionData = !isViewingPending && selectedVersion !== null
    ? versionHistory.find(v => v.version === selectedVersion) 
    : null;
  const isViewingOldVersion = !isViewingPending && selectedVersion !== null;
  
  // Get config to display:
  // - If viewing pending: use currentConfig (from GET /persistent/{id})
  // - If viewing old version: use config_snapshot from that version
  // - Fallback to dataset from list
  const displayConfig = isViewingPending
    ? (currentConfig || dataset)
    : (selectedVersionData?.config_snapshot || dataset);
  
  // Get tables from the appropriate config - memoize to prevent infinite loops
  const tablesToDisplay = useMemo(() => {
    return displayConfig?.tables || [];
  }, [displayConfig?.tables]);
  
  // Create stable key for table IDs to use in dependencies
  const tableIdsKey = useMemo(() => {
    return tablesToDisplay.map(t => t.table_id).join(',');
  }, [tablesToDisplay]);

  // Load enriched table data (table name, connection name, column count)
  useEffect(() => {
    const loadEnrichedTables = async () => {
      if (!tablesToDisplay || tablesToDisplay.length === 0) {
        setEnrichedTables([]);
        return;
      }

      setIsLoadingTables(true);
      try {
        // Fetch all table details in parallel
        const tablePromises = tablesToDisplay.map(async (t) => {
          try {
            const tableDetails = await metadataService.getTableDetails(t.table_id);
            
            // Fetch connection details
            let connectionName = 'Unknown';
            if (tableDetails.connection_id) {
              try {
                const connection = await connectionService.get(tableDetails.connection_id);
                connectionName = connection.name;
              } catch (err) {
                console.error('Failed to load connection:', err);
              }
            }

            return {
              table_id: t.table_id,
              table_name: tableDetails.table_name,
              connection_name: connectionName,
              column_count: tableDetails.columns?.length || tableDetails.column_count || 0,
              select_all: t.select_all,
              column_ids: t.column_ids,
            };
          } catch (err) {
            console.error(`Failed to load table ${t.table_id}:`, err);
            return {
              table_id: t.table_id,
              table_name: `Table ${t.table_id}`,
              connection_name: 'Unknown',
              column_count: 0,
              select_all: t.select_all,
              column_ids: t.column_ids,
            };
          }
        });

        const enriched = await Promise.all(tablePromises);
        setEnrichedTables(enriched);
      } catch (err) {
        console.error('Failed to load enriched tables:', err);
      } finally {
        setIsLoadingTables(false);
      }
    };

    loadEnrichedTables();
  }, [tableIdsKey, selectedVersion]);

  // Load relationships - automatically find relationships between tables in the dataset
  useEffect(() => {
    const loadRelationships = async () => {
      if (!tablesToDisplay || tablesToDisplay.length === 0) {
        setRelationships([]);
        return;
      }

      setIsLoadingRelationships(true);
      try {
        // Get all table IDs in this dataset
        const tableIds = new Set(tablesToDisplay.map(t => t.table_id));
        
        // Fetch relationships for each table in parallel
        const relationshipPromises = tablesToDisplay.map(async (t) => {
          try {
            return await relationshipsService.listForTable(t.table_id);
          } catch (err) {
            console.error(`Failed to load relationships for table ${t.table_id}:`, err);
            return [];
          }
        });

        const allRelationships = (await Promise.all(relationshipPromises)).flat();
        
        // Filter to keep only relationships where BOTH tables are in the dataset
        // and deduplicate by relationship ID
        const seen = new Set();
        const filteredRelationships = allRelationships.filter(rel => {
          if (seen.has(rel.id)) return false;
          seen.add(rel.id);
          
          const leftTableId = rel.left_column?.table_id;
          const rightTableId = rel.right_column?.table_id;
          
          return tableIds.has(leftTableId) && tableIds.has(rightTableId);
        });

        setRelationships(filteredRelationships);
      } catch (err) {
        console.error('Failed to load relationships:', err);
      } finally {
        setIsLoadingRelationships(false);
      }
    };

    loadRelationships();
  }, [tableIdsKey, selectedVersion]);

  if (!dataset) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Layers className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">Select a Dataset</h3>
        <p className="text-sm text-center max-w-md">
          Choose a bronze dataset from the list to view its configuration, source tables, and
          ingestion status.
        </p>
      </div>
    );
  }

  // Helper to compare configs and find changes between selected version and pending config
  const getConfigChanges = () => {
    // Only show changes when viewing an old version and comparing to pending
    if (!isViewingOldVersion || !selectedVersionData?.config_snapshot || !currentConfig) return null;
    
    const oldConfig = selectedVersionData.config_snapshot;
    const pendingConfig = currentConfig; // Use the fetched config from GET /persistent/{id}
    const changes = [];
    
    // Compare name
    if (oldConfig.name !== pendingConfig.name) {
      changes.push({ field: 'Name', old: oldConfig.name, new: pendingConfig.name });
    }
    
    // Compare description
    if (oldConfig.description !== pendingConfig.description) {
      changes.push({ field: 'Description', old: oldConfig.description || '(none)', new: pendingConfig.description || '(none)' });
    }
    
    // Compare tables count
    const oldTableIds = new Set((oldConfig.tables || []).map(t => t.table_id));
    const newTableIds = new Set((pendingConfig.tables || []).map(t => t.table_id));
    
    const addedTables = [...newTableIds].filter(id => !oldTableIds.has(id));
    const removedTables = [...oldTableIds].filter(id => !newTableIds.has(id));
    
    if (addedTables.length > 0 || removedTables.length > 0) {
      changes.push({ 
        field: 'Tables', 
        old: `${oldConfig.tables?.length || 0} tables`, 
        new: `${pendingConfig.tables?.length || 0} tables`,
        added: addedTables.length,
        removed: removedTables.length
      });
    }
    
    // Compare federated joins
    if (oldConfig.enable_federated_joins !== pendingConfig.enable_federated_joins) {
      changes.push({ 
        field: 'Federated Joins', 
        old: oldConfig.enable_federated_joins ? 'Enabled' : 'Disabled', 
        new: pendingConfig.enable_federated_joins ? 'Enabled' : 'Disabled' 
      });
    }
    
    // Compare write mode
    if (oldConfig.write_mode !== pendingConfig.write_mode) {
      changes.push({ field: 'Write Mode', old: oldConfig.write_mode || 'overwrite', new: pendingConfig.write_mode || 'overwrite' });
    }
    
    // Compare output format
    if (oldConfig.output_format !== pendingConfig.output_format) {
      changes.push({ field: 'Output Format', old: oldConfig.output_format || 'delta', new: pendingConfig.output_format || 'delta' });
    }
    
    return changes.length > 0 ? changes : null;
  };
  
  const configChanges = getConfigChanges();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Version Banner */}
        {isViewingPending && currentConfig && (
          <div className="mb-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Viewing pending configuration
                </span>
                <span className="text-xs opacity-75">
                  (not yet executed - last update: {formatDate(currentConfig.data_atualizacao || currentConfig.updated_at)})
                </span>
              </div>
              {versionHistory.length > 0 && (
                <span className="text-xs text-green-600 dark:text-green-400">
                  Last executed: v{currentVersion}
                </span>
              )}
            </div>
          </div>
        )}
        
        {isViewingOldVersion && (
          <div className="mb-4 space-y-3">
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <History className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Viewing executed version {selectedVersion}
                </span>
                {selectedVersionData && (
                  <span className="text-xs opacity-75">
                    ({formatDate(selectedVersionData.timestamp)})
                  </span>
                )}
              </div>
              <button
                onClick={() => onSelectVersion('pending')}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
              >
                <RotateCcw className="w-3 h-3" />
                Back to Pending
              </button>
            </div>
            
            {/* Config Changes Section - comparing old version to pending */}
            {configChanges && configChanges.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
                  <GitCommit className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Changes from v{selectedVersion} → Pending ({configChanges.length})
                  </span>
                </div>
                <div className="space-y-1.5">
                  {configChanges.map((change, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <span className="font-medium text-gray-600 dark:text-gray-400 w-28">{change.field}:</span>
                      <span className="px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 line-through">
                        {change.old}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className="px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {change.new}
                      </span>
                      {change.added !== undefined && (
                        <span className="text-green-600 dark:text-green-400 text-[10px]">
                          +{change.added}
                        </span>
                      )}
                      {change.removed !== undefined && change.removed > 0 && (
                        <span className="text-red-600 dark:text-red-400 text-[10px]">
                          -{change.removed}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {displayConfig?.name || dataset.name}
              </h2>
              <TypeBadge type={dataset.type} />
              {!isViewingOldVersion && <StatusBadge status={dataset.status || 'active'} />}

              {/* Version Selector */}
              {dataset.type === 'persistent' && (
                <DropdownMenu
                  isOpen={versionDropdown.isOpen}
                  onClose={versionDropdown.onClose}
                  trigger={
                    <button
                      onClick={versionDropdown.onToggle}
                      disabled={isLoadingConfig}
                      className={clsx(
                        'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border transition-colors',
                        isViewingPending
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-700'
                          : isViewingOldVersion
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                      )}
                    >
                      {isLoadingConfig ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <GitCommit className="w-3 h-3" />
                      )}
                      {isViewingPending ? 'Pending' : `v${selectedVersion}`}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  }
                >
                  {/* Pending (current config) option - always at top */}
                  <DropdownItem
                    onClick={() => {
                      onSelectVersion('pending');
                      versionDropdown.onClose();
                    }}
                  >
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Pending
                    </span>
                    <span className="ml-2 text-gray-500 dark:text-gray-400">Current config</span>
                  </DropdownItem>
                  
                  {versionHistory.length > 0 && (
                    <>
                      <DropdownDivider />
                      <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Executed Versions
                      </div>
                      {versionHistory.map((entry) => (
                        <DropdownItem
                          key={entry.version}
                          onClick={() => {
                            onSelectVersion(entry.version);
                            versionDropdown.onClose();
                          }}
                        >
                          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                            v{entry.version}
                          </span>
                          <span
                            className={clsx(
                              'ml-2 text-xs px-1.5 py-0.5 rounded',
                              entry.operation === 'WRITE' &&
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                              entry.operation === 'OVERWRITE' &&
                                'bg-blue-100 dark:bg-blue-900/30 text-blue-600',
                              entry.operation === 'MERGE' &&
                                'bg-purple-100 dark:bg-purple-900/30 text-purple-600',
                              entry.operation === 'DELETE' &&
                                'bg-red-100 dark:bg-red-900/30 text-red-600'
                            )}
                          >
                            {entry.operation}
                          </span>
                        </DropdownItem>
                      ))}
                    </>
                  )}
                </DropdownMenu>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{displayConfig?.description || 'No description'}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/bronze/${dataset.type === 'persistent' ? 'p' : 'v'}_${dataset.id}`}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                dataset.type === 'virtualized'
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              )}
            >
              <Eye className="w-4 h-4" />
              {dataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
            </Link>
            {dataset.type === 'virtualized' ? (
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">
                <Play className="w-4 h-4" />
                Run Query
              </button>
            ) : dataset.status === 'running' ? (
              <button
                disabled
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-500/50 cursor-not-allowed rounded-lg"
              >
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </button>
            ) : (
              <button 
                onClick={() => onExecute(dataset.id)}
                disabled={isExecuting}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg disabled:opacity-50"
              >
                {isExecuting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isExecuting ? 'Executing...' : 'Run'}
              </button>
            )}
          </div>
        </div>

        {/* Error message */}
        {dataset.status === 'failed' && dataset.error && (
          <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Ingestion Failed</span>
            </div>
            <p className="text-sm text-red-600 dark:text-red-300 mt-1">{dataset.error}</p>
          </div>
        )}

        {/* Virtualized Banner */}
        {dataset.type === 'virtualized' && (
          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
                <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h4 className="font-medium text-cyan-900 dark:text-cyan-200">Virtualized Query</h4>
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  This dataset queries source data on-demand. No data is persisted.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid - only for Persistent */}
        {dataset.type === 'persistent' && (
          <div className="grid grid-cols-4 gap-4">
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : isViewingPending
                    ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50'
                    : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                {isViewingOldVersion ? 'Execution Date' : isViewingPending ? 'Last Modified' : 'Last Updated'}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {isViewingOldVersion && selectedVersionData?.timestamp
                  ? formatDate(selectedVersionData.timestamp)
                  : isViewingPending && currentConfig
                    ? formatDate(currentConfig.data_atualizacao || currentConfig.updated_at)
                    : formatDate(dataset.updated_at)}
              </div>
            </div>
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : isViewingPending
                    ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50'
                    : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Table2 className="w-3.5 h-3.5" />
                Tables
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {tablesToDisplay?.length || 0}
              </div>
            </div>
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : isViewingPending
                    ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50'
                    : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <GitCommit className="w-3.5 h-3.5" />
                Version
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {isViewingPending ? 'Pending' : `v${selectedVersion}`}
                {isViewingPending && versionHistory.length > 0 && (
                  <span className="text-xs font-normal text-gray-500 ml-1">(last: v{currentVersion})</span>
                )}
              </div>
            </div>
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : isViewingPending
                    ? 'bg-green-50/50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/50'
                    : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Zap className="w-3.5 h-3.5" />
                Federated
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {displayConfig?.enable_federated_joins ? 'Enabled' : 'Disabled'}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Source Tables */}
        <div>
          <button
            onClick={() => toggleSection('sourceTables')}
            className="w-full font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <ChevronRight className={clsx(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              !collapsedSections.sourceTables && 'rotate-90'
            )} />
            <Table2 className="w-4 h-4 text-gray-400" />
            Source Tables
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({tablesToDisplay?.length || 0})
            </span>
          </button>
          <div className={clsx(
            'space-y-2 overflow-hidden transition-all duration-200',
            collapsedSections.sourceTables ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
          )}>
            {isLoadingTables ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : enrichedTables.length > 0 ? (
              enrichedTables.map((table, idx) => (
                <div
                  key={table.table_id || idx}
                  className={clsx(
                    'flex items-center justify-between p-4 rounded-lg border',
                    isViewingOldVersion
                      ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                      : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg',
                        isViewingOldVersion
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      )}
                    >
                      <Table2
                        className={clsx(
                          'w-4 h-4',
                          isViewingOldVersion
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        {table.table_name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {table.connection_name}
                      </div>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 dark:text-gray-500">
                    {table.select_all 
                      ? `${table.column_count} columns` 
                      : `${table.column_ids?.length || 0} of ${table.column_count} columns`}
                  </span>
                </div>
              ))
            ) : (
              (dataset.tables || []).map((table, idx) => (
                <div
                  key={table.table_id || idx}
                  className={clsx(
                    'flex items-center justify-between p-4 rounded-lg border',
                    isViewingOldVersion
                      ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                      : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={clsx(
                        'p-2 rounded-lg',
                        isViewingOldVersion
                          ? 'bg-amber-100 dark:bg-amber-900/30'
                          : 'bg-blue-100 dark:bg-blue-900/30'
                      )}
                    >
                      <Table2
                        className={clsx(
                          'w-4 h-4',
                          isViewingOldVersion
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-blue-600 dark:text-blue-400'
                        )}
                      />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        Table ID: {table.table_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {table.select_all ? 'All columns' : `${table.column_ids?.length || 0} columns`}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Relationships */}
        {relationships.length > 0 && (
          <div>
            <button
              onClick={() => toggleSection('relationships')}
              className="w-full font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronRight className={clsx(
                'w-4 h-4 text-gray-400 transition-transform duration-200',
                !collapsedSections.relationships && 'rotate-90'
              )} />
              <Link2 className="w-4 h-4 text-gray-400" />
              Relationships
              <span className="text-xs font-normal text-gray-500 ml-1">
                ({relationships.length})
              </span>
            </button>
            <div className={clsx(
              'overflow-hidden transition-all duration-200',
              collapsedSections.relationships ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            )}>
            {isLoadingRelationships ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : relationships.length > 0 ? (
              <div className="space-y-2">
                {relationships.map((rel) => (
                  <div
                    key={rel.id}
                    className={clsx(
                      'p-4 rounded-lg border',
                      isViewingOldVersion
                        ? 'bg-amber-50/30 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50'
                        : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
                    )}
                  >
                    <div className="flex items-center gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {rel.left_column?.table_name}.{rel.left_column?.column_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {rel.left_column?.connection_name}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className="flex items-center gap-1">
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded font-medium',
                            rel.cardinality === 'one_to_one' && 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                            rel.cardinality === 'one_to_many' && 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                            rel.cardinality === 'many_to_many' && 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
                            !rel.cardinality && 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                          )}>
                            {rel.cardinality === 'one_to_one' ? '1:1' : rel.cardinality === 'one_to_many' ? '1:N' : rel.cardinality === 'many_to_many' ? 'M:N' : '?'}
                          </span>
                          {rel.scope === 'inter_connection' && (
                            <span className="text-xs px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 font-medium">
                              Cross-connection
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-gray-400 dark:text-gray-500">
                          <ChevronRight className="w-4 h-4" />
                          <ChevronRight className="w-4 h-4 -ml-2" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 text-right">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {rel.right_column?.table_name}.{rel.right_column?.column_name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {rel.right_column?.connection_name}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm text-gray-500 dark:text-gray-400">
                No relationships found between the tables in this configuration
              </div>
            )}
            </div>
          </div>
        )}

        {/* Version History */}
        {dataset.type === 'persistent' && (
          <VersionHistory
            dataset={dataset}
            currentConfig={currentConfig}
            versions={versionHistory}
            selectedVersion={selectedVersion}
            onSelectVersion={onSelectVersion}
            isLoading={isLoadingVersions}
            isCollapsed={collapsedSections.versionHistory}
            onToggle={() => toggleSection('versionHistory')}
          />
        )}
      </div>
    </div>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function BronzeLayerPage() {
  const router = useRouter();
  const { 
    configs, 
    isLoading: isLoadingConfigs, 
    error, 
    refresh, 
    deleteConfig, 
    executeConfig,
    getVersions 
  } = useBronzeConfigs();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null); // Full config from GET /persistent/{id}
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState('pending'); // 'pending' or version number
  const [versions, setVersions] = useState(null);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executingId, setExecutingId] = useState(null);

  // Load version history and current config when selecting a persistent dataset
  useEffect(() => {
    const loadVersionsAndConfig = async () => {
      if (selectedDataset && selectedDataset.type === 'persistent') {
        setIsLoadingVersions(true);
        setIsLoadingConfig(true);
        try {
          // Fetch both versions and current config in parallel
          const [versionData, configData] = await Promise.all([
            getVersions(selectedDataset.id),
            bronzeService.persistent.get(selectedDataset.id),
          ]);
          setVersions(versionData);
          setCurrentConfig(configData);
        } catch (err) {
          console.error('Failed to load versions/config:', err);
        } finally {
          setIsLoadingVersions(false);
          setIsLoadingConfig(false);
        }
      } else {
        setVersions(null);
        setCurrentConfig(null);
      }
    };
    loadVersionsAndConfig();
  }, [selectedDataset, getVersions]);

  // Handlers
  const handleSelectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
    setSelectedVersion('pending'); // Default to showing pending (current) config
  }, []);

  const handleDeleteDataset = useCallback(async (id, type) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      const success = await deleteConfig(id, type);
      if (success) {
        setSelectedDataset((prev) => (prev?.id === id ? null : prev));
      }
    }
  }, [deleteConfig]);

  const handleExecute = useCallback(async (id) => {
    setIsExecuting(true);
    setExecutingId(id);
    try {
      const result = await executeConfig(id);
      if (result) {
        // Refresh the list to get updated status
        await refresh();
        // Reload versions and config if this is the selected dataset
        if (selectedDataset?.id === id) {
          const [versionData, configData] = await Promise.all([
            getVersions(id),
            bronzeService.persistent.get(id),
          ]);
          setVersions(versionData);
          setCurrentConfig(configData);
        }
      }
    } finally {
      setIsExecuting(false);
      setExecutingId(null);
    }
  }, [executeConfig, refresh, getVersions, selectedDataset]);

  const handleEditDataset = useCallback((id, type) => {
    const prefix = type === 'persistent' ? 'p' : 'v';
    router.push(`/bronze/${prefix}_${id}/edit`);
  }, [router]);

  // Filtered datasets
  const filteredDatasets = configs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesType = filterType === 'all' || d.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: configs.length,
    persistent: configs.filter((d) => d.type === 'persistent').length,
    virtualized: configs.filter((d) => d.type === 'virtualized').length,
    running: configs.filter((d) => d.status === 'running').length,
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <Layers className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bronze Layer</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Raw data ingestion from source systems
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={refresh}
                disabled={isLoadingConfigs}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-4 h-4", isLoadingConfigs && "animate-spin")} />
                Refresh
              </button>
              <Link
                href="/bronze/new"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Dataset
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{stats.total} datasets</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-gray-600 dark:text-gray-400">{stats.persistent} persistent</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {stats.virtualized} virtualized
              </span>
            </div>
            {stats.running > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-gray-600 dark:text-gray-400">{stats.running} running</span>
              </div>
            )}
          </div>
        </header>

        {/* Error Banner */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <button 
                onClick={refresh}
                className="ml-auto text-sm underline hover:no-underline"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* List Panel */}
          <aside className="w-[420px] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 space-y-3">
              <SearchInput
                placeholder="Search datasets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClear={() => setSearchQuery('')}
              />
              <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'persistent', label: 'Persistent', icon: Sparkles },
                  { value: 'virtualized', label: 'Virtualized', icon: Zap },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={clsx(
                      'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                      filterType === value
                        ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'running', 'completed', 'active', 'failed', 'pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-xs font-medium transition-colors capitalize',
                      filterStatus === status
                        ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                        : 'bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-zinc-700'
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Dataset List */}
            <div className="flex-1 overflow-auto p-2">
              {isLoadingConfigs ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading datasets...</p>
                </div>
              ) : filteredDatasets.length === 0 ? (
                <EmptyState
                  icon={<Database className="w-12 h-12" />}
                  title="No datasets found"
                  description={configs.length === 0 ? "Create your first Bronze dataset to get started" : "Try adjusting your search or filters"}
                />
              ) : (
                <div className="space-y-2">
                  {filteredDatasets.map((dataset) => (
                    <DatasetListItem
                      key={`${dataset.type}_${dataset.id}`}
                      dataset={dataset}
                      isSelected={selectedDataset?.id === dataset.id && selectedDataset?.type === dataset.type}
                      onSelect={handleSelectDataset}
                      onDelete={handleDeleteDataset}
                      onExecute={handleExecute}
                      onEdit={handleEditDataset}
                      isExecuting={isExecuting && executingId === dataset.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Detail Panel */}
          <main className="flex-1 overflow-auto">
            <DetailPanel
              dataset={selectedDataset}
              currentConfig={currentConfig}
              versions={versions}
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              isLoadingVersions={isLoadingVersions}
              isLoadingConfig={isLoadingConfig}
              onExecute={handleExecute}
              isExecuting={isExecuting && executingId === selectedDataset?.id}
            />
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
