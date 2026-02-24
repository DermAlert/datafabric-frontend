'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  ArrowLeft,
  Table2,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Clock,
  Rows3,
  Sparkles,
  Zap,
  RefreshCw,
  Loader2,
  Timer,
  Info,
  Play,
  Share2,
  AlertCircle,
  GitCommit,
  Database,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { bronzeService } from '@/lib/api/services/bronze';
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

export default function DatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const versionDropdown = useDisclosure();

  // Parse ID: format is p_<id> for persistent, v_<id> for virtualized
  const rawId = params.id;
  const isPersistent = rawId?.startsWith('p_');
  const isVirtualized = rawId?.startsWith('v_');
  const configId = rawId ? parseInt(rawId.replace(/^[pv]_/, ''), 10) : null;

  const [config, setConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [data, setData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [deltaVersion, setDeltaVersion] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [queryTime, setQueryTime] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versions, setVersions] = useState([]);

  const [groups, setGroups] = useState([]);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);

  // Server-side query state (persistent single-table/federated only)
  const [serverFilters, setServerFilters] = useState([]);
  const [serverFiltersLogic, setServerFiltersLogic] = useState('AND');
  const [serverSortBy, setServerSortBy] = useState(null);
  const [serverSortOrder, setServerSortOrder] = useState('asc');
  const [serverPage, setServerPage] = useState(1);
  const [serverPageSize, setServerPageSize] = useState(15);

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Load config + versions
  useEffect(() => {
    const loadConfig = async () => {
      if (!configId) return;

      setIsLoadingConfig(true);
      setConfigError(null);

      try {
        if (isPersistent) {
          const [configData, versionsData] = await Promise.all([
            bronzeService.persistent.get(configId),
            bronzeService.persistent.getVersions(configId),
          ]);
          setConfig({ ...configData, type: 'persistent' });
          setVersions(versionsData?.versions || []);
        } else {
          const configData = await bronzeService.virtualized.get(configId);
          setConfig({ ...configData, type: 'virtualized' });
        }
      } catch (err) {
        setConfigError(err?.message || 'Failed to load config');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, [configId, isPersistent]);

  // Determine multi-table layout
  const isFederated = config?.enable_federated_joins;
  const tableCount = config?.tables?.length || 0;
  const isMultiTable = !isFederated && tableCount > 1;

  // Discover table groups for multi-table configs
  const loadTableGroups = useCallback(
    async (version, numTables) => {
      const count = numTables ?? tableCount;
      if (count <= 1 || !configId) return;
      try {
        const promises = Array.from({ length: count }, (_, idx) =>
          bronzeService.persistent.queryData(configId, {
            limit: 1,
            offset: 0,
            version: version ?? undefined,
            path_index: idx,
          })
        );
        const results = await Promise.allSettled(promises);
        const parsedGroups = results
          .map((r, idx) => {
            if (r.status === 'fulfilled') {
              const result = r.value;
              const firstRow = result.data?.[0];
              const tableName = firstRow?._source_table || `Table ${idx + 1}`;
              return {
                group_name: String(tableName),
                connection_name: '',
                path_index: idx,
              };
            }
            return null;
          })
          .filter(Boolean);
        setGroups(parsedGroups);
      } catch (err) {
        console.error('Failed to discover table groups:', err);
      }
    },
    [configId, tableCount]
  );

  // Load persistent data via POST with filters (works for all cases)
  const loadPersistentData = useCallback(
    async (version, overrides = {}) => {
      if (!isPersistent || !configId) return;
      setIsLoadingData(true);
      setDataError(null);
      const startTime = Date.now();
      try {
        const ps = overrides.pageSize ?? serverPageSize;
        const pg = overrides.page ?? serverPage;
        const f = overrides.filters ?? serverFilters;
        const fl = overrides.filtersLogic ?? serverFiltersLogic;
        const sb = overrides.sortBy !== undefined ? overrides.sortBy : serverSortBy;
        const so = overrides.sortOrder ?? serverSortOrder;
        // Use groups.length > 1 as the effective multi-table flag — isMultiTable reflects
        // the CURRENT config's table count, but when viewing an older version the current
        // config may have fewer tables while still having multiple groups loaded.
        const hasMultipleGroups = isMultiTable || groups.length > 1;
        const pathIdx = overrides.pathIndex !== undefined
          ? overrides.pathIndex
          : (hasMultipleGroups ? selectedGroupIndex : undefined);

        const body = {
          limit: ps,
          offset: (pg - 1) * ps,
          version: version ?? undefined,
        };
        if (pathIdx !== undefined) {
          body.path_index = pathIdx;
        }
        if (f.length > 0) {
          body.column_filters = f;
          body.column_filters_logic = fl;
        }
        if (sb) {
          body.sort_by = sb;
          body.sort_order = so;
        }

        const result = await bronzeService.persistent.queryWithFilters(configId, body);
        const cols = result.columns || [];
        const rows = result.data || [];
        setColumns(cols);
        setData(rows);
        setTotalRows(result.total_rows || result.row_count || 0);
        setDeltaVersion(result.delta_version);
        setQueryTime(Date.now() - startTime);
      } catch (err) {
        console.error('Failed to load data:', err);
        setDataError(err?.data?.detail || err.message || 'Failed to load data');
        setData([]);
        setColumns([]);
      } finally {
        setIsLoadingData(false);
      }
    },
    [configId, isPersistent, isMultiTable, groups, selectedGroupIndex, serverFilters, serverFiltersLogic, serverSortBy, serverSortOrder, serverPage, serverPageSize]
  );

  // Load virtualized data
  const loadVirtualizedData = useCallback(async () => {
    if (!isVirtualized || !configId) return;
    setIsLoadingData(true);
    setDataError(null);
    const startTime = Date.now();
    try {
      const result = await bronzeService.virtualized.query(configId, {
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
      setQueryTime(Date.now() - startTime);
    } catch (err) {
      console.error('Failed to query data:', err);
      setDataError(err.message || 'Failed to query data');
      setData([]);
      setColumns([]);
    } finally {
      setIsLoadingData(false);
    }
  }, [configId, isVirtualized]);

  // Initial data load after config is ready (run once per configId)
  const initialLoadDoneRef = useRef(null);
  useEffect(() => {
    if (!config) return;
    if (initialLoadDoneRef.current === configId) return;
    initialLoadDoneRef.current = configId;

    if (isPersistent) {
      if (isMultiTable) {
        loadTableGroups(null);
      }
      loadPersistentData(null, { pathIndex: 0 });
    } else if (isVirtualized) {
      loadVirtualizedData();
    }
  }, [config, configId, isPersistent, isVirtualized, isMultiTable, loadPersistentData, loadVirtualizedData, loadTableGroups]);

  // Handle version change — rebuild tabs from that version's config_snapshot.tables
  const handleVersionSelect = async (version) => {
    setSelectedVersion(version);
    versionDropdown.onClose();

    const versionEntry = versions.find((v) => v.version === version);
    const versionTables = versionEntry?.config_snapshot?.tables || config?.tables || [];
    const versionTableCount = versionTables.length;
    const versionIsMultiTable = !config?.enable_federated_joins && versionTableCount > 1;

    if (versionIsMultiTable) {
      await loadTableGroups(version, versionTableCount);
      const newIndex = selectedGroupIndex < versionTableCount ? selectedGroupIndex : 0;
      setSelectedGroupIndex(newIndex);
      setServerFilters([]);
      setServerSortBy(null);
      setServerSortOrder('asc');
      setServerPage(1);
      loadPersistentData(version, {
        pathIndex: newIndex,
        filters: [],
        sortBy: null,
        sortOrder: 'asc',
        page: 1,
      });
    } else {
      setGroups(versionTableCount === 1 ? [] : groups);
      setSelectedGroupIndex(0);
      setServerFilters([]);
      setServerSortBy(null);
      setServerSortOrder('asc');
      setServerPage(1);
      loadPersistentData(version, {
        filters: [],
        sortBy: null,
        sortOrder: 'asc',
        page: 1,
      });
    }
  };

  // Handle group/source tab change (reset filters for new tab)
  const handleGroupChange = (index) => {
    if (index === selectedGroupIndex) return;
    setSelectedGroupIndex(index);
    setServerFilters([]);
    setServerSortBy(null);
    setServerSortOrder('asc');
    setServerPage(1);
    loadPersistentData(selectedVersion, {
      pathIndex: index,
      filters: [],
      sortBy: null,
      sortOrder: 'asc',
      page: 1,
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    if (isPersistent) {
      loadPersistentData(selectedVersion);
    } else {
      loadVirtualizedData();
    }
  };

  // Handle server-side query changes from DataTable
  const handleQueryChange = useCallback(
    ({ filters, filtersLogic, sortBy, sortOrder, page, pageSize }) => {
      setServerFilters(filters);
      setServerFiltersLogic(filtersLogic);
      setServerSortBy(sortBy);
      setServerSortOrder(sortOrder);
      setServerPage(page);
      setServerPageSize(pageSize);
      loadPersistentData(selectedVersion, { filters, filtersLogic, sortBy, sortOrder, page, pageSize });
    },
    [selectedVersion, loadPersistentData]
  );

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

  // Current version from deltaVersion or versions list
  const currentVersion = deltaVersion ?? (versions.length > 0 ? versions[0].version : null);

  // Loading state
  if (isLoadingConfig) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading dataset...</p>
        </div>
      </DashboardLayout>
    );
  }

  // Error state
  if (configError || !config) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <AlertCircle className="w-16 h-16 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {configError || 'Dataset Not Found'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            The dataset you&apos;re looking for doesn&apos;t exist or couldn&apos;t be loaded.
          </p>
          <Link
            href="/bronze"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Bronze Layer
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
              href="/bronze"
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
                      : 'bg-amber-100 dark:bg-amber-900/30'
                  )}
                >
                  {isVirtualized ? (
                    <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                  ) : (
                    <Table2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
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
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                      )}
                    >
                      {isVirtualized ? 'Virtualized' : 'Persistent'}
                    </span>
                    {/* Version Selector for Persistent */}
                    {isPersistent && versions.length > 0 && (
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
                              ? `Current${currentVersion !== null ? ` v${currentVersion}` : ''}`
                              : selectedVersion === currentVersion
                                ? `Current v${selectedVersion}`
                                : `v${selectedVersion}`}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        }
                      >
                        {versions.map((entry) => (
                          <DropdownItem
                            key={`${entry.version}-${entry.timestamp}`}
                            onClick={() => handleVersionSelect(entry.version)}
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
                  href={`/sharing?dataset=bronze.${config.name}`}
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
                onClick={handleRefresh}
                disabled={isLoadingData}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50',
                  isVirtualized ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-amber-500 hover:bg-amber-600'
                )}
              >
                {isLoadingData ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isVirtualized ? (
                  <Play className="w-4 h-4" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                {isVirtualized ? 'Run Query' : 'Refresh'}
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
            {config.enable_federated_joins && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                Federated Joins
              </span>
            )}
            {queryTime && (
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Timer className="w-4 h-4" />
                <span>{queryTime}ms</span>
              </div>
            )}
          </div>
        </div>

        {/* Source Tabs - when multiple groups */}
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
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-zinc-800'
                )}
              >
                {group.connection_name || group.group_name}
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
              queryTime={queryTime ? queryTime / 1000 : null}
              onQueryChange={handleQueryChange}
            />
          ) : isLoadingData ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className={clsx('w-10 h-10 animate-spin mb-4', isVirtualized ? 'text-cyan-500' : 'text-amber-500')} />
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
