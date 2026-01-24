'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock datasets - Persistent (materialized data)
const MOCK_DATASETS = {
  'silver_1': {
    id: 'silver_1',
    name: 'patients_normalized',
    description: 'Normalized patient data with CPF formatting and gender unification',
    datasetType: 'persistent',
    sourceBronzeDataset: 'patients_raw',
    columns: [
      { key: 'id', label: 'ID', type: 'number', width: 80 },
      { key: 'name', label: 'Patient Name', type: 'string', width: 180 },
      { key: 'cpf', label: 'CPF', type: 'string', width: 140 },
      { key: 'email', label: 'Email', type: 'string', width: 220 },
      { key: 'gender', label: 'Gender', type: 'string', width: 100 },
      { key: 'birth_date', label: 'Birth Date', type: 'date', width: 120 },
      { key: 'status', label: 'Status', type: 'string', width: 100 },
    ],
    data: [
      { id: 1, name: 'MARIA SANTOS', cpf: '123.456.789-00', email: 'maria.santos@email.com', gender: 'Female', birth_date: '1985-03-15', status: 'Active' },
      { id: 2, name: 'PEDRO OLIVEIRA', cpf: '234.567.890-11', email: 'pedro.o@email.com', gender: 'Male', birth_date: '1972-08-22', status: 'Active' },
      { id: 3, name: 'ANA PAULA FERREIRA', cpf: '345.678.901-22', email: 'ana.ferreira@email.com', gender: 'Female', birth_date: '1990-11-30', status: 'Active' },
      { id: 4, name: 'LUCAS RODRIGUES', cpf: '456.789.012-33', email: 'lucas.r@email.com', gender: 'Male', birth_date: '1968-05-14', status: 'Active' },
      { id: 5, name: 'JULIANA ALMEIDA', cpf: '567.890.123-44', email: 'ju.almeida@email.com', gender: 'Female', birth_date: '1995-09-08', status: 'Active' },
      { id: 6, name: 'ROBERTO NASCIMENTO', cpf: '678.901.234-55', email: 'roberto.n@email.com', gender: 'Male', birth_date: '1958-12-03', status: 'Active' },
      { id: 7, name: 'FERNANDA GOMES', cpf: '789.012.345-66', email: 'fernanda.g@email.com', gender: 'Female', birth_date: '1982-07-19', status: 'Active' },
      { id: 8, name: 'THIAGO BARBOSA', cpf: '890.123.456-77', email: 'thiago.b@email.com', gender: 'Male', birth_date: '1975-02-28', status: 'Active' },
    ],
    totalRows: 125430,
    sizeBytes: 89456712,
    lastExecution: '2026-01-13T09:30:00Z',
  },
  'silver_3': {
    id: 'silver_3',
    name: 'customer_360_silver',
    description: 'Clean customer data with phone normalization',
    datasetType: 'persistent',
    sourceBronzeDataset: 'customer_360',
    columns: [
      { key: 'id', label: 'ID', type: 'number', width: 80 },
      { key: 'name', label: 'Customer Name', type: 'string', width: 180 },
      { key: 'email', label: 'Email', type: 'string', width: 200 },
      { key: 'phone', label: 'Phone', type: 'string', width: 140 },
      { key: 'cep', label: 'CEP', type: 'string', width: 100 },
      { key: 'city', label: 'City', type: 'string', width: 140 },
      { key: 'created_at', label: 'Created', type: 'date', width: 120 },
    ],
    data: [
      { id: 1, name: 'Tech Solutions Inc', email: 'contact@techsolutions.com', phone: '(11) 99999-1234', cep: '01310-100', city: 'São Paulo', created_at: '2025-06-15' },
      { id: 2, name: 'Global Trade LLC', email: 'info@globaltrade.com', phone: '(21) 98888-5678', cep: '20040-020', city: 'Rio de Janeiro', created_at: '2025-07-22' },
      { id: 3, name: 'StartUp Brasil', email: 'hello@startupbr.io', phone: '(31) 97777-9012', cep: '30130-000', city: 'Belo Horizonte', created_at: '2025-08-10' },
      { id: 4, name: 'DataCorp', email: 'data@datacorp.com', phone: '(41) 96666-3456', cep: '80010-000', city: 'Curitiba', created_at: '2025-09-05' },
      { id: 5, name: 'Innovation Labs', email: 'labs@innovation.tech', phone: '(51) 95555-7890', cep: '90010-000', city: 'Porto Alegre', created_at: '2025-10-18' },
    ],
    totalRows: 89234,
    sizeBytes: 45678901,
    lastExecution: '2026-01-13T10:45:00Z',
  },
  'silver_5': {
    id: 'silver_5',
    name: 'transactions_clean',
    description: 'Transaction data with value formatting',
    datasetType: 'persistent',
    sourceBronzeDataset: 'orders_unified',
    columns: [
      { key: 'id', label: 'TX ID', type: 'string', width: 120 },
      { key: 'customer', label: 'Customer', type: 'string', width: 160 },
      { key: 'amount', label: 'Amount', type: 'string', width: 120 },
      { key: 'description', label: 'Description', type: 'string', width: 200 },
      { key: 'status', label: 'Status', type: 'string', width: 100 },
      { key: 'date', label: 'Date', type: 'date', width: 120 },
    ],
    data: [
      { id: 'TX-2026-001', customer: 'Tech Solutions', amount: 'R$ 4.999,99', description: 'Enterprise License', status: 'Completed', date: '2026-01-13' },
      { id: 'TX-2026-002', customer: 'Global Trade', amount: 'R$ 2.999,99', description: 'Cloud Storage Package', status: 'Completed', date: '2026-01-13' },
      { id: 'TX-2026-003', customer: 'StartUp Brasil', amount: 'R$ 1.499,00', description: 'API Integration', status: 'Completed', date: '2026-01-12' },
      { id: 'TX-2026-004', customer: 'Maria Santos', amount: 'R$ 599,99', description: 'Premium Support', status: 'Completed', date: '2026-01-12' },
      { id: 'TX-2026-005', customer: 'DataCorp', amount: 'R$ 8.997,00', description: 'Analytics Suite x3', status: 'Completed', date: '2026-01-11' },
    ],
    totalRows: 456789,
    sizeBytes: 234567890,
    lastExecution: '2026-01-12T22:00:00Z',
  },
  // Virtualized datasets - query on-demand
  'silver_2': {
    id: 'silver_2',
    name: 'orders_exploration',
    description: 'Virtualized view of orders for API consumption',
    datasetType: 'virtualized',
    sourceQuery: `SELECT 
  o.order_id,
  o.customer_id,
  c.customer_name,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
WHERE o.status = 'completed'
ORDER BY o.created_at DESC
LIMIT 100`,
    columns: [
      { key: 'order_id', label: 'Order ID', type: 'string', width: 120 },
      { key: 'customer_id', label: 'Customer ID', type: 'number', width: 100 },
      { key: 'customer_name', label: 'Customer', type: 'string', width: 180 },
      { key: 'total_amount', label: 'Amount', type: 'number', width: 120 },
      { key: 'status', label: 'Status', type: 'string', width: 100 },
      { key: 'created_at', label: 'Created', type: 'date', width: 140 },
    ],
    data: [
      { order_id: 'ORD-2026-0150', customer_id: 1, customer_name: 'Tech Solutions Inc', total_amount: 4999.99, status: 'completed', created_at: '2026-01-13 10:30:00' },
      { order_id: 'ORD-2026-0149', customer_id: 2, customer_name: 'Global Trade LLC', total_amount: 2999.99, status: 'completed', created_at: '2026-01-13 09:45:00' },
      { order_id: 'ORD-2026-0148', customer_id: 3, customer_name: 'StartUp Brasil', total_amount: 1499.00, status: 'completed', created_at: '2026-01-13 08:20:00' },
      { order_id: 'ORD-2026-0147', customer_id: 5, customer_name: 'Innovation Labs', total_amount: 899.99, status: 'completed', created_at: '2026-01-12 16:55:00' },
      { order_id: 'ORD-2026-0146', customer_id: 4, customer_name: 'DataCorp', total_amount: 8997.00, status: 'completed', created_at: '2026-01-12 14:30:00' },
    ],
    totalRows: 0,
    sizeBytes: 0,
    lastExecution: null,
  },
  'silver_4': {
    id: 'silver_4',
    name: 'inventory_api',
    description: 'Real-time inventory data for external APIs',
    datasetType: 'virtualized',
    sourceQuery: `SELECT 
  i.product_id,
  p.product_name,
  p.category,
  i.quantity,
  i.warehouse,
  i.last_updated
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity > 0
ORDER BY i.last_updated DESC
LIMIT 50`,
    columns: [
      { key: 'product_id', label: 'Product ID', type: 'number', width: 100 },
      { key: 'product_name', label: 'Product', type: 'string', width: 200 },
      { key: 'category', label: 'Category', type: 'string', width: 140 },
      { key: 'quantity', label: 'Qty', type: 'number', width: 80 },
      { key: 'warehouse', label: 'Warehouse', type: 'string', width: 120 },
      { key: 'last_updated', label: 'Updated', type: 'date', width: 140 },
    ],
    data: [
      { product_id: 101, product_name: 'Premium Watch', category: 'Accessories', quantity: 45, warehouse: 'WH-SP-01', last_updated: '2026-01-13 10:15:00' },
      { product_id: 102, product_name: 'Wireless Headphones', category: 'Electronics', quantity: 120, warehouse: 'WH-SP-01', last_updated: '2026-01-13 10:14:00' },
      { product_id: 103, product_name: 'Running Shoes', category: 'Footwear', quantity: 200, warehouse: 'WH-RJ-02', last_updated: '2026-01-13 10:12:00' },
      { product_id: 104, product_name: 'Leather Backpack', category: 'Bags', quantity: 62, warehouse: 'WH-SP-01', last_updated: '2026-01-13 10:10:00' },
      { product_id: 105, product_name: 'Fitness Tracker', category: 'Electronics', quantity: 140, warehouse: 'WH-RJ-02', last_updated: '2026-01-13 10:08:00' },
    ],
    totalRows: 0,
    sizeBytes: 0,
    lastExecution: null,
  },
};

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

// Table Component
const DataTable = ({ columns, data }) => {
  return (
    <div className="overflow-auto rounded-xl border border-gray-200 dark:border-zinc-700">
      <table className="w-full">
        <thead>
          <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
            {columns.map(col => (
              <th 
                key={col.key}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                style={{ width: col.width }}
              >
                {col.label}
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
                <td key={col.key} className="px-4 py-3 text-sm">
                  {col.type === 'number' && typeof row[col.key] === 'number' ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      {col.key.includes('amount') || col.key.includes('price') 
                        ? `$${row[col.key].toFixed(2)}`
                        : row[col.key].toLocaleString()
                      }
                    </span>
                  ) : col.type === 'date' ? (
                    <span className="text-gray-600 dark:text-gray-400">
                      {row[col.key]}
                    </span>
                  ) : col.key === 'status' ? (
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      row[col.key] === 'Active' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      row[col.key] === 'Completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      row[col.key] === 'completed' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                      row[col.key] === 'Pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                    )}>
                      {row[col.key]}
                    </span>
                  ) : col.key === 'gender' ? (
                    <span className={clsx(
                      'px-2 py-0.5 rounded-full text-xs font-medium',
                      row[col.key] === 'Female' && 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                      row[col.key] === 'Male' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    )}>
                      {row[col.key]}
                    </span>
                  ) : (
                    <span className="text-gray-900 dark:text-white">{row[col.key]}</span>
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

// Virtualized Query Preview Component
const VirtualizedPreview = ({ 
  dataset, 
  isLoading, 
  onRefresh 
}) => {
  const [queryTime, setQueryTime] = useState(null);

  useEffect(() => {
    // Simulate query time
    setQueryTime(Math.floor(Math.random() * 200) + 50);
  }, [dataset.data]);

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
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Timer className="w-4 h-4" />
          <span>Query time: <strong className="text-gray-900 dark:text-white">{queryTime}ms</strong></span>
        </div>
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
          <Rows3 className="w-4 h-4" />
          <span>Sample: <strong className="text-gray-900 dark:text-white">{dataset.data.length} rows</strong></span>
        </div>
        <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <Info className="w-4 h-4" />
          <span className="text-xs">Limited preview (LIMIT 100)</span>
        </div>
      </div>

      {/* Source Query */}
      {dataset.sourceQuery && (
        <div className="rounded-xl overflow-hidden border border-zinc-700">
          <div className="px-4 py-2 bg-zinc-800 border-b border-zinc-700 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Code2 className="w-4 h-4" />
              Source Query
            </div>
            <button className="text-xs text-cyan-400 hover:text-cyan-300">Copy SQL</button>
          </div>
          <pre className="p-4 bg-zinc-900 dark:bg-zinc-950 text-sm text-green-400 font-mono overflow-x-auto">
            {dataset.sourceQuery}
          </pre>
        </div>
      )}

      {/* Data Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700">
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Executing query...</p>
        </div>
      ) : (
        <DataTable columns={dataset.columns} data={dataset.data} />
      )}
    </div>
  );
};

export default function SilverDatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 12;

  // Get dataset
  const dataset = MOCK_DATASETS[datasetId];

  // Simulate refresh for virtualized
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!dataset) return [];
    if (!searchQuery) return dataset.data;
    
    return dataset.data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [dataset, searchQuery]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!dataset) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <Sparkles className="w-16 h-16 text-gray-300 dark:text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Dataset Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The dataset you're looking for doesn't exist.</p>
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

  const isVirtualized = dataset.datasetType === 'virtualized';

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
                <div className={clsx(
                  "p-2 rounded-lg",
                  isVirtualized 
                    ? "bg-cyan-100 dark:bg-cyan-900/30" 
                    : "bg-purple-100 dark:bg-purple-900/30"
                )}>
                  {isVirtualized 
                    ? <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    : <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  }
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{dataset.name}</h1>
                    <span className={clsx(
                      "px-2 py-0.5 rounded-md text-xs font-medium",
                      isVirtualized 
                        ? "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300"
                        : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                    )}>
                      {isVirtualized ? 'Virtualized' : 'Persistent'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dataset.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isVirtualized && (
                <Link
                  href={`/sharing?dataset=silver.${dataset.name}`}
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
              <button className={clsx(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors",
                isVirtualized 
                  ? "bg-cyan-500 hover:bg-cyan-600"
                  : "bg-purple-500 hover:bg-purple-600"
              )}>
                {isVirtualized ? (
                  <>
                    <Play className="w-4 h-4" />
                    Run Query
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Re-execute
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Stats - only for Persistent */}
          {!isVirtualized && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Rows3 className="w-4 h-4" />
                <span>{dataset.totalRows.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Layers className="w-4 h-4" />
                <span>{formatBytes(dataset.sizeBytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatDate(dataset.lastExecution)}</span>
              </div>
              {dataset.sourceBronzeDataset && (
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-amber-500" />
                  <span className="text-gray-600 dark:text-gray-400">
                    Source: <span className="font-medium text-amber-600 dark:text-amber-400">{dataset.sourceBronzeDataset}</span>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Toolbar - only for Persistent */}
        {!isVirtualized && (
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
              dataset={dataset} 
              isLoading={isLoading} 
              onRefresh={handleRefresh}
            />
          ) : (
            <>
              {filteredData.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <Search className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">No results found</p>
                  <p className="text-sm">Try adjusting your search query</p>
                </div>
              ) : (
                <DataTable columns={dataset.columns} data={paginatedData} />
              )}
            </>
          )}
        </div>

        {/* Pagination - only for Persistent */}
        {!isVirtualized && totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                          currentPage === page
                            ? "bg-purple-500 text-white"
                            : "hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400"
                        )}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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
