import React, { useState, useRef, useEffect } from 'react';
import { 
  Table, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  MoreVertical,
  Search,
  Database,
  List,
  Loader2,
  X,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  ChevronsUpDown
} from 'lucide-react';
import { clsx } from 'clsx';
import { metadataService } from '@/lib/api';

export default function SchemaListView({ tables }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [distinctValues, setDistinctValues] = useState(null);
  const [expandedTables, setExpandedTables] = useState(new Set());
  const menuRef = useRef(null);
  const distinctRef = useRef(null);

  // Toggle a single table's expanded state
  const toggleTable = (tableId) => {
    setExpandedTables(prev => {
      const next = new Set(prev);
      if (next.has(tableId)) {
        next.delete(tableId);
      } else {
        next.add(tableId);
      }
      return next;
    });
  };

  // Expand all tables
  const expandAll = () => {
    setExpandedTables(new Set(tables.map(t => t.id)));
  };

  // Collapse all tables
  const collapseAll = () => {
    setExpandedTables(new Set());
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
      if (distinctRef.current && !distinctRef.current.contains(event.target)) {
        setDistinctValues(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleViewDistinctValues = async (col) => {
    // Extract column ID from format "col_123" -> 123
    const columnId = parseInt(col.id.replace('col_', ''), 10);
    
    if (isNaN(columnId)) {
      console.error('Invalid column ID:', col.id);
      return;
    }

    // Set loading state
    setDistinctValues({
      columnId: col.id,
      isLoading: true,
      data: null,
      error: null
    });

    try {
      const data = await metadataService.getDistinctValues(columnId, 10);
      setDistinctValues({
        columnId: col.id,
        isLoading: false,
        data,
        error: null
      });
    } catch (err) {
      console.error('Failed to fetch distinct values:', err);
      setDistinctValues({
        columnId: col.id,
        isLoading: false,
        data: null,
        error: err.message || 'Failed to load values'
      });
    }
  };

  const filteredTables = tables.filter(table => {
    const label = table.data?.label || '';
    const columns = table.data?.columns || [];
    
    return label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      columns.some((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  const formatValue = (value) => {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return value.length > 30 ? value.slice(0, 30) + '...' : value;
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm">
      {/* Search & Filter Bar */}
      <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search tables and columns..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
        
        {/* Expand/Collapse All Buttons */}
        <div className="flex items-center gap-1 border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
          <button
            onClick={expandAll}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            title="Expand all tables"
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
            Expand All
          </button>
          <div className="w-px h-6 bg-gray-200 dark:bg-zinc-700" />
          <button
            onClick={collapseAll}
            className="px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
            title="Collapse all tables"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            Collapse All
          </button>
        </div>
      </div>

      {/* Table List */}
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {filteredTables.map((table) => {
          // Use data property as primary source of truth, fallback to top-level if needed
          const label = table.data?.label || table.label || 'Unknown Table';
          const isActive = table.data?.active !== false; // Default true unless explicitly false
          const columns = table.data?.columns || table.columns || [];
          const isExpanded = expandedTables.has(table.id);
          
          return (
            <div key={table.id} className="p-4 group hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors">
              {/* Table Header */}
              <div className="flex items-center justify-between">
                {/* Clickable area to expand/collapse - includes icon, name and column count */}
                <div 
                  className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-gray-100/50 dark:hover:bg-zinc-700/30 -ml-2 pl-2 -my-1 py-1 rounded-lg transition-colors"
                  onClick={() => toggleTable(table.id)}
                >
                  {/* Expand/Collapse Toggle */}
                  <button
                    className="p-1.5 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded text-gray-500 transition-colors"
                    title={isExpanded ? "Collapse columns" : "Expand columns"}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  
                  <div className={clsx(
                    "p-2 rounded-lg transition-colors",
                    isActive 
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" 
                      : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
                  )}>
                    <Table className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={clsx("text-sm font-semibold flex items-center gap-2", isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400")}>
                      {label}
                      {table.data?.schemaBadge && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                          {table.data.schemaBadge}
                        </span>
                      )}
                      {!isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 font-medium">Inactive</span>}
                    </h3>
                    <p className="text-xs text-gray-500">{columns.length} columns</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 ml-2">
                  <button 
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-500 transition-colors"
                    onClick={() => table.data?.onToggleActive?.(table.id)}
                    title={isActive ? "Deactivate Table" : "Activate Table"}
                  >
                    {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  
                  <div className="relative">
                    <button 
                      className={clsx(
                        "p-1.5 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded text-gray-500 transition-colors",
                        openMenu === table.id && "bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === table.id ? null : table.id);
                      }}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenu === table.id && (
                      <div ref={menuRef} className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                        <button 
                          className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                          onClick={() => {
                            table.data?.onLinkImage?.(table.id);
                            setOpenMenu(null);
                          }}
                        >
                          <ImageIcon className="w-3.5 h-3.5" />
                          Link Image Storage
                        </button>
                        <button 
                          className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                          onClick={() => {
                            table.data?.onViewSample?.(table.id);
                            setOpenMenu(null);
                          }}
                        >
                          <Database className="w-3.5 h-3.5" />
                          View Data Sample
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Column List (Collapsible) */}
              {isExpanded && (
              <div className={clsx("ml-14 mt-3 space-y-1 transition-all duration-300 animate-in fade-in slide-in-from-top-2", !isActive && "opacity-50")}>
                {columns.map((col) => (
                  <div key={col.id} className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-xs transition-colors group/col">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "font-mono transition-colors",
                        col.active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 line-through"
                      )}>{col.name}</span>
                      <span className="text-gray-400 text-[10px] uppercase">{col.type}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {/* Always visible indicators */}
                      <div className="flex items-center gap-1.5">
                        {col.isPk && <span className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded">PK</span>}
                        {col.isFk && <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">FK</span>}
                        {col.isImagePath && <ImageIcon className="w-3 h-3 text-purple-500" />}
                      </div>

                      {/* Distinct Values Button */}
                      <div className="relative">
                        <button
                          className={clsx(
                            "p-1 rounded transition-colors",
                            distinctValues?.columnId === col.id
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : "text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 opacity-0 group-hover/col:opacity-100"
                          )}
                          title="View distinct values"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (distinctValues?.columnId === col.id) {
                              setDistinctValues(null);
                            } else {
                              handleViewDistinctValues(col);
                            }
                          }}
                        >
                          <List className="w-3 h-3" />
                        </button>

                        {/* Distinct Values Popover */}
                        {distinctValues?.columnId === col.id && (
                          <div 
                            ref={distinctRef}
                            className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100"
                          >
                            {/* Header */}
                            <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-zinc-700">
                              <div className="flex items-center gap-2">
                                <List className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                  Distinct Values
                                </span>
                              </div>
                              <button
                                onClick={() => setDistinctValues(null)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded text-gray-400 hover:text-gray-600"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>

                            {/* Content */}
                            <div className="p-2 max-h-48 overflow-y-auto">
                              {distinctValues.isLoading ? (
                                <div className="flex items-center justify-center py-4 text-gray-500">
                                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                  <span className="text-xs">Loading...</span>
                                </div>
                              ) : distinctValues.error ? (
                                <div className="flex items-center justify-center py-4 text-red-500">
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  <span className="text-xs">{distinctValues.error}</span>
                                </div>
                              ) : distinctValues.data && distinctValues.data.distinct_values.length > 0 ? (
                                <div className="space-y-1">
                                  {distinctValues.data.distinct_values.map((value, idx) => (
                                    <div 
                                      key={idx}
                                      className={clsx(
                                        "px-2 py-1.5 rounded text-xs font-mono",
                                        value === null 
                                          ? "text-gray-400 italic bg-gray-50 dark:bg-zinc-700/50" 
                                          : "text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-zinc-700/50"
                                      )}
                                      title={String(value)}
                                    >
                                      {formatValue(value)}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-center py-4 text-gray-400">
                                  <span className="text-xs">No values found</span>
                                </div>
                              )}
                            </div>

                            {/* Footer */}
                            {distinctValues.data && (
                              <div className="px-3 py-2 border-t border-gray-100 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800/50 rounded-b-lg">
                                <span className="text-[10px] text-gray-500">
                                  Showing {distinctValues.data.total_returned} of {distinctValues.data.total_distinct} unique values
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (visible on hover) */}
                      <div className="flex items-center gap-1 opacity-0 group-hover/col:opacity-100 transition-opacity">
                        <button 
                          className={clsx(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors",
                            col.isImagePath 
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 opacity-100" 
                              : "text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                          )}
                          title="Link to Image Storage"
                          onClick={() => table.data?.onLinkImage?.(table.id, col.id)}
                        >
                          <ImageIcon className="w-3 h-3" />
                        </button>
                        
                        <button 
                          className={clsx(
                            "p-1 rounded transition-colors",
                            col.active ? "text-green-600 hover:bg-green-50 dark:text-green-500 dark:hover:bg-green-900/20" : "text-gray-400 hover:text-green-600"
                          )}
                          title={col.active ? "Deactivate Column" : "Activate Column"}
                          onClick={() => table.data?.onToggleColumnActive?.(col.id)}
                        >
                          {col.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </div>
          );
        })}
        
        {filteredTables.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No tables found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}
