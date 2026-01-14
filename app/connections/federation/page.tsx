'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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

// Mock data for federation workspaces
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
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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

  const handleDeleteFederation = (id: string) => {
    setFederations(federations.filter(f => f.id !== id));
    setDeleteConfirmId(null);
    setMenuOpenId(null);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-4 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <LinkIcon className="w-5 h-5 text-amber-500" />
                <h1 className="font-bold text-xl text-gray-900 dark:text-white">Federation</h1>
              </div>
              <span className="text-xs text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded">
                Cross-Database Relationships
              </span>
            </div>
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Federation
            </button>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create federation groups to define cross-database relationships between your data sources.
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {federations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                  <LinkIcon className="w-8 h-8 text-amber-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  No Federations Yet
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  Create a federation to start defining cross-database relationships between your data sources.
                </p>
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Federation
                </button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {federations.map((federation) => (
                <div 
                  key={federation.id}
                  className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {federation.name}
                        </h3>
                        {federation.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {federation.description}
                          </p>
                        )}
                      </div>
                      <div className="relative ml-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === federation.id ? null : federation.id);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-zinc-800 dark:hover:text-gray-200"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === federation.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                            <Link
                              href={`/connections/federation/${federation.id}`}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </Link>
                            <button 
                              onClick={() => {
                                setDeleteConfirmId(federation.id);
                                setMenuOpenId(null);
                              }}
                              className="w-full text-left px-4 py-2 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Connections */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      {federation.connections.length > 0 ? (
                        federation.connections.map((conn) => (
                          <div 
                            key={conn.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-zinc-800"
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: conn.color }}
                            />
                            <span className="text-gray-600 dark:text-gray-400">{conn.name}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400 italic">No connections yet</span>
                      )}
                    </div>
                  </div>

                  {/* Stats & Actions */}
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" />
                        <span>{federation.tableCount} tables</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>{federation.relationshipCount} relationships</span>
                      </div>
                    </div>
                    <Link
                      href={`/connections/federation/${federation.id}`}
                      className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 group-hover:gap-2 transition-all"
                    >
                      Open
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>

                  {/* Updated */}
                  <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Updated {formatDate(federation.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Card */}
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-gray-100 dark:bg-zinc-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-zinc-700 p-6 flex flex-col items-center justify-center gap-3 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-colors min-h-[200px] group"
              >
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-zinc-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 flex items-center justify-center transition-colors">
                  <Plus className="w-6 h-6 text-gray-400 group-hover:text-amber-500" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400">
                  New Federation
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-amber-500" />
                  New Federation
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setNewFederationName(''); setNewFederationDescription(''); }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., E-commerce Integration"
                    value={newFederationName}
                    onChange={(e) => setNewFederationName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description <span className="text-gray-400">(optional)</span>
                  </label>
                  <textarea 
                    placeholder="Which connections will be related in this federation?"
                    value={newFederationDescription}
                    onChange={(e) => setNewFederationDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setNewFederationName(''); setNewFederationDescription(''); }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFederation}
                  disabled={!newFederationName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Federation
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-6 text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-2">
                  Delete Federation?
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  This will permanently delete this federation and all its relationships. This action cannot be undone.
                </p>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => setDeleteConfirmId(null)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteFederation(deleteConfirmId)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg"
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
