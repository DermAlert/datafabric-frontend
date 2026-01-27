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
  Search,
  Filter
} from 'lucide-react';
import { useDisclosure } from '@/hooks';
import {
  Modal,
  DropdownMenu,
  DropdownItem,
  EmptyState,
  Select
} from '@/components/ui';
import { Input, SearchInput, Textarea } from '@/components/ui/Input';
import { equivalenceService } from '@/lib/api/services/equivalence';
import { connectionService } from '@/lib/api/services/connection';
import { metadataService } from '@/lib/api/services/metadata';
import { toast } from 'sonner';

const getConnectionColor = (type) => {
  const map = {
    'postgres': '#3b82f6',
    'mysql': '#22c55e',
    'sqlserver': '#ef4444',
    'oracle': '#f97316',
    'mongodb': '#a855f7',
    's3': '#ec4899',
  };
  return map[type?.toLowerCase()] || '#64748b';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Never';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

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
              aria-label="Menu actions"
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
          aria-label="Remove mapping"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

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
                <div className="text-[10px] text-gray-400 mt-1">{mapping.source_column_name}</div>
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
                  aria-label="Remove mapping"
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

const AddColumnMappingModal = memo(function AddColumnMappingModal({
  isOpen,
  onClose,
  onAdd,
  groupId
}) {
  const [connections, setConnections] = useState([]);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [availableColumns, setAvailableColumns] = useState([]);
  const [isLoadingCols, setIsLoadingCols] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      connectionService.list().then(setConnections).catch(console.error);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setIsLoadingCols(true);
      equivalenceService.getAvailableColumns({
        connection_id: selectedConnection ? parseInt(selectedConnection) : undefined,
        exclude_mapped: true
      })
      .then(res => setAvailableColumns(res.columns || []))
      .catch(console.error)
      .finally(() => setIsLoadingCols(false));
    }
  }, [isOpen, selectedConnection]);

  const filteredColumns = availableColumns.filter(col => 
    col.column_name.toLowerCase().includes(search.toLowerCase()) ||
    col.table_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Column Mapping" size="lg">
      <div className="space-y-4">
        <div className="flex gap-4">
          <div className="w-1/3">
            <Select
              label="Filter by Connection"
              value={selectedConnection}
              onChange={setSelectedConnection}
              options={[
                { value: '', label: 'All Connections' },
                ...connections.map(c => ({ value: c.id.toString(), label: c.name }))
              ]}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Search Columns</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by table or column name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
              />
            </div>
          </div>
        </div>

        <div className="h-64 overflow-y-auto border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900">
          {isLoadingCols ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
            </div>
          ) : filteredColumns.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Database className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No available columns found</p>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-white dark:bg-zinc-800 sticky top-0">
                <tr>
                  <th className="px-4 py-2 font-medium">Table</th>
                  <th className="px-4 py-2 font-medium">Column</th>
                  <th className="px-4 py-2 font-medium">Type</th>
                  <th className="px-4 py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                {filteredColumns.slice(0, 50).map((col) => (
                  <tr key={col.id} className="hover:bg-white dark:hover:bg-zinc-800">
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-300">{col.table_name}</td>
                    <td className="px-4 py-2 font-medium text-gray-900 dark:text-white">{col.column_name}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs">{col.data_type}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => onAdd(col.id)}
                        className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded hover:bg-purple-200"
                      >
                        Add
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <p className="text-xs text-gray-500 text-right">Showing top 50 matches</p>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          Done
        </button>
      </div>
    </Modal>
  );
});

const AddValueMappingModal = memo(function AddValueMappingModal({
  isOpen,
  onClose,
  onAdd,
  mappedColumns,
  standardValues
}) {
  const [sourceColumnId, setSourceColumnId] = useState('');
  const [sourceValue, setSourceValue] = useState('');
  const [standardValue, setStandardValue] = useState('');
  const [customStandardValue, setCustomStandardValue] = useState('');

  const handleSubmit = () => {
    if (!sourceColumnId || !sourceValue) return;
    const finalStandardValue = standardValues.length > 0 ? standardValue : customStandardValue;
    if (!finalStandardValue) return;

    onAdd({
      source_column_id: parseInt(sourceColumnId),
      source_value: sourceValue,
      standard_value: finalStandardValue
    });
    
    setSourceValue('');
    setCustomStandardValue('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Value Mapping">
      <div className="space-y-4">
        <Select
          label="Source Column"
          value={sourceColumnId}
          onChange={setSourceColumnId}
          required
          options={mappedColumns.map(mc => ({
            value: mc.column_id.toString(),
            label: `${mc.table_name}.${mc.column_name} (${mc.data_source_name})`
          }))}
        />

        <Input
          label="Source Value"
          placeholder="Original value in database (e.g., 'masculino')"
          value={sourceValue}
          onChange={(e) => setSourceValue(e.target.value)}
          required
        />

        {standardValues && standardValues.length > 0 ? (
          <Select
            label="Standard Value"
            value={standardValue}
            onChange={setStandardValue}
            required
            options={standardValues.map(v => ({ value: v, label: v }))}
          />
        ) : (
          <Input
            label="Standard Value"
            placeholder="Normalized target value (e.g., 'M')"
            value={customStandardValue}
            onChange={(e) => setCustomStandardValue(e.target.value)}
            required
          />
        )}
      </div>
      <div className="flex justify-end gap-3 mt-6">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg"
        >
          Add Mapping
        </button>
      </div>
    </Modal>
  );
});

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

const DetailPanel = memo(function DetailPanel({ 
  group, 
  isLoading,
  onRefresh
}) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [isValueModalOpen, setIsValueModalOpen] = useState(false);

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

  const handleAddColumnMapping = async (columnId) => {
    try {
      await equivalenceService.createColumnMapping({
        group_id: group.id,
        column_id: columnId
      });
      toast.success('Column added');
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add column');
    }
  };

  const handleAddValueMapping = async (data) => {
    try {
      await equivalenceService.createValueMapping({
        group_id: group.id,
        ...data
      });
      toast.success('Value mapping added');
      onRefresh();
      setIsValueModalOpen(false);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to add value mapping');
    }
  };

  const handleRemoveColumnMapping = async (id) => {
    if (!confirm('Remove this column mapping?')) return;
    try {
      await equivalenceService.deleteColumnMapping(id);
      toast.success('Column mapping removed');
      onRefresh();
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
      onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Failed to remove mapping');
    }
  };

  const standardValues = group.standard_values || []; 
  const hasDictionaryTerm = !!group.data_dictionary_term_id;

  return (
    <div className="h-full flex flex-col">
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

      <div className="flex-1 overflow-auto p-6 space-y-6">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-gray-400" />
              Column Mappings
            </h3>
            <button 
              onClick={() => setIsColumnModalOpen(true)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
            >
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

        <section>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-gray-400" />
              Value Mappings
            </h3>
            {group.column_mappings && group.column_mappings.length > 0 && (
              <button 
                onClick={() => setIsValueModalOpen(true)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Mapping
              </button>
            )}
          </div>

          <ValueMappingsTable mappings={group.value_mappings || []} onRemove={handleRemoveValueMapping} />
        </section>
      </div>

      <AddColumnMappingModal 
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onAdd={handleAddColumnMapping}
        groupId={group.id}
      />

      <AddValueMappingModal
        isOpen={isValueModalOpen}
        onClose={() => setIsValueModalOpen(false)}
        onAdd={handleAddValueMapping}
        mappedColumns={group.column_mappings || []}
        standardValues={standardValues}
      />
    </div>
  );
});

export default function EquivalencePage() {
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const createModal = useDisclosure();

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

  const fetchGroupDetails = useCallback(async (groupId) => {
    setIsLoadingDetails(true);
    try {
      const fullDetails = await equivalenceService.getColumnGroup(groupId);
      setSelectedGroup(fullDetails);
    } catch (error) {
      console.error('Failed to fetch group details:', error);
      toast.error('Failed to load group details');
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  const handleSelectGroup = useCallback((groupSummary) => {
    setSelectedGroup(groupSummary);
    fetchGroupDetails(groupSummary.id);
  }, [fetchGroupDetails]);

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
        <aside className="w-96 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
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

        <main className="flex-1 overflow-auto">
          <DetailPanel 
            group={selectedGroup} 
            isLoading={isLoadingDetails && (!selectedGroup || !selectedGroup.column_mappings)} 
            onRefresh={() => fetchGroupDetails(selectedGroup.id)}
          />
        </main>

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