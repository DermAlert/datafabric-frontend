'use client';

import React, { useState, useCallback, useEffect, memo } from 'react';
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
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useDisclosure } from '@/hooks';
import {
  Modal,
  DropdownMenu,
  DropdownItem,
  EmptyState,
} from '@/components/ui';
import { Input, SearchInput, Textarea } from '@/components/ui/Input';
import { equivalenceService } from '../../lib/api/services/equivalence';
import { toast } from 'sonner';

// Helper to generate a consistent color based on connection type/name
const getConnectionColor = (type) => {
  const map = {
    'postgres': '#3b82f6', // blue
    'mysql': '#22c55e',    // green
    'sqlserver': '#ef4444', // red
    'oracle': '#f97316',   // orange
    'mongodb': '#a855f7',  // purple
    's3': '#ec4899',       // pink
  };
  return map[type?.toLowerCase()] || '#64748b'; // default slate
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

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
            {group.data_dictionary_term_name && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                {group.data_dictionary_term_name}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {group.description}
          </p>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {group.columns_count || 0} columns
            </span>
            <span className="flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              {group.value_mappings_count || 0} mappings
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
  const color = getConnectionColor(mapping.data_source_type);
  const sample = mapping.sample_values || [];

  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
      <div className="flex items-center gap-4">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden="true"
          title={mapping.data_source_type}
        />
        <div>
          <div className="font-mono text-sm text-gray-900 dark:text-white">
            {mapping.table_name}.
            <span className="text-purple-600 dark:text-purple-400">{mapping.column_name}</span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{mapping.data_source_name}</div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        {sample.length > 0 && (
          <div className="text-xs text-gray-400 hidden sm:block">
            Sample: {sample.slice(0, 3).join(', ')}
          </div>
        )}
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
  if (!mappings || mappings.length === 0) {
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
            <tr key={mapping.id || idx} className="hover:bg-gray-50 dark:hover:bg-zinc-700/50">
              <td className="px-4 py-3">
                <code className="px-2 py-1 text-sm bg-gray-100 dark:bg-zinc-900 text-gray-700 dark:text-gray-300 rounded">
                  {mapping.source_value}
                </code>
              </td>
              <td className="px-4 py-3 text-center">
                <ArrowRight className="w-4 h-4 text-gray-300 dark:text-gray-600 mx-auto" />
              </td>
              <td className="px-4 py-3">
                <code className="px-2 py-1 text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded font-medium">
                  {mapping.standard_value}
                </code>
              </td>
              <td className="px-4 py-3 text-right text-sm text-gray-500 dark:text-gray-400">
                {(mapping.record_count || 0).toLocaleString()}
              </td>
              <td className="px-2 py-3">
                <button
                  onClick={() => onRemove(mapping.id)}
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

const DetailPanel = memo(function DetailPanel({ group, isLoading }) {
  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
        <Loader2 className="w-8 h-8 mb-4 animate-spin text-purple-500" />
        <p className="text-sm">Loading group details...</p>
      </div>
    );
  }

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

  const handleRemoveColumnMapping = async (id) => {
    if (!confirm('Remove this column mapping?')) return;
    try {
      await equivalenceService.deleteColumnMapping(id);
      toast.success('Column mapping removed');
      // Trigger a refresh logic here usually via context or callback prop
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove mapping');
    }
  };

  const handleRemoveValueMapping = async (id) => {
    if (!confirm('Remove this value mapping?')) return;
    try {
      await equivalenceService.deleteValueMapping(id);
      toast.success('Value mapping removed');
      // Trigger refresh
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove mapping');
    }
  };

  // Determine standard values (from Dictionary or Custom)
  const standardValues = group.standard_values || []; 
  const hasDictionaryTerm = !!group.data_dictionary_term_id;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.name}</h2>
              {group.data_dictionary_term_id && (
                <Link
                  href={`/equivalence/data-dictionary?term=${group.data_dictionary_term_id}`}
                  className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <BookOpen className="w-3 h-3" />
                  {group.data_dictionary_term_name}
                </Link>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{group.description}</p>
            <p className="text-xs text-gray-400 mt-2">Last updated: {formatDate(group.data_atualizacao)}</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg">
            Edit Group
          </button>
        </div>

        {/* Standard Values Information */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Standard Values
            </span>
            {standardValues.length > 0 ? (
              hasDictionaryTerm ? (
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
          
          {standardValues.length > 0 ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {standardValues.map((val) => (
                  <span
                    key={val}
                    className="px-3 py-1 text-sm font-mono bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full"
                  >
                    {val}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {hasDictionaryTerm
                  ? 'Using standard values from the linked dictionary term.'
                  : 'Values defined in property rules.'}
              </p>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This group unifies columns <strong>semantically</strong> without strict value
                normalization.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Useful for: federated queries, LGPD mapping, data cataloging, impact analysis.
              </p>
            </div>
          )}
        </div>
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
            {group.column_mappings && group.column_mappings.map((mapping) => (
              <ColumnMappingCard
                key={mapping.id}
                mapping={mapping}
                onRemove={handleRemoveColumnMapping}
              />
            ))}
            {(!group.column_mappings || group.column_mappings.length === 0) && (
              <p className="text-sm text-gray-500 italic">No columns mapped yet.</p>
            )}
          </div>
        </section>

        {/* Value Mappings */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              Value Mappings
            </h3>
            {group.value_mappings && group.value_mappings.length > 0 && (
              <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            )}
          </div>

          <ValueMappingsTable mappings={group.value_mappings || []} onRemove={handleRemoveValueMapping} />
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
  isLoading
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [termId, setTermId] = useState('');
  const [terms, setTerms] = useState([]);

  // Fetch terms when modal opens
  useEffect(() => {
    if (isOpen) {
      equivalenceService.listDataDictionary()
        .then(setTerms)
        .catch(err => console.error('Failed to load terms', err));
    }
  }, [isOpen]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    onCreate({ 
      name: name.trim(), 
      description: description.trim(), 
      data_dictionary_term_id: termId ? parseInt(termId) : null 
    });
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
                {term.name}
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
          disabled={!name.trim() || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
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
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null); // This holds the full detail object
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const createModal = useDisclosure();

  // Load Groups
  const fetchGroups = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const data = await equivalenceService.listColumnGroups();
      setGroups(data);
    } catch (error) {
      console.error('Failed to fetch groups:', error);
      toast.error('Failed to load column groups');
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  // Load Details for Selected Group
  const handleSelectGroup = useCallback(async (groupSummary) => {
    setIsLoadingDetails(true);
    // Optimistically set selection with basic info while loading details
    setSelectedGroup(groupSummary);
    
    try {
      const fullDetails = await equivalenceService.getColumnGroup(groupSummary.id);
      setSelectedGroup(fullDetails);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      toast.error('Failed to load group details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  // Filtered groups
  const filteredGroups = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (g.data_dictionary_term_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteGroup = useCallback(async (id) => {
    if (confirm('Are you sure you want to delete this column group?')) {
      try {
        await equivalenceService.deleteColumnGroup(id);
        setGroups((prev) => prev.filter((g) => g.id !== id));
        if (selectedGroup?.id === id) setSelectedGroup(null);
        toast.success('Column group deleted');
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete group');
      }
    }
  }, [selectedGroup]);

  const handleCreateGroup = useCallback(async (data) => {
    setIsCreating(true);
    try {
      const newGroup = await equivalenceService.createColumnGroup(data);
      setGroups((prev) => [newGroup, ...prev]);
      createModal.onClose();
      toast.success('Column group created');
      
      // Select the new group
      handleSelectGroup(newGroup);
    } catch (error) {
      console.error(error);
      toast.error('Failed to create group');
    } finally {
      setIsCreating(false);
    }
  }, [createModal, handleSelectGroup]);

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
            {isLoadingList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
              </div>
            ) : filteredGroups.length === 0 ? (
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
          <DetailPanel 
            group={selectedGroup} 
            isLoading={isLoadingDetails && (!selectedGroup || !selectedGroup.column_mappings)} 
          />
        </main>

        {/* Create Modal */}
        <CreateGroupModal
          isOpen={createModal.isOpen}
          onClose={createModal.onClose}
          onCreate={handleCreateGroup}
          isLoading={isCreating}
        />
      </div>
    </DashboardLayout>
  );
}