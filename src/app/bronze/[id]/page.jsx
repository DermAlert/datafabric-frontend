'use client';

import React, { useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
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
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_DATASETS = {
  'bronze_1': {
    id: 'bronze_1',
    name: 'patients_raw',
    description: 'Raw patient data from all healthcare sources',
    dataType: 'structured',
    type: 'persistent',
    columns: [
      { key: 'id', label: 'ID', type: 'number', width: 80 },
      { key: 'name', label: 'Patient Name', type: 'string', width: 180 },
      { key: 'email', label: 'Email', type: 'string', width: 220 },
      { key: 'birth_date', label: 'Birth Date', type: 'date', width: 120 },
      { key: 'admission_date', label: 'Admission', type: 'date', width: 120 },
      { key: 'status', label: 'Status', type: 'string', width: 100 },
      { key: 'room', label: 'Room', type: 'string', width: 80 },
      { key: 'doctor', label: 'Doctor', type: 'string', width: 150 },
    ],
    data: [
      { id: 1, name: 'Maria Santos', email: 'maria.santos@email.com', birth_date: '1985-03-15', admission_date: '2026-01-10', status: 'Active', room: 'A-201', doctor: 'Dr. João Silva' },
      { id: 2, name: 'Pedro Oliveira', email: 'pedro.o@email.com', birth_date: '1972-08-22', admission_date: '2026-01-08', status: 'Discharged', room: 'B-105', doctor: 'Dra. Ana Costa' },
      { id: 3, name: 'Ana Paula Ferreira', email: 'ana.ferreira@email.com', birth_date: '1990-11-30', admission_date: '2026-01-12', status: 'Active', room: 'A-304', doctor: 'Dr. Carlos Mendes' },
      { id: 4, name: 'Lucas Rodrigues', email: 'lucas.r@email.com', birth_date: '1968-05-14', admission_date: '2026-01-05', status: 'Critical', room: 'ICU-02', doctor: 'Dr. João Silva' },
      { id: 5, name: 'Juliana Almeida', email: 'ju.almeida@email.com', birth_date: '1995-09-08', admission_date: '2026-01-11', status: 'Active', room: 'C-112', doctor: 'Dra. Beatriz Lima' },
      { id: 6, name: 'Roberto Nascimento', email: 'roberto.n@email.com', birth_date: '1958-12-03', admission_date: '2026-01-09', status: 'Observation', room: 'B-208', doctor: 'Dr. Carlos Mendes' },
      { id: 7, name: 'Fernanda Gomes', email: 'fernanda.g@email.com', birth_date: '1982-07-19', admission_date: '2026-01-13', status: 'Active', room: 'A-115', doctor: 'Dra. Ana Costa' },
      { id: 8, name: 'Thiago Barbosa', email: 'thiago.b@email.com', birth_date: '1975-02-28', admission_date: '2026-01-07', status: 'Discharged', room: 'C-301', doctor: 'Dr. João Silva' },
    ],
    totalRows: 125430,
    sizeBytes: 45678912,
    lastIngestion: '2026-01-13T08:30:00Z',
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/patients/',
  },
  'bronze_2': {
    id: 'bronze_2',
    name: 'orders_unified',
    description: 'Unified orders from e-commerce and retail systems',
    dataType: 'structured',
    type: 'persistent',
    columns: [
      { key: 'order_id', label: 'Order ID', type: 'string', width: 120 },
      { key: 'customer', label: 'Customer', type: 'string', width: 150 },
      { key: 'product', label: 'Product', type: 'string', width: 200 },
      { key: 'quantity', label: 'Qty', type: 'number', width: 60 },
      { key: 'price', label: 'Price', type: 'number', width: 100 },
      { key: 'order_date', label: 'Order Date', type: 'date', width: 120 },
      { key: 'status', label: 'Status', type: 'string', width: 100 },
    ],
    data: [
      { order_id: 'ORD-2026-001', customer: 'Tech Solutions Inc', product: 'Enterprise License', quantity: 5, price: 4999.99, order_date: '2026-01-13', status: 'Completed' },
      { order_id: 'ORD-2026-002', customer: 'Global Trade LLC', product: 'Cloud Storage 1TB', quantity: 10, price: 299.99, order_date: '2026-01-13', status: 'Processing' },
      { order_id: 'ORD-2026-003', customer: 'StartUp Brasil', product: 'API Integration', quantity: 1, price: 1499.00, order_date: '2026-01-12', status: 'Completed' },
      { order_id: 'ORD-2026-004', customer: 'Maria Santos', product: 'Premium Support', quantity: 1, price: 599.99, order_date: '2026-01-12', status: 'Pending' },
      { order_id: 'ORD-2026-005', customer: 'DataCorp', product: 'Analytics Suite', quantity: 3, price: 2999.00, order_date: '2026-01-11', status: 'Completed' },
    ],
    totalRows: 89234,
    sizeBytes: 23456789,
    lastIngestion: '2026-01-13T10:15:00Z',
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/orders/',
  },
  'bronze_images': {
    id: 'bronze_images',
    name: 'product_catalog',
    description: 'Product images with metadata from e-commerce catalog',
    dataType: 'images',
    type: 'persistent',
    imageColumn: 'image_url',
    columns: [
      { key: 'id', label: 'ID', type: 'number', width: 60 },
      { key: 'image_url', label: 'Image', type: 'image_url', width: 120 },
      { key: 'product_name', label: 'Product', type: 'string', width: 180 },
      { key: 'category', label: 'Category', type: 'string', width: 120 },
      { key: 'brand', label: 'Brand', type: 'string', width: 100 },
      { key: 'price', label: 'Price', type: 'number', width: 80 },
      { key: 'stock', label: 'Stock', type: 'number', width: 70 },
      { key: 'rating', label: 'Rating', type: 'number', width: 70 },
    ],
    data: [
      { id: 1, image_url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400', product_name: 'Premium Watch', category: 'Accessories', brand: 'LuxTime', price: 299.99, stock: 45, rating: 4.8 },
      { id: 2, image_url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', product_name: 'Wireless Headphones', category: 'Electronics', brand: 'SoundMax', price: 149.99, stock: 120, rating: 4.6 },
      { id: 3, image_url: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400', product_name: 'Polaroid Camera', category: 'Electronics', brand: 'RetroSnap', price: 89.99, stock: 78, rating: 4.3 },
      { id: 4, image_url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', product_name: 'Designer Sunglasses', category: 'Accessories', brand: 'VisionPro', price: 179.99, stock: 56, rating: 4.7 },
      { id: 5, image_url: 'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=400', product_name: 'Running Shoes', category: 'Footwear', brand: 'SpeedRun', price: 129.99, stock: 200, rating: 4.5 },
      { id: 6, image_url: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400', product_name: 'Skincare Set', category: 'Beauty', brand: 'GlowUp', price: 79.99, stock: 150, rating: 4.9 },
      { id: 7, image_url: 'https://images.unsplash.com/photo-1491553895911-0055uj6?w=400', product_name: 'Smart Watch', category: 'Electronics', brand: 'TechWear', price: 349.99, stock: 89, rating: 4.4 },
      { id: 8, image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', product_name: 'Sport Sneakers', category: 'Footwear', brand: 'AthleticX', price: 159.99, stock: 175, rating: 4.6 },
      { id: 9, image_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', product_name: 'Leather Backpack', category: 'Bags', brand: 'UrbanCarry', price: 199.99, stock: 62, rating: 4.8 },
      { id: 10, image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400', product_name: 'Water Bottle', category: 'Accessories', brand: 'HydroLife', price: 34.99, stock: 300, rating: 4.2 },
      { id: 11, image_url: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', product_name: 'Basketball Shoes', category: 'Footwear', brand: 'CourtKing', price: 189.99, stock: 95, rating: 4.7 },
      { id: 12, image_url: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400', product_name: 'Fitness Tracker', category: 'Electronics', brand: 'FitPulse', price: 99.99, stock: 140, rating: 4.3 },
    ],
    totalRows: 45678,
    sizeBytes: 156789012,
    lastIngestion: '2026-01-13T09:45:00Z',
    outputFormat: 'parquet',
    outputBucket: 's3://datalake-bronze/products/',
  },
  'bronze_documents': {
    id: 'bronze_documents',
    name: 'document_scans',
    description: 'Scanned documents with OCR metadata',
    dataType: 'images',
    type: 'persistent',
    imageColumn: 'scan_url',
    columns: [
      { key: 'doc_id', label: 'Doc ID', type: 'string', width: 100 },
      { key: 'scan_url', label: 'Scan', type: 'image_url', width: 120 },
      { key: 'doc_type', label: 'Type', type: 'string', width: 100 },
      { key: 'title', label: 'Title', type: 'string', width: 200 },
      { key: 'pages', label: 'Pages', type: 'number', width: 70 },
      { key: 'ocr_confidence', label: 'OCR %', type: 'number', width: 80 },
      { key: 'created_at', label: 'Created', type: 'date', width: 110 },
    ],
    data: [
      { doc_id: 'DOC-001', scan_url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400', doc_type: 'Contract', title: 'Service Agreement 2026', pages: 12, ocr_confidence: 98.5, created_at: '2026-01-13' },
      { doc_id: 'DOC-002', scan_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400', doc_type: 'Invoice', title: 'Invoice #INV-2026-0145', pages: 2, ocr_confidence: 99.2, created_at: '2026-01-12' },
      { doc_id: 'DOC-003', scan_url: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400', doc_type: 'Report', title: 'Q4 Financial Report', pages: 45, ocr_confidence: 97.8, created_at: '2026-01-11' },
      { doc_id: 'DOC-004', scan_url: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=400', doc_type: 'Manual', title: 'Product Manual v2.1', pages: 128, ocr_confidence: 96.3, created_at: '2026-01-10' },
      { doc_id: 'DOC-005', scan_url: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400', doc_type: 'Form', title: 'Registration Form', pages: 4, ocr_confidence: 99.7, created_at: '2026-01-09' },
      { doc_id: 'DOC-006', scan_url: 'https://images.unsplash.com/photo-1456324504439-367cee3b3c32?w=400', doc_type: 'Letter', title: 'Correspondence Archive', pages: 1, ocr_confidence: 99.9, created_at: '2026-01-08' },
    ],
    totalRows: 12456,
    sizeBytes: 789456123,
    lastIngestion: '2026-01-13T11:20:00Z',
    outputFormat: 'delta',
    outputBucket: 's3://datalake-bronze/documents/',
  },
  'bronze_virt_1': {
    id: 'bronze_virt_1',
    name: 'orders_exploration',
    description: 'Virtualized view for exploring order data via API',
    dataType: 'structured',
    type: 'virtualized',
    sourceQuery: `SELECT 
  o.id AS order_id,
  o.customer_id,
  c.name AS customer_name,
  o.total_amount,
  o.status,
  o.created_at
FROM orders o
JOIN customers c ON o.customer_id = c.id
JOIN transactions t ON o.id = t.order_id
WHERE o.status IN ('completed', 'processing')
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
      { order_id: 'ORD-2026-0147', customer_id: 5, customer_name: 'Innovation Labs', total_amount: 899.99, status: 'processing', created_at: '2026-01-12 16:55:00' },
      { order_id: 'ORD-2026-0146', customer_id: 4, customer_name: 'DataCorp', total_amount: 8997.00, status: 'completed', created_at: '2026-01-12 14:30:00' },
    ],
    totalRows: 0,
    sizeBytes: 0,
    lastIngestion: null,
    outputFormat: null,
    outputBucket: null,
  },
  'bronze_virt_2': {
    id: 'bronze_virt_2',
    name: 'inventory_realtime',
    description: 'Real-time inventory data for external APIs',
    dataType: 'structured',
    type: 'virtualized',
    sourceQuery: `SELECT 
  i.product_id,
  p.name AS product_name,
  p.category,
  i.quantity,
  i.warehouse_id,
  w.name AS warehouse_name,
  i.last_updated
FROM inventory i
JOIN products p ON i.product_id = p.id
JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.quantity > 0
ORDER BY i.last_updated DESC
LIMIT 50`,
    columns: [
      { key: 'product_id', label: 'Product ID', type: 'number', width: 100 },
      { key: 'product_name', label: 'Product', type: 'string', width: 200 },
      { key: 'category', label: 'Category', type: 'string', width: 140 },
      { key: 'quantity', label: 'Qty', type: 'number', width: 80 },
      { key: 'warehouse_name', label: 'Warehouse', type: 'string', width: 140 },
      { key: 'last_updated', label: 'Updated', type: 'date', width: 140 },
    ],
    data: [
      { product_id: 101, product_name: 'Premium Watch', category: 'Accessories', quantity: 45, warehouse_name: 'São Paulo - SP01', last_updated: '2026-01-13 10:15:00' },
      { product_id: 102, product_name: 'Wireless Headphones', category: 'Electronics', quantity: 120, warehouse_name: 'São Paulo - SP01', last_updated: '2026-01-13 10:14:00' },
      { product_id: 103, product_name: 'Running Shoes', category: 'Footwear', quantity: 200, warehouse_name: 'Rio de Janeiro - RJ02', last_updated: '2026-01-13 10:12:00' },
      { product_id: 104, product_name: 'Leather Backpack', category: 'Bags', quantity: 62, warehouse_name: 'São Paulo - SP01', last_updated: '2026-01-13 10:10:00' },
      { product_id: 105, product_name: 'Fitness Tracker', category: 'Electronics', quantity: 140, warehouse_name: 'Rio de Janeiro - RJ02', last_updated: '2026-01-13 10:08:00' },
    ],
    totalRows: 0,
    sizeBytes: 0,
    lastIngestion: null,
    outputFormat: null,
    outputBucket: null,
  },
};

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  metadata, 
  columns 
}) => {
  const [copied, setCopied] = useState(null);

  if (!isOpen) return null;

  const handleCopy = (value, key) => {
    navigator.clipboard.writeText(String(value));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div 
        className={styles.modalContent}
        onClick={e => e.stopPropagation()}
      >
        <div className={styles.modalImageArea}>
          <img 
            src={imageUrl} 
            alt="Preview"
            className={styles.modalImage}
          />
        </div>

        <div className={styles.modalSidebar}>
          <div className={styles.sidebarHeader}>
            <h3 className={styles.sidebarTitle}>Metadata</h3>
            <button 
              onClick={onClose}
              className={styles.closeModalBtn}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className={styles.sidebarContent}>
            {columns.filter(col => col.type !== 'image_url').map(col => (
              <div key={col.key} className={styles.metaItem}>
                <label className={styles.metaLabel}>{col.label}</label>
                <div className={styles.metaValueRow}>
                  <span className={styles.metaValue}>
                    {col.type === 'number' && col.key.includes('price') 
                      ? `$${metadata[col.key]?.toFixed(2)}`
                      : String(metadata[col.key] ?? '-')}
                  </span>
                  <button 
                    onClick={() => handleCopy(metadata[col.key], col.key)}
                    className={styles.copyButton}
                  >
                    {copied === col.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className={styles.sidebarFooter}>
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.openOriginalBtn}
            >
              <ExternalLink className="w-4 h-4" />
              Open Original
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

const GalleryCard = ({ 
  item, 
  imageColumn, 
  columns, 
  onViewDetails 
}) => {
  const imageUrl = item[imageColumn];
  const nameColumn = columns.find(c => c.key.includes('name') || c.key.includes('title'));
  const title = nameColumn ? item[nameColumn.key] : `Item #${item.id || item.doc_id}`;

  return (
    <div 
      className={styles.galleryCard}
      onClick={onViewDetails}
    >
      <div className={styles.imageWrapper}>
        <img 
          src={imageUrl}
          alt={title}
          className={styles.cardImage}
          onError={(e) => {
            (e.target).src = 'https://via.placeholder.com/400?text=No+Image';
          }}
        />
        <div className={styles.imageOverlay}>
          <div className={styles.overlayContent}>
            <span className={styles.overlayTitle}>{title}</span>
            <button className={styles.maximizeBtn}>
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <div className={styles.cardMeta}>
          {columns.slice(0, 2).filter(c => c.type !== 'image_url' && !c.key.includes('name') && !c.key.includes('title')).map(col => (
            <span key={col.key} className="truncate">
              {col.type === 'number' && col.key.includes('price') 
                ? `$${item[col.key]?.toFixed(2)}`
                : String(item[col.key] ?? '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

const ListViewItem = ({ 
  item, 
  imageColumn, 
  columns, 
  onViewDetails 
}) => {
  const imageUrl = item[imageColumn];
  const nameColumn = columns.find(c => c.key.includes('name') || c.key.includes('title'));
  const title = nameColumn ? item[nameColumn.key] : `Item #${item.id || item.doc_id}`;

  return (
    <div 
      className={styles.listItem}
      onClick={onViewDetails}
    >
      <div className={styles.listThumb}>
        <img 
          src={imageUrl}
          alt={title}
          className={styles.listImage}
          onError={(e) => {
            (e.target).src = 'https://via.placeholder.com/80?text=No+Image';
          }}
        />
      </div>
      <div className={styles.listInfo}>
        <h4 className={styles.listTitle}>{title}</h4>
        <div className={styles.listMetaRow}>
          {columns.filter(c => c.type !== 'image_url' && !c.key.includes('name') && !c.key.includes('title')).slice(0, 4).map(col => (
            <span key={col.key} className={styles.metaEntry}>
              <span className={styles.metaKey}>{col.label}:</span>
              <span className={styles.metaVal}>
                {col.type === 'number' && col.key.includes('price') 
                  ? `$${item[col.key]?.toFixed(2)}`
                  : String(item[col.key] ?? '-')}
              </span>
            </span>
          ))}
        </div>
      </div>
      <button className={styles.listAction}>
        <Eye className="w-5 h-5" />
      </button>
    </div>
  );
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
                  {col.type === 'image_url' ? (
                    <img 
                      src={row[col.key]} 
                      alt="" 
                      className={styles.tdImg}
                      onError={(e) => {
                        (e.target).src = 'https://via.placeholder.com/40?text=N/A';
                      }}
                    />
                  ) : col.type === 'number' && col.key.includes('price') ? (
                    <span className={styles.tdText}>
                      ${row[col.key]?.toFixed(2)}
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
                      row[col.key] === 'Discharged' && styles.statusGray,
                      row[col.key] === 'Critical' && styles.statusRed,
                      row[col.key] === 'Observation' && styles.statusAmber,
                      row[col.key] === 'Processing' && styles.statusBlue,
                      row[col.key] === 'Pending' && styles.statusAmber,
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

  React.useEffect(() => {
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

export default function DatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id;

  const [viewMode, setViewMode] = useState('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState(null);
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

  const hasImages = dataset?.dataType === 'images' || dataset?.dataType === 'mixed';
  const isVirtualized = dataset?.type === 'virtualized';

  React.useEffect(() => {
    if (dataset) {
      setViewMode(dataset.dataType === 'images' ? 'gallery' : 'table');
    }
  }, [dataset]);

  if (!dataset) {
    return (
      <DashboardLayout>
        <div className={styles.container} style={{justifyContent: 'center', alignItems: 'center'}}>
          <Layers className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>Dataset Not Found</h2>
          <p className={styles.emptyText}>The dataset you're looking for doesn't exist.</p>
          <Link 
            href="/bronze"
            className={clsx(styles.actionPrimary, styles.btnAmber)}
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerTop}>
            <Link
              href="/bronze"
              className={styles.backButton}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className={styles.titleSection}>
              <div className={styles.titleRow}>
                <div className={clsx(
                  styles.iconBox,
                  isVirtualized
                    ? styles.iconBoxCyan
                    : hasImages 
                      ? styles.iconBoxPurple 
                      : styles.iconBoxAmber
                )}>
                  {isVirtualized
                    ? <Zap className={clsx(styles.icon, isVirtualized ? "text-cyan-600 dark:text-cyan-400" : "")} />
                    : hasImages 
                      ? <ImageIcon className={clsx(styles.icon, hasImages ? "text-purple-600 dark:text-purple-400" : "")} />
                      : <Table2 className={clsx(styles.icon, !isVirtualized && !hasImages ? "text-amber-600 dark:text-amber-400" : "")} />
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
                  href={`/sharing?dataset=bronze.${dataset.name}`}
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
                isVirtualized
                  ? styles.btnCyan
                  : styles.btnAmber
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
                <span>{formatDate(dataset.lastIngestion || '')}</span>
              </div>
              {dataset.outputFormat && (
                <span className={styles.formatBadge}>
                  {dataset.outputFormat}
                </span>
              )}
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
              {hasImages && (
                <>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={clsx(styles.viewButton, viewMode === 'gallery' && styles.viewButtonActive)}
                    title="Gallery View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={clsx(styles.viewButton, viewMode === 'list' && styles.viewButtonActive)}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setViewMode('table')}
                className={clsx(styles.viewButton, viewMode === 'table' && styles.viewButtonActive)}
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
          ) : viewMode === 'gallery' && hasImages ? (
            <div className={styles.galleryGrid}>
              {paginatedData.map((item, idx) => (
                <GalleryCard
                  key={idx}
                  item={item}
                  imageColumn={dataset.imageColumn}
                  columns={dataset.columns}
                  onViewDetails={() => setSelectedImage({
                    url: item[dataset.imageColumn],
                    metadata: item
                  })}
                />
              ))}
            </div>
          ) : viewMode === 'list' && hasImages ? (
            <div className={styles.listStack}>
              {paginatedData.map((item, idx) => (
                <ListViewItem
                  key={idx}
                  item={item}
                  imageColumn={dataset.imageColumn}
                  columns={dataset.columns}
                  onViewDetails={() => setSelectedImage({
                    url: item[dataset.imageColumn],
                    metadata: item
                  })}
                />
              ))}
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

        {selectedImage && (
          <ImageModal
            isOpen={!!selectedImage}
            onClose={() => setSelectedImage(null)}
            imageUrl={selectedImage.url}
            metadata={selectedImage.metadata}
            columns={dataset.columns}
          />
        )}
      </div>
    </DashboardLayout>
  );
}