'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  Columns,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Database,
  ArrowRight,
  Check,
  GitMerge,
  BookOpen,
  Layers,
  Lock
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock data for column groups
const MOCK_COLUMN_GROUPS = [
  {
    id: 'grp_1',
    name: 'sex_unified',
    description: 'Unified sex/gender column across all data sources',
    dictionaryTerm: { id: 'term_1', name: 'Sex/Gender', domain: 'Demographics', dataType: 'ENUM', standardValues: ['M', 'F', 'O'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_1', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'sex', sampleValues: ['M', 'F'] },
      { id: 'map_2', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'users', column: 'gender', sampleValues: ['male', 'female'] },
      { id: 'map_3', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'pacientes', column: 'sexo_paciente', sampleValues: ['masculino', 'feminino'] },
    ],
    valueMappings: [
      { source: 'male', target: 'M', count: 1523 },
      { source: 'female', target: 'F', count: 1891 },
      { source: 'masculino', target: 'M', count: 892 },
      { source: 'feminino', target: 'F', count: 1045 },
      { source: 'M', target: 'M', count: 3421 },
      { source: 'F', target: 'F', count: 3892 },
    ],
    updatedAt: '2026-01-12T10:30:00Z',
  },
  {
    id: 'grp_2',
    name: 'status_unified',
    description: 'Unified status column for orders and transactions',
    dictionaryTerm: { id: 'term_2', name: 'Status', domain: 'Operations', dataType: 'ENUM', standardValues: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_4', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'orders', column: 'status', sampleValues: ['active', 'pending', 'done'] },
      { id: 'map_5', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'transactions', column: 'estado', sampleValues: ['ativo', 'pendente', 'concluido'] },
    ],
    valueMappings: [
      { source: 'active', target: 'ACTIVE', count: 5432 },
      { source: 'ativo', target: 'ACTIVE', count: 2341 },
      { source: 'pending', target: 'PENDING', count: 892 },
      { source: 'pendente', target: 'PENDING', count: 234 },
      { source: 'done', target: 'COMPLETED', count: 8921 },
      { source: 'concluido', target: 'COMPLETED', count: 4521 },
    ],
    updatedAt: '2026-01-11T14:20:00Z',
  },
  {
    id: 'grp_3',
    name: 'country_unified',
    description: 'Unified country codes',
    dictionaryTerm: { id: 'term_3', name: 'Country', domain: 'Location', dataType: 'STRING', standardValues: ['BR', 'US', 'UK', 'DE', 'FR'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_6', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'addresses', column: 'country', sampleValues: ['Brazil', 'USA'] },
      { id: 'map_7', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'locations', column: 'pais', sampleValues: ['Brasil', 'Estados Unidos'] },
    ],
    valueMappings: [
      { source: 'Brazil', target: 'BR', count: 12453 },
      { source: 'Brasil', target: 'BR', count: 8921 },
      { source: 'USA', target: 'US', count: 5432 },
      { source: 'Estados Unidos', target: 'US', count: 3211 },
    ],
    updatedAt: '2026-01-10T09:15:00Z',
  },
  // Examples WITHOUT standard values (semantic grouping only)
  {
    id: 'grp_4',
    name: 'email_unified',
    description: 'Unified email columns - semantic grouping without value normalization',
    dictionaryTerm: { id: 'term_4', name: 'Email', domain: 'Contact', dataType: 'STRING', standardValues: [] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_8', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'email', sampleValues: ['joao@email.com', 'maria@gmail.com'] },
      { id: 'map_9', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'users', column: 'email', sampleValues: ['john@company.com', 'jane@work.org'] },
      { id: 'map_10', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'clientes', column: 'email_cliente', sampleValues: ['cliente1@loja.com', 'cliente2@shop.br'] },
    ],
    valueMappings: [], // No value mappings needed
    updatedAt: '2026-01-09T11:00:00Z',
  },
  {
    id: 'grp_5',
    name: 'birthdate_unified',
    description: 'Unified birth date columns - groups date columns without value transformation',
    dictionaryTerm: { id: 'term_5', name: 'Date of Birth', domain: 'Demographics', dataType: 'DATE', standardValues: [] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_11', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'birth_date', sampleValues: ['1990-05-15', '1985-12-01'] },
      { id: 'map_12', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'pacientes', column: 'data_nasc', sampleValues: ['1992-03-20', '1978-08-10'] },
    ],
    valueMappings: [], // No value mappings needed
    updatedAt: '2026-01-08T16:45:00Z',
  },
];

// Mock connections for modal
const MOCK_CONNECTIONS = [
  {
    id: 'conn_pg',
    name: 'PostgreSQL Production',
    color: '#3b82f6',
    tables: [
      { name: 'patients', columns: ['id', 'name', 'sex', 'birth_date', 'email'] },
      { name: 'orders', columns: ['id', 'user_id', 'status', 'total', 'created_at'] },
      { name: 'addresses', columns: ['id', 'street', 'city', 'country', 'zip'] },
    ]
  },
  {
    id: 'conn_mongo',
    name: 'MongoDB UserData',
    color: '#a855f7',
    tables: [
      { name: 'users', columns: ['_id', 'name', 'gender', 'email', 'avatar'] },
      { name: 'locations', columns: ['_id', 'address', 'city', 'pais', 'cep'] },
    ]
  },
  {
    id: 'conn_mysql',
    name: 'MySQL Analytics',
    color: '#22c55e',
    tables: [
      { name: 'pacientes', columns: ['id', 'nome', 'sexo_paciente', 'data_nasc'] },
      { name: 'transactions', columns: ['id', 'order_id', 'estado', 'valor'] },
    ]
  },
];

// Mock dictionary terms
const MOCK_DICTIONARY_TERMS = [
  { id: 'term_1', name: 'Sex/Gender', domain: 'Demographics', dataType: 'ENUM', values: ['M', 'F'] },
  { id: 'term_2', name: 'Status', domain: 'Operations', dataType: 'ENUM', values: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'] },
  { id: 'term_3', name: 'Country', domain: 'Location', dataType: 'STRING', values: [] },
  { id: 'term_4', name: 'Email', domain: 'Contact', dataType: 'STRING', values: [] },
  { id: 'term_5', name: 'Date of Birth', domain: 'Demographics', dataType: 'DATE', values: [] },
];

export default function EquivalencePage() {
  const [groups, setGroups] = useState(MOCK_COLUMN_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<typeof MOCK_COLUMN_GROUPS[0] | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // New group form state
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupTerm, setNewGroupTerm] = useState('');

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.dictionaryTerm?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    const term = MOCK_DICTIONARY_TERMS.find(t => t.id === newGroupTerm);
    const newGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      dictionaryTerm: term ? { id: term.id, name: term.name, domain: term.domain } : null,
      standardValues: term?.values || [],
      columnMappings: [],
      valueMappings: [],
      updatedAt: new Date().toISOString(),
    };
    
    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupTerm('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteGroup = (id: string) => {
    setGroups(groups.filter(g => g.id !== id));
    if (selectedGroup?.id === id) setSelectedGroup(null);
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex bg-gray-50 dark:bg-zinc-950">
        {/* Left Panel - Groups List */}
        <div className="w-96 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-500" />
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">Column Groups</h1>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
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
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>

          {/* Groups List */}
          <div className="flex-1 overflow-auto p-2">
            {filteredGroups.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Columns className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No column groups found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedGroup(group)}
                    className={clsx(
                      "w-full text-left p-3 rounded-lg transition-all cursor-pointer",
                      selectedGroup?.id === group.id
                        ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white text-sm truncate">
                            {group.name}
                          </span>
                          {group.dictionaryTerm && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                              {group.dictionaryTerm.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {group.columnMappings.length} columns
                          </span>
                          <span className="flex items-center gap-1">
                            <ArrowRight className="w-3 h-3" />
                            {group.valueMappings.length} mappings
                          </span>
                        </div>
                      </div>
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === group.id ? null : group.id);
                          }}
                          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === group.id && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                            <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
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

        {/* Right Panel - Group Details */}
        <div className="flex-1 overflow-auto">
          {selectedGroup ? (
            <div className="h-full flex flex-col">
              {/* Detail Header */}
              <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedGroup.name}
                      </h2>
                      {selectedGroup.dictionaryTerm && (
                        <Link 
                          href={`/equivalence/data-dictionary?term=${selectedGroup.dictionaryTerm.id}`}
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                        >
                          <BookOpen className="w-3 h-3" />
                          {selectedGroup.dictionaryTerm.name}
                        </Link>
                      )}
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                      {selectedGroup.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      Last updated: {formatDate(selectedGroup.updatedAt)}
                    </p>
                  </div>
                  <button className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg">
                    Edit Group
                  </button>
                </div>

                {/* Standard Values */}
                {selectedGroup.dictionaryTerm && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Standard Values
                      </span>
                      {selectedGroup.dictionaryTerm.standardValues.length > 0 ? (
                        selectedGroup.useTermStandardValues ? (
                          <span className="text-xs flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded">
                            <LinkIcon className="w-3 h-3" />
                            From Dictionary Term
                          </span>
                        ) : (
                          <span className="text-xs flex items-center gap-1 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded">
                            <Pencil className="w-3 h-3" />
                            Custom Values
                          </span>
                        )
                      ) : (
                        <span className="text-xs flex items-center gap-1 text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                          <Layers className="w-3 h-3" />
                          Semantic Grouping Only
                        </span>
                      )}
                    </div>
                    {selectedGroup.dictionaryTerm.standardValues.length > 0 ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          {(selectedGroup.useTermStandardValues 
                            ? selectedGroup.dictionaryTerm.standardValues 
                            : selectedGroup.customStandardValues
                          ).map((val) => (
                            <span 
                              key={val}
                              className="px-3 py-1 text-sm font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                            >
                              {val}
                            </span>
                          ))}
                          {!selectedGroup.useTermStandardValues && (
                            <button className="px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">
                              + Add
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          {selectedGroup.useTermStandardValues 
                            ? "Using standard values from the dictionary term."
                            : "Using custom values."}
                        </p>
                      </>
                    ) : (
                      <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          This group unifies columns <strong>semantically</strong> without value normalization.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">
                          Useful for: federated queries, LGPD mapping, data cataloging, impact analysis.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-auto p-6 space-y-6">
                {/* Column Mappings */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-gray-400" />
                      Column Mappings
                    </h3>
                    <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Add Column
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedGroup.columnMappings.map((mapping) => (
                      <div 
                        key={mapping.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                      >
                        <div className="flex items-center gap-4">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: mapping.connectionColor }}
                          />
                          <div>
                            <div className="font-mono text-sm text-gray-900 dark:text-white">
                              {mapping.table}.<span className="text-purple-600 dark:text-purple-400">{mapping.column}</span>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {mapping.connection}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-xs text-gray-400">
                            Sample: {mapping.sampleValues.slice(0, 3).join(', ')}
                          </div>
                          <button className="p-1 text-gray-400 hover:text-red-500">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value Mappings */}
                {selectedGroup.valueMappings.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      Value Mappings
                    </h3>
                    <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                      <Plus className="w-4 h-4" />
                      Add Mapping
                    </button>
                  </div>

                  <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-zinc-900">
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Source Value
                          </th>
                          <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            →
                          </th>
                          <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Standard Value
                          </th>
                          <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Count
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-700">
                        {selectedGroup.valueMappings.map((mapping, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
                            <td className="px-4 py-3">
                              <code className="px-2 py-1 text-sm bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded">
                                {mapping.source}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
                            </td>
                            <td className="px-4 py-3">
                              <code className="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">
                                {mapping.target}
                              </code>
                            </td>
                            <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                              {mapping.count.toLocaleString()}
                            </td>
                            <td className="px-2 py-3">
                              <button className="p-1 text-gray-400 hover:text-red-500">
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        Value Mappings
                      </h3>
                    </div>
                    <div className="p-6 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-600 text-center">
                      <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No value mappings needed for this group.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Values are passed through without transformation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <GitMerge className="w-16 h-16 mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Select a Column Group</h3>
              <p className="text-sm text-center max-w-md">
                Choose a column group from the list to view and manage its column mappings and value transformations.
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
                  <GitMerge className="w-5 h-5 text-purple-500" />
                  New Column Group
                </h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Group Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., sex_unified"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm font-mono"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea 
                    placeholder="What columns will this group unify?"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Link to Dictionary Term <span className="text-gray-400">(optional)</span>
                  </label>
                  <select 
                    value={newGroupTerm}
                    onChange={(e) => setNewGroupTerm(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                  >
                    <option value="">Select a term...</option>
                    {MOCK_DICTIONARY_TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.domain})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500">
                    Linking to a dictionary term will inherit its standard values.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

