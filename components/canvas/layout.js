import ELK from 'elkjs/lib/elk.bundled.js';

const elk = new ELK();

const DEFAULT_OPTIONS = {
  nodeWidth: 280,
  baseHeight: 80,
  heightPerColumn: 28,
};

// ─── Helpers ───

function getNodeHeight(node, opts) {
  const colCount = node.data?.columns?.length || 4;
  return opts.baseHeight + colCount * opts.heightPerColumn;
}

// ─── ELK Layout ───

/**
 * Smart layout using ELK.js (Eclipse Layout Kernel)
 * 
 * Features:
 * - Minimizes edge crossings (dedicated algorithm)
 * - Routes edges around nodes (no overlapping lines through tables)
 * - Organic positioning (nodes don't need to be grid-aligned)
 * - Handles disconnected subgraphs automatically
 * 
 * Returns a Promise since ELK layout is async.
 */
export async function getLayoutedElementsAsync(nodes, edges, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (nodes.length === 0) return { nodes: [], edges };

  // Build ELK graph
  const elkGraph = {
    id: 'root',
    layoutOptions: {
      // Layered algorithm: best for relational schemas (DAG-like)
      'elk.algorithm': 'layered',
      // Left-to-right: natural reading flow for schema diagrams
      'elk.direction': 'RIGHT',
      // ── Edge crossing minimization ──
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.layered.crossingMinimization.greedySwitch.type': 'TWO_SIDED',
      // ── Spacing ──
      'elk.spacing.nodeNode': '60',
      'elk.layered.spacing.nodeNodeBetweenLayers': '120',
      'elk.layered.spacing.edgeNodeBetweenLayers': '40',
      'elk.spacing.edgeEdge': '20',
      'elk.spacing.edgeNode': '30',
      // ── Edge routing: splines route around nodes organically ──
      'elk.edgeRouting': 'SPLINES',
      // ── Handle disconnected subgraphs ──
      'elk.separateConnectedComponents': 'true',
      'elk.spacing.componentComponent': '80',
      // ── Arrange components in a balanced grid ──
      'elk.layered.compaction.connectedComponents': 'true',
      // ── Node placement: favor short edges ──
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      // ── Thoroughness: higher = better results, slightly slower ──
      'elk.layered.thoroughness': '10',
    },
    children: nodes.map((node) => ({
      id: node.id,
      width: opts.nodeWidth,
      height: getNodeHeight(node, opts),
    })),
    edges: edges.map((edge, i) => ({
      id: `e${i}`,
      sources: [edge.source],
      targets: [edge.target],
    })),
  };

  // Run ELK layout (async)
  const layoutResult = await elk.layout(elkGraph);

  // Map positions back to ReactFlow nodes
  const positionMap = {};
  (layoutResult.children || []).forEach((child) => {
    positionMap[child.id] = { x: child.x, y: child.y };
  });

  const layoutedNodes = nodes.map((node) => ({
    ...node,
    position: positionMap[node.id] || node.position,
  }));

  return { nodes: layoutedNodes, edges };
}

// ─── Utility Exports ───

export function getGridPositions(nodes, options = {}) {
  const { columns = 3, gapX = 350, gapY = 300, startX = 0, startY = 0 } = options;

  return nodes.map((node, index) => ({
    ...node,
    position: {
      x: startX + (index % columns) * gapX,
      y: startY + Math.floor(index / columns) * gapY,
    },
  }));
}

export function calculateMinZoom(nodes, containerWidth, containerHeight, padding = 200) {
  if (nodes.length === 0 || containerWidth === 0 || containerHeight === 0) {
    return 0.1;
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.position.x);
    maxX = Math.max(maxX, node.position.x + 280);
    minY = Math.min(minY, node.position.y);
    maxY = Math.max(maxY, node.position.y + 180);
  });

  const contentWidth = maxX - minX + padding;
  const contentHeight = maxY - minY + padding;

  const zoomX = containerWidth / contentWidth;
  const zoomY = containerHeight / contentHeight;
  const calculatedMinZoom = Math.min(zoomX, zoomY, 1);

  return Math.max(0.05, calculatedMinZoom * 0.9);
}
