'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
import { DropdownMenu, DropdownItem, DropdownDivider } from '@/components/ui';

// ===========================================
// Data Table Component
// ===========================================

const DataTable = ({ columns, data }) => {
  if (!columns || columns.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p>No columns to display</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              {columns.map((col) => (
                <td key={col} className="px-4 py-3 text-sm whitespace-nowrap">
                  {typeof row[col] === 'boolean' ? (
                    <span
                      className={clsx(
                        'px-2 py-0.5 rounded-full text-xs font-medium',
                        row[col]
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      )}
                    >
                      {row[col] ? 'true' : 'false'}
                    </span>
                  ) : row[col] === null || row[col] === undefined ? (
                    <span className="text-gray-400 dark:text-gray-500 italic">null</span>
                  ) : typeof row[col] === 'object' ? (
                    <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
                      {JSON.stringify(row[col])}
                    </code>
                  ) : (
                    <span className="text-gray-900 dark:text-white">{String(row[col])}</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===========================================
// Virtualized Preview Component
// ===========================================

const VirtualizedPreview = ({ configId, isLoading, data, columns, queryTime, onRefresh, error }) => {
  return (
    <div className="space-y-4">
      {/* Virtualized Info Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40">
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-cyan-900 dark:text-cyan-200 flex items-center gap-2">
              Live Query Preview
            </h4>
            <p className="text-sm text-cyan-700 dark:text-cyan-300 mt-1">
              This is a virtualized dataset. Data is queried on-demand from source systems — no data
              is stored in this layer.
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-400 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh Query
          </button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Query Failed</span>
          </div>
          <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Query Stats */}
      {!error && data && (
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Timer className="w-4 h-4" />
            <span>
              Query time:{' '}
              <strong className="text-gray-900 dark:text-white">
                {queryTime ? `${(queryTime * 1000).toFixed(0)}ms` : '—'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Rows3 className="w-4 h-4" />
            <span>
              Rows:{' '}
              <strong className="text-gray-900 dark:text-white">
                {data.length.toLocaleString()}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Info className="w-4 h-4" />
            <span className="text-xs">Limited preview</span>
          </div>
        </div>
      )}

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Executing query...</p>
        </div>
      ) : !error && data && columns ? (
        <DataTable columns={columns} data={data} />
      ) : null}
    </div>
  );
};

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

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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

  // Load data for persistent configs
  const loadPersistentData = useCallback(
    async (version) => {
      if (!isPersistent) return;
      setIsLoadingData(true);
      setDataError(null);
      try {
        const result = await silverService.persistent.queryData(datasetId, {
          limit: 1000,
          offset: 0,
          version: version,
        });
        setColumns(result.columns || []);
        setData(result.data || []);
        setTotalRows(result.total_rows || result.row_count || 0);
        setQueryTime(result.execution_time_seconds);
      } catch (err) {
        console.error('Failed to load data:', err);
        setDataError(err.message || 'Failed to load data');
        setData([]);
        setColumns([]);
      } finally {
        setIsLoadingData(false);
      }
    },
    [datasetId, isPersistent]
  );

  // Load data when selectedVersion changes
  useEffect(() => {
    if (isPersistent && selectedVersion !== null && config) {
      loadPersistentData(selectedVersion);
    }
  }, [selectedVersion, isPersistent, config, loadPersistentData]);

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
      setColumns(result.columns || []);
      setData(result.data || []);
      setTotalRows(result.total_rows || result.row_count || 0);
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

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!data) return [];
    if (!searchQuery) return data;

    return data.filter((row) =>
      Object.values(row).some((value) =>
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [data, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

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
                            <GitCommit className="w-3 h-3" />v{selectedVersion}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        }
                      >
                        {versionHistory.map((entry) => (
                          <DropdownItem
                            key={entry.version}
                            onClick={() => {
                              setSelectedVersion(entry.version);
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
                                  'bg-purple-100 dark:bg-purple-900/30 text-purple-600'
                              )}
                            >
                              {entry.operation}
                            </span>
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

          {/* Stats - only for Persistent */}
          {isPersistent && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Rows3 className="w-4 h-4" />
                <span>{totalRows.toLocaleString()} rows</span>
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
          )}
        </div>

        {/* Toolbar - only for Persistent */}
        {isPersistent && (
          <div className="px-6 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search data..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-10 pr-4 py-2 w-72 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            <button className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-gray-400">
              <Table2 className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isVirtualized ? (
            <VirtualizedPreview
              configId={datasetId}
              isLoading={isLoadingData}
              data={data}
              columns={columns}
              queryTime={queryTime}
              onRefresh={queryVirtualizedData}
              error={dataError}
            />
          ) : (
            <>
              {dataError ? (
                <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Failed to load data</span>
                  </div>
                  <p className="mt-2 text-sm text-red-600 dark:text-red-300">{dataError}</p>
                </div>
              ) : isLoadingData ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-10 h-10 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
                </div>
              ) : filteredData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">No results found</p>
                  <p className="text-sm">
                    {data?.length === 0
                      ? 'No data available. Try executing the transformation first.'
                      : 'Try adjusting your search query'}
                  </p>
                </div>
              ) : (
                <DataTable columns={columns} data={paginatedData} />
              )}
            </>
          )}
        </div>

        {/* Pagination - only for Persistent */}
        {isPersistent && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
              {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}{' '}
              items
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                          currentPage === page
                            ? 'bg-purple-500 text-white'
                            : 'hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
