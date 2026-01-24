'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  Loader2,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { federationService } from '@/lib/api';
import { toast } from 'sonner';

export default function FederationListPage() {
  // Data state
  const [federations, setFederations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFederationName, setNewFederationName] = useState('');
  const [newFederationDescription, setNewFederationDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Menu state
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch federations
  const fetchFederations = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const response = await federationService.list({ page: 1, size: 100 });
      setFederations(response.items || []);
    } catch (err) {
      console.error('Failed to fetch federations:', err);
      setError('Failed to load federations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchFederations();
  }, [fetchFederations]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    fetchFederations(false);
  }, [fetchFederations]);

  // Create federation
  const handleCreateFederation = async () => {
    if (!newFederationName.trim()) return;
    
    setIsCreating(true);
    try {
      const newFederation = await federationService.create({
        name: newFederationName.trim(),
        description: newFederationDescription.trim() || undefined,
      });
      
      setFederations(prev => [newFederation, ...prev]);
      setNewFederationName('');
      setNewFederationDescription('');
      setIsCreateModalOpen(false);
      toast.success('Federation created successfully!');
    } catch (err) {
      console.error('Failed to create federation:', err);
      const error = err;
      toast.error(error?.message || 'Failed to create federation');
    } finally {
      setIsCreating(false);
    }
  };

  // Delete federation
  const handleDeleteFederation = async (id) => {
    setIsDeleting(true);
    try {
      await federationService.delete(id);
      setFederations(prev => prev.filter(f => f.id !== id));
      setDeleteConfirmId(null);
      setMenuOpenId(null);
      toast.success('Federation deleted successfully!');
    } catch (err) {
      console.error('Failed to delete federation:', err);
      const error = err;
      // Handle 502/204 as success (common with delete endpoints)
      if (error?.status === 502 || error?.status === 204 || !error?.status) {
        setFederations(prev => prev.filter(f => f.id !== id));
        setDeleteConfirmId(null);
        setMenuOpenId(null);
      } else {
        toast.error(error?.message || 'Failed to delete federation');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = () => setMenuOpenId(null);
    if (menuOpenId) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [menuOpenId]);

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
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Federation
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Create federation groups to define cross-database relationships between your data sources.
          </p>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Loading State */}
          {isLoading && (
            <div className="h-full flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Loading federations...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to Load
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
                <button 
                  onClick={() => fetchFederations()}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && federations.length === 0 && (
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
          )}

          {/* Federation Grid */}
          {!isLoading && !error && federations.length > 0 && (
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
                              onClick={(e) => {
                                e.stopPropagation();
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
                      {federation.connections && federation.connections.length > 0 ? (
                        federation.connections.map((conn) => (
                          <div 
                            key={conn.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-zinc-800"
                          >
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: conn.color || '#6b7280' }}
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
                        <span>{federation.tables_count || 0} tables</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <LinkIcon className="w-3.5 h-3.5" />
                        <span>{federation.relationships_count || 0} relationships</span>
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
                      <span>Created {formatDate(federation.data_criacao)}</span>
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
                  disabled={isCreating}
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
                    disabled={isCreating}
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
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsCreateModalOpen(false); setNewFederationName(''); setNewFederationDescription(''); }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateFederation}
                  disabled={!newFederationName.trim() || isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isCreating ? 'Creating...' : 'Create Federation'}
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
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteFederation(deleteConfirmId)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
