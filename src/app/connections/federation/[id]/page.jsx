'use client';

import React, { useState, useCallback } from 'react';
import DashboardLayout from '../../../components/DashboardLayout/DashboardLayout';
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
  ReactFlowProvider
} from 'reactflow';
import dagre from 'dagre';
import FederationCanvas from '../../../components/FederationCanvas/FederationCanvas';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import styles from './page.module.css';

const AVAILABLE_CONNECTIONS = [
  {
    id: 'conn_pg',
    name: 'PostgreSQL Production',
    type: 'PostgreSQL',
    color: '#3b82f6',
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
    color: '#a855f7',
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
    color: '#22c55e',
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

const MOCK_WORKSPACES = {
  'ws_1': { name: 'E-commerce Integration', description: 'User data federation between main database and user profiles' },
  'ws_2': { name: 'Inventory Sync', description: 'Product and inventory data across systems' },
  'ws_3': { name: 'Analytics Pipeline', description: 'Sales and order analytics federation' },
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges) => {
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
  const workspaceId = params.id;
  const workspace = MOCK_WORKSPACES[workspaceId] || { name: 'New Workspace', description: '' };

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  
  const [isAddTableModalOpen, setIsAddTableModalOpen] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState('');
  const [selectedTables, setSelectedTables] = useState([]);
  const [tableSearch, setTableSearch] = useState('');
  
  const [editingEdge, setEditingEdge] = useState(null);
  const [toast, setToast] = useState(null);

  const addedTableIds = nodes.map(n => n.id);

  const handleAddTables = () => {
    const conn = AVAILABLE_CONNECTIONS.find(c => c.id === selectedConnection);
    if (!conn) return;

    const newNodes = selectedTables
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
      .filter(Boolean);

    setNodes((nds) => [...nds, ...newNodes]);
    setIsAddTableModalOpen(false);
    setSelectedConnection('');
    setSelectedTables([]);
    setTableSearch('');
  };

  const onConnect = useCallback((params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    
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

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const onEdgeClick = useCallback((_, edge) => {
    setEditingEdge(edge);
  }, []);

  const handleRemoveTable = (tableId) => {
    setNodes((nds) => nds.filter(n => n.id !== tableId));
    setEdges((eds) => eds.filter(e => e.source !== tableId && e.target !== tableId));
  };

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

  const handleDeleteEdge = () => {
    if (!editingEdge) return;
    setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
    setEditingEdge(null);
  };

  const getFilteredTables = () => {
    const conn = AVAILABLE_CONNECTIONS.find(c => c.id === selectedConnection);
    if (!conn) return [];
    
    return conn.tables.filter(t => 
      t.name.toLowerCase().includes(tableSearch.toLowerCase()) &&
      !addedTableIds.includes(t.id)
    );
  };

  const toggleTableSelection = (tableId) => {
    setSelectedTables(prev => 
      prev.includes(tableId) 
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

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

  return (
    <div className={styles.editorContainer}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Link 
            href="/connections/federation"
            className={styles.backLink}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="text-sm">All Federations</span>
          </Link>
          <div className={styles.headerDivider} />
          <div className={styles.headerTitleGroup}>
            <LinkIcon className={styles.headerIcon} />
            <h1 className={styles.headerTitle}>{workspace.name}</h1>
          </div>
        </div>
        <div className={styles.headerToolbar}>
          <button 
            onClick={onLayout} 
            className={styles.toolButton}
          >
            <Wand2 className="w-4 h-4" />
            Auto Layout
          </button>
          <button 
            onClick={() => setIsAddTableModalOpen(true)}
            className={styles.addTableButton}
          >
            <Plus className="w-4 h-4" />
            Add Table
          </button>
          <div className={styles.headerDivider}></div>
          <button className={styles.saveButton}>
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {nodes.length > 0 && (
        <div className={styles.tableBar}>
          <span className={styles.tableLabel}>Tables:</span>
          {nodes.map((node) => (
            <div 
              key={node.id}
              className={styles.tableChip}
            >
              <div 
                className={styles.tableColorDot} 
                style={{ backgroundColor: node.data.connectionColor }}
              />
              <span className={styles.tableText}>{node.data.label}</span>
              <button 
                onClick={() => handleRemoveTable(node.id)}
                className={styles.removeTableButton}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.canvasArea}>
        {nodes.length === 0 ? (
          <div className={styles.emptyCanvas}>
            <div className={styles.emptyContent}>
              <div className={styles.emptyIconBox}>
                <LinkIcon className={styles.emptyIcon} />
              </div>
              <h2 className={styles.emptyTitle}>
                Create Cross-Database Relationships
              </h2>
              <p className={styles.emptyText}>
                Add tables from different data sources and connect them by dragging between columns.
              </p>
              <button 
                onClick={() => setIsAddTableModalOpen(true)}
                className={styles.addTableButton}
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

      {nodes.length > 0 && (
        <div className={styles.legend}>
          <span className={styles.legendLabel}>Legend:</span>
          {AVAILABLE_CONNECTIONS.filter(c => nodes.some(n => n.data.connectionId === c.id)).map(conn => (
            <div key={conn.id} className={styles.legendItem}>
              <div className={styles.legendDot} style={{ backgroundColor: conn.color }} />
              <span className={styles.legendText}>{conn.name}</span>
            </div>
          ))}
          <div className={styles.legendRight}>
            <div className={styles.legendItem}>
              <div className={styles.legendLine} />
              <span className={styles.legendLabel}>Cross-DB Relationship</span>
            </div>
          </div>
        </div>
      )}

      {isAddTableModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Database className="w-5 h-5 text-amber-500" />
                Add Tables to Canvas
              </h3>
              <button onClick={() => { setIsAddTableModalOpen(false); setSelectedConnection(''); setSelectedTables([]); }} className={styles.closeButton}>
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Connection</label>
                <select 
                  className={styles.select}
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

              {selectedConnection && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Select Tables</label>
                  
                  <div className={styles.searchWrapper}>
                    <Search className={styles.searchIcon} />
                    <input 
                      type="text"
                      placeholder="Search tables..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className={styles.searchInput}
                    />
                  </div>

                  <div className={styles.tableList}>
                    {getFilteredTables().length === 0 ? (
                      <div className="p-4 text-center text-sm text-gray-500">
                        {tableSearch ? 'No matching tables' : 'All tables already added'}
                      </div>
                    ) : (
                      getFilteredTables().map(table => (
                        <button
                          key={table.id}
                          onClick={() => toggleTableSelection(table.id)}
                          className={styles.tableOption}
                        >
                          {selectedTables.includes(table.id) ? (
                            <CheckSquare className={styles.checkIcon} />
                          ) : (
                            <Square className={styles.squareIcon} />
                          )}
                          <span className={styles.tableName}>{table.name}</span>
                          <span className={styles.tableColCount}>{table.columns.length} cols</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <span className={styles.selectedCount}>
                {selectedTables.length} table(s) selected
              </span>
              <div className={styles.footerButtons}>
                <button 
                  onClick={() => { setIsAddTableModalOpen(false); setSelectedConnection(''); setSelectedTables([]); }} 
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddTables}
                  disabled={selectedTables.length === 0}
                  className={styles.confirmButton}
                >
                  Add to Canvas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingEdge && (() => {
        const sourceInfo = getColumnInfo(editingEdge.source, editingEdge.sourceHandle);
        const targetInfo = getColumnInfo(editingEdge.target, editingEdge.targetHandle);
        
        return (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <LinkIcon className="w-5 h-5 text-amber-500" />
                  Edit Relationship
                </h3>
                <button onClick={() => setEditingEdge(null)} className={styles.closeButton}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.connectionInfoBox}>
                  <div className={styles.connectionLabel}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sourceInfo.connectionColor }} />
                    <span>{sourceInfo.connection}</span>
                  </div>
                  <div className={styles.relationRow}>
                    <span className={styles.columnRef}>
                      {sourceInfo.table}<span className={styles.columnDot}>.</span>{sourceInfo.column}
                    </span>
                    <ArrowRight className={styles.relationArrow} />
                    <span className={styles.columnRef}>
                      {targetInfo.table}<span className={styles.columnDot}>.</span>{targetInfo.column}
                    </span>
                  </div>
                  <div className={styles.connectionLabel}>
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: targetInfo.connectionColor }} />
                    <span>{targetInfo.connection}</span>
                  </div>
                </div>

                <div className={styles.crossDbBadge}>
                  <LinkIcon className="w-3.5 h-3.5" />
                  Cross-database relationship (uses federation layer)
                </div>
                
                <div className={styles.formGroup}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cardinality</label>
                    <select 
                      className={styles.select} 
                      defaultValue={editingEdge.data?.cardinality || '1:N'}
                      id="edit-cardinality"
                    >
                      <option value="1:1">1:1 (One to One)</option>
                      <option value="1:N">1:N (One to Many)</option>
                      <option value="N:N">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Join Type</label>
                    <select 
                      className={styles.select} 
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
              <div className={styles.modalFooter}>
                <button 
                  onClick={handleDeleteEdge}
                  className={styles.deleteEdgeButton}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className={styles.footerButtons}>
                  <button onClick={() => setEditingEdge(null)} className={styles.cancelButton}>
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const cardinality = document.getElementById('edit-cardinality').value || '1:N';
                      const joinType = document.getElementById('edit-jointype').value || 'FULL';
                      handleUpdateEdge(cardinality, joinType);
                    }} 
                    className={styles.confirmButton}
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {toast && (
        <div className={clsx(
          styles.toast,
          toast.type === 'error' ? styles.toastError : styles.toastSuccess
        )}>
          <div className={styles.toastDot} />
          <span className={styles.toastMessage}>{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className={styles.toastClose}
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