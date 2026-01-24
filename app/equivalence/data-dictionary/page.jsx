'use client';

import React, { useState } from 'react';
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
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

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

// Mock semantic domains
const MOCK_DOMAINS = [
  { id: 'dom_1', name: 'Demographics', color: '#3b82f6', description: 'Personal demographic information' },
  { id: 'dom_2', name: 'Operations', color: '#22c55e', description: 'Operational and status data' },
  { id: 'dom_3', name: 'Location', color: '#f59e0b', description: 'Geographic and address data' },
  { id: 'dom_4', name: 'Contact', color: '#ec4899', description: 'Contact information' },
  { id: 'dom_5', name: 'Financial', color: '#8b5cf6', description: 'Financial and monetary data' },
];

// Mock dictionary terms
const MOCK_TERMS = [
  {
    id: 'term_1',
    name: 'Sex/Gender',
    displayName: 'Sexo/Gênero',
    description: 'Biological sex or gender identity of a person',
    domainId: 'dom_1',
    dataType: 'ENUM',
    standardValues: ['M', 'F', 'O'],
    synonyms: ['gender', 'sexo', 'genero', 'sex'],
    usageCount: 3,
  },
  {
    id: 'term_2',
    name: 'Status',
    displayName: 'Status',
    description: 'Current state or condition of an entity',
    domainId: 'dom_2',
    dataType: 'ENUM',
    standardValues: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'],
    synonyms: ['state', 'estado', 'situacao'],
    usageCount: 2,
  },
  {
    id: 'term_3',
    name: 'Country',
    displayName: 'País',
    description: 'Country code or name',
    domainId: 'dom_3',
    dataType: 'STRING',
    standardValues: ['BR', 'US', 'UK', 'DE', 'FR'],
    synonyms: ['pais', 'nation', 'nacao'],
    usageCount: 2,
  },
  {
    id: 'term_4',
    name: 'Email',
    displayName: 'E-mail',
    description: 'Electronic mail address - used for grouping email columns without value normalization',
    domainId: 'dom_4',
    dataType: 'STRING',
    standardValues: [],
    synonyms: ['email_address', 'correio', 'mail', 'e_mail'],
    usageCount: 1,
  },
  {
    id: 'term_5',
    name: 'Date of Birth',
    displayName: 'Data de Nascimento',
    description: 'Birth date of a person - used for grouping birthdate columns',
    domainId: 'dom_1',
    dataType: 'DATE',
    standardValues: [],
    synonyms: ['birthdate', 'data_nasc', 'dob', 'nascimento', 'dt_nascimento'],
    usageCount: 1,
  },
  {
    id: 'term_6',
    name: 'Amount',
    displayName: 'Valor',
    description: 'Monetary amount or value - used for grouping price/value columns',
    domainId: 'dom_5',
    dataType: 'DECIMAL',
    standardValues: [],
    synonyms: ['value', 'valor', 'price', 'preco', 'total', 'amount'],
    usageCount: 1,
  },
];

export default function DataDictionaryPage() {
  const [terms, setTerms] = useState(MOCK_TERMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  // New term form state
  const [newTermName, setNewTermName] = useState('');
  const [newTermDisplayName, setNewTermDisplayName] = useState('');
  const [newTermDescription, setNewTermDescription] = useState('');
  const [newTermDomain, setNewTermDomain] = useState('');
  const [newTermDataType, setNewTermDataType] = useState('STRING');
  const [newTermValues, setNewTermValues] = useState('');
  const [newTermSynonyms, setNewTermSynonyms] = useState('');

  const filteredTerms = terms.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDomain = !selectedDomain || t.domainId === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const getDomain = (domainId) => MOCK_DOMAINS.find(d => d.id === domainId);

  const getDataTypeIcon = (dataType) => {
    const type = DATA_TYPES.find(t => t.value === dataType);
    return type?.icon || Type;
  };

  const handleCreateTerm = () => {
    if (!newTermName.trim() || !newTermDomain) return;
    
    const newTerm = {
      id: `term_${Date.now()}`,
      name: newTermName.trim(),
      displayName: newTermDisplayName.trim() || newTermName.trim(),
      description: newTermDescription.trim(),
      domainId: newTermDomain,
      dataType: newTermDataType,
      standardValues: newTermValues.split(',').map(v => v.trim()).filter(Boolean),
      synonyms: newTermSynonyms.split(',').map(s => s.trim()).filter(Boolean),
      usageCount: 0,
    };
    
    setTerms([newTerm, ...terms]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const resetForm = () => {
    setNewTermName('');
    setNewTermDisplayName('');
    setNewTermDescription('');
    setNewTermDomain('');
    setNewTermDataType('STRING');
    setNewTermValues('');
    setNewTermSynonyms('');
  };

  const handleDeleteTerm = (id) => {
    setTerms(terms.filter(t => t.id !== id));
    if (selectedTerm?.id === id) setSelectedTerm(null);
    setMenuOpenId(null);
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
              {MOCK_DOMAINS.map((domain) => {
                const count = terms.filter(t => t.domainId === domain.id).length;
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
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className="flex-1">{domain.name}</span>
                    <span className="text-xs text-gray-400">{count}</span>
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
            {filteredTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No terms found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTerms.map((term) => {
                  const domain = getDomain(term.domainId);
                  const TypeIcon = getDataTypeIcon(term.dataType);
                  
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
                          {term.displayName !== term.name && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 ml-6">
                              {term.displayName}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 ml-6">
                            {domain && (
                              <span 
                                className="text-xs px-1.5 py-0.5 rounded"
                                style={{ 
                                  backgroundColor: `${domain.color}20`, 
                                  color: domain.color 
                                }}
                              >
                                {domain.name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {term.dataType}
                            </span>
                            {term.usageCount > 0 && (
                              <span className="text-xs text-gray-400">
                                • {term.usageCount} groups
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
                              <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
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
                        const TypeIcon = getDataTypeIcon(selectedTerm.dataType);
                        return <TypeIcon className="w-6 h-6 text-blue-500" />;
                      })()}
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedTerm.name}
                      </h2>
                    </div>
                    {selectedTerm.displayName !== selectedTerm.name && (
                      <p className="text-gray-500 dark:text-gray-400 mt-1 ml-9">
                        {selectedTerm.displayName}
                      </p>
                    )}
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-9">
                      {selectedTerm.description}
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg">
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
                        const domain = getDomain(selectedTerm.domainId);
                        return domain ? (
                          <>
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: domain.color }}
                            />
                            <span className="text-gray-900 dark:text-white">{domain.name}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Data Type
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      {(() => {
                        const type = DATA_TYPES.find(t => t.value === selectedTerm.dataType);
                        const TypeIcon = type?.icon || Type;
                        return (
                          <>
                            <TypeIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-900 dark:text-white">{type?.label || selectedTerm.dataType}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {/* Standard Values */}
                {selectedTerm.standardValues && selectedTerm.standardValues.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <List className="w-4 h-4 text-gray-400" />
                      Standard Values
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      Output values used in Column Groups for normalization.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTerm.standardValues.map((val, idx) => (
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
                {selectedTerm.synonyms.length > 0 && (
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
                    This term is used in <strong>{selectedTerm.usageCount}</strong> column group(s).
                  </p>
                  {selectedTerm.usageCount > 0 && (
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
                      {MOCK_DOMAINS.map(domain => (
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
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Standard Values
                  </label>
                  <input 
                    type="text"
                    placeholder="Comma-separated values (e.g., M, F, O)"
                    value={newTermValues}
                    onChange={(e) => setNewTermValues(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Leave empty if no value normalization is needed (e.g., email, dates).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Synonyms
                  </label>
                  <input 
                    type="text"
                    placeholder="Comma-separated synonyms (e.g., gender, sexo, genero)"
                    value={newTermSynonyms}
                    onChange={(e) => setNewTermSynonyms(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Synonyms help automatically match columns to this term.
                  </p>
                </div>
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
                  disabled={!newTermName.trim() || !newTermDomain}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Term
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
