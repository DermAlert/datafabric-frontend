'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
  ChevronRight,
  Palette,
  Loader2,
  RefreshCw,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  List,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { equivalenceService } from '../../../lib/api/services/equivalence';
import { toast } from 'sonner';

// Data types with icons
const DATA_TYPES = [
  { value: 'STRING', label: 'String', icon: Type },
  { value: 'INTEGER', label: 'Integer', icon: Hash },
  { value: 'DECIMAL', label: 'Decimal', icon: Hash },
  { value: 'DATE', label: 'Date', icon: Calendar },
  { value: 'DATETIME', label: 'DateTime', icon: Calendar },
  { value: 'BOOLEAN', label: 'Boolean', icon: ToggleLeft },
  { value: 'ENUM', label: 'Enum', icon: List },
];

const COLOR_OPTIONS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export default function SemanticDomainsPage() {
  const [domains, setDomains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Terms for selected domain
  const [domainTerms, setDomainTerms] = useState([]);
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);

  // Form State (Create)
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDescription, setNewDomainDescription] = useState('');
  const [newDomainColor, setNewDomainColor] = useState(COLOR_OPTIONS[0]);
  
  // Form State (Edit)
  const [editDomainName, setEditDomainName] = useState('');
  const [editDomainDescription, setEditDomainDescription] = useState('');
  const [editDomainColor, setEditDomainColor] = useState(COLOR_OPTIONS[0]);
  
  const getDataTypeIcon = (dataType) => {
    const type = DATA_TYPES.find(t => t.value === dataType);
    return type?.icon || Type;
  };

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await equivalenceService.listSemanticDomains();
      setDomains(data);
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      toast.error('Failed to load semantic domains');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  // Fetch terms when a domain is selected
  const fetchDomainTerms = useCallback(async (domainId) => {
    if (!domainId) {
      setDomainTerms([]);
      return;
    }
    setIsLoadingTerms(true);
    try {
      const terms = await equivalenceService.listDataDictionary({ semantic_domain_id: domainId });
      setDomainTerms(terms || []);
    } catch (error) {
      console.error('Failed to fetch domain terms:', error);
      setDomainTerms([]);
    } finally {
      setIsLoadingTerms(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomain?.id) {
      fetchDomainTerms(selectedDomain.id);
    } else {
      setDomainTerms([]);
    }
  }, [selectedDomain?.id, fetchDomainTerms]);

  const filteredDomains = domains.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateDomain = async () => {
    if (!newDomainName.trim()) return;
    
    setIsCreating(true);
    try {
      const created = await equivalenceService.createSemanticDomain({
        name: newDomainName.trim(),
        description: newDomainDescription.trim(),
        color: newDomainColor,
      });
      
      setDomains(prev => [...prev, created]);
      toast.success('Domain created successfully');
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Create failed:', error);
      toast.error(error.message || 'Failed to create domain');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewDomainName('');
    setNewDomainDescription('');
    setNewDomainColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteDomain = async (id) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    setIsDeleting(true);
    try {
      await equivalenceService.deleteSemanticDomain(id);
      setDomains(prev => prev.filter(d => d.id !== id));
      if (selectedDomain?.id === id) setSelectedDomain(null);
      toast.success('Domain deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete domain');
    } finally {
      setIsDeleting(false);
      setMenuOpenId(null);
    }
  };

  const openEditModal = (domain) => {
    setEditDomainName(domain.name);
    setEditDomainDescription(domain.description || '');
    setEditDomainColor(domain.color || COLOR_OPTIONS[0]);
    setIsEditModalOpen(true);
    setMenuOpenId(null);
  };

  const handleUpdateDomain = async () => {
    if (!editDomainName.trim() || !selectedDomain) return;
    
    setIsUpdating(true);
    try {
      const updated = await equivalenceService.updateSemanticDomain(selectedDomain.id, {
        name: editDomainName.trim(),
        description: editDomainDescription.trim(),
        color: editDomainColor,
      });
      
      setDomains(prev => prev.map(d => d.id === updated.id ? { ...d, ...updated } : d));
      setSelectedDomain(prev => ({ ...prev, ...updated }));
      toast.success('Domain updated successfully');
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update domain');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex bg-gray-50 dark:bg-zinc-950">
        {/* Left Panel - Domains List */}
        <div className="w-96 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-amber-500" />
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">Semantic Domains</h1>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
            
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>

          {/* Domains List */}
          <div className="flex-1 overflow-auto p-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
              </div>
            ) : filteredDomains.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No domains found</p>
                <button 
                  onClick={fetchDomains}
                  className="mt-2 text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 mx-auto"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDomains.map((domain) => (
                  <div
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedDomain(domain)}
                    className={clsx(
                      "w-full text-left p-3 rounded-lg transition-all cursor-pointer",
                      selectedDomain?.id === domain.id
                        ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-lg"
                            style={{ backgroundColor: domain.color || '#ccc' }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white text-sm">
                            {domain.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6 truncate">
                          {domain.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 ml-6 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <BookOpen className="w-3 h-3" />
                            {domain.terms_count || 0} terms
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === domain.id ? null : domain.id);
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === domain.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDomain(domain);
                                openEditModal(domain);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(domain.id);
                              }}
                              className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Domain Details */}
        <div className="flex-1 overflow-auto">
          {selectedDomain ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-8 h-8 rounded-xl"
                        style={{ backgroundColor: selectedDomain.color || '#ccc' }}
                      />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedDomain.name}
                      </h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-11">
                      {selectedDomain.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 ml-11">
                      Created: {formatDate(selectedDomain.data_criacao)}
                    </p>
                  </div>
                  <button 
                    onClick={() => openEditModal(selectedDomain)}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                  >
                    Edit Domain
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dictionary Terms
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedDomain.terms_count || 0}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Terms from Data Dictionary linked to this domain
                    </p>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Color
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div 
                        className="w-6 h-6 rounded-lg"
                        style={{ backgroundColor: selectedDomain.color || '#ccc' }}
                      />
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {selectedDomain.color}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Terms in this Domain */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-gray-400" />
                      Terms in this Domain
                    </h3>
                    <Link 
                      href={`/equivalence/data-dictionary?domain=${selectedDomain.id}`}
                      className="text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium flex items-center gap-1"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {isLoadingTerms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    </div>
                  ) : domainTerms.length === 0 ? (
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6 text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No terms in this domain yet.
                      </p>
                      <Link 
                        href={`/equivalence/data-dictionary?domain=${selectedDomain.id}`}
                        className="inline-flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      >
                        <Plus className="w-4 h-4" />
                        Create first term
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {domainTerms.map((term) => {
                        const TypeIcon = getDataTypeIcon(term.data_type);
                        return (
                          <Link
                            key={term.id}
                            href={`/equivalence/data-dictionary?domain=${selectedDomain.id}&term=${term.id}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-900/10 transition-colors group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-2 rounded-lg bg-gray-100 dark:bg-zinc-700 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                                <TypeIcon className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                  {term.name}
                                </div>
                                {term.display_name && term.display_name !== term.name && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                    {term.display_name}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-400 dark:text-gray-500">
                                    {term.data_type}
                                  </span>
                                  {term.standard_values && term.standard_values.length > 0 && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      • {term.standard_values.length} values
                                    </span>
                                  )}
                                  {term.column_groups_count > 0 && (
                                    <span className="text-xs text-gray-400 dark:text-gray-500">
                                      • {term.column_groups_count} groups
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <Folder className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Domain</h3>
              <p className="text-sm text-center max-w-md">
                Semantic domains organize your dictionary terms into logical categories for easier management.
              </p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Folder className="w-5 h-5 text-amber-500" />
                  New Semantic Domain
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., Demographics"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    placeholder="Describe what kind of data belongs in this domain..."
                    value={newDomainDescription}
                    onChange={(e) => setNewDomainDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewDomainColor(color)}
                        className={clsx(
                          "w-8 h-8 rounded-lg transition-all",
                          newDomainColor === color 
                            ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900" 
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateDomain}
                  disabled={!newDomainName.trim() || isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Domain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-amber-500" />
                  Edit Semantic Domain
                </h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Domain Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., Demographics"
                    value={editDomainName}
                    onChange={(e) => setEditDomainName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    placeholder="Describe what kind of data belongs in this domain..."
                    value={editDomainDescription}
                    onChange={(e) => setEditDomainDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setEditDomainColor(color)}
                        className={clsx(
                          "w-8 h-8 rounded-lg transition-all",
                          editDomainColor === color 
                            ? "ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-zinc-900" 
                            : "hover:scale-110"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => setIsEditModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateDomain}
                  disabled={!editDomainName.trim() || isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}