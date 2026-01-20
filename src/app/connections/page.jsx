'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import { Plus, Database, RefreshCw, MoreVertical, CheckCircle2, AlertCircle, Search, Loader2, LayoutGrid, Activity, HardDrive, Edit, Trash2, FolderOpen } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './page.module.css';

const ORGANIZATION_ID = 1; 

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncingId, setSyncingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchConnections();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8004/api/data-connections/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagination: { limit: 100, query_total: false, skip: 0 }
        })
      });
      const data = await res.json();
      const mappedData = (data.items || []).map(item => ({
        ...item,
        category: item.content_type === 'image' ? 'storage' : 'metadata', 
        type: mapConnectionType(item.connection_type_id),
        lastSync: item.last_sync_time ? new Date(item.last_sync_time).toLocaleString() : 'Never'
      }));
      setConnections(mappedData);
    } catch (e) {
      console.error("Failed to fetch connections", e);
      setConnections([]);
    } finally {
      setLoading(false);
    }
  };

  const mapConnectionType = (typeId) => {
     // This is a placeholder mapping. In a real scenario, you might fetch connection types to map ID to Name.
     const types = { 1: 'Delta Lake', 2: 'PostgreSQL', 3: 'MinIO', 4: 'MySQL' };
     return types[typeId] || 'Unknown';
  };

  const handleSync = async (id) => {
    setSyncingId(id);
    try {
      const res = await fetch(`http://localhost:8004/api/data-connections/${id}/sync`, {
        method: 'POST',
        headers: { 'accept': 'application/json' }
      });
      if (res.ok) {
        // Optimistic update or refetch
         const updatedConnections = connections.map(c => 
          c.id === id ? { ...c, lastSync: 'Syncing...' } : c
        );
        setConnections(updatedConnections);
        // You might want to poll for status or refetch after a delay
        setTimeout(fetchConnections, 2000); 
      } else {
        alert('Sync failed to start');
      }
    } catch (error) {
      alert('Error triggering sync');
    } finally {
      setSyncingId(null);
    }
  };

  const handleTest = async (id) => {
    setTestingId(id);
    try {
      const res = await fetch(`http://localhost:8004/api/data-connections/${id}/test`, {
        method: 'POST',
        headers: { 'accept': 'application/json' }
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
         alert(`Connection ${id} test successful!`);
      } else {
         alert(`Connection test failed: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      alert('Error testing connection');
    } finally {
      setTestingId(null);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this connection?')) {
      try {
        const res = await fetch(`http://localhost:8004/api/data-connections/${id}`, { 
            method: 'DELETE',
            headers: { 'accept': '*/*' }
        });
        if (res.ok) {
          setConnections(prev => prev.filter(c => c.id !== id));
        } else {
          const err = await res.json();
          alert(`Failed to delete: ${err.detail || 'Unknown error'}`);
        }
      } catch (error) {
        alert('Error deleting connection');
      }
    }
    setOpenMenuId(null);
  };

  const handleEdit = (id) => {
    // Navigate to edit page
    // router.push(`/connections/edit/${id}`);
    console.log('Edit connection', id);
    setOpenMenuId(null);
  };

  const handleBrowse = (id) => {
    alert(`Browsing files for connection ${id}... (Feature Coming Soon)`);
  };

  const filteredConnections = connections.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (c.type && c.type.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const relationalConnections = filteredConnections.filter(c => c.category === 'metadata');
  const storageConnections = filteredConnections.filter(c => c.category === 'storage');

  const renderConnectionGrid = (conns) => (
    <div className={styles.grid}>
      {conns.map((conn) => (
        <div key={conn.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <div className={styles.cardTitleRow}>
              <div className={clsx(
                styles.iconBox,
                conn.category === 'metadata' ? styles.iconBoxMetadata : styles.iconBoxStorage
              )}>
                {conn.category === 'metadata' ? <Database className={styles.cardIcon} /> : <HardDrive className={styles.cardIcon} />}
              </div>
              <div>
                <h3 className={styles.connectionName}>{conn.name}</h3>
                <span className={styles.connectionType}>{conn.type}</span>
              </div>
            </div>
            
            <div className="relative">
              <button 
                className={clsx(
                  styles.menuButton,
                  openMenuId === conn.id && styles.menuButtonActive
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenMenuId(openMenuId === conn.id ? null : conn.id);
                }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {openMenuId === conn.id && (
                <div ref={menuRef} className={styles.contextMenu}>
                  <button 
                    className={styles.menuItem}
                    onClick={() => handleEdit(conn.id)}
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button 
                    className={clsx(styles.menuItem, styles.menuItemDelete)}
                    onClick={() => handleDelete(conn.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.cardDetails}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Host</span>
              <span className={styles.hostValue} title={conn.connection_params?.host || conn.connection_params?.endpoint}>
                {conn.connection_params?.host || conn.connection_params?.endpoint || 'N/A'}
              </span>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Status</span>
              <div className={styles.statusWrapper}>
                {conn.status === 'active' || conn.status === 'connected' ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-500" />
                )}
                <span className={(conn.status === 'active' || conn.status === 'connected') ? styles.statusActive : styles.statusError}>
                  {conn.status || 'Unknown'}
                </span>
              </div>
            </div>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Last Sync</span>
              <span className={styles.detailValue}>{conn.lastSync}</span>
            </div>
          </div>

          <div className={styles.actionArea}>
            <button 
              onClick={() => handleTest(conn.id)}
              disabled={testingId === conn.id}
              className={styles.testButton}
              title="Test Connection"
            >
              {testingId === conn.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            </button>
            
            {conn.category === 'metadata' ? (
              <>
                <Link
                  href={`/metadata/${conn.id}`}
                  className={styles.actionButton}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Schema
                </Link>
                <button 
                  onClick={() => handleSync(conn.id)}
                  disabled={syncingId === conn.id}
                  className={styles.syncButton}
                >
                  <RefreshCw className={clsx("w-3.5 h-3.5", syncingId === conn.id && "animate-spin")} />
                  {syncingId === conn.id ? 'Syncing' : 'Sync'}
                </button>
              </>
            ) : (
              <button 
                onClick={() => handleBrowse(conn.id)}
                className={styles.browseButton}
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
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Data Connections</h1>
            <p className={styles.subtitle}>Manage your data sources and integrations.</p>
          </div>
          <Link 
            href="/connections/new" 
            className={styles.newButton}
          >
            <Plus className="w-4 h-4" />
            New Connection
          </Link>
        </div>

        <div className={styles.searchRow}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <input 
              type="text" 
              placeholder="Search connections..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        <div>
          {loading ? (
             <div className="flex justify-center p-10"><Loader2 className="animate-spin w-8 h-8 text-blue-500" /></div>
          ) : (
            <>
            {relationalConnections.length > 0 && (
                <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <Database className={clsx(styles.sectionIcon, styles.iconBlue)} />
                    <h2 className={styles.sectionTitle}>Relational & Metadata</h2>
                    <span className={styles.countBadge}>{relationalConnections.length}</span>
                </div>
                {renderConnectionGrid(relationalConnections)}
                </section>
            )}

            {storageConnections.length > 0 && (
                <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <HardDrive className={clsx(styles.sectionIcon, styles.iconPurple)} />
                    <h2 className={styles.sectionTitle}>Object Storage & Data Lake</h2>
                    <span className={styles.countBadge}>{storageConnections.length}</span>
                </div>
                {renderConnectionGrid(storageConnections)}
                </section>
            )}

            {filteredConnections.length === 0 && (
                <div className={styles.emptyState}>
                <Search className={styles.emptyIcon} />
                <h3 className={styles.emptyTitle}>No connections found</h3>
                <p className={styles.emptyText}>Try adjusting your search terms</p>
                </div>
            )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}