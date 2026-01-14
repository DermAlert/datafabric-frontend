'use client';

import React, { memo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  Connection,
  Handle,
  Position,
  NodeProps,
  EdgeProps,
  getBezierPath,
  useReactFlow,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Key, Link as LinkIcon, Layers, Plus } from 'lucide-react';

interface FederationCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  onEdgeClick: (event: React.MouseEvent, edge: Edge) => void;
}

// Custom Table Node for Federation
const FederationTableNode = memo(function FederationTableNode({ data, id }: NodeProps) {
  return (
    <div
      className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border-2 min-w-[240px] group/node"
      style={{ borderColor: data.connectionColor }}
    >
      {/* Header with connection badge */}
      <div 
        className="px-3 py-2 border-b border-gray-100 dark:border-zinc-800 rounded-t-lg"
        style={{ backgroundColor: `${data.connectionColor}15` }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-2.5 h-2.5 rounded" 
            style={{ backgroundColor: data.connectionColor }}
          />
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {data.connectionName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4" style={{ color: data.connectionColor }} />
          <span className="font-semibold text-sm text-gray-900 dark:text-white">{data.label}</span>
        </div>
      </div>

      {/* Columns */}
      <div className="py-2">
        {data.columns.map((col: any) => (
          <div
            key={col.id}
            className="relative px-3 py-1.5 flex items-center justify-between text-xs hover:bg-gray-50 dark:hover:bg-zinc-800/50 group/col transition-colors"
          >
            <div className="flex items-center gap-2">
              {col.isPk && <Key className="w-3 h-3 text-yellow-500 rotate-45" />}
              {col.isFk && !col.isPk && <LinkIcon className="w-3 h-3 text-gray-400" />}
              {!col.isPk && !col.isFk && <span className="w-3 h-3" />}
              <span className="text-gray-700 dark:text-gray-300">
                {col.name}
              </span>
            </div>
            <span className="text-gray-400 text-[10px] uppercase">{col.type}</span>

            {/* Connection Handles - only visible on hover */}
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
                className="w-4 h-4 rounded-full text-white flex items-center justify-center shadow-sm hover:scale-125 transition-transform ring-2 ring-white dark:ring-zinc-900"
                style={{ backgroundColor: data.connectionColor }}
              >
                <Plus className="w-3 h-3" />
              </div>
            </Handle>
          </div>
        ))}
      </div>
    </div>
  );
});

// Custom Edge for Federation
const FederationEdge = memo(function FederationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  return (
    <g className="react-flow__edge">
      <path
        id={id}
        className="react-flow__edge-path cursor-pointer hover:stroke-[3px] transition-all"
        d={edgePath}
        style={style}
        markerEnd={markerEnd}
      />
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className="cursor-pointer"
      />
    </g>
  );
});

// Register node and edge types outside component
const nodeTypes = {
  federationTable: FederationTableNode,
};

const edgeTypes = {
  federation: FederationEdge,
};

export default function FederationCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onEdgeClick 
}: FederationCanvasProps) {
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeClick={onEdgeClick}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={{ type: 'smoothstep' }}
      fitView
      minZoom={0.3}
      maxZoom={1.5}
      className="bg-gray-50 dark:bg-zinc-950"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#9ca3af" gap={24} size={1} />
      <Controls 
        position="bottom-left" 
        className="!bg-white dark:!bg-zinc-800 !border-gray-200 dark:!border-zinc-700 !rounded-lg !shadow-lg"
      />
      <MiniMap
        nodeColor={(node) => node.data?.connectionColor || '#6b7280'}
        maskColor="rgba(0, 0, 0, 0.1)"
        className="!bg-white/80 dark:!bg-zinc-900/80 !border-gray-200 dark:!border-zinc-700 !rounded-lg !shadow-lg"
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

