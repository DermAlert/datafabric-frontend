'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Download,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Rows3,
  Sparkles,
  Zap,
  RefreshCw,
  Play,
  AlertCircle,
  Loader2,
  Code2,
  Database,
  Timer,
  Info,
  Share2,
  GitCommit,
  ChevronDown,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { silverService } from '@/lib/api/services/silver';
import { formatBytes, formatDate } from '@/lib/utils';
import { useDisclosure } from '@/hooks';
import { DropdownMenu, DropdownItem, DropdownDivider, DataTable } from '@/components/ui';

// ===========================================
// Virtualized Info Banner
// ===========================================

const VirtualizedBanner = () => (
  <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
        <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
      </div>
      <div>
        <h4 className="font-medium text-cyan-900 dark:text-cyan-200">Live Query Preview</h4>
        <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
          This is a virtualized dataset. Data is queried on-demand — no data is stored in this layer.
        </p>
      </div>
    </div>
  </div>
);

// ===========================================
// Main Page Component
// ===========================================

export default function SilverDatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const versionDropdown = useDisclosure();

  // Parse ID: format is p_<id> for persistent, v_<id> for virtualized
  const rawId = params.id;
  const isPersistent = rawId.startsWith('p_');
  const isVirtualized = rawId.startsWith('v_');
  const datasetId = parseInt(rawId.replace(/^[pv]_/, ''), 10);

  const [config, setConfig] = useState(null);
  const [versions, setVersions] = useState(null);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [queryTime, setQueryTime] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState(null);
  const [dataError, setDataError] = useState(null);

  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Server-side query state (persistent only)
  const [serverFilters, setServerFilters] = useState([]);
  const [serverFiltersLogic, setServerFiltersLogic] = useState('AND');
  const [serverSortBy, setServerSortBy] = useState(null);
  const [serverSortOrder, setServerSortOrder] = useState('asc');
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(15);

  // Client-side state (virtualized only fallback)
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      setIsLoadingConfig(true);
      setError(null);
      try {
        if (isPersistent) {
          const [configData, versionsData] = await Promise.all([
            silverService.persistent.get(datasetId),
            silverService.persistent.getVersions(datasetId, 10),
          ]);
          setConfig(configData);
          setVersions(versionsData);
          // If there's a current version, default to showing that version's data
          if (versionsData?.current_version !== undefined) {
            setSelectedVersion(versionsData.current_version);
          }
        } else if (isVirtualized) {
          const configData = await silverService.virtualized.get(datasetId);
          setConfig(configData);
        }
      } catch (err) {
        console.error('Failed to load config:', err);
        setError(err.message || 'Failed to load dataset configuration');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    if (datasetId) {
      loadConfig();
    }
  }, [datasetId, isPersistent, isVirtualized]);

  // Load data for persistent configs via POST with filters
  const loadPersistentData = useCallback(
    async ({ version, isCurrentVersion, filters, filtersLogic, sortBy, sortOrder, page, pageSize } = {}) => {
      if (!isPersistent) return;
      setIsLoadingData(true);
      setDataError(null);
      try {
        const body = {
          limit: pageSize ?? serverPageSize,
          offset: ((page ?? serverPage) - 1) * (pageSize ?? serverPageSize),
        };
        // When viewing the current version, don't pass version param
        if (!isCurrentVersion) {
          body.version = version ?? selectedVersion;
        }
        const f = filters ?? serverFilters;
        if (f.length > 0) {
          body.column_filters = f;
          body.column_filters_logic = filtersLogic ?? serverFiltersLogic;
        }
        const sb = sortBy !== undefined ? sortBy : serverSortBy;
        if (sb) {
          body.sort_by = sb;
          body.sort_order = sortOrder ?? serverSortOrder;
        }

        const result = await silverService.persistent.queryWithFilters(datasetId, body);
        const cols = result.columns || [];
        const rows = result.data || [];
        setColumns(cols);
        setData(rows);
        setTotalRows(result.total_rows || result.row_count || 0);
        setQueryTime(result.execution_time_seconds);
      } catch (err) {
        console.error('Failed to load data:', err);
        setDataError(err?.data?.detail || err.message || 'Failed to load data');
        setData([]);
        setColumns([]);
      } finally {
        setIsLoadingData(false);
      }
    },
    [datasetId, isPersistent, selectedVersion, serverFilters, serverFiltersLogic, serverSortBy, serverSortOrder, serverPage, serverPageSize]
  );

  // Load data when selectedVersion changes
  useEffect(() => {
    if (isPersistent && selectedVersion !== null && config) {
      const isCurrentVersion = versions?.current_version !== undefined &&
        selectedVersion === versions.current_version;
      loadPersistentData({ version: selectedVersion, isCurrentVersion });
    }
  }, [selectedVersion, isPersistent, config, versions, loadPersistentData]);

  // Handle server-side query changes from DataTable
  const handleQueryChange = useCallback(
    ({ filters, filtersLogic, sortBy, sortOrder, page, pageSize }) => {
      setServerFilters(filters);
      setServerFiltersLogic(filtersLogic);
      setServerSortBy(sortBy);
      setServerSortOrder(sortOrder);
      setServerPage(page);
      setServerPageSize(pageSize);

      const isCurrentVersion = versions?.current_version !== undefined &&
        selectedVersion === versions.current_version;
      loadPersistentData({
        version: selectedVersion,
        isCurrentVersion,
        filters,
        filtersLogic,
        sortBy,
        sortOrder,
        page,
        pageSize,
      });
    },
    [selectedVersion, versions, loadPersistentData]
  );

  // Query virtualized data
  const queryVirtualizedData = useCallback(async () => {
    if (!isVirtualized) return;
    setIsLoadingData(true);
    setDataError(null);
    try {
      const result = await silverService.virtualized.query(datasetId, {
        limit: 1000,
        offset: 0,
      });
      // Parse groups from response
      if (result.groups && result.groups.length > 0) {
        const parsedGroups = result.groups.map((g) => ({
          group_name: g.group_name || 'Data',
          connection_name: g.connection_name || '',
          columns: g.columns || [],
          data: g.data || [],
        }));
        setGroups(parsedGroups);
        setSelectedGroupIndex(0);
        setColumns(parsedGroups[0].columns);
        setData(parsedGroups[0].data);
        setTotalRows(result.total_rows || parsedGroups[0].data.length);
      } else {
        const cols = result.columns || [];
        const rows = result.data || [];
        setGroups([{ group_name: 'All Data', connection_name: '', columns: cols, data: rows }]);
        setSelectedGroupIndex(0);
        setColumns(cols);
        setData(rows);
        setTotalRows(result.total_rows || result.row_count || 0);
      }
      setQueryTime(result.execution_time_seconds);
    } catch (err) {
      console.error('Failed to query data:', err);
      setDataError(err.message || 'Failed to query data');
      setData([]);
      setColumns([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [datasetId, isVirtualized]);

  // Initial load for virtualized
  useEffect(() => {
    if (isVirtualized && config && !data) {
      queryVirtualizedData();
    }
  }, [isVirtualized, config, data, queryVirtualizedData]);

  // Execute transformation
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const result = await silverService.persistent.execute(datasetId);
      if (result) {
        // Reload versions and data
        const versionsData = await silverService.persistent.getVersions(datasetId, 10);
        setVersions(versionsData);
        if (versionsData?.current_version !== undefined) {
          setSelectedVersion(versionsData.current_version);
        }
      }
    } catch (err) {
      console.error('Execution failed:', err);
      setError(err.message || 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  // Handle group/source tab change
  const handleGroupChange = (index) => {
    if (index === selectedGroupIndex) return;
    setSelectedGroupIndex(index);
    setColumns(groups[index].columns);
    setData(groups[index].data);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // Client-side filter (virtualized only)
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (isPersistent) return data;
    if (!searchQuery) return data;
    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery, isPersistent]);

  // Version history
  const versionHistory = versions?.versions || [];
  const currentVersion = versions?.current_version;

  // Loading state
  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading dataset...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (error || !config) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {error || 'Dataset Not Found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The dataset you&apos;re looking for doesn&apos;t exist or could not be loaded.
          </p>
          <Link
            href="/silver"
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Silver Layer
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center gap-4 mb-4">
            <Link
              href="/silver"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div
                  className={clsx(
                    'p-2 rounded-lg',
                    isVirtualized
                      ? 'bg-cyan-100 dark:bg-cyan-900/30'
                      : 'bg-purple-100 dark:bg-purple-900/30'
                  )}
                >
                  {isVirtualized ? (
                    <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                      {config.name}
                    </h1>
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-md text-xs font-medium',
                        isVirtualized
                          ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300'
                          : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                      )}
                    >
                      {isVirtualized ? 'Virtualized' : 'Persistent'}
                    </span>
                    {/* Version Selector for Persistent */}
                    {isPersistent && versionHistory.length > 0 && (
                      <DropdownMenu
                        isOpen={versionDropdown.isOpen}
                        onClose={versionDropdown.onClose}
                        trigger={
                          <button
                            onClick={versionDropdown.onToggle}
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                          >
                            <GitCommit className="w-3 h-3" />
                            {selectedVersion === null
                              ? `Current v${currentVersion}`
                              : selectedVersion === currentVersion
                                ? `Current v${selectedVersion}`
                                : `v${selectedVersion}`}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        }
                      >
                        {versionHistory.map((entry) => (
                          <DropdownItem
                            key={`${entry.version}-${entry.timestamp}`}
                            onClick={() => {
                              setSelectedVersion(entry.version);
                              versionDropdown.onClose();
                            }}
                          >
                            <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400">
                              v{entry.version}
                            </span>
                            {entry.version === currentVersion && (
                              <span className="ml-2 text-xs text-green-700 dark:text-green-400">
                                current
                              </span>
                            )}
                          </DropdownItem>
                        ))}
                      </DropdownMenu>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isPersistent && (
                <Link
                  href={`/sharing?dataset=silver.${config.name}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Link>
              )}
              {isPersistent && (
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              <button
                onClick={isPersistent ? handleExecute : queryVirtualizedData}
                disabled={isExecuting || isLoadingData}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50',
                  isVirtualized ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-purple-500 hover:bg-purple-600'
                )}
              >
                {isExecuting || isLoadingData ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isVirtualized ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isVirtualized ? 'Run Query' : 'Re-execute'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Rows3 className="w-4 h-4" />
              <span>{(filteredData.length || totalRows || 0).toLocaleString()} rows</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Clock className="w-4 h-4" />
              <span>{formatDate(config.updated_at)}</span>
            </div>
            {config.source_bronze_config_name && (
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  Source:{' '}
                  <span className="font-medium text-amber-600 dark:text-amber-400">
                    {config.source_bronze_config_name}
                  </span>
                  {config.source_bronze_version !== null && config.source_bronze_version !== undefined ? (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                      v{config.source_bronze_version}
                    </span>
                  ) : (
                    <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      latest
                    </span>
                  )}
                </span>
              </div>
            )}
            {queryTime && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Timer className="w-4 h-4" />
                <span>{(queryTime * 1000).toFixed(0)}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Source Tabs - when multiple groups (virtualized) */}
        {groups.length > 1 && (
          <div className="px-6 py-2 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-1 overflow-x-auto">
            <Database className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
            {groups.map((group, idx) => (
              <button
                key={idx}
                onClick={() => handleGroupChange(idx)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  selectedGroupIndex === idx
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                )}
              >
                {group.connection_name || group.group_name}
                <span className="ml-1.5 text-xs opacity-70">({group.data.length})</span>
              </button>
            ))}
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6 space-y-4">
          {isVirtualized && groups.length <= 1 && <VirtualizedBanner />}

          {dataError ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Failed to load data</span>
              </div>
              <p className="mt-2 text-sm text-red-600 dark:text-red-300">{dataError}</p>
            </div>
          ) : isPersistent ? (
            <DataTable
              columns={columns}
              data={data || []}
              totalRows={totalRows}
              page={serverPage}
              pageSize={serverPageSize}
              filters={serverFilters}
              filtersLogic={serverFiltersLogic}
              sortBy={serverSortBy}
              sortOrder={serverSortOrder}
              isLoading={isLoadingData}
              queryTime={queryTime}
              onQueryChange={handleQueryChange}
            />
          ) : isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="w-10 h-10 animate-spin mb-4 text-cyan-500" />
              <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
            </div>
          ) : (
            <DataTable columns={columns} data={filteredData} />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
