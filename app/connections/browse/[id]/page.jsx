'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Folder,
  File,
  FileImage,
  FileText,
  FileCode,
  FileArchive,
  FileVideo,
  FileAudio,
  ChevronRight,
  Download,
  ArrowLeft,
  Loader2,
  AlertCircle,
  HardDrive,
  Home,
  RefreshCw,
  Copy,
  Check,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { storageBrowserService } from '@/lib/api/services/storageBrowser';
import { connectionService } from '@/lib/api';
import { toast } from 'sonner';

// =============================================
// Helper functions
// =============================================

function formatFileSize(bytes) {
  if (bytes == null) return '—';
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1);
  return `${size} ${units[i]}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(name, contentType) {
  const ext = name?.split('.').pop()?.toLowerCase();
  const mime = contentType?.toLowerCase() || '';

  if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext)) {
    return <FileImage className="w-5 h-5 text-pink-500" />;
  }
  if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
    return <FileVideo className="w-5 h-5 text-red-500" />;
  }
  if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext)) {
    return <FileAudio className="w-5 h-5 text-orange-500" />;
  }
  if (['zip', 'tar', 'gz', 'rar', '7z', 'bz2'].includes(ext)) {
    return <FileArchive className="w-5 h-5 text-yellow-600" />;
  }
  if (['json', 'xml', 'yaml', 'yml', 'toml', 'py', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'sql', 'sh'].includes(ext)) {
    return <FileCode className="w-5 h-5 text-green-500" />;
  }
  if (['txt', 'md', 'csv', 'log', 'parquet', 'avro', 'orc'].includes(ext)) {
    return <FileText className="w-5 h-5 text-blue-500" />;
  }
  return <File className="w-5 h-5 text-gray-400 dark:text-gray-500" />;
}

function getBreadcrumbSegments(prefix) {
  if (!prefix) return [];
  const parts = prefix.replace(/\/$/, '').split('/');
  return parts.map((part, i) => ({
    name: part,
    path: parts.slice(0, i + 1).join('/') + '/',
  }));
}

// =============================================
// Sub-components
// =============================================

/** Bucket selector dropdown */
function BucketSelector({ buckets, selectedBucket, onSelect, isLoading }) {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading buckets...
      </div>
    );
  }

  return (
    <select
      value={selectedBucket || ''}
      onChange={(e) => onSelect(e.target.value)}
      className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none transition-all min-w-[200px]"
    >
      {buckets.map((bucket) => (
        <option key={bucket.name} value={bucket.name}>
          {bucket.name}
        </option>
      ))}
    </select>
  );
}

/** Breadcrumb navigation */
function Breadcrumbs({ bucket, prefix, onNavigate }) {
  const segments = getBreadcrumbSegments(prefix);

  return (
    <div className="flex items-center gap-1 text-sm overflow-x-auto flex-shrink-0 min-w-0">
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors flex-shrink-0"
        title={bucket}
      >
        <Home className="w-3.5 h-3.5" />
        <span className="max-w-[120px] truncate">{bucket}</span>
      </button>
      {segments.map((segment) => (
        <React.Fragment key={segment.path}>
          <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <button
            onClick={() => onNavigate(segment.path)}
            className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-300 transition-colors truncate max-w-[150px] flex-shrink-0"
            title={segment.name}
          >
            {segment.name}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

/** File detail side panel */
function FileDetailPanel({ item, connectionId, bucket, onClose }) {
  const [info, setInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!item || item.type === 'folder') return;

    let cancelled = false;
    setIsLoading(true);
    setError(null);
    setInfo(null);

    storageBrowserService
      .getObjectInfo(connectionId, { bucket, key: item.path })
      .then((data) => {
        if (!cancelled) setInfo(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Failed to load file details');
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [item, connectionId, bucket]);

  const handleDownload = useCallback(async () => {
    if (!item) return;
    setIsDownloading(true);
    try {
      const result = await storageBrowserService.getDownloadUrl(connectionId, {
        bucket,
        key: item.path,
      });
      window.open(result.url, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to generate download URL');
    } finally {
      setIsDownloading(false);
    }
  }, [item, connectionId, bucket]);

  const handleCopyPath = useCallback(() => {
    if (!item) return;
    navigator.clipboard.writeText(item.path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [item]);

  if (!item) return null;

  return (
    <div className="w-80 border-l border-gray-200 dark:border-zinc-800 flex flex-col flex-shrink-0 bg-gray-50/50 dark:bg-zinc-950/50">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-800">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
          File Details
        </h3>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200 dark:hover:bg-zinc-800 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* File Icon & Name */}
        <div className="flex flex-col items-center text-center gap-3 pb-4 border-b border-gray-200 dark:border-zinc-800">
          <div className="w-16 h-16 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 flex items-center justify-center">
            {getFileIcon(item.name, item.content_type)}
          </div>
          <div className="min-w-0 w-full">
            <p className="font-medium text-gray-900 dark:text-white text-sm break-all">
              {item.name}
            </p>
            <button
              onClick={handleCopyPath}
              className="inline-flex items-center gap-1 mt-1 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="Copy path"
            >
              {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
              <span className="truncate max-w-[200px]">{item.path}</span>
            </button>
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            <DetailRow label="Size" value={formatFileSize(info?.size ?? item.size)} />
            <DetailRow label="Last Modified" value={formatDate(info?.last_modified ?? item.last_modified)} />
            <DetailRow label="Content Type" value={info?.content_type || item.content_type || '—'} />
            <DetailRow label="ETag" value={info?.etag || item.etag || '—'} mono />
            {info?.storage_class && (
              <DetailRow label="Storage Class" value={info.storage_class} />
            )}
            {info?.metadata && Object.keys(info.metadata).length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Metadata</span>
                <div className="mt-1 space-y-1">
                  {Object.entries(info.metadata).map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span className="text-gray-500">{k}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-mono">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Download Button */}
      <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {isDownloading ? 'Generating URL...' : 'Download'}
        </button>
      </div>
    </div>
  );
}

/** Single detail row in the panel */
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
      <span
        className={clsx(
          'text-sm text-gray-800 dark:text-gray-200 break-all',
          mono && 'font-mono text-xs'
        )}
      >
        {value}
      </span>
    </div>
  );
}

// =============================================
// Main Page Component
// =============================================

export default function BrowseFilesPage() {
  const params = useParams();
  const connectionId = parseInt(params.id, 10);

  // Connection info
  const [connectionName, setConnectionName] = useState('');
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // Browser state
  const [buckets, setBuckets] = useState([]);
  const [selectedBucket, setSelectedBucket] = useState(null);
  const [prefix, setPrefix] = useState('');
  const [items, setItems] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [totalFolders, setTotalFolders] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const [continuationToken, setContinuationToken] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Loading states
  const [isBucketsLoading, setIsBucketsLoading] = useState(false);
  const [isObjectsLoading, setIsObjectsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Error states
  const [bucketsError, setBucketsError] = useState(null);
  const [objectsError, setObjectsError] = useState(null);

  // Fetch connection info + buckets on mount
  useEffect(() => {
    if (!connectionId || isNaN(connectionId)) return;

    let cancelled = false;

    async function load() {
      setConnectionLoading(true);
      setConnectionError(null);

      try {
        // Fetch connection info and buckets in parallel
        const [conn, bucketsData] = await Promise.all([
          connectionService.get(connectionId),
          storageBrowserService.listBuckets(connectionId),
        ]);

        if (cancelled) return;

        setConnectionName(conn.name);
        setBuckets(bucketsData.buckets);

        if (bucketsData.buckets.length > 0) {
          setSelectedBucket(bucketsData.buckets[0].name);
        }
      } catch (err) {
        if (!cancelled) {
          setConnectionError(err.message || 'Failed to load connection');
        }
      } finally {
        if (!cancelled) {
          setConnectionLoading(false);
          setIsBucketsLoading(false);
        }
      }
    }

    setIsBucketsLoading(true);
    load();

    return () => { cancelled = true; };
  }, [connectionId]);

  // Fetch objects when bucket, prefix, or refreshKey changes
  useEffect(() => {
    if (!selectedBucket) return;

    let cancelled = false;
    setIsObjectsLoading(true);
    setObjectsError(null);
    setItems([]);
    setContinuationToken(null);
    setIsTruncated(false);
    setSelectedFile(null);

    storageBrowserService
      .listObjects(connectionId, { bucket: selectedBucket, prefix })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setTotalFiles(data.total_files);
        setTotalFolders(data.total_folders);
        setIsTruncated(data.is_truncated);
        setContinuationToken(data.next_continuation_token);
      })
      .catch((err) => {
        if (!cancelled) setObjectsError(err.message || 'Failed to load objects');
      })
      .finally(() => {
        if (!cancelled) setIsObjectsLoading(false);
      });

    return () => { cancelled = true; };
  }, [connectionId, selectedBucket, prefix, refreshKey]);

  // Load more items (pagination)
  const handleLoadMore = useCallback(async () => {
    if (!continuationToken || isLoadingMore) return;
    setIsLoadingMore(true);

    try {
      const data = await storageBrowserService.listObjects(connectionId, {
        bucket: selectedBucket,
        prefix,
        continuation_token: continuationToken,
      });
      setItems((prev) => [...prev, ...data.items]);
      setTotalFiles(data.total_files);
      setTotalFolders(data.total_folders);
      setIsTruncated(data.is_truncated);
      setContinuationToken(data.next_continuation_token);
    } catch (err) {
      toast.error(err.message || 'Failed to load more items');
    } finally {
      setIsLoadingMore(false);
    }
  }, [connectionId, selectedBucket, prefix, continuationToken, isLoadingMore]);

  // Navigate into a folder
  const handleNavigate = useCallback((newPrefix) => {
    setPrefix(newPrefix);
    setSelectedFile(null);
  }, []);

  // Handle bucket change
  const handleBucketChange = useCallback((bucketName) => {
    setSelectedBucket(bucketName);
    setPrefix('');
    setSelectedFile(null);
  }, []);

  // Go back one level
  const handleGoBack = useCallback(() => {
    if (!prefix) return;
    const parts = prefix.replace(/\/$/, '').split('/');
    parts.pop();
    const newPrefix = parts.length > 0 ? parts.join('/') + '/' : '';
    setPrefix(newPrefix);
    setSelectedFile(null);
  }, [prefix]);

  // Refresh current directory
  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  // Handle item click
  const handleItemClick = useCallback((item) => {
    if (item.type === 'folder') {
      handleNavigate(item.path);
    } else {
      setSelectedFile((prev) => (prev?.path === item.path ? null : item));
    }
  }, [handleNavigate]);

  // Handle download from list row
  const handleDownload = useCallback(async (e, item) => {
    e.stopPropagation();
    try {
      const result = await storageBrowserService.getDownloadUrl(connectionId, {
        bucket: selectedBucket,
        key: item.path,
      });
      window.open(result.url, '_blank');
    } catch (err) {
      toast.error(err.message || 'Failed to generate download URL');
    }
  }, [connectionId, selectedBucket]);

  const hasItems = items.length > 0;

  // Full-page error state
  if (connectionError && !connectionLoading) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col">
          <header className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
            <div className="flex items-center gap-4">
              <Link
                href="/connections"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Browse Files</h1>
            </div>
          </header>
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">{connectionError}</p>
            <Link
              href="/connections"
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Connections
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col">
        {/* Page Header */}
        <header className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0">
          <div className="flex items-center gap-4">
            <Link
              href="/connections"
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 flex items-center justify-center">
                <HardDrive className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Browse Files
                </h1>
                {connectionLoading ? (
                  <div className="flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Loading...</span>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">{connectionName}</p>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Loading state */}
        {connectionLoading && (
          <div className="flex-1 flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="text-sm text-gray-500">Loading connection...</span>
          </div>
        )}

        {/* Main content after loading */}
        {!connectionLoading && !connectionError && (
          <>
            {/* Toolbar: Bucket selector + Breadcrumbs + Refresh */}
            <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 overflow-hidden">
              <BucketSelector
                buckets={buckets}
                selectedBucket={selectedBucket}
                onSelect={handleBucketChange}
                isLoading={isBucketsLoading}
              />

              <div className="h-5 w-px bg-gray-200 dark:bg-zinc-700 flex-shrink-0" />

              {prefix && (
                <button
                  onClick={handleGoBack}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              {selectedBucket && (
                <Breadcrumbs
                  bucket={selectedBucket}
                  prefix={prefix}
                  onNavigate={handleNavigate}
                />
              )}

              <div className="flex-1" />

              <button
                onClick={handleRefresh}
                disabled={isObjectsLoading}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors flex-shrink-0 disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={clsx('w-4 h-4', isObjectsLoading && 'animate-spin')} />
              </button>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 min-h-0">
              {/* File List */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Buckets error */}
                {bucketsError && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-md">{bucketsError}</p>
                  </div>
                )}

                {/* Objects loading */}
                {isObjectsLoading && !bucketsError && (
                  <div className="flex items-center justify-center flex-1 gap-2">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-500">Loading...</span>
                  </div>
                )}

                {/* Objects error */}
                {objectsError && !isObjectsLoading && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
                    <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400 text-center max-w-md">{objectsError}</p>
                  </div>
                )}

                {/* Empty state */}
                {!isObjectsLoading && !objectsError && !bucketsError && !hasItems && selectedBucket && (
                  <div className="flex flex-col items-center justify-center flex-1 gap-3 p-8">
                    <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Folder className="w-7 h-7 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">
                      {prefix ? 'This folder is empty' : 'This bucket is empty'}
                    </p>
                  </div>
                )}

                {/* Items Table */}
                {!isObjectsLoading && !objectsError && !bucketsError && hasItems && (
                  <div className="flex-1 overflow-y-auto">
                    {/* Table Header */}
                    <div className="grid grid-cols-[1fr_100px_180px_40px] gap-2 px-6 py-2.5 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900 z-10">
                      <span>Name</span>
                      <span className="text-right">Size</span>
                      <span className="text-right">Modified</span>
                      <span />
                    </div>

                    {/* Items */}
                    {items.map((item) => (
                      <div
                        key={item.path}
                        role="button"
                        tabIndex={0}
                        onClick={() => handleItemClick(item)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleItemClick(item); } }}
                        className={clsx(
                          'w-full grid grid-cols-[1fr_100px_180px_40px] gap-2 px-6 py-3 text-sm items-center transition-colors text-left border-b border-gray-50 dark:border-zinc-800/50 cursor-pointer',
                          'hover:bg-gray-50 dark:hover:bg-zinc-800/50',
                          selectedFile?.path === item.path && 'bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-50 dark:hover:bg-purple-900/20'
                        )}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {item.type === 'folder' ? (
                            <Folder className="w-5 h-5 text-purple-500 flex-shrink-0" />
                          ) : (
                            getFileIcon(item.name, item.content_type)
                          )}
                          <span className="truncate text-gray-900 dark:text-white">
                            {item.name}
                          </span>
                          {item.type === 'folder' && (
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          )}
                        </div>
                        <span className="text-right text-gray-500 text-xs tabular-nums">
                          {item.type === 'file' ? formatFileSize(item.size) : '—'}
                        </span>
                        <span className="text-right text-gray-500 text-xs">
                          {item.type === 'file' ? formatDate(item.last_modified) : '—'}
                        </span>
                        <div className="flex justify-end">
                          {item.type === 'file' && (
                            <button
                              onClick={(e) => handleDownload(e, item)}
                              className="p-1 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded transition-colors"
                              title="Download"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* Load More */}
                    {isTruncated && (
                      <div className="flex justify-center py-4 border-t border-gray-100 dark:border-zinc-800">
                        <button
                          onClick={handleLoadMore}
                          disabled={isLoadingMore}
                          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isLoadingMore && (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          )}
                          {isLoadingMore ? 'Loading...' : 'Load more items'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* File Detail Panel */}
              {selectedFile && (
                <FileDetailPanel
                  item={selectedFile}
                  connectionId={connectionId}
                  bucket={selectedBucket}
                  onClose={() => setSelectedFile(null)}
                />
              )}
            </div>

            {/* Footer / Status Bar */}
            <div className="flex items-center justify-between px-6 py-2.5 border-t border-gray-200 dark:border-zinc-800 text-xs text-gray-500 flex-shrink-0 bg-gray-50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-4">
                {!isObjectsLoading && !bucketsError && selectedBucket && (
                  <>
                    <span>{totalFolders} folder{totalFolders !== 1 ? 's' : ''}</span>
                    <span>{totalFiles} file{totalFiles !== 1 ? 's' : ''}</span>
                  </>
                )}
              </div>
              <div>
                {selectedFile && (
                  <span className="text-purple-600 dark:text-purple-400 font-medium">
                    {selectedFile.name}
                  </span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
