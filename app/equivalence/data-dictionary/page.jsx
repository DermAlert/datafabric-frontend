'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  BookOpen,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Folder,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  List,
  Tag,
  Loader2,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
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

function normalizeTokens(items) {
  const out = [];
  const seen = new Set();
  for (const raw of items) {
    const v = String(raw ?? '').trim();
    if (!v) continue;
    const key = v.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

function splitBySeparators(text) {
  return String(text ?? '')
    .split(/[,\s;]+/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function TokensInput({
  label,
  placeholder,
  helper,
  tokens,
  onChange,
}) {
  const [draft, setDraft] = useState('');

  const commit = (raw, forceAll = false) => {
    const s = String(raw ?? '');
    const endsWithSeparator = /[,\s;]$/.test(s);
    const parts = splitBySeparators(s);

    if (parts.length === 0) {
      setDraft('');
      return;
    }

    if (forceAll || endsWithSeparator) {
      onChange(normalizeTokens([...(tokens || []), ...parts]));
      setDraft('');
      return;
    }

    // keep last as draft (still being typed)
    const last = parts[parts.length - 1];
    const toCommit = parts.slice(0, -1);
    if (toCommit.length) {
      onChange(normalizeTokens([...(tokens || []), ...toCommit]));
    }
    setDraft(last);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm flex flex-wrap gap-2 items-center">
        {(tokens || []).map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => onChange((tokens || []).filter((x) => x !== t))}
              className="text-blue-700/70 hover:text-blue-700 dark:text-blue-300/70 dark:hover:text-blue-300"
              aria-label={`Remove ${t}`}
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            if (/[,\s;]/.test(v)) {
              commit(v, false);
            } else {
              setDraft(v);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab' || e.key === ',' || e.key === ';' || e.key === ' ') {
              e.preventDefault();
              commit(draft, true);
              return;
            }
            if (e.key === 'Backspace' && !draft && (tokens || []).length > 0) {
              onChange((tokens || []).slice(0, -1));
            }
          }}
          onBlur={() => commit(draft, true)}
          placeholder={(tokens || []).length ? '' : placeholder}
          className="flex-1 min-w-[180px] bg-transparent outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
        />
      </div>
      {helper ? <p className="text-xs text-gray-500">{helper}</p> : null}
    </div>
  );
}

export default function DataDictionaryPage() {
  const searchParams = useSearchParams();
  const domainParam = searchParams.get('domain');
  const termParam = searchParams.get('term');

  const [terms, setTerms] = useState([]);
  const [domains, setDomains] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // Query-param driven selection (deep-linking)
  const [pendingTermId, setPendingTermId] = useState(null);
  
  const [isLoadingTerms, setIsLoadingTerms] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // New term form state
  const [newTermName, setNewTermName] = useState('');
  const [newTermDisplayName, setNewTermDisplayName] = useState('');
  const [newTermDescription, setNewTermDescription] = useState('');
  const [newTermDomain, setNewTermDomain] = useState('');
  const [newTermDataType, setNewTermDataType] = useState('STRING');
  const [newTermValues, setNewTermValues] = useState([]);
  const [newTermSynonyms, setNewTermSynonyms] = useState([]);

  // Edit term form state
  const [editTermName, setEditTermName] = useState('');
  const [editTermDisplayName, setEditTermDisplayName] = useState('');
  const [editTermDescription, setEditTermDescription] = useState('');
  const [editTermDomain, setEditTermDomain] = useState('');
  const [editTermDataType, setEditTermDataType] = useState('STRING');
  const [editTermValues, setEditTermValues] = useState([]);
  const [editTermSynonyms, setEditTermSynonyms] = useState([]);

  // Fetch Domains for sidebar
  useEffect(() => {
    const loadDomains = async () => {
      try {
        const data = await equivalenceService.listSemanticDomains();
        setDomains(data);
      } catch (error) {
        console.error('Failed to load domains:', error);
      }
    };
    loadDomains();
  }, []);

  // Apply query params (domain/term) to state
  useEffect(() => {
    if (domainParam) {
      const parsedDomain = parseInt(domainParam, 10);
      if (!Number.isNaN(parsedDomain)) {
        setSelectedDomain(parsedDomain);
      }
    }

    if (termParam) {
      const parsedTerm = parseInt(termParam, 10);
      setPendingTermId(Number.isNaN(parsedTerm) ? null : parsedTerm);
    } else {
      setPendingTermId(null);
    }
  }, [domainParam, termParam]);

  // Fetch Terms
  const fetchTerms = useCallback(async () => {
    setIsLoadingTerms(true);
    try {
      // If a domain is selected, filter by it in the API call
      const filters = selectedDomain ? { semantic_domain_id: selectedDomain } : undefined;
      const data = await equivalenceService.listDataDictionary(filters);
      setTerms(data);
    } catch (error) {
      console.error('Failed to fetch terms:', error);
      toast.error('Failed to load data dictionary');
    } finally {
      setIsLoadingTerms(false);
    }
  }, [selectedDomain]);

  useEffect(() => {
    fetchTerms();
  }, [fetchTerms]);

  // Auto-select term from query params (after list loads, or via direct fetch)
  useEffect(() => {
    let cancelled = false;

    async function ensureSelected() {
      if (!pendingTermId) return;

      const inList = terms.find((t) => t.id === pendingTermId);
      if (inList) {
        setSelectedTerm(inList);
        return;
      }

      try {
        const fetched = await equivalenceService.getDataDictionaryTerm(pendingTermId);
        if (!cancelled) setSelectedTerm(fetched);
      } catch (error) {
        console.error('Failed to fetch term by id:', error);
      }
    }

    ensureSelected();
    return () => {
      cancelled = true;
    };
  }, [pendingTermId, terms]);

  const filteredTerms = terms.filter(t => {
    const q = searchQuery.toLowerCase();
    return (
      t.name.toLowerCase().includes(q) ||
      (t.display_name || '').toLowerCase().includes(q) ||
      (t.synonyms || []).some(s => s.toLowerCase().includes(q))
    );
  });

  const getDomain = (domainId) => domains.find(d => d.id === domainId);

  const getDataTypeIcon = (dataType) => {
    const type = DATA_TYPES.find(t => t.value === dataType);
    return type?.icon || Type;
  };

  const handleCreateTerm = async () => {
    if (!newTermName.trim() || !newTermDomain) return;
    
    setIsCreating(true);
    try {
      const payload = {
        name: newTermName.trim(),
        display_name: newTermDisplayName.trim() || newTermName.trim(),
        description: newTermDescription.trim(),
        semantic_domain_id: parseInt(newTermDomain),
        data_type: newTermDataType,
        standard_values: normalizeTokens(newTermValues || []),
        synonyms: normalizeTokens(newTermSynonyms || []),
      };

      const created = await equivalenceService.createDataDictionaryTerm(payload);
      
      // Update local list if it matches current filter
      if (!selectedDomain || selectedDomain === created.semantic_domain_id) {
        setTerms(prev => [created, ...prev]);
      }
      
      toast.success('Term created successfully');
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error('Create failed:', error);
      toast.error(error.message || 'Failed to create term');
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewTermName('');
    setNewTermDisplayName('');
    setNewTermDescription('');
    setNewTermDomain('');
    setNewTermDataType('STRING');
    setNewTermValues([]);
    setNewTermSynonyms([]);
  };

  const handleDeleteTerm = async (id) => {
    if (!confirm('Are you sure you want to delete this term?')) return;

    setIsDeleting(true);
    try {
      await equivalenceService.deleteDataDictionaryTerm(id);
      setTerms(prev => prev.filter(t => t.id !== id));
      if (selectedTerm?.id === id) setSelectedTerm(null);
      toast.success('Term deleted successfully');
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error(error.message || 'Failed to delete term');
    } finally {
      setIsDeleting(false);
      setMenuOpenId(null);
    }
  };

  const openEditTermModal = (term) => {
    if (!term) return;
    setEditTermName(term.name || '');
    setEditTermDisplayName(term.display_name || term.name || '');
    setEditTermDescription(term.description || '');
    setEditTermDomain(term.semantic_domain_id ? term.semantic_domain_id.toString() : '');
    setEditTermDataType(term.data_type || 'STRING');
    setEditTermValues(term.standard_values || []);
    setEditTermSynonyms(term.synonyms || []);
    setIsEditModalOpen(true);
    setMenuOpenId(null);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
  };

  const handleUpdateTerm = async () => {
    if (!selectedTerm?.id) return;
    if (!editTermName.trim() || !editTermDomain) return;

    setIsUpdating(true);
    try {
      const payload = {
        name: editTermName.trim(),
        display_name: editTermDisplayName.trim() || editTermName.trim(),
        description: editTermDescription.trim(),
        semantic_domain_id: parseInt(editTermDomain, 10),
        data_type: editTermDataType,
        standard_values: normalizeTokens(editTermValues || []),
        synonyms: normalizeTokens(editTermSynonyms || []),
      };

      const updated = await equivalenceService.updateDataDictionaryTerm(selectedTerm.id, payload);

      // Update list (respect current domain filter)
      setTerms((prev) => {
        const isInList = prev.some((t) => t.id === updated.id);
        const shouldKeepInList = !selectedDomain || updated.semantic_domain_id === selectedDomain;
        if (!shouldKeepInList) {
          return prev.filter((t) => t.id !== updated.id);
        }
        if (!isInList) return [updated, ...prev];
        return prev.map((t) => (t.id === updated.id ? { ...t, ...updated } : t));
      });

      // Update selected term
      if (selectedDomain && updated.semantic_domain_id !== selectedDomain) {
        setSelectedTerm(null);
      } else {
        setSelectedTerm((prev) => (prev?.id === updated.id ? { ...prev, ...updated } : prev));
      }

      toast.success('Term updated successfully');
      closeEditModal();
    } catch (error) {
      console.error('Update failed:', error);
      toast.error(error.message || 'Failed to update term');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex bg-gray-50 dark:bg-zinc-950">
        {/* Left Sidebar - Domains Filter */}
        <div className="w-64 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-blue-500" />
              <h2 className="font-semibold text-gray-900 dark:text-white">Semantic Domains</h2>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto p-2">
            <button
              onClick={() => setSelectedDomain(null)}
              className={clsx(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                !selectedDomain
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
              )}
            >
              All Domains
            </button>
            
            <div className="mt-2 space-y-1">
              {domains.map((domain) => {
                // Count is not strictly updated here unless we fetch counts again, 
                // defaulting to the count from domain list
                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={clsx(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                      selectedDomain === domain.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800"
                    )}
                  >
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: domain.color || '#ccc' }}
                    />
                    <span className="flex-1 truncate">{domain.name}</span>
                    <span className="text-xs text-gray-400">{domain.terms_count || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-zinc-800">
            <Link
              href="/equivalence/semantic-domains"
              className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
            >
              <Folder className="w-4 h-4" />
              Manage Domains
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Link>
          </div>
        </div>

        {/* Middle Panel - Terms List */}
        <div className="w-96 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" />
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">Data Dictionary</h1>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
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
                placeholder="Search terms or synonyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>

          {/* Terms List */}
          <div className="flex-1 overflow-auto p-2">
            {isLoadingTerms ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No terms found</p>
                <button onClick={fetchTerms} className="mt-2 text-xs text-blue-600 flex items-center justify-center gap-1 mx-auto hover:underline">
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTerms.map((term) => {
                  const domain = getDomain(term.semantic_domain_id);
                  const TypeIcon = getDataTypeIcon(term.data_type);
                  
                  return (
                    <div
                      key={term.id}
                      onClick={() => setSelectedTerm(term)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedTerm(term)}
                      className={clsx(
                        "w-full text-left p-3 rounded-lg transition-all cursor-pointer",
                        selectedTerm?.id === term.id
                          ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <TypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900 dark:text-white text-sm">
                              {term.name}
                            </span>
                          </div>
                          {term.display_name !== term.name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                              {term.display_name}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            {domain && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: `${domain.color || '#ccc'}20`, 
                                  color: domain.color || '#666'
                                }}
                              >
                                {domain.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {term.data_type}
                            </span>
                            {term.column_groups_count > 0 && (
                              <span className="text-xs text-gray-400">
                                • {term.column_groups_count} groups
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="relative">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === term.id ? null : term.id);
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {menuOpenId === term.id && (
                            <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTerm(term);
                                  openEditTermModal(term);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTerm(term.id);
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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Term Details */}
        <div className="flex-1 overflow-auto">
          {selectedTerm ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      {(() => {
                        const TypeIcon = getDataTypeIcon(selectedTerm.data_type);
                        return <TypeIcon className="w-6 h-6 text-blue-500" />;
                      })()}
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedTerm.name}
                      </h2>
                    </div>
                    {selectedTerm.display_name !== selectedTerm.name && (
                      <p className="text-gray-500 dark:text-gray-400 mt-1 ml-9">
                        {selectedTerm.display_name}
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-9">
                      {selectedTerm.description}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditTermModal(selectedTerm)}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg"
                  >
                    Edit Term
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Properties */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Domain
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const domain = getDomain(selectedTerm.semantic_domain_id);
                        return domain ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: domain.color || '#ccc' }}
                            />
                            <span className="text-gray-900 dark:text-white">{domain.name}</span>
                          </>
                        ) : <span className="text-gray-400">None</span>;
                      })()}
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data Type
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const type = DATA_TYPES.find(t => t.value === selectedTerm.data_type);
                        const TypeIcon = type?.icon || Type;
                        return (
                          <>
                            <TypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{type?.label || selectedTerm.data_type}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Standard Values */}
                {selectedTerm.standard_values && selectedTerm.standard_values.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <List className="w-4 h-4 text-gray-400" />
                      Standard Values
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Output values used in Column Groups for normalization.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.standard_values.map((val, idx) => (
                        <code 
                          key={idx}
                          className="px-3 py-1.5 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg font-medium"
                        >
                          {val}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonyms */}
                {selectedTerm.synonyms && selectedTerm.synonyms.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      Synonyms
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.synonyms.map((syn, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 text-sm bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-400 rounded-full"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      These synonyms help identify columns that should map to this term.
                    </p>
                  </div>
                )}

                {/* Usage */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                    Usage
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    This term is used in <strong>{selectedTerm.column_groups_count || 0}</strong> column group(s).
                  </p>
                  {selectedTerm.column_groups_count > 0 && (
                    <Link 
                      href={`/equivalence?term=${selectedTerm.id}`}
                      className="inline-flex items-center gap-1 mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                      View column groups
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <BookOpen className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Term</h3>
              <p className="text-sm text-center max-w-md">
                Choose a term from the dictionary to view its properties, allowed values, and usage.
              </p>
            </div>
          )}
        </div>

        {/* Create Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  New Dictionary Term
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., Sex/Gender"
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., Sexo/Gênero"
                      value={newTermDisplayName}
                      onChange={(e) => setNewTermDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    placeholder="Describe what this term represents..."
                    value={newTermDescription}
                    onChange={(e) => setNewTermDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Semantic Domain <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={newTermDomain}
                      onChange={(e) => setNewTermDomain(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    >
                      <option value="">Select domain...</option>
                      {domains.map(domain => (
                        <option key={domain.id} value={domain.id}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data Type <span className="text-red-500">*</span>
                    </label>
                    <select 
                      value={newTermDataType}
                      onChange={(e) => setNewTermDataType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    >
                      {DATA_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <TokensInput
                    label="Standard Values"
                    placeholder="Type values and separate with space/comma (e.g., M, F, O)"
                    helper="Press space, comma, Enter or Tab to create a value. Leave empty if no value normalization is needed (e.g., email, dates)."
                    tokens={newTermValues}
                    onChange={setNewTermValues}
                  />
                </div>

                <TokensInput
                  label="Synonyms"
                  placeholder="Type synonyms and separate with space/comma (e.g., gender, sexo, genero)"
                  helper="Press space, comma, Enter or Tab to create a synonym."
                  tokens={newTermSynonyms}
                  onChange={setNewTermSynonyms}
                />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateTerm}
                  disabled={!newTermName.trim() || !newTermDomain || isCreating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Term
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 sticky top-0 bg-white dark:bg-zinc-900">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-blue-500" />
                  Edit Dictionary Term
                </h3>
                <button
                  onClick={closeEditModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sex/Gender"
                      value={editTermName}
                      onChange={(e) => setEditTermName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Display Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Sexo/Gênero"
                      value={editTermDisplayName}
                      onChange={(e) => setEditTermDisplayName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    placeholder="Describe what this term represents..."
                    value={editTermDescription}
                    onChange={(e) => setEditTermDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Semantic Domain <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editTermDomain}
                      onChange={(e) => setEditTermDomain(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    >
                      <option value="">Select domain...</option>
                      {domains.map((domain) => (
                        <option key={domain.id} value={domain.id}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Data Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editTermDataType}
                      onChange={(e) => setEditTermDataType(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    >
                      {DATA_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <TokensInput
                    label="Standard Values"
                    placeholder="Type values and separate with space/comma (e.g., M, F, O)"
                    helper="Press space, comma, Enter or Tab to create a value."
                    tokens={editTermValues}
                    onChange={setEditTermValues}
                  />
                </div>

                <TokensInput
                  label="Synonyms"
                  placeholder="Type synonyms and separate with space/comma (e.g., gender, sexo, genero)"
                  helper="Press space, comma, Enter or Tab to create a synonym."
                  tokens={editTermSynonyms}
                  onChange={setEditTermSynonyms}
                />
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-zinc-900">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateTerm}
                  disabled={!editTermName.trim() || !editTermDomain || isUpdating}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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