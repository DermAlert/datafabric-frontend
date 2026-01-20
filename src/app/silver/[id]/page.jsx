'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
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
import styles from './page.module.css';

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

const DataTable = ({ columns, data }) => {
  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr className={styles.thead}>
            {columns.map(col => (
              <th 
                key={col.key}
                className={styles.th}
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className={styles.tbody}>
          {data.map((row, idx) => (
            <tr 
              key={idx} 
              className={styles.tr}
            >
              {columns.map(col => (
                <td key={col.key} className={styles.td}>
                  {col.type === 'number' && typeof row[col.key] === 'number' ? (
                    <span className={styles.tdText}>
                      {col.key.includes('amount') || col.key.includes('price') 
                        ? `$${row[col.key].toFixed(2)}`
                        : row[col.key].toLocaleString()
                      }
                    </span>
                  ) : col.type === 'date' ? (
                    <span className={styles.tdSub}>
                      {row[col.key]}
                    </span>
                  ) : col.key === 'status' ? (
                    <span className={clsx(
                      styles.statusBadge,
                      row[col.key] === 'Active' && styles.statusGreen,
                      row[col.key] === 'Completed' && styles.statusGreen,
                      row[col.key] === 'completed' && styles.statusGreen,
                      row[col.key] === 'Pending' && styles.statusAmber,
                    )}>
                      {row[col.key]}
                    </span>
                  ) : col.key === 'gender' ? (
                    <span className={clsx(
                      styles.statusBadge,
                      row[col.key] === 'Female' && styles.statusPink,
                      row[col.key] === 'Male' && styles.statusBlue,
                    )}>
                      {row[col.key]}
                    </span>
                  ) : (
                    <span className={styles.tdText}>{row[col.key]}</span>
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

const VirtualizedPreview = ({ 
  dataset, 
  isLoading, 
  onRefresh 
}) => {
  const [queryTime, setQueryTime] = useState(null);

  useEffect(() => {
    setQueryTime(Math.floor(Math.random() * 200) + 50);
  }, [dataset.data]);

  return (
    <div className={styles.previewContainer}>
      <div className={styles.previewBanner}>
        <div className={styles.previewContent}>
          <div className={styles.previewIconBox}>
            <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div style={{flex: 1}}>
            <h4 className={styles.previewTitle}>
              Live Query Preview
            </h4>
            <p className={styles.previewText}>
              This is a virtualized dataset. Data is queried on-demand from source systems — no data is stored in this layer.
            </p>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className={styles.refreshButton}
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

      <div className={styles.queryStats}>
        <div className={styles.statItem}>
          <Timer className="w-4 h-4" />
          <span>Query time: <strong className={styles.tdText}>{queryTime}ms</strong></span>
        </div>
        <div className={styles.statItem}>
          <Rows3 className="w-4 h-4" />
          <span>Sample: <strong className={styles.tdText}>{dataset.data.length} rows</strong></span>
        </div>
        <div className={clsx(styles.statItem, styles.statusAmber)}>
          <Info className="w-4 h-4" />
          <span style={{fontSize: '0.75rem'}}>Limited preview (LIMIT 100)</span>
        </div>
      </div>

      {dataset.sourceQuery && (
        <div className={styles.codeBlock}>
          <div className={styles.codeHeader}>
            <div className={styles.codeTitle}>
              <Code2 className="w-4 h-4" />
              Source Query
            </div>
            <button className={styles.copyButton}>Copy SQL</button>
          </div>
          <pre className={styles.codeContent}>
            {dataset.sourceQuery}
          </pre>
        </div>
      )}

      {isLoading ? (
        <div className={styles.loaderState}>
          <Loader2 className="w-10 h-10 text-cyan-500 animate-spin mb-4" />
          <p className={styles.tdSub}>Executing query...</p>
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

  const dataset = MOCK_DATASETS[datasetId];

  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const filteredData = useMemo(() => {
    if (!dataset) return [];
    if (!searchQuery) return dataset.data;
    
    return dataset.data.filter(row => 
      Object.values(row).some(value => 
        String(value).toLowerCase().includes(searchQuery.toLowerCase())
      )
    );
  }, [dataset, searchQuery]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (!dataset) {
    return (
      <DashboardLayout>
        <div className={styles.container} style={{justifyContent: 'center', alignItems: 'center'}}>
          <Sparkles className={styles.emptyIcon} />
          <h2 className={styles.title}>Dataset Not Found</h2>
          <p className={styles.subtitle}>The dataset you're looking for doesn't exist.</p>
          <Link 
            href="/silver"
            className={clsx(styles.actionPrimary, styles.btnPurple)}
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link
              href="/silver"
              className={styles.backButton}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className={styles.titleSection}>
              <div className={styles.titleRow}>
                <div className={clsx(
                  styles.iconBox,
                  isVirtualized ? styles.iconBoxCyan : styles.iconBoxPurple
                )}>
                  {isVirtualized 
                    ? <Zap className={clsx(styles.icon, isVirtualized ? "text-cyan-600 dark:text-cyan-400" : "")} />
                    : <Sparkles className={clsx(styles.icon, !isVirtualized ? "text-purple-600 dark:text-purple-400" : "")} />
                  }
                </div>
                <div>
                  <h1 className={styles.title}>{dataset.name}</h1>
                  <p className={styles.description}>{dataset.description}</p>
                </div>
              </div>
            </div>
            <div className={styles.actions}>
              {!isVirtualized && (
                <Link
                  href={`/sharing?dataset=silver.${dataset.name}`}
                  className={styles.shareButton}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Link>
              )}
              {!isVirtualized && (
                <button className={styles.exportButton}>
                  <Download className="w-4 h-4" />
                  Export
                </button>
              )}
              <button className={clsx(
                styles.actionPrimary,
                isVirtualized ? styles.btnCyan : styles.btnPurple
              )}>
                {isVirtualized ? (
                  <>
                    <Play className="w-4 h-4" />
                    Run Query
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </>
                )}
              </button>
            </div>
          </div>

          {!isVirtualized && (
            <div className={styles.statsRow}>
              <div className={styles.statItem}>
                <Rows3 className="w-4 h-4" />
                <span>{dataset.totalRows.toLocaleString()} rows</span>
              </div>
              <div className={styles.statItem}>
                <HardDrive className="w-4 h-4" />
                <span>{formatBytes(dataset.sizeBytes)}</span>
              </div>
              <div className={styles.statItem}>
                <Clock className="w-4 h-4" />
                <span>{formatDate(dataset.lastExecution || '')}</span>
              </div>
            </div>
          )}

          {isVirtualized && (
            <div className={styles.statsRow}>
              <span className={styles.virtualizedBadge}>
                <Zap className="w-3 h-3" />
                Virtualized Query
              </span>
            </div>
          )}
        </div>

        {!isVirtualized && (
          <div className={styles.toolbar}>
            <div className={styles.searchGroup}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input 
                  type="text"
                  placeholder="Search data..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className={styles.searchInput}
                />
              </div>
              <button className={styles.filterButton}>
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            <div className={styles.viewToggle}>
              <button
                className={clsx(styles.viewButton, styles.viewButtonActive)}
                title="Table View"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className={styles.content}>
          {isVirtualized ? (
            <VirtualizedPreview 
              dataset={dataset} 
              isLoading={isLoading} 
              onRefresh={handleRefresh} 
            />
          ) : filteredData.length === 0 ? (
            <div className={styles.emptyState}>
              <Search className={styles.emptyIcon} />
              <p className={styles.title} style={{fontSize: '1.125rem'}}>No results found</p>
              <p className={styles.description}>Try adjusting your search query</p>
            </div>
          ) : (
            <DataTable columns={dataset.columns} data={paginatedData} />
          )}
        </div>

        {!isVirtualized && totalPages > 1 && (
          <div className={styles.pagination}>
            <span className={styles.paginationText}>
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} items
            </span>
            <div className={styles.pageControls}>
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={styles.pageBtn}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className={styles.pageControls} style={{gap: '0.25rem'}}>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                  .map((page, idx, arr) => (
                    <React.Fragment key={page}>
                      {idx > 0 && arr[idx - 1] !== page - 1 && (
                        <span className={styles.paginationText} style={{padding: '0 0.5rem'}}>...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={clsx(
                          styles.pageNum,
                          currentPage === page ? styles.pageNumActive : styles.pageNumInactive
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
                className={styles.pageBtn}
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