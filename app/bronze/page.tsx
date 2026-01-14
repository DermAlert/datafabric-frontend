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
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock bronze datasets
const MOCK_DATASETS = [
  {
    id: 'bronze_1',
    name: 'patients_raw',
    description: 'Raw patient data from all healthcare sources',
    dataType: 'structured' as const,
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
    dataType: 'structured' as const,
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
    dataType: 'images' as const,
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
    dataType: 'images' as const,
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
    dataType: 'structured' as const,
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
    dataType: 'structured' as const,
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
];

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
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

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    completed: { color: 'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2, label: 'Completed' },
    running: { color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400', icon: Loader2, label: 'Running' },
    failed: { color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400', icon: AlertCircle, label: 'Failed' },
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

export default function BronzeLayerPage() {
  const [datasets, setDatasets] = useState(MOCK_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState<typeof MOCK_DATASETS[0] | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredDatasets = datasets.filter(d => {
    const matchesSearch = 
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDeleteDataset = (id: string) => {
    setDatasets(datasets.filter(d => d.id !== id));
    if (selectedDataset?.id === id) setSelectedDataset(null);
    setMenuOpenId(null);
  };

  const stats = {
    total: datasets.length,
    running: datasets.filter(d => d.status === 'running').length,
    completed: datasets.filter(d => d.status === 'completed').length,
    failed: datasets.filter(d => d.status === 'failed').length,
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
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
            <Link
              href="/bronze/new"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Dataset
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4 text-gray-400" />
              <span className="text-gray-600 dark:text-gray-400">{stats.total} datasets</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Loader2 className="w-4 h-4 text-blue-500" />
              <span className="text-gray-600 dark:text-gray-400">{stats.running} running</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-400">{stats.completed} completed</span>
            </div>
            {stats.failed > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-red-600 dark:text-red-400">{stats.failed} failed</span>
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
                {['all', 'running', 'completed', 'failed', 'pending'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={clsx(
                      'px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize',
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
              {filteredDatasets.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
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
                          ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                              {dataset.name}
                            </span>
                            <StatusBadge status={dataset.status} />
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mb-2">
                            {dataset.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            {dataset.dataType === 'images' ? (
                              <span className="flex items-center gap-1 text-purple-500">
                                <ImageIcon className="w-3 h-3" />
                                Images + Metadata
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Table2 className="w-3 h-3" />
                                {dataset.tables.length} tables
                              </span>
                            )}
                            {dataset.relationshipCount > 0 && (
                              <span className="flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                {dataset.relationshipCount} joins
                              </span>
                            )}
                            {dataset.federatedJoins && (
                              <span className="flex items-center gap-1 text-purple-500">
                                <Zap className="w-3 h-3" />
                                Federated
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
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-amber-600 dark:text-amber-400 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View Data
                              </Link>
                              {dataset.status === 'running' ? (
                                <button 
                                  disabled
                                  className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                >
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  Running...
                                </button>
                              ) : dataset.status === 'pending' ? (
                                <button 
                                  disabled
                                  className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                >
                                  <Clock className="w-3.5 h-3.5" />
                                  Queued
                                </button>
                              ) : (
                                <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  Re-run Ingestion
                                </button>
                              )}
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
                        <StatusBadge status={selectedDataset.status} />
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedDataset.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        href={`/bronze/${selectedDataset.id}`}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                      >
                        {selectedDataset.dataType === 'images' ? (
                          <ImageIcon className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                        View Data
                      </Link>
                      {selectedDataset.status === 'running' ? (
                        <button 
                          disabled
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-500/50 cursor-not-allowed rounded-lg"
                        >
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Running...
                        </button>
                      ) : selectedDataset.status === 'pending' ? (
                        <button 
                          disabled
                          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-zinc-700 cursor-not-allowed rounded-lg"
                        >
                          <Clock className="w-4 h-4" />
                          Queued
                        </button>
                      ) : (
                        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg">
                          <RefreshCw className="w-4 h-4" />
                          Re-run Ingestion
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error message */}
                  {selectedDataset.status === 'failed' && selectedDataset.error && (
                    <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 mb-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Ingestion Failed</span>
                      </div>
                      <p className="text-sm text-red-600 dark:text-red-300 mt-1">
                        {selectedDataset.error}
                      </p>
                    </div>
                  )}

                  {/* Data Type Banner */}
                  {selectedDataset.dataType === 'images' && (
                    <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40">
                          <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-medium text-purple-900 dark:text-purple-200">Image Dataset</h4>
                          <p className="text-sm text-purple-700 dark:text-purple-300">
                            This dataset contains images with associated metadata. Click "View Data" to explore the gallery.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stats Grid */}
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
                        {selectedDataset.dataType === 'images' ? (
                          <ImageIcon className="w-3.5 h-3.5" />
                        ) : (
                          <Table2 className="w-3.5 h-3.5" />
                        )}
                        {selectedDataset.dataType === 'images' ? 'Total Items' : 'Total Rows'}
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
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6 space-y-6">
                  {/* Source Tables */}
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-gray-400" />
                      Source Tables
                      <span className="text-xs font-normal text-gray-500 ml-1">
                        ({selectedDataset.tables.length})
                      </span>
                    </h3>
                    <div className="space-y-2">
                      {selectedDataset.tables.map((table) => (
                        <div 
                          key={table.id}
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
                  </div>

                  {/* Relationships */}
                  {selectedDataset.relationshipCount > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        Relationships
                        <span className="text-xs font-normal text-gray-500 ml-1">
                          ({selectedDataset.relationshipCount})
                        </span>
                      </h3>
                      <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedDataset.relationshipCount} relationship(s) will be used for joining tables during ingestion.
                        </p>
                        <Link 
                          href={`/bronze/${selectedDataset.id}/relationships`}
                          className="inline-flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700"
                        >
                          View relationship details
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Layers className="w-16 h-16 mb-4 opacity-30" />
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

