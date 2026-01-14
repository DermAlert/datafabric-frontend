'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  Search, 
  Database,
  Play,
  Eye,
  MoreVertical,
  Pencil,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronRight,
  Sparkles,
  Zap,
  Table2,
  GitMerge,
  Filter,
  Code2,
  FileCode,
  Settings2,
  ArrowRightLeft,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

type FilterCondition = {
  column: string;
  operator: string;
  value: string;
};

// Mock silver datasets (combining Virtualized and Transform)
const MOCK_DATASETS = [
  {
    id: 'silver_1',
    name: 'patients_normalized',
    description: 'Normalized patient data with CPF formatting and gender unification',
    type: 'transform' as const,
    sourceBronzeDataset: 'patients_raw',
    columnGroups: ['sex_group', 'country_unified'],
    filterConditions: [
      { column: 'patients.status', operator: '=', value: 'active' },
      { column: 'patients.age', operator: '>=', value: '18' },
    ] as FilterCondition[],
    filterLogic: 'AND' as const,
    transformations: [
      { column: 'cpf', type: 'template', rule: 'CPF Format' },
      { column: 'name', type: 'uppercase' },
      { column: 'email', type: 'lowercase' },
    ],
    status: 'completed',
    lastExecution: '2026-01-13T09:30:00Z',
    rowCount: 125430,
    sizeBytes: 89456712,
    createdAt: '2026-01-10T14:00:00Z',
  },
  {
    id: 'silver_2',
    name: 'orders_exploration',
    description: 'Virtualized view of orders for API consumption',
    type: 'virtualized' as const,
    tables: [
      { name: 'orders', connection: 'PostgreSQL Production', columnCount: 8 },
      { name: 'order_items', connection: 'PostgreSQL Production', columnCount: 6 },
      { name: 'customers', connection: 'MySQL Analytics', columnCount: 10 },
    ],
    columnGroups: ['status_unified'],
    filterConditions: [] as FilterCondition[],
    filterLogic: 'AND' as const,
    transformations: [
      { column: 'customer_name', type: 'trim' },
    ],
    status: 'active',
    lastExecution: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-12T10:00:00Z',
  },
  {
    id: 'silver_3',
    name: 'customer_360_silver',
    description: 'Clean customer data with phone normalization',
    type: 'transform' as const,
    sourceBronzeDataset: 'customer_360',
    columnGroups: [],
    filterConditions: [
      { column: 'customers.email', operator: 'IS NOT NULL', value: '' },
      { column: 'customers.email', operator: 'LIKE', value: '%@%' },
    ] as FilterCondition[],
    filterLogic: 'AND' as const,
    transformations: [
      { column: 'phone', type: 'template', rule: 'Phone BR' },
      { column: 'cep', type: 'template', rule: 'CEP Format' },
      { column: 'name', type: 'normalize_spaces' },
    ],
    status: 'running',
    lastExecution: '2026-01-13T10:45:00Z',
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-11T16:30:00Z',
  },
  {
    id: 'silver_4',
    name: 'inventory_api',
    description: 'Real-time inventory data for external APIs',
    type: 'virtualized' as const,
    tables: [
      { name: 'inventory', connection: 'PostgreSQL Production', columnCount: 5 },
      { name: 'products', connection: 'MongoDB UserData', columnCount: 12 },
    ],
    columnGroups: [],
    filterConditions: [
      { column: 'inventory.quantity', operator: '>', value: '0' },
    ] as FilterCondition[],
    filterLogic: 'AND' as const,
    transformations: [],
    status: 'active',
    lastExecution: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-13T08:00:00Z',
  },
  {
    id: 'silver_5',
    name: 'transactions_clean',
    description: 'Transaction data with value formatting',
    type: 'transform' as const,
    sourceBronzeDataset: 'orders_unified',
    columnGroups: ['currency_unified'],
    filterConditions: [
      { column: 'transactions.status', operator: '=', value: 'completed' },
    ] as FilterCondition[],
    filterLogic: 'AND' as const,
    transformations: [
      { column: 'amount', type: 'template', rule: 'Currency BR' },
      { column: 'description', type: 'remove_accents' },
    ],
    status: 'failed',
    lastExecution: '2026-01-12T22:00:00Z',
    rowCount: 456789,
    sizeBytes: 234567890,
    createdAt: '2026-01-09T11:00:00Z',
    error: 'Invalid transformation rule: Currency BR not found',
  },
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string | null) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge = ({ status, type }: { status: string; type: 'transform' | 'virtualized' }) => {
  const config = {
    completed: { color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2, label: 'Completed' },
    running: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2, label: 'Running' },
    failed: { color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle, label: 'Failed' },
    active: { color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400', icon: Zap, label: 'Active' },
    pending: { color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock, label: 'Pending' },
  }[status] || { color: 'text-gray-600 bg-gray-100', icon: Clock, label: status };

  const Icon = config.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', config.color)}>
      <Icon className={clsx('w-3.5 h-3.5', status === 'running' && 'animate-spin')} />
      {config.label}
    </span>
  );
};

const TypeBadge = ({ type }: { type: 'transform' | 'virtualized' }) => {
  const config = type === 'transform' 
    ? { color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400', icon: Sparkles, label: 'Transform' }
    : { color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-400', icon: Zap, label: 'Virtualized' };

  const Icon = config.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium', config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default function SilverLayerPage() {
  const [datasets, setDatasets] = useState(MOCK_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<typeof MOCK_DATASETS[0] | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteDataset = (id: string) => {
    setDatasets(datasets.filter(d => d.id !== id));
    if (selectedDataset?.id === id) setSelectedDataset(null);
    setMenuOpenId(null);
  };

  const stats = {
    total: datasets.length,
    transform: datasets.filter(d => d.type === 'transform').length,
    virtualized: datasets.filter(d => d.type === 'virtualized').length,
    running: datasets.filter(d => d.status === 'running').length,
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
              <span className="text-gray-600 dark:text-gray-400">{stats.transform} transform</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-cyan-500" />
              <span className="text-gray-600 dark:text-gray-400">{stats.virtualized} virtualized</span>
            </div>
            {stats.running > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-gray-600 dark:text-gray-400">{stats.running} running</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* List Panel */}
          <div className="w-[420px] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex gap-1 p-1 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'transform', label: 'Transform', icon: Sparkles },
                    { value: 'virtualized', label: 'Virtual', icon: Zap },
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
              </div>
              <div className="flex gap-2 flex-wrap">
                {['all', 'running', 'completed', 'active', 'failed'].map((status) => (
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
              {filteredDatasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No datasets found</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredDatasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      onClick={() => setSelectedDataset(dataset)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedDataset(dataset)}
                      className={clsx(
                        "p-4 rounded-lg transition-all cursor-pointer",
                        selectedDataset?.id === dataset.id
                          ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {dataset.name}
                            </span>
                            <TypeBadge type={dataset.type} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                            {dataset.description}
                          </p>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={dataset.status} type={dataset.type} />
                            {dataset.transformations.length > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Code2 className="w-3 h-3" />
                                {dataset.transformations.length}
                              </span>
                            )}
                            {dataset.columnGroups.length > 0 && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <GitMerge className="w-3 h-3" />
                                {dataset.columnGroups.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative ml-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === dataset.id ? null : dataset.id);
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {menuOpenId === dataset.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                              <Link 
                                href={`/silver/${dataset.id}`}
                                className={clsx(
                                  "w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 font-medium",
                                  dataset.type === 'transform' 
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-cyan-600 dark:text-cyan-400"
                                )}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {dataset.type === 'transform' ? 'View Data' : 'Preview Data'}
                              </Link>
                              <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
                                <Play className="w-3.5 h-3.5" />
                                {dataset.type === 'transform' ? 'Execute' : 'Query'}
                              </button>
                              <hr className="my-1 border-gray-200 dark:border-zinc-700" />
                              <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDataset(dataset.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="flex-1 overflow-auto">
            {selectedDataset ? (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedDataset.name}
                        </h2>
                        <TypeBadge type={selectedDataset.type} />
                        <StatusBadge status={selectedDataset.status} type={selectedDataset.type} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedDataset.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/silver/${selectedDataset.id}`}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                          selectedDataset.type === 'transform'
                            ? "bg-purple-500 hover:bg-purple-600"
                            : "bg-cyan-500 hover:bg-cyan-600"
                        )}
                      >
                        <Eye className="w-4 h-4" />
                        {selectedDataset.type === 'transform' ? 'View Data' : 'Preview Data'}
                      </Link>
                      <button className={clsx(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        selectedDataset.type === 'transform'
                          ? "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                          : "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      )}>
                        <Play className="w-4 h-4" />
                        {selectedDataset.type === 'transform' ? 'Execute' : 'Run Query'}
                      </button>
                    </div>
                  </div>

                  {/* Error message */}
                  {selectedDataset.status === 'failed' && selectedDataset.error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Execution Failed</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {selectedDataset.error}
                      </p>
                    </div>
                  )}

                  {/* Stats Grid */}
                  {selectedDataset.type === 'transform' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last Execution
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formatDate(selectedDataset.lastExecution)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Table2 className="w-3.5 h-3.5" />
                          Output Rows
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {selectedDataset.rowCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Layers className="w-3.5 h-3.5" />
                          Delta Size
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formatBytes(selectedDataset.sizeBytes)}
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedDataset.type === 'virtualized' && (
                    <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
                      <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 mb-1">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-medium">Virtualized Query</span>
                      </div>
                      <p className="text-sm text-cyan-600 dark:text-cyan-300">
                        This dataset queries source data on-demand via Trino. No data is materialized.
                      </p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                  {/* Source */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      {selectedDataset.type === 'transform' ? (
                        <>
                          <Database className="w-4 h-4 text-gray-400" />
                          Source Bronze Dataset
                        </>
                      ) : (
                        <>
                          <Table2 className="w-4 h-4 text-gray-400" />
                          Source Tables
                          <span className="text-xs font-normal text-gray-500 ml-1">
                            ({selectedDataset.tables?.length || 0})
                          </span>
                        </>
                      )}
                    </h3>
                    {selectedDataset.type === 'transform' ? (
                      <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                            <Layers className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white text-sm">
                              {selectedDataset.sourceBronzeDataset}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Bronze Layer Dataset
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedDataset.tables?.map((table: { name: string; connection: string; columnCount: number }) => (
                          <div 
                            key={table.name}
                            className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Table2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 dark:text-white text-sm">
                                  {table.name}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {table.connection}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {table.columnCount} columns
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Column Transformations */}
                  {selectedDataset.transformations.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-gray-400" />
                        Column Transformations
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          ({selectedDataset.transformations.length})
                        </span>
                      </h3>
                      <div className="space-y-2">
                        {selectedDataset.transformations.map((t, i) => (
                          <div 
                            key={i}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <code className="px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 text-sm font-mono text-gray-800 dark:text-gray-200">
                                {t.column}
                              </code>
                              <ArrowRightLeft className="w-4 h-4 text-gray-400" />
                              <span className={clsx(
                                "px-2 py-1 rounded text-xs font-medium",
                                t.type === 'template' 
                                  ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                                  : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              )}>
                                {t.type.toUpperCase()}
                              </span>
                            </div>
                            {t.rule && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Rule: {t.rule}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Column Groups (Equivalence) */}
                  {selectedDataset.columnGroups.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <GitMerge className="w-4 h-4 text-gray-400" />
                        Column Groups (Equivalence)
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          ({selectedDataset.columnGroups.length})
                        </span>
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedDataset.columnGroups.map((group) => (
                          <span 
                            key={group}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-sm text-purple-700 dark:text-purple-300"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                            {group}
                          </span>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Column unification + value mappings applied from Equivalence layer
                      </p>
                    </div>
                  )}

                  {/* Filter Conditions */}
                  {selectedDataset.filterConditions.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-400" />
                        Filter Conditions
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          ({selectedDataset.filterConditions.length})
                        </span>
                      </h3>
                      <div className="p-4 rounded-lg bg-zinc-900 dark:bg-zinc-950">
                        <code className="text-sm text-green-400 font-mono">
                          WHERE {selectedDataset.filterConditions
                            .map((c: FilterCondition) => {
                              if (['IS NULL', 'IS NOT NULL'].includes(c.operator)) {
                                return `${c.column} ${c.operator}`;
                              }
                              return `${c.column} ${c.operator} '${c.value}'`;
                            })
                            .join(` ${selectedDataset.filterLogic} `)}
                        </code>
                      </div>
                    </div>
                  )}

                  {/* No transformations message */}
                  {selectedDataset.transformations.length === 0 && 
                   selectedDataset.columnGroups.length === 0 && 
                   selectedDataset.filterConditions.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">No transformations configured</p>
                      <p className="text-xs mt-1">Data is passed through without modifications</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a Dataset</h3>
                <p className="text-sm text-center max-w-md">
                  Choose a silver dataset from the list to view its transformations, column groups, and execution status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
