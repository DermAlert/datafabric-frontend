'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, 
  Table2, 
  Image as ImageIcon,
  Grid3X3,
  List,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  HardDrive,
  Rows3,
  Maximize2,
  X,
  ExternalLink,
  Copy,
  Check,
  Eye,
  RefreshCw,
  Layers,
  Sparkles,
  Zap,
  Loader2,
  Timer,
  Info,
  Code2,
  Play,
  Share2,
  AlertCircle,
  GitCommit
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { bronzeService } from '@/lib/api/services/bronze';
import { formatBytes, formatDate } from '@/lib/utils';

// Table Component
const DataTable = ({ columns, data }) => {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            {columns.map(col => (
              <th 
                key={col}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
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
              {columns.map(col => (
                <td key={col} className="px-4 py-3 text-sm">
                  <span className="text-gray-900 dark:text-white">
                    {row[col] !== null && row[col] !== undefined ? String(row[col]) : '-'}
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// Virtualized Query Preview Component
const VirtualizedPreview = ({ 
  config,
  data,
  columns,
  rowCount,
  totalRows,
  isLoading, 
  queryTime,
  onRefresh 
}) => {
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
              This is a virtualized dataset. Data is queried on-demand from source systems — no data is stored in this layer.
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

      {/* Query Stats */}
      <div className="flex items-center gap-4 text-sm">
        {queryTime !== null && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Timer className="w-4 h-4" />
            <span>Query time: <strong className="text-gray-900 dark:text-white">{queryTime}ms</strong></span>
          </div>
        )}
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Rows3 className="w-4 h-4" />
          <span>Rows: <strong className="text-gray-900 dark:text-white">{rowCount}</strong></span>
        </div>
        {totalRows && (
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <Info className="w-4 h-4" />
            <span className="text-xs">Total available: {totalRows.toLocaleString()} rows</span>
          </div>
        )}
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Executing query...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Table2 className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
};

// Persistent Data View Component  
const PersistentDataView = ({
  config,
  data,
  columns,
  rowCount,
  totalRows,
  deltaVersion,
  isLoading,
  currentPage,
  itemsPerPage,
  onPageChange,
  onVersionChange,
  selectedVersion,
  versions,
  onRefresh
}) => {
  return (
    <div className="space-y-4">
      {/* Version Selector */}
      {versions && versions.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40">
                <GitCommit className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h4 className="font-medium text-amber-900 dark:text-amber-200">Delta Lake Version</h4>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  Current version: v{deltaVersion ?? 0}. Use time travel to query historical data.
                </p>
              </div>
            </div>
            <select
              value={selectedVersion ?? ''}
              onChange={(e) => onVersionChange(e.target.value ? Number(e.target.value) : null)}
              className="px-3 py-2 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-800 text-sm font-medium"
            >
              <option value="">Current (v{deltaVersion ?? 0})</option>
              {versions.map((v) => (
                <option key={v.version} value={v.version}>
                  v{v.version} - {v.operation} ({formatDate(v.timestamp)})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Rows3 className="w-4 h-4" />
          <span>Showing: <strong className="text-gray-900 dark:text-white">{rowCount}</strong> rows</span>
        </div>
        {totalRows && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <span>Total: <strong className="text-gray-900 dark:text-white">{totalRows.toLocaleString()}</strong></span>
          </div>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
        >
          <RefreshCw className={clsx("w-4 h-4", isLoading && "animate-spin")} />
          Refresh
        </button>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading data...</p>
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Table2 className="w-10 h-10 text-gray-300 dark:text-zinc-600 mb-4" />
          <p className="text-gray-600 dark:text-gray-400">No data available. Run an ingestion first.</p>
        </div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}

      {/* Pagination */}
      {totalRows && totalRows > itemsPerPage && (
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-zinc-700">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {currentPage} of {Math.ceil(totalRows / itemsPerPage)}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1 || isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalRows / itemsPerPage) || isLoading}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params.id;

  // Parse ID: format is "p_123" for persistent or "v_123" for virtualized
  const configType = rawId?.startsWith('v_') ? 'virtualized' : 'persistent';
  const configId = rawId ? parseInt(rawId.replace(/^[pv]_/, ''), 10) : null;

  const [config, setConfig] = useState(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [configError, setConfigError] = useState(null);

  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [totalRows, setTotalRows] = useState(null);
  const [deltaVersion, setDeltaVersion] = useState(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [queryTime, setQueryTime] = useState(null);

  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 100;

  // Load config
  useEffect(() => {
    const loadConfig = async () => {
      if (!configId) return;
      
      setIsLoadingConfig(true);
      setConfigError(null);
      
      try {
        const configData = configType === 'persistent'
          ? await bronzeService.persistent.get(configId)
          : await bronzeService.virtualized.get(configId);
        
        setConfig({ ...configData, type: configType });
        
        // Load versions for persistent configs
        if (configType === 'persistent') {
          try {
            const versionsData = await bronzeService.persistent.getVersions(configId);
            setVersions(versionsData?.versions || []);
          } catch (err) {
            console.error('Failed to load versions:', err);
          }
        }
      } catch (err) {
        setConfigError(err?.message || 'Failed to load config');
      } finally {
        setIsLoadingConfig(false);
      }
    };

    loadConfig();
  }, [configId, configType]);

  // Load data
  const loadData = useCallback(async (page = 1, version = null) => {
    if (!configId) return;
    
    setIsLoadingData(true);
    const startTime = Date.now();
    
    try {
      if (configType === 'persistent') {
        const result = await bronzeService.persistent.queryData(configId, {
          limit: itemsPerPage,
          offset: (page - 1) * itemsPerPage,
          version: version ?? undefined,
        });
        
        setColumns(result.columns || []);
        setData(result.data || []);
        setRowCount(result.row_count || 0);
        setTotalRows(result.total_rows);
        setDeltaVersion(result.delta_version);
      } else {
        const result = await bronzeService.virtualized.query(configId, {
          limit: itemsPerPage,
          offset: (page - 1) * itemsPerPage,
        });
        
        // Virtualized response has groups array with columns and data per group
        // Flatten data from all groups
        if (result.groups && result.groups.length > 0) {
          // Get columns from first group
          const firstGroup = result.groups[0];
          setColumns(firstGroup.columns || []);
          
          // Combine data from all groups
          const allData = result.groups.flatMap(g => g.data || []);
          setData(allData);
          setRowCount(allData.length);
        } else {
          // Fallback for flat response format
          setColumns(result.columns || []);
          setData(result.data || []);
          setRowCount(result.row_count || 0);
        }
        setTotalRows(result.total_rows);
      }
      
      setQueryTime(Date.now() - startTime);
    } catch (err) {
      console.error('Failed to load data:', err);
      setData([]);
      setColumns([]);
      setRowCount(0);
    } finally {
      setIsLoadingData(false);
    }
  }, [configId, configType, itemsPerPage]);

  // Initial data load
  useEffect(() => {
    if (config) {
      loadData(1, null);
    }
  }, [config, loadData]);

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    loadData(newPage, selectedVersion);
  };

  const handleVersionChange = (version) => {
    setSelectedVersion(version);
    setCurrentPage(1);
    loadData(1, version);
  };

  const handleRefresh = () => {
    loadData(currentPage, selectedVersion);
  };

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
            The dataset you're looking for doesn't exist or couldn't be loaded.
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

  const isVirtualized = config.type === 'virtualized';

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
                <div className={clsx(
                  "p-2 rounded-lg",
                  isVirtualized
                    ? "bg-cyan-100 dark:bg-cyan-900/30"
                    : "bg-amber-100 dark:bg-amber-900/30"
                )}>
                  {isVirtualized
                    ? <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    : <Table2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  }
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{config.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {config.description || 'No description'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isVirtualized && (
                <Link
                  href={`/sharing?dataset=bronze.${config.name}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-violet-700 dark:text-violet-300 bg-violet-100 dark:bg-violet-900/30 hover:bg-violet-200 dark:hover:bg-violet-900/50 rounded-lg transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Link>
              )}
              {!isVirtualized && (
                <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
            </div>
          </div>

          {/* Type Badge */}
          <div className="flex items-center gap-2 text-sm">
            <span className={clsx(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
              isVirtualized
                ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400"
                : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
            )}>
              {isVirtualized ? (
                <>
                  <Zap className="w-3 h-3" />
                  Virtualized Query
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3" />
                  Persistent (Delta Lake)
                </>
              )}
            </span>
            {config.enable_federated_joins && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                Federated Joins
              </span>
            )}
            <span className="text-gray-500 dark:text-gray-400">
              {config.tables?.length || 0} tables
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {isVirtualized ? (
            <VirtualizedPreview 
              config={config}
              data={data}
              columns={columns}
              rowCount={rowCount}
              totalRows={totalRows}
              isLoading={isLoadingData} 
              queryTime={queryTime}
              onRefresh={handleRefresh} 
            />
          ) : (
            <PersistentDataView
              config={config}
              data={data}
              columns={columns}
              rowCount={rowCount}
              totalRows={totalRows}
              deltaVersion={deltaVersion}
              isLoading={isLoadingData}
              currentPage={currentPage}
              itemsPerPage={itemsPerPage}
              onPageChange={handlePageChange}
              onVersionChange={handleVersionChange}
              selectedVersion={selectedVersion}
              versions={versions}
              onRefresh={handleRefresh}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
