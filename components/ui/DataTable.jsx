'use client';

import React from 'react';
import { clsx } from 'clsx';
import {
  X,
  Copy,
  Expand,
  Filter,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  Timer,
} from 'lucide-react';

const LONG_TEXT_THRESHOLD = 80;

// ===========================================
// Column type inference
// ===========================================

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}|^\d{2}\/\d{2}\/\d{4}/;

function inferColumnType(data, columnName) {
  for (const row of data) {
    const val = row[columnName];
    if (val === null || val === undefined) continue;
    if (typeof val === 'boolean') return 'boolean';
    if (typeof val === 'number') return 'number';
    if (typeof val === 'string') {
      if (DATE_REGEX.test(val)) return 'date';
      return 'string';
    }
    return 'string';
  }
  return 'string';
}

function inferColumnTypes(data, columns) {
  const types = {};
  for (const col of columns) {
    types[col] = inferColumnType(data, col);
  }
  return types;
}

// ===========================================
// Operators per column type
// ===========================================

const OPERATORS_BY_TYPE = {
  string: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'in', label: 'Is one of' },
    { value: 'not_in', label: 'Is not one of' },
    { value: 'is_null', label: 'Is empty' },
    { value: 'is_not_null', label: 'Is not empty' },
  ],
  number: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'gt', label: 'Greater than' },
    { value: 'gte', label: 'Greater or equal' },
    { value: 'lt', label: 'Less than' },
    { value: 'lte', label: 'Less or equal' },
    { value: 'between', label: 'Between' },
    { value: 'in', label: 'Is one of' },
    { value: 'not_in', label: 'Is not one of' },
    { value: 'is_null', label: 'Is empty' },
    { value: 'is_not_null', label: 'Is not empty' },
  ],
  date: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'gt', label: 'After' },
    { value: 'gte', label: 'On or after' },
    { value: 'lt', label: 'Before' },
    { value: 'lte', label: 'On or before' },
    { value: 'between', label: 'Between' },
    { value: 'is_null', label: 'Is empty' },
    { value: 'is_not_null', label: 'Is not empty' },
  ],
  boolean: [
    { value: 'eq', label: 'Equals' },
    { value: 'neq', label: 'Not equals' },
    { value: 'is_null', label: 'Is empty' },
    { value: 'is_not_null', label: 'Is not empty' },
  ],
};

const NO_VALUE_OPERATORS = ['is_null', 'is_not_null'];
const MULTI_VALUE_OPERATORS = ['in', 'not_in'];
const BETWEEN_OPERATOR = 'between';

// ===========================================
// Operator label helper
// ===========================================

function getOperatorLabel(operator) {
  for (const ops of Object.values(OPERATORS_BY_TYPE)) {
    const found = ops.find((o) => o.value === operator);
    if (found) return found.label;
  }
  return operator;
}

// ===========================================
// Cell Detail Modal
// ===========================================

const CellDetailModal = ({ isOpen, onClose, columnName, value }) => {
  if (!isOpen) return null;

  const [copied, setCopied] = React.useState(false);
  const displayValue = value === null || value === undefined ? 'null' : String(value);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[80vh] flex flex-col bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-2 min-w-0">
            <code className="px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold uppercase truncate">
              {columnName}
            </code>
            <span className="text-xs text-gray-400">
              {displayValue.length.toLocaleString()} chars
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-5">
          <div className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed font-mono">
            {displayValue}
          </div>
        </div>
      </div>
    </div>
  );
};

// ===========================================
// Cell Content Renderer
// ===========================================

const CellContent = ({ value, columnName, onExpand }) => {
  if (typeof value === 'boolean') {
    return (
      <span
        className={clsx(
          'px-2 py-0.5 rounded-full text-xs font-medium',
          value
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
        )}
      >
        {value ? 'true' : 'false'}
      </span>
    );
  }

  if (value === null || value === undefined) {
    return <span className="text-gray-400 dark:text-gray-500 italic">null</span>;
  }

  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    if (jsonStr.length > LONG_TEXT_THRESHOLD) {
      return (
        <button
          onClick={() => onExpand(columnName, jsonStr)}
          className="group flex items-center gap-1.5 max-w-[300px] text-left"
        >
          <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded truncate block">
            {jsonStr}
          </code>
          <Expand className="w-3 h-3 text-gray-400 group-hover:text-purple-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      );
    }
    return (
      <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1 py-0.5 rounded">
        {jsonStr}
      </code>
    );
  }

  const strValue = String(value);
  if (strValue.length > LONG_TEXT_THRESHOLD) {
    return (
      <button
        onClick={() => onExpand(columnName, strValue)}
        className="group flex items-center gap-1.5 max-w-[300px] text-left"
      >
        <span className="text-gray-900 dark:text-white truncate block">
          {strValue.slice(0, LONG_TEXT_THRESHOLD)}...
        </span>
        <Expand className="w-3 h-3 text-gray-400 group-hover:text-purple-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    );
  }

  return <span className="text-gray-900 dark:text-white">{strValue}</span>;
};

// ===========================================
// Filter Popover
// ===========================================

const FilterPopover = ({ column, columnType, currentFilter, onApply, onClear, onClose }) => {
  const operators = OPERATORS_BY_TYPE[columnType] || OPERATORS_BY_TYPE.string;
  const [operator, setOperator] = React.useState(currentFilter?._displayOperator || currentFilter?.operator || operators[0].value);
  const [value, setValue] = React.useState(currentFilter?.value ?? '');
  const [betweenMin, setBetweenMin] = React.useState(
    Array.isArray(currentFilter?.value) ? currentFilter.value[0] ?? '' : ''
  );
  const [betweenMax, setBetweenMax] = React.useState(
    Array.isArray(currentFilter?.value) ? currentFilter.value[1] ?? '' : ''
  );
  const [multiValues, setMultiValues] = React.useState(
    Array.isArray(currentFilter?.value) && MULTI_VALUE_OPERATORS.includes(currentFilter?.operator)
      ? currentFilter.value
      : []
  );
  const [multiInput, setMultiInput] = React.useState('');
  const popoverRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleApply = () => {
    if (NO_VALUE_OPERATORS.includes(operator)) {
      // For string columns, treat "Is empty" as eq "" and "Is not empty" as neq ""
      // This catches both NULL and empty strings in Spark
      if (columnType === 'string') {
        onApply({
          column,
          operator: operator === 'is_null' ? 'eq' : 'neq',
          value: '',
          _displayOperator: operator,
        });
      } else {
        onApply({ column, operator });
      }
    } else if (operator === BETWEEN_OPERATOR) {
      if (betweenMin !== '' && betweenMax !== '') {
        const min = columnType === 'number' ? Number(betweenMin) : betweenMin;
        const max = columnType === 'number' ? Number(betweenMax) : betweenMax;
        onApply({ column, operator, value: [min, max] });
      }
    } else if (MULTI_VALUE_OPERATORS.includes(operator)) {
      if (multiValues.length > 0) {
        onApply({ column, operator, value: multiValues });
      }
    } else {
      if (value !== '' && value !== null && value !== undefined) {
        let finalValue = value;
        if (columnType === 'number') finalValue = Number(value);
        if (columnType === 'boolean') finalValue = value === 'true' || value === true;
        onApply({ column, operator, value: finalValue });
      }
    }
    onClose();
  };

  const handleAddMultiValue = () => {
    const trimmed = multiInput.trim();
    if (trimmed && !multiValues.includes(trimmed)) {
      const val = columnType === 'number' ? Number(trimmed) : trimmed;
      setMultiValues([...multiValues, val]);
      setMultiInput('');
    }
  };

  const isNoValue = NO_VALUE_OPERATORS.includes(operator);
  const isBetween = operator === BETWEEN_OPERATOR;
  const isMulti = MULTI_VALUE_OPERATORS.includes(operator);
  const isBoolean = columnType === 'boolean';
  const inputType = columnType === 'number' ? 'number' : columnType === 'date' ? 'date' : 'text';

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-1 z-50 w-72 bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-700 shadow-xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
            Filter: {column}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Operator selector */}
        <div className="relative">
          <select
            value={operator}
            onChange={(e) => {
              setOperator(e.target.value);
              setValue('');
              setBetweenMin('');
              setBetweenMax('');
              setMultiValues([]);
            }}
            className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
          >
            {operators.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Value input */}
        {!isNoValue && (
          <>
            {isBetween ? (
              <div className="flex gap-2 items-center">
                <input
                  type={inputType}
                  value={betweenMin}
                  onChange={(e) => setBetweenMin(e.target.value)}
                  placeholder="Min"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                />
                <span className="text-xs text-gray-400">e</span>
                <input
                  type={inputType}
                  value={betweenMax}
                  onChange={(e) => setBetweenMax(e.target.value)}
                  placeholder="Max"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                />
              </div>
            ) : isMulti ? (
              <div className="space-y-2">
                {multiValues.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {multiValues.map((v, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs"
                      >
                        {String(v)}
                        <button
                          onClick={() => setMultiValues(multiValues.filter((_, idx) => idx !== i))}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex gap-1">
                  <input
                    type={inputType}
                    value={multiInput}
                    onChange={(e) => setMultiInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddMultiValue();
                      }
                    }}
                    placeholder="Add value..."
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                  />
                  <button
                    onClick={handleAddMultiValue}
                    className="px-2 py-2 rounded-lg bg-purple-500 text-white text-xs hover:bg-purple-600"
                  >
                    +
                  </button>
                </div>
              </div>
            ) : isBoolean ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setValue(true)}
                  className={clsx(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    value === true
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  true
                </button>
                <button
                  onClick={() => setValue(false)}
                  className={clsx(
                    'flex-1 px-3 py-2 rounded-lg text-sm font-medium border-2 transition-all',
                    value === false
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-400'
                  )}
                >
                  false
                </button>
              </div>
            ) : (
              <input
                type={inputType}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApply();
                  }
                }}
                placeholder="Value..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                autoFocus
              />
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleApply}
            className="flex-1 px-3 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
          >
            Apply
          </button>
          {currentFilter && (
            <button
              onClick={() => {
                onClear(column);
                onClose();
              }}
              className="px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ===========================================
// Active Filters Bar
// ===========================================

const ActiveFiltersBar = ({ filters, filtersLogic, onRemoveFilter, onClearAll, onToggleLogic }) => {
  if (!filters || filters.length === 0) return null;

  const getFilterDisplayOperator = (filter) => {
    return filter._displayOperator || filter.operator;
  };

  const formatValue = (filter) => {
    if (NO_VALUE_OPERATORS.includes(getFilterDisplayOperator(filter))) return '';
    if (filter.operator === BETWEEN_OPERATOR && Array.isArray(filter.value)) {
      return `${filter.value[0]} — ${filter.value[1]}`;
    }
    if (MULTI_VALUE_OPERATORS.includes(filter.operator) && Array.isArray(filter.value)) {
      return filter.value.join(', ');
    }
    if (filter.value === '' || filter.value === null || filter.value === undefined) return '';
    return String(filter.value);
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/10 border-b border-purple-200 dark:border-purple-800/30 flex-wrap">
      <Filter className="w-3.5 h-3.5 text-purple-500 shrink-0" />
      {filters.length > 1 && (
        <button
          onClick={onToggleLogic}
          className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-200 dark:bg-purple-800/50 text-purple-700 dark:text-purple-300 hover:bg-purple-300 dark:hover:bg-purple-800 transition-colors"
        >
          {filtersLogic}
        </button>
      )}
      {filters.map((f, i) => (
        <span
          key={`${f.column}-${i}`}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-800/50 text-xs"
        >
          <span className="font-semibold text-purple-700 dark:text-purple-300">{f.column}</span>
          <span className="text-gray-500 dark:text-gray-400">{getOperatorLabel(getFilterDisplayOperator(f))}</span>
          {formatValue(f) && (
            <span className="font-mono text-gray-900 dark:text-white">{formatValue(f)}</span>
          )}
          <button
            onClick={() => onRemoveFilter(i)}
            className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-200 font-medium ml-1"
      >
        Clear all
      </button>
    </div>
  );
};

// ===========================================
// Pagination Controls
// ===========================================

const Pagination = ({ currentPage, totalPages, totalRows, pageSize, onPageChange, onPageSizeChange }) => {
  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalRows);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
        <span>
          Showing {start} to {end} of {totalRows.toLocaleString()} rows
        </span>
        <div className="flex items-center gap-1.5">
          <span>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
          >
            {[15, 25, 50, 100].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {getPageNumbers().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-gray-400 text-sm">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={clsx(
                'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                p === currentPage
                  ? 'bg-purple-500 text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// ===========================================
// DataTable Component
// ===========================================

/**
 * DataTable with optional server-side filtering, sorting and pagination.
 *
 * Basic mode (just columns + data):
 *   <DataTable columns={[...]} data={[...]} />
 *
 * Server-side mode (with callbacks):
 *   <DataTable
 *     columns={[...]} data={[...]}
 *     totalRows={352} page={1} pageSize={15}
 *     filters={[]} filtersLogic="AND"
 *     sortBy={null} sortOrder="asc"
 *     isLoading={false} queryTime={0.45}
 *     onQueryChange={({ filters, filtersLogic, sortBy, sortOrder, page, pageSize }) => {}}
 *   />
 */
export const DataTable = ({
  columns,
  data,
  // Server-side props (all optional)
  totalRows: totalRowsProp,
  page: pageProp,
  pageSize: pageSizeProp,
  filters: filtersProp,
  filtersLogic: filtersLogicProp,
  sortBy: sortByProp,
  sortOrder: sortOrderProp,
  isLoading,
  queryTime,
  onQueryChange,
}) => {
  const isServerSide = typeof onQueryChange === 'function';

  const [expandedCell, setExpandedCell] = React.useState(null);
  const [openFilterColumn, setOpenFilterColumn] = React.useState(null);

  // Client-side state (used only when NOT server-side)
  const [clientPage, setClientPage] = React.useState(1);
  const [clientPageSize, setClientPageSize] = React.useState(15);
  const [clientSearch, setClientSearch] = React.useState('');

  // Server-side state
  const filters = filtersProp || [];
  const filtersLogic = filtersLogicProp || 'AND';
  const sortBy = sortByProp || null;
  const sortOrder = sortOrderProp || 'asc';
  const page = isServerSide ? (pageProp || 1) : clientPage;
  const pageSize = isServerSide ? (pageSizeProp || 15) : clientPageSize;

  const sortedColumns = React.useMemo(() => {
    if (!columns) return [];
    const regular = columns.filter((c) => !c.startsWith('_'));
    const internal = columns.filter((c) => c.startsWith('_'));
    return [...regular, ...internal];
  }, [columns]);

  const columnTypes = React.useMemo(() => {
    if (!data || !sortedColumns.length) return {};
    return inferColumnTypes(data, sortedColumns);
  }, [data, sortedColumns]);

  // Client-side filtering & pagination
  const clientFilteredData = React.useMemo(() => {
    if (isServerSide || !data) return data || [];
    if (!clientSearch) return data;
    const q = clientSearch.toLowerCase();
    return data.filter((row) =>
      sortedColumns.some((col) => {
        const val = row[col];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      })
    );
  }, [data, clientSearch, sortedColumns, isServerSide]);

  const totalRows = isServerSide ? (totalRowsProp || 0) : clientFilteredData.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));

  const displayData = React.useMemo(() => {
    if (isServerSide) return data || [];
    const start = (clientPage - 1) * clientPageSize;
    return clientFilteredData.slice(start, start + clientPageSize);
  }, [isServerSide, data, clientFilteredData, clientPage, clientPageSize]);

  if (!sortedColumns.length) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        <p>No columns to display</p>
      </div>
    );
  }

  // Server-side handlers
  const emitChange = (overrides) => {
    if (!isServerSide) return;
    onQueryChange({
      filters,
      filtersLogic,
      sortBy,
      sortOrder,
      page,
      pageSize,
      ...overrides,
    });
  };

  const handleSort = (col) => {
    if (isServerSide) {
      if (sortBy === col) {
        if (sortOrder === 'asc') emitChange({ sortOrder: 'desc' });
        else emitChange({ sortBy: null, sortOrder: 'asc' });
      } else {
        emitChange({ sortBy: col, sortOrder: 'asc', page: 1 });
      }
    }
  };

  const handleApplyFilter = (filter) => {
    const newFilters = filters.filter((f) => f.column !== filter.column);
    newFilters.push(filter);
    emitChange({ filters: newFilters, page: 1 });
  };

  const handleClearFilter = (column) => {
    emitChange({ filters: filters.filter((f) => f.column !== column), page: 1 });
  };

  const handleRemoveFilterByIndex = (index) => {
    const newFilters = filters.filter((_, i) => i !== index);
    emitChange({ filters: newFilters, page: 1 });
  };

  const handleClearAllFilters = () => {
    emitChange({ filters: [], page: 1 });
  };

  const handleToggleLogic = () => {
    emitChange({ filtersLogic: filtersLogic === 'AND' ? 'OR' : 'AND', page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (isServerSide) {
      emitChange({ page: newPage });
    } else {
      setClientPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize) => {
    if (isServerSide) {
      emitChange({ pageSize: newSize, page: 1 });
    } else {
      setClientPageSize(newSize);
      setClientPage(1);
    }
  };

  const handleExpandCell = (columnName, value) => {
    setExpandedCell({ columnName, value });
  };

  const getFilterForColumn = (col) => filters.find((f) => f.column === col);

  return (
    <>
      <div className="rounded-xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        {/* Client-side search (non-server mode only) */}
        {!isServerSide && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-zinc-700">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => {
                  setClientSearch(e.target.value);
                  setClientPage(1);
                }}
                placeholder="Search data..."
                className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
              />
            </div>
          </div>
        )}

        {/* Active filters bar (server-side only) */}
        {isServerSide && (
          <ActiveFiltersBar
            filters={filters}
            filtersLogic={filtersLogic}
            onRemoveFilter={handleRemoveFilterByIndex}
            onClearAll={handleClearAllFilters}
            onToggleLogic={handleToggleLogic}
          />
        )}

        {/* Table */}
        <div className="relative overflow-x-scroll overflow-y-hidden">
          {isLoading && (
            <div className="absolute inset-0 bg-white/60 dark:bg-zinc-900/60 z-10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
            </div>
          )}
          <table className="w-full min-w-max">
            <thead>
              <tr className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
                {sortedColumns.map((col) => {
                  const colFilter = getFilterForColumn(col);
                  const isSorted = sortBy === col;
                  return (
                    <th
                      key={col}
                      className="relative px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5">
                        {/* Sort button (server-side only) */}
                        {isServerSide ? (
                          <button
                            onClick={() => handleSort(col)}
                            className="flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition-colors"
                          >
                            {col}
                            {isSorted ? (
                              sortOrder === 'asc' ? (
                                <ArrowUp className="w-3 h-3 text-purple-500" />
                              ) : (
                                <ArrowDown className="w-3 h-3 text-purple-500" />
                              )
                            ) : (
                              <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 text-gray-400" />
                            )}
                          </button>
                        ) : (
                          <span>{col}</span>
                        )}

                        {/* Filter button (server-side only) */}
                        {isServerSide && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenFilterColumn(openFilterColumn === col ? null : col);
                            }}
                            className={clsx(
                              'p-0.5 rounded transition-colors',
                              colFilter
                                ? 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
                                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-50 hover:opacity-100'
                            )}
                          >
                            <Filter className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Filter popover */}
                      {isServerSide && openFilterColumn === col && (
                        <FilterPopover
                          column={col}
                          columnType={columnTypes[col] || 'string'}
                          currentFilter={colFilter}
                          onApply={handleApplyFilter}
                          onClear={handleClearFilter}
                          onClose={() => setOpenFilterColumn(null)}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {displayData.length === 0 ? (
                <tr>
                  <td colSpan={sortedColumns.length} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
                      <Search className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-medium">No results found</p>
                      {filters.length > 0 && (
                        <p className="text-xs">Try adjusting the applied filters</p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((row, idx) => (
                  <tr
                    key={idx}
                    className="bg-white dark:bg-zinc-900 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    {sortedColumns.map((col) => (
                      <td key={col} className="px-4 py-3 text-sm whitespace-nowrap">
                        <div className="max-w-[350px] overflow-hidden">
                          <CellContent
                            value={row[col]}
                            columnName={col}
                            onExpand={handleExpandCell}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with pagination and info */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
            {totalRows > 0 ? (
              <span>
                Showing {(page - 1) * pageSize + 1} to{' '}
                {Math.min(page * pageSize, totalRows)} of {totalRows.toLocaleString()} rows
              </span>
            ) : (
              <span>0 rows</span>
            )}
            <div className="flex items-center gap-1.5">
              <span>Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="px-2 py-1 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
              >
                {[15, 25, 50, 100].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {queryTime !== undefined && queryTime !== null && (
              <span className="flex items-center gap-1 text-xs">
                <Timer className="w-3 h-3" />
                {queryTime.toFixed(2)}s
              </span>
            )}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page <= 1}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {(() => {
                const pages = [];
                if (totalPages <= 7) {
                  for (let i = 1; i <= totalPages; i++) pages.push(i);
                } else {
                  pages.push(1);
                  if (page > 3) pages.push('...');
                  for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) {
                    pages.push(i);
                  }
                  if (page < totalPages - 2) pages.push('...');
                  pages.push(totalPages);
                }
                return pages.map((p, i) =>
                  p === '...' ? (
                    <span key={`d${i}`} className="px-1.5 text-gray-400 text-sm">
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => handlePageChange(p)}
                      className={clsx(
                        'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                        p === page
                          ? 'bg-purple-500 text-white'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                      )}
                    >
                      {p}
                    </button>
                  )
                );
              })()}
              <button
                onClick={() => handlePageChange(page + 1)}
                disabled={page >= totalPages}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      <CellDetailModal
        isOpen={!!expandedCell}
        onClose={() => setExpandedCell(null)}
        columnName={expandedCell?.columnName}
        value={expandedCell?.value}
      />
    </>
  );
};
