'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  getNodesBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * Shared Canvas Wrapper component for ReactFlow
 * Provides common configuration for Background, Controls, MiniMap
 */
export default function CanvasWrapper({
  nodes,
  edges,
  nodeTypes,
  edgeTypes,
  onNodesChange,
  onEdgesChange,
  onConnect,
  onEdgeClick,
  onPaneClick,
  onNodeDragStop,
  layoutVersion = 0,
  fitViewOnLayoutChange = true,
  variant = 'schema',
  defaultEdgeType = 'smoothstep',
  minZoom: propMinZoom,
  maxZoom = 2,
  dynamicMinZoom = true,
}) {
  const containerRef = useRef(null);
  const [calculatedMinZoom, setCalculatedMinZoom] = useState(0.1);
  const reactFlowInstance = useReactFlow();
  const isInitialMount = useRef(true);
  const prevLayoutVersionRef = useRef(layoutVersion);
  const prevNodesLengthRef = useRef(nodes.length);
  const dragStartPosition = useRef(null);
  
  const isFederation = variant === 'federation';
  const minZoom = propMinZoom ?? calculatedMinZoom;

  // Function to recalculate minZoom based on current nodes bounds
  const recalculateMinZoom = useCallback(() => {
    if (!dynamicMinZoom || nodes.length === 0 || !containerRef.current) return;
    
    const bounds = getNodesBounds(nodes);
    const container = containerRef.current;
    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;
    
    if (containerWidth === 0 || containerHeight === 0 || bounds.width === 0) return;
    
    const padding = 200;
    const contentWidth = bounds.width + padding;
    const contentHeight = bounds.height + padding;
    
    const zoomX = containerWidth / contentWidth;
    const zoomY = containerHeight / contentHeight;
    const calculated = Math.min(zoomX, zoomY, 1);
    
    const finalMinZoom = Math.max(0.05, calculated * 0.9);
    setCalculatedMinZoom(finalMinZoom);
  }, [nodes, dynamicMinZoom]);

  // Handle node drag start
  const handleNodeDragStart = useCallback((event, node) => {
    dragStartPosition.current = { x: node.position.x, y: node.position.y };
  }, []);

  // Handle node drag stop
  const handleNodeDragStop = useCallback((event, node) => {
    const startPos = dragStartPosition.current;
    const endPos = node.position;
    
    const threshold = 5;
    const didMove = startPos && (
      Math.abs(endPos.x - startPos.x) > threshold || 
      Math.abs(endPos.y - startPos.y) > threshold
    );
    
    if (didMove && dynamicMinZoom) {
      recalculateMinZoom();
      
      setTimeout(() => {
        reactFlowInstance?.fitView({ 
          padding: 0.15,
          minZoom: 0.01,
          maxZoom: 1.5,
          duration: 200
        });
      }, 50);
    }
    
    dragStartPosition.current = null;
    onNodeDragStop?.(event, node);
  }, [recalculateMinZoom, onNodeDragStop, reactFlowInstance, dynamicMinZoom]);

  // Calculate minZoom when node count changes
  useEffect(() => {
    if (!dynamicMinZoom) return;
    
    if (nodes.length === 0 || !containerRef.current) {
      setCalculatedMinZoom(0.1);
      return;
    }

    if (nodes.length === prevNodesLengthRef.current && !isInitialMount.current) {
      return;
    }
    prevNodesLengthRef.current = nodes.length;

    const timer = setTimeout(recalculateMinZoom, 100);
    return () => clearTimeout(timer);
  }, [nodes.length, recalculateMinZoom, dynamicMinZoom]);

  // FitView on initial mount or layout change
  useEffect(() => {
    if (!reactFlowInstance || nodes.length === 0 || !fitViewOnLayoutChange) return;

    const isLayoutChange = layoutVersion !== prevLayoutVersionRef.current;
    prevLayoutVersionRef.current = layoutVersion;

    if (isInitialMount.current || isLayoutChange) {
      isInitialMount.current = false;
      
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ 
          padding: 0.15,
          minZoom: 0.01,
          maxZoom: 1.5,
          duration: 200
        });
      }, isLayoutChange ? 300 : 150);

      return () => clearTimeout(timer);
    }
  }, [layoutVersion, reactFlowInstance, nodes.length, fitViewOnLayoutChange]);

  // MiniMap node color function
  const getNodeColor = useCallback((node) => {
    if (isFederation) {
      return node.data?.connectionColor || '#6b7280';
    }
    return node.data?.active === false ? '#64748b' : '#3b82f6';
  }, [isFederation]);

  return (
    <div ref={containerRef} className="h-full w-full bg-gray-50 dark:bg-zinc-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={dynamicMinZoom ? handleNodeDragStart : undefined}
        onNodeDragStop={dynamicMinZoom ? handleNodeDragStop : onNodeDragStop}
        defaultEdgeOptions={{ type: defaultEdgeType }}
        fitView
        minZoom={minZoom}
        maxZoom={maxZoom}
        deleteKeyCode={['Backspace', 'Delete']}
        className="dark:bg-zinc-950"
        proOptions={{ hideAttribution: true }}
      >
        <Background 
          color={isFederation ? "#9ca3af" : "#94a3b8"} 
          gap={isFederation ? 24 : 20} 
          size={1} 
        />
        <Controls 
          position="bottom-left"
          showInteractive={true}
          className="!bg-white dark:!bg-zinc-800 !border-gray-200 dark:!border-zinc-700 !rounded-lg !shadow-lg [&>button]:!bg-white [&>button]:dark:!bg-zinc-800 [&>button]:!border-gray-200 [&>button]:dark:!border-zinc-700 [&>button]:!fill-gray-600 [&>button]:dark:!fill-zinc-400 [&>button:hover]:!bg-gray-100 [&>button:hover]:dark:!bg-zinc-700 [&>button:hover]:!fill-gray-900 [&>button:hover]:dark:!fill-white"
        />
        <MiniMap 
          nodeColor={getNodeColor}
          maskColor="rgba(0, 0, 0, 0.15)"
          className="!bg-white/80 dark:!bg-zinc-900/80 !border-gray-200 dark:!border-zinc-700 !rounded-lg !shadow-lg"
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
