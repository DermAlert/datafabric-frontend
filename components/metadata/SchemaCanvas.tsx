import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  Edge, 
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  BaseEdge,
  EdgeProps,
  getSmoothStepPath,
  MiniMap,
  Handle, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MoreVertical, Key, Link as LinkIcon, Image as ImageIcon, Plus, Eye, EyeOff, Database } from 'lucide-react';
import { clsx } from 'clsx';

// --- Components Definitions ---

const TableNode = ({ data, id }: { data: any, id: string }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as HTMLElement)) {
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

  return (
    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg min-w-[240px] group/node relative">
      {/* Header */}
      <div className="bg-blue-50 dark:bg-zinc-800 px-3 py-2 border-b border-gray-200 dark:border-zinc-700 flex justify-between items-center rounded-t-lg">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100">{data.label}</span>
          {!data.active && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400 font-medium">
              Inactive
            </span>
          )}
        </div>
        
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

          {/* Context Menu */}
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
      </div>
      
      {/* Columns */}
      <div className={clsx("py-2", !data.active && "opacity-50 grayscale")}>
        {data.columns.map((col: any) => (
          <div 
            key={col.id} 
            className="relative px-3 py-1.5 flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-zinc-800/50 group/col transition-colors cursor-pointer"
            onClick={() => data.onToggleColumnActive?.(col.id)}
            title={col.active ? "Click to deactivate column" : "Click to activate column"}
          >
            <div className="flex items-center gap-2">
              <div 
                className={clsx(
                  "transition-colors",
                  col.active ? "text-gray-700 dark:text-gray-300" : "text-gray-400 dark:text-gray-600"
                )}
              >
                {col.active ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              </div>
              <span className={clsx(
                col.active ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600 line-through'
              )}>
                {col.name}
              </span>
              {col.isPk && <Key className="w-3 h-3 text-yellow-500 rotate-45" />}
              {col.isFk && <LinkIcon className="w-3 h-3 text-gray-400" />}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-[10px] uppercase">{col.type}</span>
              {/* Image Path Indicator */}
              {col.isImagePath && (
                <div className="text-purple-500" title="Image Path Configured">
                   <ImageIcon className="w-3 h-3" />
                </div>
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
              onClick={(e) => e.stopPropagation()} // Prevent column toggle when dragging handle
            >
              <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform ring-2 ring-white dark:ring-zinc-900">
                <Plus className="w-3 h-3" />
              </div>
            </Handle>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Edge Component - clean, no delete buttons (deletion via Edit modal)
const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: EdgeProps) => {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
  );
};

const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  smoothstep: CustomEdge,
};

interface SchemaCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onEdgeClick?: (event: React.MouseEvent, edge: Edge) => void;
}

export default function SchemaCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onEdgeClick 
}: SchemaCanvasProps) {
  return (
    <div className="h-full w-full bg-gray-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        fitView
        attributionPosition="bottom-right"
        className="dark:bg-zinc-950"
        minZoom={0.5}
        maxZoom={1.5}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className="dark:bg-zinc-800 dark:border-zinc-700 dark:text-white" />
        <MiniMap 
          className="dark:bg-zinc-900 dark:border-zinc-800" 
          nodeColor={(node) => {
            return '#e2e8f0'; // slate-200
          }}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}
