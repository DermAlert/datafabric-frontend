'use client';

import React, { useState, useMemo } from 'react';
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
  Share2
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Types
type DataType = 'structured' | 'images' | 'mixed';
type ViewMode = 'table' | 'gallery' | 'list';

interface Column {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'image_url' | 'boolean';
  width?: number;
}

interface DatasetInfo {
  id: string;
  name: string;
  description: string;
  dataType: DataType;
  type: 'persistent' | 'virtualized';
  columns: Column[];
  data: Record<string, any>[];
  imageColumn?: string; // Column that contains image URLs
  totalRows: number;
  sizeBytes: number;
  lastIngestion: string | null;
  outputFormat: string | null;
  outputBucket: string | null;
  sourceQuery?: string; // For virtualized datasets
}

// Mock datasets with different types
const MOCK_DATASETS: Record<string, DatasetInfo> = {
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
  // Virtualized datasets
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

const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Image Modal Component
const ImageModal = ({ 
  isOpen, 
  onClose, 
  imageUrl, 
  metadata,
  columns 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  imageUrl: string;
  metadata: Record<string, any>;
  columns: Column[];
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (value: string, key: string) => {
    navigator.clipboard.writeText(String(value));
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="relative w-full max-w-6xl max-h-[90vh] m-4 bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl flex"
        onClick={e => e.stopPropagation()}
      >
        {/* Image Side */}
        <div className="flex-1 bg-black flex items-center justify-center p-6">
          <img 
            src={imageUrl} 
            alt="Preview"
            className="max-w-full max-h-[75vh] object-contain rounded-lg"
          />
        </div>

        {/* Metadata Side */}
        <div className="w-96 bg-zinc-900 border-l border-zinc-800 flex flex-col">
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <h3 className="font-semibold text-white">Metadata</h3>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {columns.filter(col => col.type !== 'image_url').map(col => (
              <div key={col.key} className="group">
                <label className="text-xs text-gray-500 uppercase tracking-wide">{col.label}</label>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-white font-medium">
                    {col.type === 'number' && col.key.includes('price') 
                      ? `$${metadata[col.key]?.toFixed(2)}`
                      : String(metadata[col.key] ?? '-')}
                  </span>
                  <button 
                    onClick={() => handleCopy(metadata[col.key], col.key)}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-zinc-800 text-gray-500 hover:text-white transition-all"
                  >
                    {copied === col.key ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-zinc-800">
            <a 
              href={imageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium transition-colors"
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

// Gallery Card Component
const GalleryCard = ({ 
  item, 
  imageColumn, 
  columns,
  onViewDetails 
}: { 
  item: Record<string, any>; 
  imageColumn: string;
  columns: Column[];
  onViewDetails: () => void;
}) => {
  const imageUrl = item[imageColumn];
  const nameColumn = columns.find(c => c.key.includes('name') || c.key.includes('title'));
  const title = nameColumn ? item[nameColumn.key] : `Item #${item.id || item.doc_id}`;

  return (
    <div 
      className="group bg-white dark:bg-zinc-800 rounded-xl overflow-hidden border border-gray-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer shadow-sm hover:shadow-lg"
      onClick={onViewDetails}
    >
      <div className="aspect-square relative overflow-hidden bg-gray-100 dark:bg-zinc-900">
        <img 
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400?text=No+Image';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <span className="text-white text-sm font-medium truncate">{title}</span>
            <button className="p-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors">
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 space-y-1">
        <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate">{title}</h4>
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
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

// List View Item Component
const ListViewItem = ({ 
  item, 
  imageColumn, 
  columns,
  onViewDetails 
}: { 
  item: Record<string, any>; 
  imageColumn: string;
  columns: Column[];
  onViewDetails: () => void;
}) => {
  const imageUrl = item[imageColumn];
  const nameColumn = columns.find(c => c.key.includes('name') || c.key.includes('title'));
  const title = nameColumn ? item[nameColumn.key] : `Item #${item.id || item.doc_id}`;

  return (
    <div 
      className="group flex items-center gap-4 p-4 bg-white dark:bg-zinc-800 rounded-xl border border-gray-200 dark:border-zinc-700 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 dark:bg-zinc-900 flex-shrink-0">
        <img 
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/80?text=No+Image';
          }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 dark:text-white truncate">{title}</h4>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
          {columns.filter(c => c.type !== 'image_url' && !c.key.includes('name') && !c.key.includes('title')).slice(0, 4).map(col => (
            <span key={col.key} className="flex items-center gap-1">
              <span className="text-gray-400">{col.label}:</span>
              <span className="text-gray-700 dark:text-gray-300">
                {col.type === 'number' && col.key.includes('price') 
                  ? `$${item[col.key]?.toFixed(2)}`
                  : String(item[col.key] ?? '-')}
              </span>
            </span>
          ))}
        </div>
      </div>
      <button className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400">
        <Eye className="w-5 h-5" />
      </button>
    </div>
  );
};

// Table Component
const DataTable = ({ columns, data }: { columns: Column[]; data: Record<string, any>[] }) => {
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
                  {col.type === 'image_url' ? (
                    <img 
                      src={row[col.key]} 
                      alt="" 
                      className="w-10 h-10 rounded object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/40?text=N/A';
                      }}
                    />
                  ) : col.type === 'number' && col.key.includes('price') ? (
                    <span className="font-medium text-gray-900 dark:text-white">
                      ${row[col.key]?.toFixed(2)}
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
                      row[col.key] === 'Discharged' && 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300',
                      row[col.key] === 'Critical' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                      row[col.key] === 'Observation' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                      row[col.key] === 'Processing' && 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                      row[col.key] === 'Pending' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
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
}: { 
  dataset: DatasetInfo;
  isLoading: boolean;
  onRefresh: () => void;
}) => {
  const [queryTime, setQueryTime] = useState<number | null>(null);

  React.useEffect(() => {
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

export default function DatasetViewPage() {
  const params = useParams();
  const router = useRouter();
  const datasetId = params.id as string;

  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedImage, setSelectedImage] = useState<{ url: string; metadata: Record<string, any> } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const itemsPerPage = 12;

  // Get dataset or 404
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

  // Determine available view modes based on data type
  const hasImages = dataset?.dataType === 'images' || dataset?.dataType === 'mixed';
  const isVirtualized = dataset?.type === 'virtualized';

  // Set initial view mode based on data type
  React.useEffect(() => {
    if (dataset) {
      setViewMode(dataset.dataType === 'images' ? 'gallery' : 'table');
    }
  }, [dataset]);

  if (!dataset) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
          <Layers className="w-16 h-16 text-gray-300 dark:text-zinc-700 mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Dataset Not Found</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-4">The dataset you're looking for doesn't exist.</p>
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
                    : hasImages 
                      ? "bg-purple-100 dark:bg-purple-900/30" 
                      : "bg-amber-100 dark:bg-amber-900/30"
                )}>
                  {isVirtualized
                    ? <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    : hasImages 
                      ? <ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      : <Table2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  }
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">{dataset.name}</h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{dataset.description}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isVirtualized && (
                <Link
                  href={`/sharing?dataset=bronze.${dataset.name}`}
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
                  : "bg-amber-500 hover:bg-amber-600"
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

          {/* Stats - only for Persistent */}
          {!isVirtualized && (
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Rows3 className="w-4 h-4" />
                <span>{dataset.totalRows.toLocaleString()} rows</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <HardDrive className="w-4 h-4" />
                <span>{formatBytes(dataset.sizeBytes)}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>{formatDate(dataset.lastIngestion || '')}</span>
              </div>
              {dataset.outputFormat && (
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase">
                    {dataset.outputFormat}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Virtualized Type Badge */}
          {isVirtualized && (
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400">
                <Zap className="w-3 h-3" />
                Virtualized Query
              </span>
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
                  className="pl-10 pr-4 py-2 w-72 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              {hasImages && (
                <>
                  <button
                    onClick={() => setViewMode('gallery')}
                    className={clsx(
                      "p-2 rounded-md transition-all",
                      viewMode === 'gallery' 
                        ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    title="Gallery View"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={clsx(
                      "p-2 rounded-md transition-all",
                      viewMode === 'list' 
                        ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                    title="List View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </>
              )}
              <button
                onClick={() => setViewMode('table')}
                className={clsx(
                  "p-2 rounded-md transition-all",
                  viewMode === 'table' 
                    ? "bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-sm"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                )}
                title="Table View"
              >
                <Table2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Virtualized Preview */}
          {isVirtualized ? (
            <VirtualizedPreview 
              dataset={dataset} 
              isLoading={isLoading} 
              onRefresh={handleRefresh} 
            />
          ) : filteredData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Search className="w-12 h-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">No results found</p>
              <p className="text-sm">Try adjusting your search query</p>
            </div>
          ) : viewMode === 'gallery' && hasImages ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {paginatedData.map((item, idx) => (
                <GalleryCard
                  key={idx}
                  item={item}
                  imageColumn={dataset.imageColumn!}
                  columns={dataset.columns}
                  onViewDetails={() => setSelectedImage({
                    url: item[dataset.imageColumn!],
                    metadata: item
                  })}
                />
              ))}
            </div>
          ) : viewMode === 'list' && hasImages ? (
            <div className="space-y-3 max-w-4xl">
              {paginatedData.map((item, idx) => (
                <ListViewItem
                  key={idx}
                  item={item}
                  imageColumn={dataset.imageColumn!}
                  columns={dataset.columns}
                  onViewDetails={() => setSelectedImage({
                    url: item[dataset.imageColumn!],
                    metadata: item
                  })}
                />
              ))}
            </div>
          ) : (
            <DataTable columns={dataset.columns} data={paginatedData} />
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
                            ? "bg-amber-500 text-white"
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

        {/* Image Modal */}
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

