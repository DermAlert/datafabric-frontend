'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  X, 
  Link as LinkIcon, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  Layers, 
  Calendar
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_WORKSPACES = [
  {
    id: 'ws_1',
    name: 'E-commerce Integration',
    description: 'User data federation between main database and user profiles',
    connections: [
      { id: 'conn_pg', name: 'PostgreSQL Production', color: '#3b82f6' },
      { id: 'conn_mongo', name: 'MongoDB UserData', color: '#a855f7' },
    ],
    tableCount: 3,
    relationshipCount: 2,
    updatedAt: '2026-01-10T14:30:00Z',
  },
  {
    id: 'ws_2',
    name: 'Inventory Sync',
    description: 'Product and inventory data across systems',
    connections: [
      { id: 'conn_pg', name: 'PostgreSQL Production', color: '#3b82f6' },
      { id: 'conn_mysql', name: 'MySQL Analytics', color: '#22c55e' },
    ],
    tableCount: 4,
    relationshipCount: 3,
    updatedAt: '2026-01-09T10:15:00Z',
  },
  {
    id: 'ws_3',
    name: 'Analytics Pipeline',
    description: 'Sales and order analytics federation',
    connections: [
      { id: 'conn_mongo', name: 'MongoDB UserData', color: '#a855f7' },
      { id: 'conn_mysql', name: 'MySQL Analytics', color: '#22c55e' },
    ],
    tableCount: 2,
    relationshipCount: 1,
    updatedAt: '2026-01-08T16:45:00Z',
  },
];

export default function FederationListPage() {
  const [federations, setFederations] = useState(MOCK_WORKSPACES);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFederationName, setNewFederationName] = useState('');
  const [newFederationDescription, setNewFederationDescription] = useState('');
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const handleCreateFederation = () => {
    if (!newFederationName.trim()) return;
    
    const newFederation = {
      id: `fed_${Date.now()}`,
      name: newFederationName.trim(),
      description: newFederationDescription.trim(),
      connections: [],
      tableCount: 0,
      relationshipCount: 0,
      updatedAt: new Date().toISOString(),
    };
    
    setFederations([newFederation, ...federations]);
    setNewFederationName('');
    setNewFederationDescription('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteFederation = (id) => {
    setFederations(federations.filter(f => f.id !== id));
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTop}>
            <div className={styles.headerLeft}>
              <div className={styles.titleGroup}>
                <LinkIcon className={styles.titleIcon} />
                <h1 className={styles.title}>Federation</h1>
              </div>
              <span className={styles.badge}>
                Cross-Database Relationships
              </span>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className={styles.newButton}
            >
              <Plus className="w-4 h-4" />
              New Federation
            </button>
          </div>
          <p className={styles.description}>
            Create federation groups to define cross-database relationships between your data sources.
          </p>
        </header>

        <div className={styles.content}>
          {federations.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyWrapper}>
                <div className={styles.emptyIconBox}>
                  <LinkIcon className={styles.emptyIcon} />
                </div>
                <h2 className={styles.emptyTitle}>
                  No Federations Yet
                </h2>
                <p className={styles.emptyText}>
                  Create a federation to start defining cross-database relationships between your data sources.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className={styles.newButton}
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Federation
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {federations.map((federation) => (
                <div 
                  key={federation.id}
                  className={styles.card}
                >
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderContent}>
                      <div className={styles.cardInfo}>
                        <h3 className={styles.cardTitle}>
                          {federation.name}
                        </h3>
                        {federation.description && (
                          <p className={styles.cardDesc}>
                            {federation.description}
                          </p>
                        )}
                      </div>
                      <div className={styles.menuWrapper}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === federation.id ? null : federation.id);
                          }}
                          className={styles.menuButton}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === federation.id && (
                          <div className={styles.contextMenu}>
                            <Link
                              href={`/connections/federation/${federation.id}`}
                              className={styles.menuItem}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(federation.id);
                                setMenuOpenId(null);
                              }}
                              className={clsx(styles.menuItem, styles.menuItemDelete)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className={styles.connectionsRow}>
                    <div className={styles.connectionList}>
                      {federation.connections.length > 0 ? (
                        federation.connections.map((conn) => (
                          <div 
                            key={conn.id}
                            className={styles.connectionBadge}
                          >
                            <div 
                              className={styles.connectionDot} 
                              style={{ backgroundColor: conn.color }}
                            />
                            <span className={styles.connectionName}>{conn.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className={styles.emptyConnections}>No connections yet</span>
                      )}
                    </div>
                  </div>

                  <div className={styles.statsRow}>
                    <div className={styles.statsGroup}>
                      <div className={styles.statItem}>
                        <Layers className={styles.statIcon} />
                        <span>{federation.tableCount} tables</span>
                      </div>
                      <div className={styles.statItem}>
                        <LinkIcon className={styles.statIcon} />
                        <span>{federation.relationshipCount} relationships</span>
                      </div>
                    </div>
                    <Link
                      href={`/connections/federation/${federation.id}`}
                      className={styles.openLink}
                    >
                      Open
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  <div className={styles.updatedRow}>
                    <div className={styles.updatedContent}>
                      <Calendar className="w-3 h-3" />
                      <span>Updated {formatDate(federation.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className={styles.addCard}
              >
                <div className={styles.addIconBox}>
                  <Plus className={styles.addIcon} />
                </div>
                <span className={styles.addText}>
                  New Federation
                </span>
              </button>
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <LinkIcon className={styles.titleIcon} />
                  New Federation
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setNewFederationName(''); setNewFederationDescription(''); }} 
                  className={styles.closeButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., E-commerce Integration"
                    value={newFederationName}
                    onChange={(e) => setNewFederationName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Description <span className={styles.optional}>(optional)</span>
                  </label>
                  <textarea 
                    placeholder="Which connections will be related in this federation?"
                    value={newFederationDescription}
                    onChange={(e) => setNewFederationDescription(e.target.value)}
                    rows={3}
                    className={styles.textarea}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setNewFederationName(''); setNewFederationDescription(''); }} 
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFederation}
                  disabled={!newFederationName.trim()}
                  className={styles.createButton}
                >
                  Create Federation
                </button>
              </div>
            </div>
          </div>
        )}

        {deleteConfirmId && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.confirmBody}>
                <div className={styles.confirmIconBox}>
                  <Trash2 className={styles.confirmIcon} />
                </div>
                <h3 className={styles.confirmTitle}>
                  Delete Federation?
                </h3>
                <p className={styles.confirmText}>
                  This will permanently delete this federation and all its relationships. This action cannot be undone.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteFederation(deleteConfirmId)}
                  className={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}