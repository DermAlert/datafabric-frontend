'use client';

import React, { useState } from 'react';
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
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Color options for domains
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

// Terms by domain (must match Data Dictionary)
const TERMS_BY_DOMAIN: Record<string, { name: string; type: string }[]> = {
  dom_1: [ // Demographics
    { name: 'Sex/Gender', type: 'ENUM' },
    { name: 'Date of Birth', type: 'DATE' },
  ],
  dom_2: [ // Operations
    { name: 'Status', type: 'ENUM' },
  ],
  dom_3: [ // Location
    { name: 'Country', type: 'STRING' },
  ],
  dom_4: [ // Contact
    { name: 'Email', type: 'STRING' },
  ],
  dom_5: [ // Financial
    { name: 'Amount', type: 'DECIMAL' },
  ],
};

// Mock semantic domains
const MOCK_DOMAINS = [
  { 
    id: 'dom_1', 
    name: 'Demographics', 
    color: '#3b82f6', 
    description: 'Personal demographic information like age, gender, birth date',
    parentId: null,
    termCount: 2,
    updatedAt: '2026-01-12T10:30:00Z',
  },
  { 
    id: 'dom_2', 
    name: 'Operations', 
    color: '#22c55e', 
    description: 'Operational and status data like workflow states, flags',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-11T14:20:00Z',
  },
  { 
    id: 'dom_3', 
    name: 'Location', 
    color: '#f59e0b', 
    description: 'Geographic and address data',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-10T09:15:00Z',
  },
  { 
    id: 'dom_4', 
    name: 'Contact', 
    color: '#ec4899', 
    description: 'Contact information like email, phone, social media',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-09T16:45:00Z',
  },
  { 
    id: 'dom_5', 
    name: 'Financial', 
    color: '#8b5cf6', 
    description: 'Financial and monetary data like prices, amounts, currencies',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-08T11:30:00Z',
  },
];

export default function SemanticDomainsPage() {
  const [domains, setDomains] = useState(MOCK_DOMAINS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<typeof MOCK_DOMAINS[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // New domain form state
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDescription, setNewDomainDescription] = useState('');
  const [newDomainColor, setNewDomainColor] = useState(COLOR_OPTIONS[0]);

  const filteredDomains = domains.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateDomain = () => {
    if (!newDomainName.trim()) return;
    
    const newDomain = {
      id: `dom_${Date.now()}`,
      name: newDomainName.trim(),
      description: newDomainDescription.trim(),
      color: newDomainColor,
      parentId: null,
      termCount: 0,
      updatedAt: new Date().toISOString(),
    };
    
    setDomains([newDomain, ...domains]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const resetForm = () => {
    setNewDomainName('');
    setNewDomainDescription('');
    setNewDomainColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteDomain = (id: string) => {
    setDomains(domains.filter(d => d.id !== id));
    if (selectedDomain?.id === id) setSelectedDomain(null);
    setMenuOpenId(null);
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
            {filteredDomains.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Folder className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No domains found</p>
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
                            style={{ backgroundColor: domain.color }}
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
                            {domain.termCount} terms
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
                            <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
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
                        style={{ backgroundColor: selectedDomain.color }}
                      />
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedDomain.name}
                      </h2>
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-11">
                      {selectedDomain.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 ml-11">
                      Last updated: {formatDate(selectedDomain.updatedAt)}
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg">
                    Edit Domain
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Dictionary Terms
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedDomain.termCount}
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
                        style={{ backgroundColor: selectedDomain.color }}
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
                  
                  {selectedDomain.termCount > 0 && TERMS_BY_DOMAIN[selectedDomain.id] ? (
                    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 divide-y divide-gray-100 dark:divide-zinc-700">
                      {TERMS_BY_DOMAIN[selectedDomain.id].map((term, idx) => (
                        <div key={idx} className="flex items-center justify-between px-4 py-3">
                          <div className="flex items-center gap-3">
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-900 dark:text-white">{term.name}</span>
                          </div>
                          <span className="text-xs text-gray-400">{term.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 p-6 text-center">
                      <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No terms in this domain yet.
                      </p>
                      <Link 
                        href="/equivalence/data-dictionary"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
                      >
                        <Plus className="w-4 h-4" />
                        Create first term
                      </Link>
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
                  disabled={!newDomainName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Domain
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

