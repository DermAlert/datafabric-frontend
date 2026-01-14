'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  Wand2, 
  Save, 
  Database, 
  ArrowRight,
  Trash2,
  Link as LinkIcon,
  CheckSquare,
  Square,
  ChevronLeft
} from 'lucide-react';
import { 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  Connection, 
  Edge,
  Node,
  ReactFlowProvider
} from 'reactflow';
import { clsx } from 'clsx';
import dagre from 'dagre';
import FederationCanvas from '@/components/federation/FederationCanvas';
import Link from 'next/link';
import { useParams } from 'next/navigation';

// Mock data for available connections and their tables
const AVAILABLE_CONNECTIONS = [
  {
    id: 'conn_pg',
    name: 'PostgreSQL Production',
    type: 'PostgreSQL',
    color: '#3b82f6', // blue
    tables: [
      { id: 'pg_users', name: 'users', columns: [
        { id: 'pg_u_id', name: 'id', type: 'INT', isPk: true },
        { id: 'pg_u_email', name: 'email', type: 'VARCHAR' },
        { id: 'pg_u_name', name: 'name', type: 'VARCHAR' },
      ]},
      { id: 'pg_orders', name: 'orders', columns: [
        { id: 'pg_o_id', name: 'id', type: 'INT', isPk: true },
        { id: 'pg_o_user_id', name: 'user_id', type: 'INT', isFk: true },
        { id: 'pg_o_total', name: 'total', type: 'DECIMAL' },
      ]},
      { id: 'pg_products', name: 'products', columns: [
        { id: 'pg_p_id', name: 'id', type: 'INT', isPk: true },
        { id: 'pg_p_sku', name: 'sku', type: 'VARCHAR' },
        { id: 'pg_p_name', name: 'name', type: 'VARCHAR' },
      ]},
    ]
  },
  {
    id: 'conn_mongo',
    name: 'MongoDB UserData',
    type: 'MongoDB',
    color: '#a855f7', // purple
    tables: [
      { id: 'mongo_profiles', name: 'profiles', columns: [
        { id: 'mongo_p_id', name: '_id', type: 'ObjectId', isPk: true },
        { id: 'mongo_p_user_id', name: 'user_id', type: 'INT', isFk: true },
        { id: 'mongo_p_avatar', name: 'avatar_url', type: 'String' },
        { id: 'mongo_p_bio', name: 'bio', type: 'String' },
      ]},
      { id: 'mongo_preferences', name: 'preferences', columns: [
        { id: 'mongo_pref_id', name: '_id', type: 'ObjectId', isPk: true },
        { id: 'mongo_pref_user', name: 'user_id', type: 'INT', isFk: true },
        { id: 'mongo_pref_theme', name: 'theme', type: 'String' },
      ]},
    ]
  },
  {
    id: 'conn_mysql',
    name: 'MySQL Analytics',
    type: 'MySQL',
    color: '#22c55e', // green
    tables: [
      { id: 'mysql_inventory', name: 'inventory', columns: [
        { id: 'mysql_i_id', name: 'id', type: 'INT', isPk: true },
        { id: 'mysql_i_sku', name: 'product_sku', type: 'VARCHAR', isFk: true },
        { id: 'mysql_i_qty', name: 'quantity', type: 'INT' },
      ]},
      { id: 'mysql_sales', name: 'sales_report', columns: [
        { id: 'mysql_s_id', name: 'id', type: 'INT', isPk: true },
        { id: 'mysql_s_order', name: 'order_id', type: 'INT', isFk: true },
        { id: 'mysql_s_revenue', name: 'revenue', type: 'DECIMAL' },
      ]},
    ]
  },
];

// Mock workspace data
const MOCK_WORKSPACES: Record<string, { name: string; description: string }> = {
  'ws_1': { name: 'E-commerce Integration', description: 'User data federation between main database and user profiles' },
  'ws_2': { name: 'Inventory Sync', description: 'Product and inventory data across systems' },
  'ws_3': { name: 'Analytics Pipeline', description: 'Sales and order analytics federation' },
};

// Dagre layout helper
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 80, ranksep: 150 });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 260, height: 180 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return { ...node, position: { x: nodeWithPosition.x - 130, y: nodeWithPosition.y - 90 } };
  });
  return { nodes: layoutedNodes, edges };
};

function FederationEditorContent() {
  const params = useParams();
  const workspaceId = params.id as string;
  const workspace = MOCK_WORKSPACES[workspaceId] || { name: 'New Workspace', description: '' };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState<string>('');
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [tableSearch, setTableSearch] = useState('');
  
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'error' | 'success' } | null>(null);

  // Get tables already added to canvas
  const addedTableIds = nodes.map(n => n.id);

  // Handle adding tables to canvas
  const handleAddTables = () => {
    const conn = AVAILABLE_CONNECTIONS.find(c => c.id === selectedConnection);
    if (!conn) return;

    const newNodes: Node[] = selectedTables
      .filter(tableId => !addedTableIds.includes(tableId))
      .map((tableId, index) => {
        const table = conn.tables.find(t => t.id === tableId);
        if (!table) return null;
        
        return {
          id: table.id,
          type: 'federationTable',
          position: { x: 100 + (nodes.length + index) * 300, y: 100 },
          data: {
            label: table.name,
            connectionId: conn.id,
            connectionName: conn.name,
            connectionColor: conn.color,
            columns: table.columns.map(c => ({ ...c, active: true })),
          },
        };
      })
      .filter(Boolean) as Node[];

    setNodes((nds) => [...nds, ...newNodes]);
    setIsAddTableModalOpen(false);
    setSelectedConnection('');
    setSelectedTables([]);
    setTableSearch('');
  };

  // Handle connection for drag-and-drop
  const onConnect = useCallback((params: Connection) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    // Only allow cross-connection relationships in Federation
    const isCrossConnection = sourceNode?.data.connectionId !== targetNode?.data.connectionId;
    
    if (!isCrossConnection) {
      setToast({ 
        message: 'Federation is for cross-database relationships only. Use the Schema Editor for same-database relationships.', 
        type: 'error' 
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: false, 
      style: { 
        stroke: '#f59e0b',
        strokeWidth: 2,
        strokeDasharray: '8 4',
      }, 
      markerEnd: { 
        type: MarkerType.ArrowClosed, 
        color: '#f59e0b' 
      },
      data: { 
        cardinality: '1:N', 
        joinType: 'FULL',
        isCrossConnection: true 
      }
    }, eds));
  }, [nodes, setEdges]);

  // Auto layout
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  // Edge click to edit
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge);
  }, []);

  // Remove table from canvas
  const handleRemoveTable = (tableId: string) => {
    setNodes((nds) => nds.filter(n => n.id !== tableId));
    setEdges((eds) => eds.filter(e => e.source !== tableId && e.target !== tableId));
  };

  // Update edge
  const handleUpdateEdge = (cardinality: string, joinType: string) => {
    if (!editingEdge) return;
    setEdges((eds) => eds.map((e) => {
      if (e.id === editingEdge.id) {
        return { ...e, data: { ...e.data, cardinality, joinType } };
      }
      return e;
    }));
    setEditingEdge(null);
  };

  // Delete edge
  const handleDeleteEdge = () => {
    if (!editingEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
    setEditingEdge(null);
  };

  // Get filtered tables for modal
  const getFilteredTables = () => {
    const conn = AVAILABLE_CONNECTIONS.find(c => c.id === selectedConnection);
    if (!conn) return [];
    
    return conn.tables.filter(t => 
      t.name.toLowerCase().includes(tableSearch.toLowerCase()) &&
      !addedTableIds.includes(t.id)
    );
  };

  // Toggle table selection
  const toggleTableSelection = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  // Get column info for edge modal
  const getColumnInfo = (tableId: string, handleId: string | null | undefined) => {
    if (!handleId) return { table: tableId, column: '?', connection: '' };
    const colId = handleId.replace(/-right$/, '').replace(/-left$/, '');
    const node = nodes.find(n => n.id === tableId);
    const column = node?.data.columns.find((c: any) => c.id === colId);
    return { 
      table: node?.data.label || tableId, 
      column: column?.name || colId,
      connection: node?.data.connectionName || '',
      connectionColor: node?.data.connectionColor || '#666',
    };
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/connections/federation"
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">All Federations</span>
          </Link>
          <div className="h-4 w-px bg-gray-200 dark:bg-zinc-700" />
          <div className="flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-amber-500" />
            <h1 className="font-bold text-gray-900 dark:text-white">{workspace.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onLayout} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
          >
            <Wand2 className="w-4 h-4" />
            Auto Layout
          </button>
          <button 
            onClick={() => setIsAddTableModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {/* Added Tables Bar */}
      {nodes.length > 0 && (
        <div className="bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-200 dark:border-zinc-800 px-6 py-2 flex items-center gap-2 shrink-0 overflow-x-auto">
          <span className="text-xs text-gray-500 shrink-0">Tables:</span>
          {nodes.map((node) => (
            <div 
              key={node.id}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 group"
            >
              <div 
                className="w-2 h-2 rounded-full shrink-0" 
                style={{ backgroundColor: node.data.connectionColor }}
              />
              <span className="text-gray-700 dark:text-gray-300">{node.data.label}</span>
              <button 
                onClick={() => handleRemoveTable(node.id)}
                className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        {nodes.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center">
                <LinkIcon className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Create Cross-Database Relationships
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Add tables from different data sources and connect them by dragging between columns.
              </p>
              <button 
                onClick={() => setIsAddTableModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Table
              </button>
            </div>
          </div>
        ) : (
          <FederationCanvas 
            nodes={nodes} 
            edges={edges} 
            onNodesChange={onNodesChange} 
            onEdgesChange={onEdgesChange} 
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
          />
        )}
      </div>

      {/* Legend */}
      {nodes.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 px-6 py-2 flex items-center gap-6 text-xs">
          <span className="text-gray-500">Legend:</span>
          {AVAILABLE_CONNECTIONS.filter(c => nodes.some(n => n.data.connectionId === c.id)).map(conn => (
            <div key={conn.id} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: conn.color }} />
              <span className="text-gray-600 dark:text-gray-400">{conn.name}</span>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-0.5 bg-amber-500" style={{ backgroundImage: 'repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px)' }} />
              <span className="text-gray-500">Cross-DB Relationship</span>
            </div>
          </div>
        </div>
      )}

      {/* Add Table Modal */}
      {isAddTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-amber-500" />
                Add Tables to Canvas
              </h3>
              <button onClick={() => { setIsAddTableModalOpen(false); setSelectedConnection(''); setSelectedTables([]); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Connection Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Connection</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                  value={selectedConnection}
                  onChange={(e) => { setSelectedConnection(e.target.value); setSelectedTables([]); }}
                >
                  <option value="">Select a connection...</option>
                  {AVAILABLE_CONNECTIONS.map(conn => (
                    <option key={conn.id} value={conn.id}>
                      {conn.name} ({conn.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Table Selection */}
              {selectedConnection && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Tables</label>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search tables..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    />
                  </div>

                  {/* Table List */}
                  <div className="border border-gray-200 dark:border-zinc-700 rounded-lg max-h-48 overflow-y-auto">
                    {getFilteredTables().length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {tableSearch ? 'No matching tables' : 'All tables already added'}
                      </div>
                    ) : (
                      getFilteredTables().map(table => (
                        <button
                          key={table.id}
                          onClick={() => toggleTableSelection(table.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-zinc-800 text-left transition-colors"
                        >
                          {selectedTables.includes(table.id) ? (
                            <CheckSquare className="w-4 h-4 text-amber-500 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{table.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">{table.columns.length} cols</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {selectedTables.length} table(s) selected
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => { setIsAddTableModalOpen(false); setSelectedConnection(''); setSelectedTables([]); }} 
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTables}
                  disabled={selectedTables.length === 0}
                  className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Relationship Modal */}
      {editingEdge && (() => {
        const sourceInfo = getColumnInfo(editingEdge.source, editingEdge.sourceHandle);
        const targetInfo = getColumnInfo(editingEdge.target, editingEdge.targetHandle);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-amber-500" />
                  Edit Relationship
                </h3>
                <button onClick={() => setEditingEdge(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                {/* Connection Info */}
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sourceInfo.connectionColor }} />
                    <span className="text-xs text-gray-500">{sourceInfo.connection}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {sourceInfo.table}<span className="text-gray-400">.</span>{sourceInfo.column}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {targetInfo.table}<span className="text-gray-400">.</span>{targetInfo.column}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: targetInfo.connectionColor }} />
                    <span className="text-xs text-gray-500">{targetInfo.connection}</span>
                  </div>
                </div>

                {/* Cross-connection badge */}
                <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  <LinkIcon className="w-3.5 h-3.5" />
                  Cross-database relationship (uses federation layer)
                </div>
                
                {/* Settings */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cardinality</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      defaultValue={editingEdge.data?.cardinality || '1:N'}
                      id="edit-cardinality"
                    >
                      <option value="1:1">1:1 (One to One)</option>
                      <option value="1:N">1:N (One to Many)</option>
                      <option value="N:N">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Type</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      defaultValue={editingEdge.data?.joinType || 'FULL'}
                      id="edit-jointype"
                    >
                      <option value="FULL">FULL OUTER JOIN</option>
                      <option value="INNER">INNER JOIN</option>
                      <option value="LEFT">LEFT JOIN</option>
                      <option value="RIGHT">RIGHT JOIN</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between">
                <button 
                  onClick={handleDeleteEdge}
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setEditingEdge(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const cardinality = (document.getElementById('edit-cardinality') as HTMLSelectElement)?.value || '1:N';
                      const joinType = (document.getElementById('edit-jointype') as HTMLSelectElement)?.value || 'FULL';
                      handleUpdateEdge(cardinality, joinType);
                    }} 
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Toast notification */}
      {toast && (
        <div className={clsx(
          "fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 duration-300",
          toast.type === 'error' 
            ? "bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200" 
            : "bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200"
        )}>
          <div className={clsx(
            "w-2 h-2 rounded-full",
            toast.type === 'error' ? "bg-red-500" : "bg-green-500"
          )} />
          <span className="text-sm font-medium max-w-md">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default function FederationEditorPage() {
  return (
    <DashboardLayout>
      <ReactFlowProvider>
        <FederationEditorContent />
      </ReactFlowProvider>
    </DashboardLayout>
  );
}

