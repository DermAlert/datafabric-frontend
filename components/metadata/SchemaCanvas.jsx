'use client';

import React from 'react';
import 'reactflow/dist/style.css';

// Import shared components
import { 
  SchemaTableNode, 
  SchemaEdge, 
  CanvasWrapper 
} from '@/components/canvas';

// Node and edge types using shared components
const nodeTypes = {
  table: SchemaTableNode,
};

const edgeTypes = {
  smoothstep: SchemaEdge,
};

export default function SchemaCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onEdgeClick,
  onPaneClick,
  layoutVersion = 0,
  onNodeDragStop
}) {
  return (
    <CanvasWrapper
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onEdgeClick={onEdgeClick}
      onPaneClick={onPaneClick}
      onNodeDragStop={onNodeDragStop}
      layoutVersion={layoutVersion}
      fitViewOnLayoutChange={true}
      variant="schema"
      defaultEdgeType="smoothstep"
      dynamicMinZoom={true}
    />
  );
}
