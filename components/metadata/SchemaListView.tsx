import React, { useState, useRef, useEffect } from 'react';
import { 
  Table, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  MoreVertical,
  Search,
  Check,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';

export default function SchemaListView({ tables }: { tables: any[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTables = tables.filter(table => {
    const label = table.data?.label || '';
    const columns = table.data?.columns || [];
    
    return label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      columns.some((col: any) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg shadow-sm pb-20">
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
      </div>

      {/* Table List */}
      <div className="divide-y divide-gray-100 dark:divide-zinc-800">
        {filteredTables.map((table) => {
          // Use data property as primary source of truth, fallback to top-level if needed
          const label = table.data?.label || table.label || 'Unknown Table';
          const isActive = table.data?.active !== false; // Default true unless explicitly false
          const columns = table.data?.columns || table.columns || [];
          
          return (
            <div key={table.id} className="p-4 group hover:bg-gray-50/50 dark:hover:bg-zinc-800/20 transition-colors">
              {/* Table Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
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
                      {!isActive && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 font-medium">Inactive</span>}
                    </h3>
                    <p className="text-xs text-gray-500">{columns.length} columns</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
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

              {/* Column List (Preview) */}
              <div className={clsx("ml-11 space-y-1 transition-opacity duration-300", !isActive && "opacity-50")}>
                {columns.map((col: any) => (
                  <div key={col.id} className="flex items-center justify-between py-1.5 px-3 rounded hover:bg-gray-50 dark:hover:bg-zinc-800/50 text-xs transition-colors group/col">
                    <div className="flex items-center gap-3">
                      <span className={clsx(
                        "font-mono transition-colors",
                        col.active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 line-through"
                      )}>{col.name}</span>
                      <span className="text-gray-400 text-[10px] uppercase">{col.type}</span>
                    </div>
                    
                    <div className="flex items-center gap-3 opacity-0 group-hover/col:opacity-100 transition-opacity">
                      {/* Action Buttons */}
                      <button 
                        className={clsx(
                          "flex items-center gap-1 px-2 py-0.5 rounded transition-colors",
                          col.isImagePath 
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 opacity-100" 
                            : "text-gray-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                        )}
                        title="Link to Image Storage"
                        onClick={() => table.data?.onLinkImage?.(table.id)}
                      >
                        <ImageIcon className="w-3 h-3" />
                        {col.isImagePath && <span className="text-[10px] font-medium">Linked</span>}
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
                    
                    {/* Always visible indicators if active */}
                    <div className="flex items-center gap-2 group-hover/col:hidden">
                       {col.isPk && <span className="text-[10px] text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 px-1 rounded">PK</span>}
                       {col.isFk && <span className="text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-1 rounded">FK</span>}
                       {col.isImagePath && <ImageIcon className="w-3 h-3 text-purple-500" />}
                    </div>
                  </div>
                ))}
              </div>
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
