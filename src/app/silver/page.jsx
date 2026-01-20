'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
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
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  HardDrive, 
  Layers, 
  Zap, 
  Image as ImageIcon, 
  Sparkles,
  FileCode,
  Share2,
  Code2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_DATASETS = [
  {
    id: 'silver_1',
    name: 'patients_normalized',
    description: 'Normalized patient data with CPF formatting and gender unification',
    type: 'persistent',
    sourceBronzeDataset: 'patients_raw',
    columnGroups: ['sex_group', 'country_unified'],
    filterConditions: [
      { column: 'patients.status', operator: '=', value: 'active' },
      { column: 'patients.age', operator: '>=', value: '18' },
    ],
    filterLogic: 'AND',
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
    type: 'virtualized',
    tables: [
      { name: 'orders', connection: 'PostgreSQL Production', columnCount: 8 },
      { name: 'order_items', connection: 'PostgreSQL Production', columnCount: 6 },
      { name: 'customers', connection: 'MySQL Analytics', columnCount: 10 },
    ],
    columnGroups: ['status_unified'],
    filterConditions: [],
    filterLogic: 'AND',
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
    type: 'persistent',
    sourceBronzeDataset: 'customer_360',
    columnGroups: [],
    filterConditions: [
      { column: 'customers.email', operator: 'IS NOT NULL', value: '' },
      { column: 'customers.email', operator: 'LIKE', value: '%@%' },
    ],
    filterLogic: 'AND',
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
    type: 'virtualized',
    tables: [
      { name: 'inventory', connection: 'PostgreSQL Production', columnCount: 5 },
      { name: 'products', connection: 'MongoDB UserData', columnCount: 12 },
    ],
    columnGroups: [],
    filterConditions: [
      { column: 'inventory.quantity', operator: '>', value: '0' },
    ],
    filterLogic: 'AND',
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
    type: 'persistent',
    sourceBronzeDataset: 'orders_unified',
    columnGroups: ['currency_unified'],
    filterConditions: [
      { column: 'transactions.status', operator: '=', value: 'completed' },
    ],
    filterLogic: 'AND',
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

const formatBytes = (bytes) => {
  if (bytes === 0) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const StatusBadge = ({ status, type }) => {
  let config = { color: 'text-gray-600 bg-gray-100', icon: Clock, label: status };

  if (status === 'completed') config = { color: styles.statusCompleted, icon: CheckCircle2, label: 'Completed' };
  else if (status === 'running') config = { color: styles.statusRunning, icon: Loader2, label: 'Running' };
  else if (status === 'failed') config = { color: styles.statusFailed, icon: AlertCircle, label: 'Failed' };
  else if (status === 'active') config = { color: styles.statusActive, icon: Zap, label: 'Active' };
  else if (status === 'pending') config = { color: styles.statusPending, icon: Clock, label: 'Pending' };

  const Icon = config.icon;

  return (
    <span className={clsx(styles.itemStatus, config.color)}>
      <Icon className={clsx("w-3.5 h-3.5", status === 'running' && "animate-spin")} />
      {config.label}
    </span>
  );
};

const TypeBadge = ({ type }) => {
  const config = type === 'persistent' 
    ? { color: styles.tagPurple, icon: Sparkles, label: 'Persistent' }
    : { color: styles.tagCyan, icon: Zap, label: 'Virtualized' };

  const Icon = config.icon;

  return (
    <span className={clsx(styles.tag, config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default function SilverLayerPage() {
  const [datasets, setDatasets] = useState(MOCK_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || d.type === filterType;
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteDataset = (id) => {
    setDatasets(datasets.filter(d => d.id !== id));
    if (selectedDataset?.id === id) setSelectedDataset(null);
    setMenuOpenId(null);
  };

  const stats = {
    total: datasets.length,
    persistent: datasets.filter(d => d.type === 'persistent').length,
    virtualized: datasets.filter(d => d.type === 'virtualized').length,
    running: datasets.filter(d => d.status === 'running').length,
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <div className={styles.iconBox}>
                <Sparkles className={styles.icon} />
              </div>
              <div>
                <h1 className={styles.title}>Silver Layer</h1>
                <p className={styles.subtitle}>
                  Data transformation and normalization
                </p>
              </div>
            </div>
            <div className={styles.actions}>
              <Link
                href="/silver/rules"
                className={styles.rulesButton}
              >
                <FileCode className="w-4 h-4" />
                Rules
              </Link>
              <Link
                href="/silver/new"
                className={styles.newButton}
              >
                <Plus className="w-4 h-4" />
                New Dataset
              </Link>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Database className={styles.statIcon} />
              <span className={styles.statText}>{stats.total} datasets</span>
            </div>
            <div className={styles.statItem}>
              <Sparkles className={clsx(styles.statIcon, styles.iconPurple)} />
              <span className={styles.statText}>{stats.persistent} persistent</span>
            </div>
            <div className={styles.statItem}>
              <Zap className={clsx(styles.statIcon, styles.iconCyan)} />
              <span className={styles.statText}>{stats.virtualized} virtualized</span>
            </div>
            {stats.running > 0 && (
              <div className={styles.statItem}>
                <Loader2 className={clsx(styles.statIcon, styles.iconBlue, "animate-spin")} />
                <span className={styles.statText}>{stats.running} running</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <div className={styles.filters}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input 
                  type="text"
                  placeholder="Search datasets..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
              <div className={styles.typeFilter}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'persistent', label: 'Persistent', icon: Sparkles },
                  { value: 'virtualized', label: 'Virtualized', icon: Zap },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilterType(value)}
                    className={clsx(
                      styles.typeBtn,
                      filterType === value && styles.typeBtnActive
                    )}
                  >
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.statusFilter}>
                {['all', 'running', 'completed', 'active', 'failed', 'pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={clsx(
                      styles.statusBtn,
                      filterStatus === status && styles.statusBtnActive
                    )}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.list}>
              {filteredDatasets.length === 0 ? (
                <div className={styles.emptyList}>
                  <Sparkles className={styles.emptyListIcon} />
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
                        styles.item,
                        selectedDataset?.id === dataset.id && styles.itemActive
                      )}
                    >
                      <div className={styles.itemHeader}>
                        <div className={styles.itemMeta}>
                          <div className={styles.itemTitleRow}>
                            <span className={styles.itemName}>
                              {dataset.name}
                            </span>
                            <TypeBadge type={dataset.type} />
                          </div>
                          <p className={styles.itemDesc}>
                            {dataset.description}
                          </p>
                          <div className={styles.itemStats}>
                            <StatusBadge status={dataset.status} type={dataset.type} />
                            {dataset.transformations.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Code2 className="w-3 h-3" />
                                {dataset.transformations.length}
                              </span>
                            )}
                            {dataset.columnGroups.length > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Layers className="w-3 h-3" />
                                {dataset.columnGroups.length}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.menuWrapper}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === dataset.id ? null : dataset.id);
                            }}
                            className={styles.menuButton}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {menuOpenId === dataset.id && (
                            <div className={styles.contextMenu}>
                              <Link 
                                href={`/silver/${dataset.id}`}
                                className={clsx(
                                  styles.menuItem,
                                  styles.menuItemLink,
                                  dataset.type === 'virtualized' ? styles.menuItemLinkCyan : styles.menuItemLinkAmber
                                )}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {dataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
                              </Link>
                              
                              {dataset.status === 'running' ? (
                                <button className={clsx(styles.menuItem, styles.menuItemDisabled)} disabled>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Running...
                                </button>
                              ) : dataset.status === 'pending' ? (
                                <button className={clsx(styles.menuItem, styles.menuItemDisabled)} disabled>
                                  <Clock className="w-3.5 h-3.5" />
                                  Queued
                                </button>
                              ) : (
                                <button className={styles.menuItem}>
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Re-run Ingestion
                                </button>
                              )}
                              
                              <div className={styles.menuDivider} />
                              
                              <button className={styles.menuItem}>
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteDataset(dataset.id);
                                }}
                                className={clsx(styles.menuItem, styles.menuItemDelete)}
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

          <div className={styles.detailPanel}>
            {selectedDataset ? (
              <div className="h-full flex flex-col">
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
                          selectedDataset.type === 'virtualized'
                            ? "bg-cyan-500 hover:bg-cyan-600"
                            : "bg-purple-500 hover:bg-purple-600"
                        )}
                      >
                        <Eye className="w-4 h-4" />
                        {selectedDataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
                      </Link>
                      <button className={clsx(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                        selectedDataset.type === 'persistent'
                          ? "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                          : "text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700"
                      )}>
                        <Play className="w-4 h-4" />
                        {selectedDataset.type === 'persistent' ? 'Execute' : 'Run Query'}
                      </button>
                    </div>
                  </div>

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

                  {selectedDataset.type === 'persistent' && (
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
                          <HardDrive className="w-3.5 h-3.5" />
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
                        This dataset queries source data on-demand. No data is materialized.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-auto p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      {selectedDataset.type === 'persistent' ? (
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
                    {selectedDataset.type === 'persistent' ? (
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
                        {selectedDataset.tables?.map((table) => (
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
                            .map((c) => {
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
                              <ChevronRight className="w-4 h-4 text-gray-400" />
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
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                <Sparkles className={styles.emptyDetailIcon} />
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