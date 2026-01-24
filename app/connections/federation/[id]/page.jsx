'use client';

import React, { useState, useCallback, useEffect } from 'react';
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  RefreshCw,
  Table2
} from 'lucide-react';
import { 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  ReactFlowProvider
} from 'reactflow';
import { clsx } from 'clsx';
import FederationCanvas from '@/components/federation/FederationCanvas';
import { getLayoutedElements } from '@/components/canvas';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { federationService, connectionService, metadataService } from '@/lib/api';

// Color palette for connections without colors
const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#a855f7', // purple
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#8b5cf6', // violet
];

function FederationEditorContent() {
  const params = useParams();
  const federationId = parseInt(params.id, 10);

  // Data state
  const [federation, setFederation] = useState(null);
  const [availableConnections, setAvailableConnections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Canvas state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutVersion, setLayoutVersion] = useState(0); // Used to trigger fitView in canvas
  
  // Add Connection Modal state (wizard)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalStep, setAddModalStep] = useState(1); // 1 = select connections, 2 = select tables
  const [selectedConnectionsToAdd, setSelectedConnectionsToAdd] = useState([]);
  const [selectedTablesPerConnection, setSelectedTablesPerConnection] = useState({}); // { connectionId: [tableIds] }
  const [connectionSearch, setConnectionSearch] = useState('');
  const [tableSearch, setTableSearch] = useState('');
  const [isAddingConnections, setIsAddingConnections] = useState(false);
  const [expandedConnection, setExpandedConnection] = useState(null);
  
  const [editingEdge, setEditingEdge] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Fetch federation and connections data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch federation details, all connections, and connection types in parallel
      const [federationData, connectionsData, connectionTypes] = await Promise.all([
        federationService.get(federationId),
        connectionService.list(),
        connectionService.getAll(), // Get connection types for proper names
      ]);

      setFederation(federationData);

      // Create a map of connection types by ID
      const connectionTypesMap = {};
      connectionTypes.forEach(ct => {
        connectionTypesMap[ct.id] = ct;
      });

      // Filter only metadata connections (not storage/image)
      const metadataConnections = connectionsData.filter(conn => conn.content_type === 'metadata');

      // Enrich connections with metadata (tables/columns)
      const enrichedConnections = await Promise.all(
        metadataConnections.map(async (conn, index) => {
          // Get the connection type info
          const connType = connectionTypesMap[conn.connection_type_id];
          const typeName = connType?.name || 'Database';
          const typeColor = connType?.color_hex || DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          try {
            // Get schemas for this connection
            const schemas = await metadataService.listSchemas(conn.id);
            
            // Get tables for each schema
            const allTables = [];
            for (const schema of schemas.slice(0, 5)) { // Limit to 5 schemas for performance
              try {
                const tables = await metadataService.listTables(schema.id);
                for (const table of tables.slice(0, 10)) { // Limit to 10 tables per schema
                  allTables.push({
                    ...table,
                    schema_name: schema.schema_name,
                  });
                }
              } catch {
                // Skip schema if error
              }
            }

            // Get columns for each table
            const tablesWithColumns = await Promise.all(
              allTables.slice(0, 20).map(async (table) => { // Limit to 20 tables total
                try {
                  const columns = await metadataService.listColumns(table.id);
                  return {
                    id: `table_${table.id}`,
                    tableId: table.id,
                    name: table.table_name,
                    schema: table.schema_name,
                    columns: columns.map(col => ({
                      id: `col_${col.id}`,
                      columnId: col.id,
                      name: col.column_name,
                      type: col.data_type || 'unknown',
                      isPk: col.is_primary_key || false,
                      isFk: col.is_foreign_key || false,
                    })),
                  };
                } catch {
                  return {
                    id: `table_${table.id}`,
                    tableId: table.id,
                    name: table.table_name,
                    schema: table.schema_name,
                    columns: [],
                  };
                }
              })
            );

            return {
              id: conn.id,
              name: conn.name,
              type: typeName,
              color: typeColor,
              icon: connType?.icon || 'database',
              tables: tablesWithColumns,
            };
          } catch (err) {
            console.error(`Failed to fetch tables for connection ${conn.id}:`, err);
            return {
              id: conn.id,
              name: conn.name,
              type: typeName,
              color: typeColor,
              icon: connType?.icon || 'database',
              tables: [],
            };
          }
        })
      );

      setAvailableConnections(enrichedConnections);

      // Load tables from federation into canvas nodes
      if (federationData.tables && federationData.tables.length > 0) {
        // Create a map of enriched connections for quick lookup
        const enrichedConnectionsMap = {};
        enrichedConnections.forEach(c => {
          enrichedConnectionsMap[c.id] = c;
        });

        // Also use federation connections for colors
        const federationConnectionsMap = {};
        federationData.connections?.forEach((c, idx) => {
          federationConnectionsMap[c.id] = {
            ...c,
            color: c.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length],
          };
        });

        // Build nodes from federation tables
        const initialNodes = [];
        for (let i = 0; i < federationData.tables.length; i++) {
          const fedTable = federationData.tables[i];
          const connId = fedTable.connection_id;
          const enrichedConn = enrichedConnectionsMap[connId];
          const fedConn = federationConnectionsMap[connId];
          
          // Try to find the enriched table with columns
          const enrichedTable = enrichedConn?.tables?.find(t => t.tableId === fedTable.id);
          
          initialNodes.push({
            id: `table_${fedTable.id}`,
            type: 'federationTable',
            position: { x: 100 + (i % 4) * 300, y: 100 + Math.floor(i / 4) * 250 },
            data: {
              label: fedTable.table_name,
              connectionId: connId,
              connectionName: fedTable.connection_name || fedConn?.name || 'Unknown',
              connectionColor: fedConn?.color || enrichedConn?.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
              columns: enrichedTable?.columns || [],
            },
          });
        }
        
        // Apply auto layout on initial load
        const { nodes: layoutedNodes } = getLayoutedElements(initialNodes, []);
        setNodes(layoutedNodes);
        // Trigger fitView after layout
        setTimeout(() => setLayoutVersion(v => v + 1), 100);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      setError('Failed to load federation data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [federationId, setNodes]);

  // Fetch data on mount
  useEffect(() => {
    if (federationId) {
      fetchData();
    }
  }, [federationId, fetchData]);

  // Get tables already added to canvas
  const addedTableIds = nodes.map(n => n.id);

  // Reset modal state
  const resetAddModal = () => {
    setIsAddModalOpen(false);
    setAddModalStep(1);
    setSelectedConnectionsToAdd([]);
    setSelectedTablesPerConnection({});
    setConnectionSearch('');
    setTableSearch('');
    setExpandedConnection(null);
  };

  // Handle wizard next step
  const handleNextStep = async () => {
    if (addModalStep === 1 && selectedConnectionsToAdd.length > 0) {
      // Add connections to federation first
      setIsAddingConnections(true);
      try {
        // Filter only connections not already in federation
        const newConnectionIds = selectedConnectionsToAdd.filter(
          id => !federationConnectionIds.includes(id)
        );
        
        if (newConnectionIds.length > 0) {
          const updatedFederation = await federationService.addConnections(federationId, {
            connection_ids: newConnectionIds,
          });
          setFederation(updatedFederation);
        }
        
        // Initialize tables selection for each connection
        const initialTables = {};
        selectedConnectionsToAdd.forEach(connId => {
          initialTables[connId] = [];
        });
        setSelectedTablesPerConnection(initialTables);
        
        // Move to step 2
        setAddModalStep(2);
        setExpandedConnection(selectedConnectionsToAdd[0]); // Expand first connection
      } catch (err) {
        console.error('Failed to add connections:', err);
      } finally {
        setIsAddingConnections(false);
      }
    }
  };

  // Handle finish (add tables to canvas)
  const handleFinish = () => {
    // Add all selected tables to canvas
    Object.entries(selectedTablesPerConnection).forEach(([connId, tableIds]) => {
      const conn = availableConnections.find(c => c.id === parseInt(connId, 10));
      if (!conn) return;

      const newNodes = tableIds
        .filter(tableId => !addedTableIds.includes(tableId))
        .map((tableId, index) => {
          const table = conn.tables.find(t => t.id === tableId);
          if (!table) return null;
          
          return {
            id: table.id,
            type: 'federationTable',
            position: { x: 100 + (nodes.length + index) * 300, y: 100 + parseInt(connId, 10) * 50 },
            data: {
              label: table.name,
              connectionId: conn.id,
              connectionName: conn.name,
              connectionColor: conn.color,
              columns: table.columns.map(c => ({ ...c, active: true })),
            },
          };
        })
        .filter(Boolean);

      if (newNodes.length > 0) {
        setNodes((nds) => [...nds, ...newNodes]);
      }
    });

    resetAddModal();
  };

  // Handle removing connection from federation
  const handleRemoveConnection = async (connectionId) => {
    try {
      await federationService.removeConnection(federationId, connectionId);
      setFederation(prev => ({
        ...prev,
        connections: prev.connections.filter(c => c.id !== connectionId),
      }));
      // Remove nodes from that connection
      setNodes(nds => nds.filter(n => n.data.connectionId !== connectionId));
      setEdges(eds => eds.filter(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        return sourceNode?.data.connectionId !== connectionId && targetNode?.data.connectionId !== connectionId;
      }));
    } catch (err) {
      console.error('Failed to remove connection:', err);
    }
  };

  // Handle connection for drag-and-drop
  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
    // Only allow cross-connection relationships in Federation
    const isCrossConnection = sourceNode?.data.connectionId !== targetNode?.data.connectionId;
    
    if (!isCrossConnection) {
      setToastMessage({ 
        message: 'Federation is for cross-database relationships only. Use the Schema Editor for same-database relationships.', 
        type: 'error' 
      });
      setTimeout(() => setToastMessage(null), 4000);
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
  // Auto layout - also triggers fitView via layoutVersion
  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    // Trigger fitView after layout
    setLayoutVersion(v => v + 1);
  }, [nodes, edges, setNodes, setEdges]);

  // Edge click to edit
  const onEdgeClick = useCallback((_, edge) => {
    setEditingEdge(edge);
  }, []);

  // Remove table from canvas
  const handleRemoveTable = (tableId) => {
    setNodes((nds) => nds.filter(n => n.id !== tableId));
    setEdges((eds) => eds.filter(e => e.source !== tableId && e.target !== tableId));
  };

  // Update edge
  const handleUpdateEdge = (cardinality, joinType) => {
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

  // Get connections that are in the federation
  const federationConnectionIds = federation?.connections?.map(c => c.id) || [];

  // Get connections available in this federation (filter availableConnections)
  const connectionsInFederation = availableConnections.filter(c => 
    federationConnectionIds.includes(c.id)
  );

  // Get connections not yet in federation (for add modal)
  const connectionsNotInFederation = availableConnections.filter(c => 
    !federationConnectionIds.includes(c.id)
  ).filter(c =>
    c.name.toLowerCase().includes(connectionSearch.toLowerCase())
  );

  // Toggle connection selection for add modal
  const toggleConnectionSelection = (connectionId) => {
    setSelectedConnectionsToAdd(prev =>
      prev.includes(connectionId)
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  // Toggle table selection for a connection
  const toggleTableSelection = (connectionId, tableId) => {
    setSelectedTablesPerConnection(prev => {
      const current = prev[connectionId] || [];
      const updated = current.includes(tableId)
        ? current.filter(id => id !== tableId)
        : [...current, tableId];
      return { ...prev, [connectionId]: updated };
    });
  };

  // Select all tables for a connection
  const selectAllTables = (connectionId) => {
    const conn = availableConnections.find(c => c.id === connectionId);
    if (!conn) return;
    
    const allTableIds = conn.tables
      .filter(t => !addedTableIds.includes(t.id))
      .map(t => t.id);
    
    setSelectedTablesPerConnection(prev => ({
      ...prev,
      [connectionId]: allTableIds,
    }));
  };

  // Get column info for edge modal
  const getColumnInfo = (tableId, handleId) => {
    if (!handleId) return { table: tableId, column: '?', connection: '' };
    const colId = handleId.replace(/-right$/, '').replace(/-left$/, '');
    const node = nodes.find(n => n.id === tableId);
    const column = node?.data.columns.find((c) => c.id === colId);
    return { 
      table: node?.data.label || tableId, 
      column: column?.name || colId,
      connection: node?.data.connectionName || '',
      connectionColor: node?.data.connectionColor || '#666',
    };
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // For now, just show success - in a real app, you'd save the canvas state
      // The relationships would be saved via the relationships API
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Get total selected tables count
  const getTotalSelectedTables = () => {
    return Object.values(selectedTablesPerConnection).reduce((acc, tables) => acc + tables.length, 0);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Loading federation...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Failed to Load
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Link
              href="/connections/federation"
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
            >
              Go Back
            </Link>
            <button 
              onClick={fetchData}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="font-bold text-gray-900 dark:text-white">{federation?.name || 'Federation'}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onLayout} 
            disabled={nodes.length === 0}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            <Wand2 className="w-4 h-4" />
            Auto Layout
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Connection
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </header>

      {/* Connections Bar */}
      {federation?.connections && federation.connections.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-2 flex items-center gap-2 shrink-0 overflow-x-auto">
          <span className="text-xs text-gray-500 shrink-0">Connections:</span>
          {federation.connections.map((conn, idx) => {
            const enrichedConn = availableConnections.find(c => c.id === conn.id);
            const color = enrichedConn?.color || conn.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return (
              <div 
                key={conn.id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-zinc-800 group"
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-gray-700 dark:text-gray-300">{conn.name}</span>
                <button 
                  onClick={() => handleRemoveConnection(conn.id)}
                  className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove from federation"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}
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
                Add connections and select tables to start building cross-database relationships.
              </p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Connection
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
            layoutVersion={layoutVersion}
          />
        )}
      </div>

      {/* Legend */}
      {nodes.length > 0 && (
        <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 px-6 py-2 flex items-center gap-6 text-xs">
          <span className="text-gray-500">Legend:</span>
          {connectionsInFederation.filter(c => nodes.some(n => n.data.connectionId === c.id)).map(conn => (
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

      {/* Add Connection Modal (Wizard) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800 shrink-0">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  addModalStep === 1 
                    ? "bg-amber-500 text-white" 
                    : "bg-amber-100 dark:bg-amber-900/30 text-amber-600"
                )}>
                  1
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300" />
                <div className={clsx(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
                  addModalStep === 2 
                    ? "bg-amber-500 text-white" 
                    : "bg-gray-100 dark:bg-zinc-800 text-gray-400"
                )}>
                  2
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-2">
                  {addModalStep === 1 ? 'Select Connections' : 'Select Tables'}
                </span>
              </div>
              <button 
                onClick={resetAddModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                disabled={isAddingConnections}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {addModalStep === 1 ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select the connections you want to add to this federation.
                  </p>
                  
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      placeholder="Search connections..."
                      value={connectionSearch}
                      onChange={(e) => setConnectionSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                    />
                  </div>

                  {/* Connection List */}
                  <div className="border border-gray-200 dark:border-zinc-700 rounded-lg divide-y divide-gray-100 dark:divide-zinc-800 max-h-80 overflow-y-auto">
                    {connectionsNotInFederation.length === 0 ? (
                      <div className="p-6 text-center text-sm text-gray-500">
                        {connectionSearch ? 'No matching connections' : 'All connections already added to this federation'}
                      </div>
                    ) : (
                      connectionsNotInFederation.map((conn) => (
                        <button
                          key={conn.id}
                          onClick={() => toggleConnectionSelection(conn.id)}
                          className={clsx(
                            "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                            selectedConnectionsToAdd.includes(conn.id)
                              ? "bg-amber-50 dark:bg-amber-900/20"
                              : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                          )}
                        >
                          {selectedConnectionsToAdd.includes(conn.id) ? (
                            <CheckSquare className="w-5 h-5 text-amber-500 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-300 shrink-0" />
                          )}
                          <div 
                            className="w-3 h-3 rounded-full shrink-0" 
                            style={{ backgroundColor: conn.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium text-gray-900 dark:text-white block truncate">
                              {conn.name}
                            </span>
                            <span className="text-xs text-gray-500">{conn.type}</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Table2 className="w-3.5 h-3.5" />
                            <span>{conn.tables?.length || 0}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Select tables from each connection to add to the canvas.
                  </p>

                  {/* Connections with Tables - Bronze Layer style */}
                  <div className="space-y-4 max-h-[500px] overflow-auto">
                    {selectedConnectionsToAdd.map((connId) => {
                      const conn = availableConnections.find(c => c.id === connId);
                      if (!conn) return null;
                      
                      const isExpanded = expandedConnection === connId;
                      const selectedTables = selectedTablesPerConnection[connId] || [];
                      const availableTables = conn.tables.filter(t => 
                        !addedTableIds.includes(t.id) &&
                        t.name.toLowerCase().includes(tableSearch.toLowerCase())
                      );
                      const allSelected = availableTables.length > 0 && availableTables.every(t => selectedTables.includes(t.id));

                      return (
                        <div key={connId} className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                          {/* Connection Header */}
                          <button
                            onClick={() => setExpandedConnection(isExpanded ? null : connId)}
                            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: conn.color }}
                              />
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {conn.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-amber-600 dark:text-amber-400">
                                {selectedTables.length}/{availableTables.length} selected
                              </span>
                              <ChevronRight className={clsx(
                                "w-4 h-4 text-gray-400 transition-transform",
                                isExpanded && "rotate-90"
                              )} />
                            </div>
                          </button>
                          
                          {/* Tables List */}
                          {isExpanded && (
                            <div className="p-3 space-y-1">
                              {/* Search */}
                              <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                <input 
                                  type="text"
                                  placeholder="Search tables..."
                                  value={tableSearch}
                                  onChange={(e) => setTableSearch(e.target.value)}
                                  className="w-full pl-8 pr-3 py-1.5 rounded border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs"
                                />
                              </div>

                              {/* Select All */}
                              <div
                                onClick={() => selectAllTables(connId)}
                                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 border-b border-gray-100 dark:border-zinc-700 mb-2"
                              >
                                <div className={clsx(
                                  "w-5 h-5 rounded border-2 flex items-center justify-center",
                                  allSelected
                                    ? "bg-amber-500 border-amber-500"
                                    : "border-gray-300 dark:border-zinc-600"
                                )}>
                                  {allSelected && (
                                    <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>
                                  )}
                                </div>
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Select All
                                </span>
                              </div>

                              {/* Tables */}
                              <div className="max-h-48 overflow-y-auto space-y-1">
                                {availableTables.length === 0 ? (
                                  <p className="text-xs text-gray-500 py-4 text-center">
                                    {tableSearch ? 'No matching tables' : 'No tables available'}
                                  </p>
                                ) : (
                                  availableTables.map(table => (
                                    <div
                                      key={table.id}
                                      onClick={() => toggleTableSelection(connId, table.id)}
                                      className={clsx(
                                        "flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors",
                                        selectedTables.includes(table.id)
                                          ? "bg-amber-50 dark:bg-amber-900/20"
                                          : "hover:bg-gray-50 dark:hover:bg-zinc-800"
                                      )}
                                    >
                                      <div className="flex items-center gap-3">
                                        <div className={clsx(
                                          "w-5 h-5 rounded border-2 flex items-center justify-center",
                                          selectedTables.includes(table.id)
                                            ? "bg-amber-500 border-amber-500"
                                            : "border-gray-300 dark:border-zinc-600"
                                        )}>
                                          {selectedTables.includes(table.id) && (
                                            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                              <path d="M2 6l3 3 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                          )}
                                        </div>
                                        <Table2 className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-900 dark:text-white font-mono">
                                          {table.name}
                                        </span>
                                      </div>
                                      <span className="text-xs text-gray-500">
                                        {table.columns?.length || 0} cols
                                      </span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center shrink-0">
              <span className="text-xs text-gray-500">
                {addModalStep === 1 
                  ? `${selectedConnectionsToAdd.length} connection(s) selected`
                  : `${getTotalSelectedTables()} table(s) selected`
                }
              </span>
              <div className="flex gap-3">
                {addModalStep === 2 && (
                  <button 
                    onClick={() => setAddModalStep(1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    Back
                  </button>
                )}
                <button 
                  onClick={resetAddModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                  disabled={isAddingConnections}
                >
                  Cancel
                </button>
                {addModalStep === 1 ? (
                  <button 
                    onClick={handleNextStep}
                    disabled={selectedConnectionsToAdd.length === 0 || isAddingConnections}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAddingConnections && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isAddingConnections ? 'Adding...' : 'Next'}
                    {!isAddingConnections && <ChevronRight className="w-4 h-4" />}
                  </button>
                ) : (
                  <button 
                    onClick={handleFinish}
                    disabled={getTotalSelectedTables() === 0}
                    className="px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add to Canvas
                  </button>
                )}
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
                      const cardinality = document.getElementById('edit-cardinality')?.value || '1:N';
                      const joinType = document.getElementById('edit-jointype')?.value || 'FULL';
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
      {toastMessage && (
        <div className={clsx(
          "fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 z-50 animate-in slide-in-from-bottom-4 duration-300",
          toastMessage.type === 'error' 
            ? "bg-red-50 dark:bg-red-900/90 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200" 
            : "bg-green-50 dark:bg-green-900/90 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-200"
        )}>
          <div className={clsx(
            "w-2 h-2 rounded-full",
            toastMessage.type === 'error' ? "bg-red-500" : "bg-green-500"
          )} />
          <span className="text-sm font-medium max-w-md">{toastMessage.message}</span>
          <button 
            onClick={() => setToastMessage(null)} 
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
