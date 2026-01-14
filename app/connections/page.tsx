'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { Plus, Database, RefreshCw, MoreVertical, CheckCircle2, AlertCircle, Search, Loader2, LayoutGrid, Activity, Cloud, HardDrive, Edit, Trash2, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';

// Extended Mock Data with Categories
const INITIAL_CONNECTIONS = [
  { id: 1, name: 'Production DB', type: 'PostgreSQL', category: 'metadata', status: 'active', lastSync: '2 hours ago', host: 'db-prod.internal' },
  { id: 2, name: 'Analytics Warehouse', type: 'Snowflake', category: 'metadata', status: 'active', lastSync: '5 mins ago', host: 'sf-account.us-east' },
  { id: 3, name: 'Legacy MySQL', type: 'MySQL', category: 'metadata', status: 'error', lastSync: '1 day ago', host: '192.168.1.55' },
  { id: 4, name: 'Main Data Lake', type: 'Amazon S3', category: 'storage', status: 'active', lastSync: '1 hour ago', host: 's3.amazonaws.com' },
  { id: 5, name: 'Backup Storage', type: 'MinIO', category: 'storage', status: 'active', lastSync: '3 days ago', host: 'minio.internal' },
];

export default function ConnectionsPage() {
  const [connections, setConnections] = useState(INITIAL_CONNECTIONS);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [testingId, setTestingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Context Menu State
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSync = async (id: number) => {
    setSyncingId(id);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSyncingId(null);
    setConnections(prev => prev.map(c => c.id === id ? { ...c, lastSync: 'Just now' } : c));
  };

  const handleTest = async (id: number) => {
    setTestingId(id);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setTestingId(null);
    alert(`Connection ${id} test successful!`);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      setConnections(prev => prev.filter(c => c.id !== id));
    }
    setOpenMenuId(null);
  };

  const handleEdit = (id: number) => {
    console.log('Edit connection', id);
    setOpenMenuId(null);
    // Ideally redirect to edit page
  };

  const handleBrowse = (id: number) => {
    alert(`Browsing files for connection ${id}... (Feature Coming Soon)`);
  };

  const filteredConnections = connections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relationalConnections = filteredConnections.filter(c => c.category === 'metadata');
  const storageConnections = filteredConnections.filter(c => c.category === 'storage');

  const renderConnectionGrid = (conns: typeof connections) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {conns.map((conn) => (
        <div key={conn.id} className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-all relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={clsx(
                "w-10 h-10 rounded-lg flex items-center justify-center border",
                conn.category === 'metadata' 
                  ? "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400" 
                  : "bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400"
              )}>
                {conn.category === 'metadata' ? <Database className="w-5 h-5" /> : <HardDrive className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{conn.name}</h3>
                <span className="text-xs text-gray-500">{conn.type}</span>
              </div>
            </div>
            
            <div className="relative">
              <button 
                className={clsx(
                  "text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors",
                  openMenuId === conn.id && "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === conn.id ? null : conn.id);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {openMenuId === conn.id && (
                <div ref={menuRef} className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                  <button 
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                    onClick={() => handleEdit(conn.id)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                    onClick={() => handleDelete(conn.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Host</span>
              <span className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 max-w-[140px] truncate" title={conn.host}>{conn.host}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Status</span>
              <div className="flex items-center gap-1.5">
                {conn.status === 'active' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={`capitalize ${conn.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  {conn.status}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Last Sync</span>
              <span className="text-gray-700 dark:text-gray-300">{conn.lastSync}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
            <button 
              onClick={() => handleTest(conn.id)}
              disabled={testingId === conn.id}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              title="Test Connection"
            >
              {testingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            </button>
            
            {conn.category === 'metadata' ? (
              <>
                <Link
                  href={`/metadata/${conn.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Schema
                </Link>
                <button 
                  onClick={() => handleSync(conn.id)}
                  disabled={syncingId === conn.id}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", syncingId === conn.id && "animate-spin")} />
                  {syncingId === conn.id ? 'Syncing' : 'Sync'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleBrowse(conn.id)}
                className="flex-[2] flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FolderOpen className="w-4 h-4" />
                Browse Files
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto pb-20">
        {/* ... (rest of the layout remains the same) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Connections</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your data sources and integrations.</p>
          </div>
          <Link 
            href="/connections/new" 
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Connection
          </Link>
        </div>

        {/* Filters & Search */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search connections..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        <div className="space-y-10">
          {/* Relational Section */}
          {relationalConnections.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Relational & Metadata</h2>
                <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded-full">{relationalConnections.length}</span>
              </div>
              {renderConnectionGrid(relationalConnections)}
            </section>
          )}

          {/* Storage Section */}
          {storageConnections.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Object Storage & Data Lake</h2>
                <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded-full">{storageConnections.length}</span>
              </div>
              {renderConnectionGrid(storageConnections)}
            </section>
          )}

          {filteredConnections.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 border-dashed">
              <Search className="w-8 h-8 text-gray-400 mx-auto mb-3" />
              <h3 className="text-gray-900 dark:text-white font-medium">No connections found</h3>
              <p className="text-gray-500 text-sm mt-1">Try adjusting your search terms</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
