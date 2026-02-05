import dagre from 'dagre';

const DEFAULT_OPTIONS = {
  rankdir: 'LR',
  nodesep: 80,
  ranksep: 150,
  nodeWidth: 280,
  nodeHeight: 180,
  baseHeight: 80,
  heightPerColumn: 28,
};

/**
 * Apply Dagre layout to ReactFlow nodes and edges
 * Creates a fresh graph each time to avoid stale data
 */
export function getLayoutedElements(nodes, edges, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Create a fresh graph each time
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: opts.rankdir, 
    nodesep: opts.nodesep, 
    ranksep: opts.ranksep 
  });
  
  // Add nodes with dynamic height based on column count
  nodes.forEach((node) => {
    const colCount = node.data?.columns?.length || 4;
    const height = opts.baseHeight + colCount * opts.heightPerColumn;
    dagreGraph.setNode(node.id, { width: opts.nodeWidth, height });
  });
  
  // Add edges
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  
  // Run layout
  dagre.layout(dagreGraph);
  
  // Apply positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const colCount = node.data?.columns?.length || 4;
    const height = opts.baseHeight + colCount * opts.heightPerColumn;
    
    return { 
      ...node, 
      position: { 
        x: nodeWithPosition.x - opts.nodeWidth / 2, 
        y: nodeWithPosition.y - height / 2 
      } 
    };
  });
  
  return { nodes: layoutedNodes, edges };
}

/**
 * Calculate initial grid positions for nodes
 * Used when no layout has been applied yet
 */
export function getGridPositions(nodes, options = {}) {
  const { 
    columns = 3, 
    gapX = 350, 
    gapY = 300, 
    startX = 0, 
    startY = 0 
  } = options;
  
  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX + (index % columns) * gapX,
      y: startY + Math.floor(index / columns) * gapY,
    },
  }));
}

/**
 * Calculate min zoom level to fit all nodes
 */
export function calculateMinZoom(nodes, containerWidth, containerHeight, padding = 200) {
  if (nodes.length === 0 || containerWidth === 0 || containerHeight === 0) {
    return 0.1;
  }
  
  // Calculate bounds
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  nodes.forEach(node => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + 280); // Approximate node width
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y + 180); // Approximate node height
  });
  
  const contentWidth = maxX - minX + padding;
  const contentHeight = maxY - minY + padding;
  
  // Calculate zoom to fit
  const zoomX = containerWidth / contentWidth;
  const zoomY = containerHeight / contentHeight;
  const calculatedMinZoom = Math.min(zoomX, zoomY, 1);
  
  // Return with buffer and minimum floor
  return Math.max(0.05, calculatedMinZoom * 0.9);
}
