'use client';

import React, { memo, useState, useEffect, useRef } from 'react';
import { Handle, Position } from 'reactflow';
import { 
  MoreVertical, 
  Key, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  Plus, 
  Eye, 
  EyeOff, 
  Database, 
  List,
  Layers
} from 'lucide-react';
import { clsx } from 'clsx';

/**
 * Shared Table Node component for ReactFlow
 * Used by both Schema Editor and Federation Canvas
 */
const TableNode = memo(function TableNode({ 
  data, 
  id,
  variant = 'schema',
  showContextMenu = true,
  showColumnToggle = true,
  showDistinctButton = true,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  const isFederation = variant === 'federation';
  const accentColor = data.connectionColor || '#3b82f6';
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Check if a column is highlighted
  const isColumnHighlighted = (colId) => {
    return data.highlightedColumns?.includes(colId);
  };

  return (
    <div
      className={clsx(
        "bg-white dark:bg-zinc-900 rounded-lg shadow-lg min-w-[240px] group/node relative",
        isFederation ? "border-2" : "border border-gray-200 dark:border-zinc-700"
      )}
      style={isFederation ? { borderColor: accentColor } : undefined}
    >
      {/* Header */}
      <div 
        className={clsx(
          "px-3 py-2 border-b border-gray-100 dark:border-zinc-800 rounded-t-lg flex items-center justify-between",
          isFederation ? "" : "bg-blue-50 dark:bg-zinc-800"
        )}
        style={isFederation ? { backgroundColor: `${accentColor}15` } : undefined}
      >
        <div className="flex-1 min-w-0">
          {/* Federation: Show connection badge */}
          {isFederation && data.connectionName && (
            <div className="flex items-center gap-2 mb-1">
              <div 
                className="w-2.5 h-2.5 rounded shrink-0" 
                style={{ backgroundColor: accentColor }}
              />
              <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                {data.connectionName}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            {isFederation ? (
              <Layers className="w-4 h-4 shrink-0" style={{ color: accentColor }} />
            ) : null}
            <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
              {data.label}
            </span>
            {data.active === false && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 font-medium shrink-0">
                Inactive
              </span>
            )}
          </div>
        </div>
        
        {/* Context Menu (Schema variant) */}
        {showContextMenu && !isFederation && (
          <div className="relative" ref={menuRef}>
            <button 
              className={clsx(
                "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors",
                showMenu && "bg-black/5 dark:bg-white/10 text-gray-900 dark:text-gray-100"
              )}
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Context Menu Dropdown */}
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-100 origin-top-right">
                <button 
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    data.onToggleActive?.(id);
                    setShowMenu(false);
                  }}
                >
                  {data.active === false ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  {data.active === false ? 'Activate Table' : 'Deactivate Table'}
                </button>
                
                <button 
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    data.onLinkImage?.(id);
                    setShowMenu(false);
                  }}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Link Image Storage
                </button>

                <div className="h-px bg-gray-100 dark:bg-zinc-700 my-1" />
                
                <button 
                  className="w-full text-left px-4 py-2 text-xs flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                  onClick={() => {
                    data.onViewSample?.(id);
                    setShowMenu(false);
                  }}
                >
                  <Database className="w-3.5 h-3.5" />
                  View Data Sample
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Columns */}
      <div className={clsx("py-2", data.active === false && "opacity-50 grayscale")}>
        {data.columns.map((col) => {
          const highlighted = isColumnHighlighted(col.id);
          const isActive = col.active !== false;
          
          return (
            <div 
              key={col.id} 
              className={clsx(
                "relative px-3 py-1.5 flex items-center justify-between text-xs group/col transition-all cursor-pointer",
                highlighted 
                  ? "bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 dark:ring-blue-500 ring-inset" 
                  : "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
              )}
              onClick={(e) => {
                e.stopPropagation();
                data.onColumnClick?.(col.id, id);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                {/* Column toggle button (schema variant only) */}
                {showColumnToggle && !isFederation && (
                  <button 
                    className={clsx(
                      "p-0.5 rounded transition-colors hover:bg-gray-200 dark:hover:bg-zinc-700 shrink-0",
                      isActive ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onToggleColumnActive?.(col.id);
                    }}
                    title={isActive ? "Deactivate column" : "Activate column"}
                  >
                    {isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                )}
                
                {/* PK/FK/Image icons */}
                {isFederation ? (
                  <>
                    {col.isPk && <Key className="w-3 h-3 text-yellow-500 rotate-45 shrink-0" />}
                    {col.isFk && !col.isPk && <LinkIcon className="w-3 h-3 text-gray-400 shrink-0" />}
                    {!col.isPk && !col.isFk && <span className="w-3 h-3 shrink-0" />}
                  </>
                ) : null}
                
                <span className={clsx(
                  "truncate",
                  highlighted && "font-semibold text-blue-700 dark:text-blue-300",
                  !highlighted && isActive && 'text-gray-700 dark:text-gray-300',
                  !highlighted && !isActive && 'text-gray-400 dark:text-gray-600 line-through'
                )}>
                  {col.name}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Schema variant: PK/FK/Image indicators */}
                {!isFederation && (
                  <div className="flex items-center gap-1">
                    {col.isPk && <Key className="w-3 h-3 text-yellow-500 rotate-45" />}
                    {col.isFk && <LinkIcon className="w-3 h-3 text-blue-400" />}
                    {col.isImagePath && (
                      <ImageIcon className="w-3 h-3 text-purple-500" title="Image Path Configured" />
                    )}
                  </div>
                )}
                
                <span className="text-gray-400 text-[10px] uppercase">{col.type}</span>
                
                {/* Distinct values button (schema variant) */}
                {showDistinctButton && !isFederation && (
                  <button
                    className="p-0.5 rounded text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 opacity-0 group-hover/col:opacity-100 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      data.onViewDistinct?.(col.id, col.name);
                    }}
                    title="View distinct values"
                  >
                    <List className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Connection Handles */}
              <Handle 
                type="target" 
                position={Position.Left} 
                id={`${col.id}-left`}
                className="!w-2 !h-2 !bg-gray-300 dark:!bg-zinc-600 !border-none !-left-1 opacity-0 group-hover/col:opacity-100 transition-opacity" 
              />
              
              {/* Source Handle (Plus Icon) */}
              <Handle 
                type="source" 
                position={Position.Right} 
                id={`${col.id}-right`}
                className="!w-5 !h-5 !bg-transparent !border-none !-right-2.5 flex items-center justify-center z-50 cursor-crosshair opacity-0 group-hover/col:opacity-100 transition-opacity"
              >
                <div 
                  className="w-4 h-4 rounded-full text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform ring-2 ring-white dark:ring-zinc-900 pointer-events-none"
                  style={{ backgroundColor: isFederation ? accentColor : '#2563eb' }}
                >
                  <Plus className="w-3 h-3 pointer-events-none" />
                </div>
              </Handle>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// Export variants for easy use
export const SchemaTableNode = memo(function SchemaTableNode(props) {
  return <TableNode {...props} variant="schema" showContextMenu showColumnToggle showDistinctButton />;
});

export const FederationTableNode = memo(function FederationTableNode(props) {
  return <TableNode {...props} variant="federation" showContextMenu={false} showColumnToggle={false} showDistinctButton={false} />;
});

export default TableNode;
