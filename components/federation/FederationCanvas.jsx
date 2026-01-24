'use client';

import React from 'react';
import 'reactflow/dist/style.css';

// Import shared components
import { 
  FederationTableNode, 
  FederationEdge, 
  CanvasWrapper 
} from '@/components/canvas';

// Node and edge types using shared components
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
  onEdgeClick,
  layoutVersion = 0
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
      variant="federation"
      defaultEdgeType="smoothstep"
      maxZoom={1.5}
      dynamicMinZoom={true}
      fitViewOnLayoutChange={true}
      layoutVersion={layoutVersion}
    />
  );
}
