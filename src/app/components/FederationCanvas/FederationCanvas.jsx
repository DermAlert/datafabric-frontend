'use client';

import React, { memo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Key, Link as LinkIcon, Layers, Plus } from 'lucide-react';
import styles from './FederationCanvas.module.css';

const FederationTableNode = memo(function FederationTableNode({ data, id }) {
  return (
    <div
      className={styles.nodeCard}
      style={{ borderColor: data.connectionColor }}
    >
      <div 
        className={styles.nodeHeader}
        style={{ backgroundColor: `${data.connectionColor}15` }}
      >
        <div className={styles.badge}>
          <div 
            className={styles.badgeDot} 
            style={{ backgroundColor: data.connectionColor }}
          />
          <span className={styles.badgeText}>
            {data.connectionName}
          </span>
        </div>
        <div className={styles.titleRow}>
          <Layers className={styles.titleIcon} style={{ color: data.connectionColor }} />
          <span className={styles.titleText}>{data.label}</span>
        </div>
      </div>

      <div className={styles.columnList}>
        {data.columns.map((col) => (
          <div
            key={col.id}
            className={styles.columnRow}
          >
            <div className={styles.columnLeft}>
              {col.isPk && <Key className={styles.pkIcon} />}
              {col.isFk && !col.isPk && <LinkIcon className={styles.fkIcon} />}
              {!col.isPk && !col.isFk && <span className={styles.spacer} />}
              <span className={styles.columnName}>
                {col.name}
              </span>
            </div>
            <span className={styles.columnType}>{col.type}</span>

            <Handle 
              type="target" 
              position={Position.Left} 
              id={`${col.id}-left`}
              className={styles.handleLeft} 
            />
            
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`${col.id}-right`}
              className={styles.handleRight}
            >
              <div 
                className={styles.handleIconWrapper}
                style={{ backgroundColor: data.connectionColor }}
              >
                <Plus className={styles.plusIcon} />
              </div>
            </Handle>
          </div>
        ))}
      </div>
    </div>
  );
});

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
}) {
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
        className={styles.edgePath}
        d={edgePath}
        style={style}
        markerEnd={markerEnd}
      />
      <path
        d={edgePath}
        fill="none"
        strokeWidth={20}
        stroke="transparent"
        className={styles.edgeClickArea}
      />
    </g>
  );
});

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
}) {
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
      className={styles.container}
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#9ca3af" gap={24} size={1} />
      <Controls 
        position="bottom-left" 
        className={styles.controls}
      />
      <MiniMap
        nodeColor={(node) => node.data?.connectionColor || '#6b7280'}
        maskColor="rgba(0, 0, 0, 0.1)"
        className={styles.miniMap}
        pannable
        zoomable
      />
    </ReactFlow>
  );
}