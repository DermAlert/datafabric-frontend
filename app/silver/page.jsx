'use client';

import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Plus,
  Database,
  Play,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  RefreshCw,
  Clock,
  Loader2,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Zap,
  Table2,
  GitMerge,
  Filter,
  Code2,
  FileCode,
  Layers,
  GitCommit,
  History,
  RotateCcw,
  AlertCircle,
  ArrowRightLeft,
} from 'lucide-react';
import { useDisclosure, useSilverConfigs } from '@/hooks';
import {
  StatusBadge,
  TypeBadge,
  VersionBadge,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  EmptyState,
} from '@/components/ui';
import { SearchInput } from '@/components/ui/Input';
import { formatBytes, formatDate } from '@/lib/utils';
import { silverService } from '@/lib/api/services/silver';

// ===========================================
// Helper: Check if there are pending changes
// ===========================================

/**
 * Compares current config with the last executed version to determine if there are pending changes.
 * Returns true if:
 * - No versions exist (first execution)
 * - Current config differs from the config_snapshot of the last version
 */
const hasPendingChanges = (currentConfig, versions) => {
  // If no current config, nothing to compare
  if (!currentConfig) return false;
  
  // Get version history array
  const versionHistory = versions?.versions || versions || [];
  
  // If no versions exist, it's the first execution - show pending
  if (!versionHistory || versionHistory.length === 0) return true;
  
  // Get the most recent version's config snapshot
  const lastVersion = versionHistory[0];
  const lastConfig = lastVersion?.config_snapshot;
  
  // If no config snapshot in last version, show pending
  if (!lastConfig) return true;
  
  // Compare key fields
  if (currentConfig.name !== lastConfig.name) return true;
  if (currentConfig.description !== lastConfig.description) return true;
  
  // Compare source (bronze dataset reference)
  if (currentConfig.source_bronze_config_id !== lastConfig.source_bronze_config_id) return true;
  if (currentConfig.source_bronze_version !== lastConfig.source_bronze_version) return true;
  
  // Compare column transformations (using correct field name)
  const currentTransforms = JSON.stringify(currentConfig.column_transformations || []);
  const lastTransforms = JSON.stringify(lastConfig.column_transformations || []);
  if (currentTransforms !== lastTransforms) return true;
  
  // Compare column group IDs (using correct field name)
  const currentGroups = JSON.stringify(currentConfig.column_group_ids || []);
  const lastGroups = JSON.stringify(lastConfig.column_group_ids || []);
  if (currentGroups !== lastGroups) return true;
  
  // Compare filters
  const currentFilters = JSON.stringify(currentConfig.filters || {});
  const lastFilters = JSON.stringify(lastConfig.filters || {});
  if (currentFilters !== lastFilters) return true;
  
  // No changes detected
  return false;
};

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
          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {dataset.name}
            </span>
            <TypeBadge type={dataset.type} variant="silver" />
            {dataset.type === 'persistent' && dataset.currentDeltaVersion !== undefined && dataset.currentDeltaVersion !== null && dataset.currentDeltaVersion !== 'pending' && (
              <VersionBadge version={dataset.currentDeltaVersion} />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
            {dataset.description || 'No description'}
          </p>
          <div className="flex items-center gap-3">
            <StatusBadge status={dataset.status || 'active'} />
            {dataset.columnTransformations && dataset.columnTransformations.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Code2 className="w-3 h-3" />
                {dataset.columnTransformations.length}
              </span>
            )}
            {dataset.columnGroupIds && dataset.columnGroupIds.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <GitMerge className="w-3 h-3" />
                {dataset.columnGroupIds.length}
              </span>
            )}
            {dataset.filters && dataset.filters.conditions && dataset.filters.conditions.length > 0 && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                {dataset.filters.conditions.length}
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
            href={`/silver/${dataset.type === 'persistent' ? 'p' : 'v'}_${dataset.id}`}
          >
            {dataset.type === 'persistent' ? 'View Data' : 'Preview Data'}
          </DropdownItem>
          {dataset.type === 'persistent' && dataset.status !== 'running' && (
            <DropdownItem
              icon={isExecuting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              onClick={(e) => {
                e.stopPropagation();
                onExecute(dataset.id);
                menuDisclosure.onClose();
              }}
              disabled={isExecuting}
            >
              {isExecuting ? 'Executing...' : 'Execute'}
            </DropdownItem>
          )}
          {dataset.type === 'virtualized' && (
            <DropdownItem
              icon={<Play className="w-3.5 h-3.5" />}
              href={`/silver/${dataset.type === 'persistent' ? 'p' : 'v'}_${dataset.id}`}
            >
              Query
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
  selectedVersion,
  onSelectVersion,
  isLoading,
  isCollapsed,
  onToggle,
  showPending, // Only show pending option if there are uncommitted changes
}) {
  const isViewingPending = selectedVersion === 'pending';
  const currentVersion = dataset?.currentDeltaVersion ?? 0;

  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ChevronRight
          className={clsx(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            !isCollapsed && 'rotate-90'
          )}
        />
        <History className="w-4 h-4 text-gray-400" />
        Version History
        <span className="text-xs font-normal text-gray-500 ml-1">(Delta Lake)</span>
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
              <div className="divide-y divide-gray-100 dark:divide-zinc-700">
                {/* Pending (current config) - only shown if there are pending changes */}
                {showPending && (
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
                      <span>
                        {formatDate(
                          currentConfig?.updated_at || dataset?.updated_at
                        )}
                      </span>
                    </div>
                  </button>
                )}

                {/* Executed versions */}
                {versions &&
                  versions.length > 0 &&
                  versions.slice(0, 5).map((entry) => (
                    <button
                      key={`${entry.version}-${entry.timestamp}`}
                      onClick={() => {
                        // If clicking same version, toggle back to pending only if pending exists
                        if (entry.version === selectedVersion) {
                          if (showPending) onSelectVersion('pending');
                          // Otherwise do nothing (stay on this version)
                        } else {
                          onSelectVersion(entry.version);
                        }
                      }}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50',
                        entry.version === selectedVersion &&
                          !isViewingPending &&
                          'bg-purple-50/50 dark:bg-purple-900/10'
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
                            (entry.operation === 'WRITE' ||
                              entry.operation === 'OVERWRITE') &&
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
                        <span>{(entry.rows_inserted || 0).toLocaleString()} rows</span>
                        <span>{formatDate(entry.timestamp)}</span>
                      </div>
                    </button>
                  ))}
              </div>
              {versions && versions.length > 5 && (
                <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
                  <button className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium flex items-center gap-1">
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
// Transformations Section Component
// ===========================================

const TransformationsSection = memo(function TransformationsSection({
  transformations,
  isViewingOldVersion,
  currentCount,
  isCollapsed,
  onToggle,
}) {
  if (!transformations || transformations.length === 0) return null;

  const transformationLabels = {
    lowercase: 'LOWERCASE',
    uppercase: 'UPPERCASE',
    trim: 'TRIM',
    normalize_spaces: 'NORMALIZE_SPACES',
    remove_accents: 'REMOVE_ACCENTS',
    template: 'TEMPLATE',
  };

  return (
    <section
      className={clsx(
        isViewingOldVersion &&
          'p-4 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between mb-3 hover:opacity-80 transition-opacity"
      >
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <ChevronRight
            className={clsx(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              !isCollapsed && 'rotate-90'
            )}
          />
          <Code2 className="w-4 h-4 text-gray-400" />
          Column Transformations
          <span className="text-xs font-normal text-gray-500 ml-1">
            ({transformations.length})
          </span>
        </h3>
        {isViewingOldVersion &&
          currentCount !== undefined &&
          currentCount !== transformations.length && (
            <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
              Changed from current ({currentCount})
            </span>
          )}
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}
      >
        <div className="space-y-2">
          {transformations.map((t, i) => (
            <div
              key={i}
              className={clsx(
                'flex items-center justify-between p-3 rounded-lg border',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/50'
                  : 'bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700'
              )}
            >
              <div className="flex items-center gap-3">
                <code
                  className={clsx(
                    'px-2 py-1 rounded text-sm font-mono',
                    isViewingOldVersion
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200'
                      : 'bg-gray-100 dark:bg-zinc-700 text-gray-800 dark:text-gray-200'
                  )}
                >
                  column_id: {t.column_id}
                </code>
                <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                <span
                  className={clsx(
                    'px-2 py-1 rounded text-xs font-medium',
                    isViewingOldVersion
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      : t.type === 'template'
                      ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  )}
                >
                  {transformationLabels[t.type] || t.type.toUpperCase()}
                </span>
              </div>
              {t.rule_id && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Rule ID: {t.rule_id}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

// ===========================================
// Column Groups Section Component
// ===========================================

const ColumnGroupsSection = memo(function ColumnGroupsSection({
  columnGroupIds,
  isViewingOldVersion,
  isCollapsed,
  onToggle,
}) {
  if (!columnGroupIds || columnGroupIds.length === 0) return null;

  return (
    <section
      className={clsx(
        isViewingOldVersion &&
          'p-4 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        <ChevronRight
          className={clsx(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            !isCollapsed && 'rotate-90'
          )}
        />
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <GitMerge className="w-4 h-4 text-gray-400" />
          Column Groups (Equivalence)
          <span className="text-xs font-normal text-gray-500 ml-1">
            ({columnGroupIds.length})
          </span>
        </h3>
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}
      >
        <div className="flex flex-wrap gap-2">
          {columnGroupIds.map((groupId) => (
            <span
              key={groupId}
              className={clsx(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm',
                isViewingOldVersion
                  ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                  : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
              )}
            >
              <GitMerge className="w-3.5 h-3.5" />
              Group ID: {groupId}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Column unification + value mappings applied from Equivalence layer
        </p>
      </div>
    </section>
  );
});

// ===========================================
// Filters Section Component
// ===========================================

const FiltersSection = memo(function FiltersSection({
  filters,
  isViewingOldVersion,
  isCollapsed,
  onToggle,
}) {
  if (!filters?.conditions || filters.conditions.length === 0) return null;

  return (
    <section
      className={clsx(
        isViewingOldVersion &&
          'p-4 rounded-lg bg-amber-50/30 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30'
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity"
      >
        <ChevronRight
          className={clsx(
            'w-4 h-4 text-gray-400 transition-transform duration-200',
            !isCollapsed && 'rotate-90'
          )}
        />
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          Filter Conditions
          <span className="text-xs font-normal text-gray-500 ml-1">
            ({filters.conditions.length})
          </span>
        </h3>
      </button>
      <div
        className={clsx(
          'overflow-hidden transition-all duration-200',
          isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
        )}
      >
        <div
          className={clsx(
            'p-4 rounded-lg',
            isViewingOldVersion ? 'bg-amber-900/80 dark:bg-amber-950' : 'bg-zinc-900 dark:bg-zinc-950'
          )}
        >
          <code
            className={clsx(
              'text-sm font-mono',
              isViewingOldVersion ? 'text-amber-300' : 'text-green-400'
            )}
          >
            WHERE{' '}
            {filters.conditions
              .map((c) => {
                if (['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                  return `column_${c.column_id} ${c.operator}`;
                }
                if (c.operator === 'BETWEEN') {
                  return `column_${c.column_id} BETWEEN ${c.value_min} AND ${c.value_max}`;
                }
                return `column_${c.column_id} ${c.operator} '${c.value}'`;
              })
              .join(` ${filters.logic} `)}
          </code>
        </div>
      </div>
    </section>
  );
});

// ===========================================
// Detail Panel Component
// ===========================================

const DetailPanel = memo(function DetailPanel({
  dataset,
  currentConfig,
  versions,
  selectedVersion,
  onSelectVersion,
  isLoadingVersions,
  isLoadingConfig,
  onExecute,
  isExecuting,
  showPending, // Only show pending option if there are uncommitted changes
}) {
  const versionDropdown = useDisclosure();

  // Collapsed sections state
  const [collapsedSections, setCollapsedSections] = useState({
    source: false,
    transformations: false,
    columnGroups: false,
    filters: false,
    versionHistory: false,
  });

  const toggleSection = useCallback((section) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  }, []);

  // Get version data for selected version
  const versionHistory = versions?.versions || [];
  const currentVersion = versions?.current_version ?? dataset?.currentDeltaVersion ?? 0;

  // Check if viewing pending (current unsaved config) or a specific version
  // Only show as pending if there are actually pending changes
  const isViewingPending = selectedVersion === 'pending' && showPending;
  const selectedVersionData =
    !isViewingPending && selectedVersion !== null
      ? versionHistory.find((v) => v.version === selectedVersion)
      : null;
  
  // Determine if viewing an "old" version (not the current state)
  // - If showPending: any executed version is "old" compared to pending
  // - If no pending: only versions older than the latest are "old"
  const latestVersion = versionHistory.length > 0 ? versionHistory[0].version : null;
  const isViewingOldVersion = selectedVersion !== 'pending' && 
    selectedVersion !== null && 
    (showPending || selectedVersion !== latestVersion);

  // Get config to display
  const displayConfig = isViewingPending
    ? currentConfig || dataset
    : selectedVersionData?.config_snapshot || dataset;

  if (!dataset) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Sparkles className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">Select a Dataset</h3>
        <p className="text-sm text-center max-w-md">
          Choose a silver dataset from the list to view its transformations, column
          groups, and execution status.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Version Banner */}
        {isViewingPending && currentConfig && (
          <div className="mb-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">Viewing pending configuration</span>
                <span className="text-xs opacity-75">
                  (last update: {formatDate(currentConfig.updated_at)})
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
              {showPending && (
                <button
                  onClick={() => onSelectVersion('pending')}
                  className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
                >
                  <RotateCcw className="w-3 h-3" />
                  Back to Pending
                </button>
              )}
            </div>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {displayConfig?.name || dataset.name}
              </h2>
              <TypeBadge type={dataset.type} variant="silver" />
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
                      {isLoadingConfig || isLoadingVersions || (selectedVersion === 'pending' && !isViewingPending) ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <GitCommit className="w-3 h-3" />
                      )}
                      {isLoadingVersions || (selectedVersion === 'pending' && !isViewingPending) ? '' : isViewingPending ? 'Pending' : `v${selectedVersion}`}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  }
                >
                  {/* Pending (current config) option - only if there are pending changes */}
                  {showPending && (
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
                  )}

                  {versionHistory.length > 0 && (
                    <>
                      <DropdownDivider />
                      <div className="px-3 py-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                        Executed Versions
                      </div>
                      {versionHistory.map((entry) => (
                        <DropdownItem
                          key={`${entry.version}-${entry.timestamp}`}
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
            <p className="text-gray-500 dark:text-gray-400">
              {displayConfig?.description || 'No description'}
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/silver/${dataset.type === 'persistent' ? 'p' : 'v'}_${dataset.id}`}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                dataset.type === 'persistent'
                  ? 'bg-purple-500 hover:bg-purple-600'
                  : 'bg-cyan-500 hover:bg-cyan-600'
              )}
            >
              <Eye className="w-4 h-4" />
              {dataset.type === 'persistent' ? 'View Data' : 'Preview Data'}
            </Link>
            {dataset.type === 'persistent' ? (
              dataset.status === 'running' ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-500/50 cursor-not-allowed rounded-lg"
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
                    <Play className="w-4 h-4" />
                  )}
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
              )
            ) : (
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">
                <Play className="w-4 h-4" />
                Run Query
              </button>
            )}
          </div>
        </div>

        {/* Virtualized Banner */}
        {dataset.type === 'virtualized' && (
          <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800 mb-4">
            <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Virtualized Query</span>
            </div>
            <p className="text-sm text-cyan-600 dark:text-cyan-300">
              This dataset queries source data on-demand. No data is materialized.
            </p>
          </div>
        )}

        {/* Stats Grid - only for Persistent */}
        {dataset.type === 'persistent' && (
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                Last Updated
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatDate(dataset.updated_at)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <GitCommit className="w-3.5 h-3.5" />
                Version
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {isLoadingVersions || (selectedVersion === 'pending' && !isViewingPending) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isViewingPending ? (
                  <>
                    Pending
                    {versionHistory.length > 0 && (
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        (last: v{currentVersion})
                      </span>
                    )}
                  </>
                ) : (
                  `v${selectedVersion}`
                )}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Layers className="w-3.5 h-3.5" />
                Source Bronze
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 dark:text-white text-sm">
                  {dataset.sourceBronzeConfigName || `ID: ${dataset.sourceBronzeConfigId}`}
                </span>
                {dataset.sourceBronzeVersion !== null && dataset.sourceBronzeVersion !== undefined ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                    v{dataset.sourceBronzeVersion}
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                    latest
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Source */}
        <section>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            {dataset.type === 'persistent' ? (
              <>
                <Database className="w-4 h-4 text-gray-400" />
                Source Bronze Dataset
              </>
            ) : (
              <>
                <Table2 className="w-4 h-4 text-gray-400" />
                Source Tables
                <span className="text-xs font-normal text-gray-500 ml-1">
                  ({dataset.tables?.length || 0})
                </span>
              </>
            )}
          </h3>
          {dataset.type === 'persistent' ? (
            <div className="p-4 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Layers className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {dataset.sourceBronzeConfigName || `Bronze Config ID: ${dataset.sourceBronzeConfigId}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Bronze Layer Dataset
                    </div>
                  </div>
                </div>
                {/* Version Strategy Badge */}
                <div className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg',
                  dataset.sourceBronzeVersion !== null && dataset.sourceBronzeVersion !== undefined
                    ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50'
                    : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50'
                )}>
                  {dataset.sourceBronzeVersion !== null && dataset.sourceBronzeVersion !== undefined ? (
                    <>
                      <GitCommit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <div className="text-right">
                        <div className="text-xs font-medium text-amber-700 dark:text-amber-300">
                          Pinned Version
                        </div>
                        <div className="text-sm font-bold text-amber-800 dark:text-amber-200">
                          v{dataset.sourceBronzeVersion}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <div className="text-right">
                        <div className="text-xs font-medium text-green-700 dark:text-green-300">
                          Version Strategy
                        </div>
                        <div className="text-sm font-bold text-green-800 dark:text-green-200">
                          Always Latest
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {dataset.tables?.map((table, idx) => (
                <div
                  key={table.table_id || idx}
                  className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                      <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white text-sm">
                        Table ID: {table.table_id}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {table.select_all ? 'All columns selected' : 'Specific columns'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Configuration Sections - Only show when not loading for persistent datasets */}
        {dataset.type === 'persistent' && (isLoadingConfig || isLoadingVersions) ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-purple-500 animate-spin mr-2" />
            <span className="text-gray-500 dark:text-gray-400">Loading configuration...</span>
          </div>
        ) : (
          <>
            {/* Column Transformations */}
            <TransformationsSection
              transformations={displayConfig?.column_transformations || displayConfig?.columnTransformations}
              isViewingOldVersion={isViewingOldVersion}
              currentCount={dataset.columnTransformations?.length}
              isCollapsed={collapsedSections.transformations}
              onToggle={() => toggleSection('transformations')}
            />

            {/* Column Groups (Equivalence) */}
            <ColumnGroupsSection
              columnGroupIds={displayConfig?.column_group_ids || displayConfig?.columnGroupIds}
              isViewingOldVersion={isViewingOldVersion}
              isCollapsed={collapsedSections.columnGroups}
              onToggle={() => toggleSection('columnGroups')}
            />

            {/* Filter Conditions */}
            <FiltersSection
              filters={displayConfig?.filters}
              isViewingOldVersion={isViewingOldVersion}
              isCollapsed={collapsedSections.filters}
              onToggle={() => toggleSection('filters')}
            />
          </>
        )}

        {/* Version History */}
        {dataset.type === 'persistent' && (
          <VersionHistory
            key={dataset.id}
            dataset={dataset}
            currentConfig={currentConfig}
            versions={versionHistory}
            selectedVersion={selectedVersion}
            onSelectVersion={onSelectVersion}
            isLoading={isLoadingVersions}
            isCollapsed={collapsedSections.versionHistory}
            onToggle={() => toggleSection('versionHistory')}
            showPending={showPending}
          />
        )}
      </div>
    </div>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function SilverLayerPage() {
  const router = useRouter();
  const {
    configs,
    isLoading: isLoadingConfigs,
    error,
    refresh,
    deleteConfig,
    executeConfig,
    getVersions,
  } = useSilverConfigs();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState('pending');
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
        setVersions(null);
        setCurrentConfig(null);
        setSelectedVersion('pending'); // Reset version when dataset changes
        try {
          const [versionData, configData] = await Promise.all([
            getVersions(selectedDataset.id),
            silverService.persistent.get(selectedDataset.id),
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
        setSelectedVersion('pending');
      }
    };
    loadVersionsAndConfig();
  }, [selectedDataset, getVersions]);

  // Handlers
  const handleSelectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
    // Note: selectedVersion is reset in the useEffect above
  }, []);

  const handleDeleteDataset = useCallback(
    async (id, type) => {
      if (confirm('Are you sure you want to delete this dataset?')) {
        const success = await deleteConfig(id, type);
        if (success) {
          setSelectedDataset((prev) => (prev?.id === id ? null : prev));
        }
      }
    },
    [deleteConfig]
  );

  const handleExecute = useCallback(
    async (id) => {
      setIsExecuting(true);
      setExecutingId(id);
      try {
        const result = await executeConfig(id);
        if (result) {
          await refresh();
          if (selectedDataset?.id === id) {
            const [versionData, configData] = await Promise.all([
              getVersions(id),
              silverService.persistent.get(id),
            ]);
            setVersions(versionData);
            setCurrentConfig(configData);
          }
        }
      } finally {
        setIsExecuting(false);
        setExecutingId(null);
      }
    },
    [executeConfig, refresh, getVersions, selectedDataset]
  );

  const handleEditDataset = useCallback(
    (id, type) => {
      const prefix = type === 'persistent' ? 'p' : 'v';
      router.push(`/silver/${prefix}_${id}/edit`);
    },
    [router]
  );

  // Calculate if there are pending changes (config differs from last executed version)
  const showPending = useMemo(() => {
    return hasPendingChanges(currentConfig, versions);
  }, [currentConfig, versions]);

  // Auto-select the latest version if no pending changes
  useEffect(() => {
    if (!isLoadingConfig && !isLoadingVersions && selectedVersion === 'pending' && !showPending) {
      // No pending changes, auto-select the latest executed version
      const versionHistory = versions?.versions || [];
      if (versionHistory.length > 0) {
        setSelectedVersion(versionHistory[0].version);
      }
    }
  }, [isLoadingConfig, isLoadingVersions, selectedVersion, showPending, versions]);

  // Filtered datasets
  const filteredDatasets = configs.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
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
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Silver Layer</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Data transformation and normalization
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={isLoadingConfigs}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-4 h-4', isLoadingConfigs && 'animate-spin')} />
                Refresh
              </button>
              <Link
                href="/silver/rules"
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <FileCode className="w-4 h-4" />
                Rules
              </Link>
              <Link
                href="/silver/new"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
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
              <Sparkles className="w-4 h-4 text-purple-500" />
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
              <button onClick={refresh} className="ml-auto text-sm underline hover:no-underline">
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
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
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
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading datasets...</p>
                </div>
              ) : filteredDatasets.length === 0 ? (
                <EmptyState
                  icon={<Sparkles className="w-12 h-12" />}
                  title="No datasets found"
                  description={
                    configs.length === 0
                      ? 'Create your first Silver dataset to get started'
                      : 'Try adjusting your search or filters'
                  }
                />
              ) : (
                <div className="space-y-2">
                  {filteredDatasets.map((dataset) => (
                    <DatasetListItem
                      key={`${dataset.type}_${dataset.id}`}
                      dataset={dataset}
                      isSelected={
                        selectedDataset?.id === dataset.id && selectedDataset?.type === dataset.type
                      }
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
              key={selectedDataset ? `${selectedDataset.type}_${selectedDataset.id}` : 'empty'}
              dataset={selectedDataset}
              currentConfig={currentConfig}
              versions={versions}
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
              isLoadingVersions={isLoadingVersions}
              isLoadingConfig={isLoadingConfig}
              onExecute={handleExecute}
              isExecuting={isExecuting && executingId === selectedDataset?.id}
              showPending={showPending}
            />
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
