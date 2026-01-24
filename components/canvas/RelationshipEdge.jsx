'use client';

import React, { memo } from 'react';
import { 
  BaseEdge, 
  getSmoothStepPath, 
  getBezierPath 
} from 'reactflow';

/**
 * Schema Edge - clean smoothstep edge for same-database relationships
 */
export const SchemaEdge = memo(function SchemaEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) {
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
});

/**
 * Federation Edge - bezier curve for cross-database relationships
 */
export const FederationEdge = memo(function FederationEdge({
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

export default SchemaEdge;
