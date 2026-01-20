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
  ChevronRight, 
  HardDrive, 
  Layers, 
  Zap, 
  Image as ImageIcon, 
  FileText, 
  ExternalLink, 
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_DATASETS = [
  {
    id: 'bronze_1',
    name: 'patients_raw',
    description: 'Raw patient data from all healthcare sources',
    dataType: 'structured',
    type: 'persistent',
    tables: [
      { id: 1, name: 'patients', connection: 'PostgreSQL Production', columnCount: 12 },
      { id: 2, name: 'medical_records', connection: 'PostgreSQL Production', columnCount: 8 },
    ],
    relationshipCount: 2,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/patients/',
    federatedJoins: false,
    status: 'completed',
    lastIngestion: '2026-01-13T08:30:00Z',
    rowCount: 125430,
    sizeBytes: 45678912,
    createdAt: '2026-01-10T14:00:00Z',
  },
  {
    id: 'bronze_2',
    name: 'orders_unified',
    description: 'Unified orders from e-commerce and retail systems',
    dataType: 'structured',
    type: 'persistent',
    tables: [
      { id: 3, name: 'orders', connection: 'PostgreSQL Production', columnCount: 15 },
      { id: 4, name: 'transactions', connection: 'MySQL Analytics', columnCount: 10 },
      { id: 5, name: 'order_items', connection: 'PostgreSQL Production', columnCount: 6 },
    ],
    relationshipCount: 4,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/orders/',
    federatedJoins: true,
    status: 'running',
    lastIngestion: '2026-01-13T10:15:00Z',
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-11T09:30:00Z',
  },
  {
    id: 'bronze_images',
    name: 'product_catalog',
    description: 'Product images with metadata from e-commerce catalog',
    dataType: 'images',
    type: 'persistent',
    tables: [
      { id: 9, name: 'products', connection: 'S3 Product Images', columnCount: 8 },
    ],
    relationshipCount: 0,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/products/',
    federatedJoins: false,
    status: 'completed',
    lastIngestion: '2026-01-13T09:45:00Z',
    rowCount: 45678,
    sizeBytes: 156789012,
    createdAt: '2026-01-09T15:00:00Z',
  },
  {
    id: 'bronze_documents',
    name: 'document_scans',
    description: 'Scanned documents with OCR metadata',
    dataType: 'images',
    type: 'persistent',
    tables: [
      { id: 10, name: 'scans', connection: 'S3 Document Archive', columnCount: 7 },
    ],
    relationshipCount: 0,
    outputFormat: 'delta',
    outputBucket: 's3://datalake-bronze/documents/',
    federatedJoins: false,
    status: 'completed',
    lastIngestion: '2026-01-13T11:20:00Z',
    rowCount: 12456,
    sizeBytes: 789456123,
    createdAt: '2026-01-07T10:30:00Z',
  },
  {
    id: 'bronze_3',
    name: 'customer_360',
    description: 'Customer data consolidated from CRM and MongoDB',
    dataType: 'structured',
    type: 'persistent',
    tables: [
      { id: 6, name: 'customers', connection: 'PostgreSQL Production', columnCount: 20 },
      { id: 7, name: 'users', connection: 'MongoDB UserData', columnCount: 15 },
    ],
    relationshipCount: 1,
    outputFormat: 'delta',
    outputBucket: 's3://datalake-bronze/customers/',
    federatedJoins: true,
    status: 'failed',
    lastIngestion: '2026-01-12T16:45:00Z',
    rowCount: 89234,
    sizeBytes: 23456789,
    createdAt: '2026-01-08T11:00:00Z',
    error: 'Connection timeout to MongoDB UserData',
  },
  {
    id: 'bronze_4',
    name: 'inventory_snapshot',
    description: 'Daily inventory snapshots',
    dataType: 'structured',
    type: 'persistent',
    tables: [
      { id: 8, name: 'inventory', connection: 'MySQL Analytics', columnCount: 8 },
    ],
    relationshipCount: 0,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/inventory/',
    federatedJoins: false,
    status: 'pending',
    lastIngestion: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-13T09:00:00Z',
  },
  {
    id: 'bronze_virt_1',
    name: 'orders_exploration',
    description: 'Virtualized view for exploring order data via API',
    dataType: 'structured',
    type: 'virtualized',
    tables: [
      { id: 3, name: 'orders', connection: 'PostgreSQL Production', columnCount: 15 },
      { id: 4, name: 'transactions', connection: 'MySQL Analytics', columnCount: 10 },
      { id: 5, name: 'order_items', connection: 'PostgreSQL Production', columnCount: 6 },
    ],
    relationshipCount: 2,
    outputFormat: null,
    outputBucket: null,
    federatedJoins: true,
    status: 'active',
    lastIngestion: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-12T14:00:00Z',
  },
  {
    id: 'bronze_virt_2',
    name: 'inventory_realtime',
    description: 'Real-time inventory data for external APIs',
    dataType: 'structured',
    type: 'virtualized',
    tables: [
      { id: 8, name: 'inventory', connection: 'MySQL Analytics', columnCount: 8 },
    ],
    relationshipCount: 0,
    outputFormat: null,
    outputBucket: null,
    federatedJoins: false,
    status: 'active',
    lastIngestion: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-13T10:00:00Z',
  },
];

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
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

const StatusBadge = ({ status }) => {
  let config = { color: 'text-gray-600 bg-gray-100', icon: Clock, label: status };
  
  if (status === 'completed') config = { color: styles.statusCompleted, icon: CheckCircle2, label: 'Completed' };
  else if (status === 'running') config = { color: styles.statusRunning, icon: Loader2, label: 'Running' };
  else if (status === 'failed') config = { color: styles.statusFailed, icon: AlertCircle, label: 'Failed' };
  else if (status === 'pending') config = { color: styles.statusPending, icon: Clock, label: 'Pending' };
  else if (status === 'active') config = { color: styles.statusActive, icon: Zap, label: 'Active' };

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
    ? { color: styles.tagAmber, icon: Sparkles, label: 'Persistent' }
    : { color: styles.tagCyan, icon: Zap, label: 'Virtualized' };

  const Icon = config.icon;

  return (
    <span className={clsx(styles.tag, config.color)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export default function BronzeLayerPage() {
  const [datasets, setDatasets] = useState(MOCK_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesType = filterType === 'all' || d.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
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
                <Layers className={styles.icon} />
              </div>
              <div>
                <h1 className={styles.title}>Bronze Layer</h1>
                <p className={styles.subtitle}>
                  Raw data ingestion from source systems
                </p>
              </div>
            </div>
            <Link
              href="/bronze/new"
              className={styles.newButton}
            >
              <Plus className="w-4 h-4" />
              New Dataset
            </Link>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Database className={styles.statIcon} />
              <span className={styles.statText}>{stats.total} datasets</span>
            </div>
            <div className={styles.statItem}>
              <Sparkles className={clsx(styles.statIcon, styles.iconAmber)} />
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
                  <Database className={styles.emptyListIcon} />
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
                            <StatusBadge status={dataset.status} />
                            {dataset.dataType === 'images' ? (
                              <span className="flex items-center gap-1 text-xs text-purple-500">
                                <ImageIcon className="w-3 h-3" />
                                Images
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Table2 className="w-3 h-3" />
                                {dataset.tables.length}
                              </span>
                            )}
                            {dataset.relationshipCount > 0 && (
                              <span className="flex items-center gap-1 text-xs text-gray-400">
                                <Link2 className="w-3 h-3" />
                                {dataset.relationshipCount}
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
                                href={`/bronze/${dataset.id}`}
                                className={clsx(
                                  "w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 font-medium",
                                  dataset.type === 'virtualized' ? "text-cyan-600 dark:text-cyan-400" : "text-amber-600 dark:text-amber-400"
                                )}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                {dataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
                              </Link>
                              {/* ... actions ... */}
                              <hr className="my-1 border-gray-200 dark:border-zinc-700" />
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
                        <StatusBadge status={selectedDataset.status} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedDataset.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/bronze/${selectedDataset.id}`}
                        className={clsx(
                          "flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                          selectedDataset.type === 'virtualized' ? "bg-cyan-500 hover:bg-cyan-600" : "bg-purple-500 hover:bg-purple-600"
                        )}
                      >
                        {selectedDataset.dataType === 'images' ? <ImageIcon className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        {selectedDataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
                      </Link>
                    </div>
                  </div>

                  {selectedDataset.type === 'persistent' && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          Last Ingestion
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formatDate(selectedDataset.lastIngestion)}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <Table2 className="w-3.5 h-3.5" />
                          Total Rows
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {selectedDataset.rowCount.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                          <HardDrive className="w-3.5 h-3.5" />
                          Data Size
                        </div>
                        <div className="font-semibold text-gray-900 dark:text-white text-sm">
                          {formatBytes(selectedDataset.sizeBytes)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                <Layers className={styles.emptyDetailIcon} />
                <h3 className="text-lg font-medium mb-2">Select a Dataset</h3>
                <p className="text-sm text-center max-w-md">
                  Choose a bronze dataset from the list to view its configuration, source tables, and ingestion status.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}