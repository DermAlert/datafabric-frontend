'use client';

import React, { useState, useCallback, useEffect, useRef, memo } from 'react';
import { useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Plus,
  X,
  Columns,
  ChevronRight,
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

const getSourceColor = (sourceName) => {
  const palette = [
    '#3b82f6', // blue
    '#22c55e', // green
    '#a855f7', // purple
    '#f59e0b', // amber
    '#ef4444', // red
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
  ];
  if (!sourceName) return '#64748b';
  let hash = 0;
  for (let i = 0; i < sourceName.length; i++) {
    hash = sourceName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
};

const DISTINCT_PAGE_SIZE = 12;

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
  onEdit,
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
          <DropdownItem
            icon={<Pencil className="w-3.5 h-3.5" />}
            onClick={(e) => {
              e.stopPropagation();
              menuDisclosure.onClose();
              onEdit?.(group);
            }}
          >
            Edit
          </DropdownItem>
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
                <div className="text-[10px] text-gray-400 mt-1">
                  {mapping.table_name
                    ? `${mapping.table_name}.${mapping.source_column_name}`
                    : mapping.source_column_name}
                </div>
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
      connectionService
        .list()
        .then((allConnections) => {
          // Equivalence column mapping only supports metadata sources.
          const metadataConnections = allConnections.filter(
            (conn) => conn.content_type === 'metadata'
          );
          setConnections(metadataConnections);
        })
        .catch(console.error);
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

        <div className="h-64 overflow-auto border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-900">
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
            <div className="p-2 space-y-2">
              {filteredColumns.slice(0, 50).map((col) => (
                <div
                  key={col.id}
                  className="group flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm transition-all"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 text-[11px] text-gray-500 dark:text-gray-400 mb-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: getSourceColor(col.data_source_name) }}
                        aria-hidden="true"
                        title={col.data_source_name}
                      />
                      <span className="truncate font-medium" title={col.data_source_name}>
                        {col.data_source_name}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="truncate" title={`${col.schema_name}.${col.table_name}`}>
                        {col.schema_name}.{col.table_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate"
                        title={col.column_name}
                      >
                        {col.column_name}
                      </span>
                      <span
                        className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-300 uppercase"
                        title={col.data_type}
                      >
                        {col.data_type}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => onAdd(col.id)}
                    className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/30 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              ))}
            </div>
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

const ColumnValueMapper = memo(function ColumnValueMapper({
  mapping,
  standardValues,
  onAdd,
  existingMappings,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [sourceValue, setSourceValue] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [standardValue, setStandardValue] = useState('');
  const [customStandardValue, setCustomStandardValue] = useState('');
  const [distinctOrder, setDistinctOrder] = useState('frequency_desc');
  const [distinctItems, setDistinctItems] = useState([]);
  const [visibleSuggestions, setVisibleSuggestions] = useState(5);
  const [distinctNextOffset, setDistinctNextOffset] = useState(null);
  const [distinctHasMore, setDistinctHasMore] = useState(false);
  const [isLoadingDistinct, setIsLoadingDistinct] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [distinctError, setDistinctError] = useState('');
  const distinctCacheRef = useRef(new Map());

  const color = getConnectionColor(mapping.data_source_type);
  const columnId = mapping.column_id;

  // Existing value mappings for this specific column
  const columnMappings = (existingMappings || []).filter(
    (vm) => vm.source_column_id === columnId
  );

  const normalizeValueToInput = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return '';
    return String(value);
  };

  const formatSuggestion = (value) => {
    if (value === null) return 'null';
    const str = String(value);
    return str.length > 30 ? `${str.slice(0, 30)}...` : str;
  };

  const applyDistinctResponse = useCallback((response, append) => {
    const withCount = response.distinct_values_with_count?.length
      ? response.distinct_values_with_count
      : (response.distinct_values || []).map((value) => ({ value, count: 0 }));

    setDistinctItems((prev) => {
      if (!append) return withCount;
      const seen = new Set(prev.map((item) => JSON.stringify(item.value)));
      const merged = [...prev];
      withCount.forEach((item) => {
        const key = JSON.stringify(item.value);
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(item);
        }
      });
      return merged;
    });

    setDistinctNextOffset(response.next_offset ?? null);
    setDistinctHasMore(Boolean(response.has_more ?? response.next_offset !== null));
  }, []);

  const loadDistinctSuggestions = useCallback(async (append = false) => {
    const offset = append ? (distinctNextOffset ?? 0) : 0;
    const requestKey = `${columnId}:${distinctOrder}:${offset}`;

    if (!append) {
      setDistinctItems([]);
      setVisibleSuggestions(5);
    }

    const cached = distinctCacheRef.current.get(requestKey);
    if (cached) {
      applyDistinctResponse(cached, append);
      return;
    }

    setIsLoadingDistinct(true);
    setDistinctError('');
    try {
      const response = await metadataService.getDistinctValues(columnId, {
        limit: DISTINCT_PAGE_SIZE,
        offset,
        orderBy: distinctOrder,
      });
      distinctCacheRef.current.set(requestKey, response);
      applyDistinctResponse(response, append);
    } catch (error) {
      console.error('Failed to load distinct suggestions:', error);
      setDistinctError('Could not load suggested values');
      setDistinctHasMore(false);
      setDistinctNextOffset(null);
    } finally {
      setIsLoadingDistinct(false);
    }
  }, [columnId, distinctOrder, distinctNextOffset, applyDistinctResponse]);

  // Load distincts when expanded
  useEffect(() => {
    if (isExpanded && distinctItems.length === 0 && !isLoadingDistinct && !distinctError) {
      loadDistinctSuggestions(false);
    }
  }, [isExpanded]);

  // Reload when sort order changes
  useEffect(() => {
    if (isExpanded) {
      loadDistinctSuggestions(false);
    }
  }, [distinctOrder]);

  const handleSubmit = async () => {
    if (!sourceValue) return;
    const finalStandardValue = standardValues.length > 0 ? standardValue : customStandardValue;
    if (!finalStandardValue) return;

    setIsSaving(true);
    try {
      await onAdd({
        source_column_id: columnId,
        source_value: sourceValue,
        standard_value: finalStandardValue,
      });
      setSourceValue('');
      setCustomStandardValue('');
    } finally {
      setIsSaving(false);
    }
  };

  // Already-mapped source values (to show which are done)
  const mappedSourceValues = new Set(columnMappings.map((vm) => vm.source_value));

  return (
    <div
      className={clsx(
        'rounded-lg transition-colors',
        isExpanded
          ? 'border border-purple-200 dark:border-purple-800 bg-white dark:bg-zinc-800'
          : 'border border-dashed border-gray-300 dark:border-zinc-600 bg-gray-50/50 dark:bg-zinc-800/30 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/30 dark:hover:bg-purple-900/10'
      )}
    >
      {/* Header - always visible */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Plus
            className={clsx(
              'w-4 h-4 shrink-0 transition-transform duration-200',
              isExpanded
                ? 'text-purple-500 rotate-45'
                : 'text-purple-400'
            )}
          />
          <div className="min-w-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">
              {isExpanded ? 'Adding mappings for' : 'Add mapping'}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-mono text-sm text-gray-900 dark:text-white truncate">
                {mapping.table_name}.
                <span className="text-purple-600 dark:text-purple-400">{mapping.column_name}</span>
              </span>
            </div>
            <div className="text-[11px] text-gray-400 dark:text-gray-500">{mapping.data_source_name}</div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {columnMappings.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-medium">
              {columnMappings.length} done
            </span>
          )}
        </div>
      </button>

      {/* Expanded area */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-100 dark:border-zinc-700 pt-3">
          {/* Existing mappings for this column */}
          {columnMappings.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {columnMappings.map((vm) => (
                <span
                  key={vm.id}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-gray-300"
                >
                  <code>{vm.source_value}</code>
                  <ArrowRight className="w-3 h-3 text-gray-400" />
                  <code className="text-purple-600 dark:text-purple-400">{vm.standard_value}</code>
                </span>
              ))}
            </div>
          )}

          {/* Distinct suggestions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Source values</span>
              <select
                value={distinctOrder}
                onChange={(e) => setDistinctOrder(e.target.value)}
                className="text-[11px] px-1.5 py-0.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-300"
              >
                <option value="frequency_desc">Most frequent</option>
                <option value="value_asc">A → Z</option>
                <option value="frequency_asc">Least frequent</option>
              </select>
            </div>

            {isLoadingDistinct && distinctItems.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-gray-500 py-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Loading...
              </div>
            ) : distinctError ? (
              <div className="text-xs text-red-500">{distinctError}</div>
            ) : distinctItems.length === 0 ? (
              <div className="text-xs text-gray-500">No distinct values found.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-1.5">
                  {distinctItems.slice(0, visibleSuggestions).map((item, idx) => {
                    const inputValue = normalizeValueToInput(item.value);
                    const isSelected = sourceValue === inputValue;
                    const alreadyMapped = mappedSourceValues.has(inputValue);
                    return (
                      <button
                        key={`${JSON.stringify(item.value)}-${idx}`}
                        type="button"
                        onClick={() => {
                          if (alreadyMapped) return;
                          setSourceValue(inputValue);
                          setShowManualInput(false);
                        }}
                        disabled={alreadyMapped}
                        className={clsx(
                          'inline-flex items-center gap-1 px-2 py-1 rounded text-xs border transition-colors',
                          alreadyMapped
                            ? 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 opacity-60 cursor-default line-through'
                            : isSelected
                              ? 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-300'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-gray-300 dark:hover:bg-zinc-800'
                        )}
                        title={alreadyMapped ? `Already mapped` : inputValue}
                      >
                        <span className="font-mono">{formatSuggestion(item.value)}</span>
                        {item.count > 0 && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-400">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setShowManualInput((prev) => !prev)}
                    className={clsx(
                      'inline-flex items-center rounded text-xs border border-dashed px-2 py-1 transition-colors font-medium',
                      showManualInput
                        ? 'border-purple-400 text-purple-600 bg-purple-50 dark:border-purple-700 dark:text-purple-300 dark:bg-purple-900/20'
                        : 'border-gray-300 text-gray-500 hover:border-purple-400 hover:text-purple-600 dark:border-zinc-600 dark:text-gray-400 dark:hover:border-purple-700 dark:hover:text-purple-300'
                    )}
                  >
                    {showManualInput ? 'Hide manual' : 'Type manually'}
                  </button>
                </div>
                {(visibleSuggestions < distinctItems.length || distinctHasMore) && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (visibleSuggestions < distinctItems.length) {
                        setVisibleSuggestions((prev) => prev + 6);
                        return;
                      }
                      if (distinctHasMore && !isLoadingDistinct) {
                        await loadDistinctSuggestions(true);
                        setVisibleSuggestions((prev) => prev + 6);
                      }
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                    disabled={isLoadingDistinct}
                  >
                    {isLoadingDistinct ? 'Loading more...' : 'Show more values'}
                  </button>
                )}
              </>
            )}
          </div>

          {/* Manual input (collapsed by default) */}
          {showManualInput && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
                  Manual source value
                </label>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  Hide
                </button>
              </div>
              <input
                type="text"
                placeholder="Type a value..."
                value={sourceValue}
                onChange={(e) => setSourceValue(e.target.value)}
                className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          )}

          {/* Standard value + submit */}
          {sourceValue && (
            <div className="flex items-end gap-2 pt-1">
              <div className="flex-1 min-w-0">
                {standardValues && standardValues.length > 0 ? (
                  <Select
                    label={<span className="text-xs">Map to</span>}
                    value={standardValue}
                    onChange={setStandardValue}
                    options={standardValues.map((v) => ({ value: v, label: v }))}
                  />
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Map to
                    </label>
                    <input
                      type="text"
                      placeholder="Standard value"
                      value={customStandardValue}
                      onChange={(e) => setCustomStandardValue(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-md border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-gray-900 dark:text-white placeholder-gray-400"
                    />
                  </div>
                )}
              </div>
              <button
                onClick={handleSubmit}
                disabled={
                  isSaving ||
                  !sourceValue ||
                  (standardValues && standardValues.length > 0 ? !standardValue : !customStandardValue)
                }
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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

const EditGroupModal = memo(function EditGroupModal({
  isOpen,
  onClose,
  group,
  onSave,
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

  useEffect(() => {
    if (isOpen && group) {
      setName(group.name || '');
      setDescription(group.description || '');
      setTermId(group.data_dictionary_term_id ? String(group.data_dictionary_term_id) : '');
    }
  }, [isOpen, group]);

  const handleSubmit = () => {
    if (!name.trim() || !group?.id) return;
    onSave({
      name: name.trim(),
      description: description.trim(),
      data_dictionary_term_id: termId ? parseInt(termId) : null
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Column Group">
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
          Save Changes
        </button>
      </div>
    </Modal>
  );
});

const DetailPanel = memo(function DetailPanel({ 
  group, 
  isLoading,
  onRefresh,
  onEdit
}) {
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    columnMappings: false,
    valueMappings: false,
    allValueMappings: false,
  });

  const toggleSection = useCallback((section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  }, []);

  useEffect(() => {
    setCollapsedSections({
      columnMappings: false,
      valueMappings: false,
      allValueMappings: false,
    });
  }, [group?.id]);

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
          <button
            onClick={() => onEdit?.(group)}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg"
          >
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
            <button
              type="button"
              onClick={() => toggleSection('columnMappings')}
              className="flex-1 min-w-0 font-semibold text-gray-900 dark:text-white flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-left"
            >
              <ChevronRight
                className={clsx(
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  !collapsedSections.columnMappings && 'rotate-90'
                )}
              />
              <Database className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Column Mappings</h3>
            </button>
            <button 
              onClick={() => setIsColumnModalOpen(true)}
              className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Add Column
            </button>
          </div>

          {!collapsedSections.columnMappings && (
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
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => toggleSection('valueMappings')}
              className="w-full font-semibold text-gray-900 dark:text-white flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-left"
            >
              <ChevronRight
                className={clsx(
                  'w-4 h-4 text-gray-400 transition-transform duration-200',
                  !collapsedSections.valueMappings && 'rotate-90'
                )}
              />
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Value Mappings</h3>
            </button>
          </div>

          {!collapsedSections.valueMappings && (
            <>
              {group.column_mappings && group.column_mappings.length > 0 ? (
                <div className="space-y-3">
                  {group.column_mappings.map((cm) => (
                    <ColumnValueMapper
                      key={cm.id}
                      mapping={cm}
                      standardValues={standardValues}
                      onAdd={handleAddValueMapping}
                      existingMappings={group.value_mappings || []}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-6 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-dashed border-gray-300 dark:border-zinc-600 text-center">
                  <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Add column mappings first to configure value transformations.
                  </p>
                </div>
              )}
            </>
          )}

          {(group.value_mappings || []).length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => toggleSection('allValueMappings')}
                className="w-full font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3 hover:text-gray-700 dark:hover:text-gray-200 transition-colors text-left"
              >
                <ChevronRight
                  className={clsx(
                    'w-4 h-4 text-gray-400 transition-transform duration-200',
                    !collapsedSections.allValueMappings && 'rotate-90'
                  )}
                />
                <Layers className="w-4 h-4 text-gray-400" />
                <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  All Value Mappings
                </h4>
              </button>
              {!collapsedSections.allValueMappings && (
                <ValueMappingsTable mappings={group.value_mappings} onRemove={handleRemoveValueMapping} />
              )}
            </div>
          )}
        </section>
      </div>

      <AddColumnMappingModal 
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onAdd={handleAddColumnMapping}
        groupId={group.id}
      />

    </div>
  );
});

export default function EquivalencePage() {
  const searchParams = useSearchParams();
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  
  const createModal = useDisclosure();
  const editModal = useDisclosure();

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

  // Auto-select group when arriving with /equivalence?group_id=<id>
  useEffect(() => {
    const groupIdParam = searchParams.get('group_id');
    if (!groupIdParam) return;

    const groupId = Number(groupIdParam);
    if (!Number.isFinite(groupId)) return;
    if (selectedGroup?.id === groupId) return;
    if (!groups.length) return;

    const groupFromList = groups.find((g) => g.id === groupId);
    if (groupFromList) {
      handleSelectGroup(groupFromList);
    }
  }, [groups, searchParams, selectedGroup?.id, handleSelectGroup]);

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

  const openEditGroup = useCallback((group) => {
    if (!group) return;
    setEditingGroup(group);
    editModal.onOpen();
  }, [editModal]);

  const handleUpdateGroup = useCallback(async (data) => {
    if (!editingGroup?.id) return;
    setIsUpdating(true);
    try {
      const updated = await equivalenceService.updateColumnGroup(editingGroup.id, data);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)));
      toast.success('Group updated');
      editModal.onClose();

      // Refresh details to keep mappings/derived fields in sync
      await fetchGroupDetails(updated.id);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Failed to update group');
    } finally {
      setIsUpdating(false);
    }
  }, [editingGroup?.id, editModal, fetchGroupDetails]);

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
                    onEdit={openEditGroup}
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
            onEdit={openEditGroup}
          />
        </main>

        <CreateGroupModal
          isOpen={createModal.isOpen}
          onClose={createModal.onClose}
          onCreate={handleCreateGroup}
          isLoading={isCreating}
        />

        <EditGroupModal
          isOpen={editModal.isOpen}
          onClose={() => {
            editModal.onClose();
            setEditingGroup(null);
          }}
          group={editingGroup}
          onSave={handleUpdateGroup}
          isLoading={isUpdating}
        />
      </div>
    </DashboardLayout>
  );
}