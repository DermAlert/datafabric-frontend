'use client';

import React, { useState, useCallback, memo } from 'react';
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
  AlertTriangle,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useDisclosure } from '@/hooks';
import { StatusBadge, TypeBadge, VersionBadge, DropdownMenu, DropdownItem, DropdownDivider, EmptyState } from '@/components/ui';
import { SearchInput } from '@/components/ui/Input';
import { formatBytes, formatDate } from '@/lib/utils';

// ===========================================
// Mock Data - Em produção, viria de uma API
// ===========================================

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
    version: 12,
    versionHistory: [
      {
        version: 12,
        timestamp: '2026-01-13T08:30:00Z',
        operation: 'MERGE',
        rowsAffected: 1523,
        config: {
          tables: [
            { id: 1, name: 'patients', connection: 'PostgreSQL Production', columnCount: 12 },
            { id: 2, name: 'medical_records', connection: 'PostgreSQL Production', columnCount: 8 },
          ],
          relationshipCount: 2,
          outputFormat: 'parquet',
          outputBucket: 's3://datalake-bronze/patients/',
          federatedJoins: false,
          rowCount: 125430,
          sizeBytes: 45678912,
        },
      },
      {
        version: 11,
        timestamp: '2026-01-12T08:30:00Z',
        operation: 'MERGE',
        rowsAffected: 2341,
        config: {
          tables: [
            { id: 1, name: 'patients', connection: 'PostgreSQL Production', columnCount: 12 },
            { id: 2, name: 'medical_records', connection: 'PostgreSQL Production', columnCount: 8 },
          ],
          relationshipCount: 2,
          outputFormat: 'parquet',
          outputBucket: 's3://datalake-bronze/patients/',
          federatedJoins: false,
          rowCount: 123907,
          sizeBytes: 44123456,
        },
      },
    ],
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
    version: 7,
    versionHistory: [
      {
        version: 6,
        timestamp: '2026-01-12T10:15:00Z',
        operation: 'MERGE',
        rowsAffected: 8921,
        config: {
          tables: [
            { id: 3, name: 'orders', connection: 'PostgreSQL Production', columnCount: 15 },
            { id: 4, name: 'transactions', connection: 'MySQL Analytics', columnCount: 10 },
            { id: 5, name: 'order_items', connection: 'PostgreSQL Production', columnCount: 6 },
          ],
          relationshipCount: 4,
          outputFormat: 'parquet',
          outputBucket: 's3://datalake-bronze/orders/',
          federatedJoins: true,
          rowCount: 133921,
          sizeBytes: 89456123,
        },
      },
    ],
  },
  {
    id: 'bronze_images',
    name: 'product_catalog',
    description: 'Product images with metadata from e-commerce catalog',
    dataType: 'images',
    type: 'persistent',
    tables: [{ id: 9, name: 'products', connection: 'S3 Product Images', columnCount: 8 }],
    relationshipCount: 0,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/products/',
    federatedJoins: false,
    status: 'completed',
    lastIngestion: '2026-01-13T09:45:00Z',
    rowCount: 45678,
    sizeBytes: 156789012,
    createdAt: '2026-01-09T15:00:00Z',
    version: 23,
    versionHistory: [],
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
    version: 8,
    versionHistory: [],
  },
  {
    id: 'bronze_4',
    name: 'inventory_snapshot',
    description: 'Daily inventory snapshots',
    dataType: 'structured',
    type: 'persistent',
    tables: [{ id: 8, name: 'inventory', connection: 'MySQL Analytics', columnCount: 8 }],
    relationshipCount: 0,
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/inventory/',
    federatedJoins: false,
    status: 'pending',
    lastIngestion: null,
    rowCount: 0,
    sizeBytes: 0,
    createdAt: '2026-01-13T09:00:00Z',
    version: 0,
    versionHistory: [],
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
];

// ===========================================
// Dataset List Item Component
// ===========================================

const DatasetListItem = memo(function DatasetListItem({
  dataset,
  isSelected,
  onSelect,
  onDelete,
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
            {dataset.description}
          </p>
          <div className="flex items-center gap-3">
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
            href={`/bronze/${dataset.id}`}
          >
            {dataset.type === 'virtualized' ? 'Preview Data' : 'View Data'}
          </DropdownItem>
          {dataset.status !== 'running' && dataset.status !== 'pending' && (
            <DropdownItem icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Re-run Ingestion
            </DropdownItem>
          )}
          <DropdownDivider />
          <DropdownItem icon={<Pencil className="w-3.5 h-3.5" />}>Edit</DropdownItem>
          <DropdownItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(dataset.id);
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
  selectedVersion,
  onSelectVersion,
}) {
  if (!dataset.versionHistory || dataset.versionHistory.length === 0) {
    return null;
  }

  return (
    <div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <History className="w-4 h-4 text-gray-400" />
        Version History
        <span className="text-xs font-normal text-gray-500 ml-1">(Delta Lake)</span>
      </h3>
      <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
        <div className="divide-y divide-gray-100 dark:divide-zinc-700">
          {dataset.versionHistory.slice(0, 5).map((entry) => (
            <button
              key={entry.version}
              onClick={() =>
                onSelectVersion(entry.version === selectedVersion ? null : entry.version)
              }
              className={clsx(
                'w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-700/50',
                entry.version === selectedVersion && 'bg-amber-50/50 dark:bg-amber-900/10'
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
                    entry.operation === 'WRITE' &&
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
                    entry.operation === 'MERGE' &&
                      'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
                    entry.operation === 'DELETE' &&
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                  )}
                >
                  {entry.operation}
                </span>
                {entry.error && (
                  <span className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="w-3 h-3" />
                    Failed
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span>{entry.rowsAffected.toLocaleString()} rows</span>
                <span>{formatDate(entry.timestamp)}</span>
              </div>
            </button>
          ))}
        </div>
        {dataset.versionHistory.length > 5 && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-700">
            <button className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 font-medium flex items-center gap-1">
              View all {dataset.versionHistory.length} versions
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
        <GitCommit className="w-3 h-3" />
        Time travel available: query any version using{' '}
        <code className="px-1 py-0.5 bg-gray-100 dark:bg-zinc-800 rounded text-xs">
          VERSION AS OF {dataset.version}
        </code>
      </p>
    </div>
  );
});

// ===========================================
// Detail Panel Component
// ===========================================

const DetailPanel = memo(function DetailPanel({
  dataset,
  selectedVersion,
  onSelectVersion,
}) {
  const versionDropdown = useDisclosure();

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

  const getVersionConfig = () => {
    if (selectedVersion === null || selectedVersion === dataset.version) {
      return null;
    }
    const versionEntry = dataset.versionHistory?.find((v) => v.version === selectedVersion);
    return versionEntry?.config || null;
  };

  const viewingVersion = getVersionConfig();
  const isViewingOldVersion = selectedVersion !== null && selectedVersion !== dataset.version;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {/* Version Warning Banner */}
        {isViewingOldVersion && (
          <div className="mb-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <History className="w-4 h-4" />
              <span className="text-sm font-medium">
                Viewing configuration from version {selectedVersion}
              </span>
            </div>
            <button
              onClick={() => onSelectVersion(null)}
              className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded"
            >
              <RotateCcw className="w-3 h-3" />
              Back to current
            </button>
          </div>
        )}

        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{dataset.name}</h2>
              <TypeBadge type={dataset.type} />
              <StatusBadge status={dataset.status} />

              {/* Version Selector */}
              {dataset.type === 'persistent' &&
                dataset.versionHistory &&
                dataset.versionHistory.length > 0 && (
                  <DropdownMenu
                    isOpen={versionDropdown.isOpen}
                    onClose={versionDropdown.onClose}
                    trigger={
                      <button
                        onClick={versionDropdown.onToggle}
                        className={clsx(
                          'inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono border transition-colors',
                          isViewingOldVersion
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                        )}
                      >
                        <GitCommit className="w-3 h-3" />
                        v{selectedVersion ?? dataset.version}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    }
                  >
                    <DropdownItem
                      onClick={() => {
                        onSelectVersion(null);
                        versionDropdown.onClose();
                      }}
                    >
                      <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        v{dataset.version}
                      </span>
                      <span className="ml-2">Current</span>
                    </DropdownItem>
                    <DropdownDivider />
                    {dataset.versionHistory.map((entry) => (
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
                  </DropdownMenu>
                )}
            </div>
            <p className="text-gray-500 dark:text-gray-400">{dataset.description}</p>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/bronze/${dataset.id}`}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors',
                dataset.type === 'virtualized'
                  ? 'bg-cyan-500 hover:bg-cyan-600'
                  : 'bg-purple-500 hover:bg-purple-600'
              )}
            >
              {dataset.dataType === 'images' ? (
                <ImageIcon className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
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
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">
                <RefreshCw className="w-4 h-4" />
                Re-run
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
          <div className="grid grid-cols-3 gap-4">
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <Clock className="w-3.5 h-3.5" />
                {isViewingOldVersion ? 'Version Date' : 'Last Ingestion'}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatDate(
                  isViewingOldVersion
                    ? dataset.versionHistory?.find((v) => v.version === selectedVersion)
                        ?.timestamp || null
                    : dataset.lastIngestion
                )}
              </div>
            </div>
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                {dataset.dataType === 'images' ? (
                  <ImageIcon className="w-3.5 h-3.5" />
                ) : (
                  <Table2 className="w-3.5 h-3.5" />
                )}
                {dataset.dataType === 'images' ? 'Total Items' : 'Total Rows'}
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {(viewingVersion?.rowCount ?? dataset.rowCount).toLocaleString()}
              </div>
            </div>
            <div
              className={clsx(
                'p-4 rounded-lg',
                isViewingOldVersion
                  ? 'bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50'
                  : 'bg-gray-50 dark:bg-zinc-800'
              )}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                <HardDrive className="w-3.5 h-3.5" />
                Data Size
              </div>
              <div className="font-semibold text-gray-900 dark:text-white text-sm">
                {formatBytes(viewingVersion?.sizeBytes ?? dataset.sizeBytes)}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Source Tables */}
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
            <Table2 className="w-4 h-4 text-gray-400" />
            Source Tables
            <span className="text-xs font-normal text-gray-500 ml-1">
              ({(viewingVersion?.tables ?? dataset.tables).length})
            </span>
          </h3>
          <div className="space-y-2">
            {(viewingVersion?.tables ?? dataset.tables).map((table) => (
              <div
                key={table.id}
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
                      {table.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {table.connection}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">{table.columnCount} columns</div>
              </div>
            ))}
          </div>
        </div>

        {/* Relationships */}
        {(viewingVersion?.relationshipCount ?? dataset.relationshipCount) > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-gray-400" />
              Relationships
              <span className="text-xs font-normal text-gray-500 ml-1">
                ({viewingVersion?.relationshipCount ?? dataset.relationshipCount})
              </span>
            </h3>
            <div className="p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {dataset.relationshipCount} relationship(s) will be used for joining tables during
                ingestion.
              </p>
              <Link
                href={`/bronze/${dataset.id}/relationships`}
                className="inline-flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700"
              >
                View relationship details
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Version History */}
        <VersionHistory
          dataset={dataset}
          selectedVersion={selectedVersion}
          onSelectVersion={onSelectVersion}
        />
      </div>
    </div>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function BronzeLayerPage() {
  const [datasets, setDatasets] = useState(MOCK_DATASETS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [selectedVersion, setSelectedVersion] = useState(null);

  // Handlers
  const handleSelectDataset = useCallback((dataset) => {
    setSelectedDataset(dataset);
    setSelectedVersion(null);
  }, []);

  const handleDeleteDataset = useCallback((id) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      setDatasets((prev) => prev.filter((d) => d.id !== id));
      setSelectedDataset((prev) => (prev?.id === id ? null : prev));
    }
  }, []);

  // Filtered datasets
  const filteredDatasets = datasets.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    const matchesType = filterType === 'all' || d.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: datasets.length,
    persistent: datasets.filter((d) => d.type === 'persistent').length,
    virtualized: datasets.filter((d) => d.type === 'virtualized').length,
    running: datasets.filter((d) => d.status === 'running').length,
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
              {filteredDatasets.length === 0 ? (
                <EmptyState
                  icon={<Database className="w-12 h-12" />}
                  title="No datasets found"
                  description="Try adjusting your search or filters"
                />
              ) : (
                <div className="space-y-2">
                  {filteredDatasets.map((dataset) => (
                    <DatasetListItem
                      key={dataset.id}
                      dataset={dataset}
                      isSelected={selectedDataset?.id === dataset.id}
                      onSelect={handleSelectDataset}
                      onDelete={handleDeleteDataset}
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
              selectedVersion={selectedVersion}
              onSelectVersion={setSelectedVersion}
            />
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
