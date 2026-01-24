'use client';

import React, { useState, useCallback, memo } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Plus,
  X,
  Columns,
  MoreVertical,
  Pencil,
  Trash2,
  Database,
  ArrowRight,
  GitMerge,
  BookOpen,
  Layers,
  Link as LinkIcon,
} from 'lucide-react';
import { useDisclosure } from '@/hooks';
import {
  Modal,
  DropdownMenu,
  DropdownItem,
  DropdownDivider,
  EmptyState,
} from '@/components/ui';
import { Input, SearchInput, Textarea } from '@/components/ui/Input';
import { formatDate } from '@/lib/utils';

// ===========================================
// Mock Data - Em produção, viria de uma API
// ===========================================

const MOCK_COLUMN_GROUPS = [
  {
    id: 'grp_1',
    name: 'sex_unified',
    description: 'Unified sex/gender column across all data sources',
    dictionaryTerm: {
      id: 'term_1',
      name: 'Sex/Gender',
      domain: 'Demographics',
      dataType: 'ENUM',
      standardValues: ['M', 'F', 'O'],
    },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      {
        id: 'map_1',
        connection: 'PostgreSQL Production',
        connectionColor: '#3b82f6',
        table: 'patients',
        column: 'sex',
        sampleValues: ['M', 'F'],
      },
      {
        id: 'map_2',
        connection: 'MongoDB UserData',
        connectionColor: '#a855f7',
        table: 'users',
        column: 'gender',
        sampleValues: ['male', 'female'],
      },
      {
        id: 'map_3',
        connection: 'MySQL Analytics',
        connectionColor: '#22c55e',
        table: 'pacientes',
        column: 'sexo_paciente',
        sampleValues: ['masculino', 'feminino'],
      },
    ],
    valueMappings: [
      { source: 'male', target: 'M', count: 1523 },
      { source: 'female', target: 'F', count: 1891 },
      { source: 'masculino', target: 'M', count: 892 },
      { source: 'feminino', target: 'F', count: 1045 },
    ],
    updatedAt: '2026-01-12T10:30:00Z',
  },
  {
    id: 'grp_2',
    name: 'status_unified',
    description: 'Unified status column for orders and transactions',
    dictionaryTerm: {
      id: 'term_2',
      name: 'Status',
      domain: 'Operations',
      dataType: 'ENUM',
      standardValues: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'],
    },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      {
        id: 'map_4',
        connection: 'PostgreSQL Production',
        connectionColor: '#3b82f6',
        table: 'orders',
        column: 'status',
        sampleValues: ['active', 'pending', 'done'],
      },
      {
        id: 'map_5',
        connection: 'MySQL Analytics',
        connectionColor: '#22c55e',
        table: 'transactions',
        column: 'estado',
        sampleValues: ['ativo', 'pendente', 'concluido'],
      },
    ],
    valueMappings: [
      { source: 'active', target: 'ACTIVE', count: 5432 },
      { source: 'ativo', target: 'ACTIVE', count: 2341 },
      { source: 'pending', target: 'PENDING', count: 892 },
    ],
    updatedAt: '2026-01-11T14:20:00Z',
  },
  {
    id: 'grp_3',
    name: 'email_unified',
    description: 'Unified email columns - semantic grouping without value normalization',
    dictionaryTerm: {
      id: 'term_4',
      name: 'Email',
      domain: 'Contact',
      dataType: 'STRING',
      standardValues: [],
    },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      {
        id: 'map_8',
        connection: 'PostgreSQL Production',
        connectionColor: '#3b82f6',
        table: 'patients',
        column: 'email',
        sampleValues: ['joao@email.com', 'maria@gmail.com'],
      },
      {
        id: 'map_9',
        connection: 'MongoDB UserData',
        connectionColor: '#a855f7',
        table: 'users',
        column: 'email',
        sampleValues: ['john@company.com', 'jane@work.org'],
      },
    ],
    valueMappings: [],
    updatedAt: '2026-01-09T11:00:00Z',
  },
];

const MOCK_DICTIONARY_TERMS = [
  { id: 'term_1', name: 'Sex/Gender', domain: 'Demographics', dataType: 'ENUM', values: ['M', 'F'] },
  {
    id: 'term_2',
    name: 'Status',
    domain: 'Operations',
    dataType: 'ENUM',
    values: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'],
  },
  { id: 'term_3', name: 'Country', domain: 'Location', dataType: 'STRING', values: [] },
  { id: 'term_4', name: 'Email', domain: 'Contact', dataType: 'STRING', values: [] },
  { id: 'term_5', name: 'Date of Birth', domain: 'Demographics', dataType: 'DATE', values: [] },
];

// ===========================================
// Group List Item Component
// ===========================================

const GroupListItem = memo(function GroupListItem({
  group,
  isSelected,
  onSelect,
  onDelete,
}) {
  const menuDisclosure = useDisclosure();

  return (
    <div
      onClick={() => onSelect(group)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(group)}
      className={clsx(
        'w-full text-left p-3 rounded-lg transition-all cursor-pointer',
        isSelected
          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent'
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

        <DropdownMenu
          isOpen={menuDisclosure.isOpen}
          onClose={menuDisclosure.onClose}
          trigger={
            <button
              onClick={(e) => {
                e.stopPropagation();
                menuDisclosure.onToggle();
              }}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
              aria-label="Menu de ações"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
        >
          <DropdownItem icon={<Pencil className="w-3.5 h-3.5" />}>Edit</DropdownItem>
          <DropdownItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(group.id);
            }}
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </div>
    </div>
  );
});

// ===========================================
// Column Mapping Card Component
// ===========================================

const ColumnMappingCard = memo(function ColumnMappingCard({
  mapping,
  onRemove,
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
      <div className="flex items-center gap-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: mapping.connectionColor }}
          aria-hidden="true"
        />
        <div>
          <div className="font-mono text-sm text-gray-900 dark:text-white">
            {mapping.table}.
            <span className="text-purple-600 dark:text-purple-400">{mapping.column}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{mapping.connection}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="text-xs text-gray-400">
          Sample: {mapping.sampleValues.slice(0, 3).join(', ')}
        </div>
        <button
          onClick={() => onRemove(mapping.id)}
          className="p-1 text-gray-400 hover:text-red-500"
          aria-label="Remover mapeamento"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

// ===========================================
// Value Mappings Table Component
// ===========================================

const ValueMappingsTable = memo(function ValueMappingsTable({
  mappings,
  onRemove,
}) {
  if (mappings.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-600 text-center">
        <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No value mappings needed for this group.
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Values are passed through without transformation.
        </p>
      </div>
    );
  }

  return (
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
          {mappings.map((mapping, idx) => (
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
                <button
                  onClick={() => onRemove(idx)}
                  className="p-1 text-gray-400 hover:text-red-500"
                  aria-label="Remover mapeamento"
                >
                  <X className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// ===========================================
// Detail Panel Component
// ===========================================

const DetailPanel = memo(function DetailPanel({ group }) {
  if (!group) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <GitMerge className="w-16 h-16 mb-4 opacity-30" />
        <h3 className="text-lg font-medium mb-2">Select a Column Group</h3>
        <p className="text-sm text-center max-w-md">
          Choose a column group from the list to view and manage its column mappings and value
          transformations.
        </p>
      </div>
    );
  }

  const handleRemoveColumnMapping = (id) => {
    console.log('Remove column mapping:', id);
  };

  const handleRemoveValueMapping = (index) => {
    console.log('Remove value mapping at index:', index);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
              {group.dictionaryTerm && (
                <Link
                  href={`/equivalence/data-dictionary?term=${group.dictionaryTerm.id}`}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  {group.dictionaryTerm.name}
                </Link>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
            <p className="text-xs text-gray-400 mt-2">Last updated: {formatDate(group.updatedAt)}</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg">
            Edit Group
          </button>
        </div>

        {/* Standard Values */}
        {group.dictionaryTerm && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Standard Values
              </span>
              {group.dictionaryTerm.standardValues &&
              group.dictionaryTerm.standardValues.length > 0 ? (
                group.useTermStandardValues ? (
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
            {group.dictionaryTerm.standardValues &&
            group.dictionaryTerm.standardValues.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  {(group.useTermStandardValues
                    ? group.dictionaryTerm.standardValues
                    : group.customStandardValues
                  ).map((val) => (
                    <span
                      key={val}
                      className="px-3 py-1 text-sm font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                    >
                      {val}
                    </span>
                  ))}
                  {!group.useTermStandardValues && (
                    <button className="px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded">
                      + Add
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {group.useTermStandardValues
                    ? 'Using standard values from the dictionary term.'
                    : 'Using custom values.'}
                </p>
              </>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This group unifies columns <strong>semantically</strong> without value
                  normalization.
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Useful for: federated queries, LGPD mapping, data cataloging, impact analysis.
                </p>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* Column Mappings */}
        <section>
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
            {group.columnMappings.map((mapping) => (
              <ColumnMappingCard
                key={mapping.id}
                mapping={mapping}
                onRemove={handleRemoveColumnMapping}
              />
            ))}
          </div>
        </section>

        {/* Value Mappings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              Value Mappings
            </h3>
            {group.valueMappings.length > 0 && (
              <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            )}
          </div>

          <ValueMappingsTable mappings={group.valueMappings} onRemove={handleRemoveValueMapping} />
        </section>
      </div>
    </div>
  );
});

// ===========================================
// Create Group Modal Component
// ===========================================

const CreateGroupModal = memo(function CreateGroupModal({
  isOpen,
  onClose,
  onCreate,
  terms,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [termId, setTermId] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ name: name.trim(), description: description.trim(), termId });
    setName('');
    setDescription('');
    setTermId('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Column Group">
      <div className="space-y-4">
        <Input
          label="Group Name"
          placeholder="e.g., sex_unified"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="font-mono"
        />

        <Textarea
          label="Description"
          placeholder="What columns will this group unify?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Link to Dictionary Term <span className="text-gray-400">(optional)</span>
          </label>
          <select
            value={termId}
            onChange={(e) => setTermId(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
          >
            <option value="">Select a term...</option>
            {terms.map((term) => (
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

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Group
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function EquivalencePage() {
  const [groups, setGroups] = useState(MOCK_COLUMN_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const createModal = useDisclosure();

  // Filtered groups
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.dictionaryTerm?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handlers
  const handleSelectGroup = useCallback((group) => {
    setSelectedGroup(group);
  }, []);

  const handleDeleteGroup = useCallback((id) => {
    if (confirm('Are you sure you want to delete this column group?')) {
      setGroups((prev) => prev.filter((g) => g.id !== id));
      setSelectedGroup((prev) => (prev?.id === id ? null : prev));
    }
  }, []);

  const handleCreateGroup = useCallback(
    (data) => {
      const term = MOCK_DICTIONARY_TERMS.find((t) => t.id === data.termId);
      const newGroup = {
        id: `grp_${Date.now()}`,
        name: data.name,
        description: data.description,
        dictionaryTerm: term
          ? {
              id: term.id,
              name: term.name,
              domain: term.domain,
              dataType: term.dataType,
              standardValues: term.values,
            }
          : null,
        useTermStandardValues: true,
        customStandardValues: [],
        columnMappings: [],
        valueMappings: [],
        updatedAt: new Date().toISOString(),
      };

      setGroups((prev) => [newGroup, ...prev]);
      createModal.onClose();
    },
    [createModal]
  );

  return (
    <DashboardLayout>
      <div className="h-screen flex bg-gray-50 dark:bg-zinc-950">
        {/* Left Panel - Groups List */}
        <aside className="w-96 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
          {/* Header */}
          <header className="p-4 border-b border-gray-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-purple-500" />
                <h1 className="font-bold text-lg text-gray-900 dark:text-white">Column Groups</h1>
              </div>
              <button
                onClick={createModal.onOpen}
                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>

            <SearchInput
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
            />
          </header>

          {/* Groups List */}
          <div className="flex-1 overflow-auto p-2">
            {filteredGroups.length === 0 ? (
              <EmptyState
                icon={<Columns className="w-8 h-8" />}
                title="No column groups found"
                description="Try adjusting your search or create a new group"
              />
            ) : (
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <GroupListItem
                    key={group.id}
                    group={group}
                    isSelected={selectedGroup?.id === group.id}
                    onSelect={handleSelectGroup}
                    onDelete={handleDeleteGroup}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Right Panel - Group Details */}
        <main className="flex-1 overflow-auto">
          <DetailPanel group={selectedGroup} />
        </main>

        {/* Create Modal */}
        <CreateGroupModal
          isOpen={createModal.isOpen}
          onClose={createModal.onClose}
          onCreate={handleCreateGroup}
          terms={MOCK_DICTIONARY_TERMS}
        />
      </div>
    </DashboardLayout>
  );
}
