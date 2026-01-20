'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import SchemaCanvas from '../../components/SchemaCanvas/SchemaCanvas';
import SchemaListView from '../../components/SchemaListView/SchemaListView';
import { 
  LayoutGrid, 
  List, 
  Save, 
  Sparkles, 
  X,
  AlertCircle,
  Plus,
  ArrowRight,
  Wand2,
  HardDrive,
  Database,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Trash2
} from 'lucide-react';
import { 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  addEdge, 
  ReactFlowProvider
} from 'reactflow';
import { clsx } from 'clsx';
import dagre from 'dagre';
import styles from './page.module.css';

const INITIAL_TABLES = [
  {
    id: 'insurances',
    type: 'table',
    position: { x: 50, y: 50 },
    data: { 
      label: 'insurances',
      active: true,
      columns: [
        { id: 'i_id', name: 'id', type: 'INT', isPk: true, active: true },
        { id: 'i_name', name: 'provider_name', type: 'VARCHAR', active: true },
        { id: 'i_type', name: 'plan_type', type: 'VARCHAR', active: true },
        { id: 'i_logo', name: 'logo_url', type: 'VARCHAR', active: true, isImagePath: true },
      ]
    },
    active: true,
    columns: []
  },
  {
    id: 'patients',
    type: 'table',
    position: { x: 50, y: 300 },
    data: { 
      label: 'patients',
      active: true,
      columns: [
        { id: 'p_id', name: 'id', type: 'UUID', isPk: true, active: true },
        { id: 'p_ins_id', name: 'insurance_id', type: 'INT', isFk: true, active: true },
        { id: 'p_name', name: 'name', type: 'VARCHAR', active: true },
        { id: 'p_dob', name: 'birth_date', type: 'DATE', active: true },
        { id: 'p_cpf', name: 'cpf', type: 'VARCHAR', active: true },
        { id: 'p_photo', name: 'photo_url', type: 'VARCHAR', active: true, isImagePath: true },
      ]
    },
    active: true,
    columns: [] 
  },
  {
    id: 'appointments',
    type: 'table',
    position: { x: 400, y: 150 },
    data: { 
      label: 'appointments',
      active: true,
      columns: [
        { id: 'a_id', name: 'id', type: 'INT', isPk: true, active: true },
        { id: 'a_pid', name: 'patient_id', type: 'UUID', isFk: true, active: true },
        { id: 'a_did', name: 'doctor_id', type: 'INT', isFk: true, active: true },
        { id: 'a_date', name: 'date', type: 'TIMESTAMP', active: true },
        { id: 'a_status', name: 'status', type: 'VARCHAR', active: true },
      ]
    },
    active: true,
    columns: []
  },
  {
    id: 'medical_records',
    type: 'table',
    position: { x: 400, y: 450 },
    data: { 
      label: 'medical_records',
      active: true,
      columns: [
        { id: 'm_id', name: 'id', type: 'INT', isPk: true, active: true },
        { id: 'm_aid', name: 'appointment_id', type: 'INT', isFk: true, active: true },
        { id: 'm_diag', name: 'diagnosis', type: 'TEXT', active: true },
        { id: 'm_notes', name: 'notes', type: 'TEXT', active: true },
        { id: 'm_attach', name: 'attachment_url', type: 'VARCHAR', active: true, isImagePath: true },
      ]
    },
    active: true,
    columns: []
  },
  {
    id: 'prescriptions',
    type: 'table',
    position: { x: 400, y: 750 },
    data: { 
      label: 'prescriptions',
      active: true,
      columns: [
        { id: 'pr_id', name: 'id', type: 'INT', isPk: true, active: true },
        { id: 'pr_mid', name: 'record_id', type: 'INT', isFk: true, active: true },
        { id: 'pr_med_id', name: 'medication_id', type: 'INT', isFk: true, active: true },
        { id: 'pr_dose', name: 'dosage', type: 'VARCHAR', active: true },
      ]
    },
    active: true,
    columns: []
  },
  {
    id: 'departments',
    type: 'table',
    position: { x: 750, y: 50 },
    data: { 
      label: 'departments',
      active: false,
      columns: [
        { id: 'dep_id', name: 'id', type: 'INT', isPk: true, active: false },
        { id: 'dep_name', name: 'name', type: 'VARCHAR', active: false },
        { id: 'dep_loc', name: 'location', type: 'VARCHAR', active: false },
      ]
    },
    active: false,
    columns: []
  },
  {
    id: 'doctors',
    type: 'table',
    position: { x: 750, y: 300 },
    data: { 
      label: 'doctors',
      active: true,
      columns: [
        { id: 'd_id', name: 'id', type: 'INT', isPk: true, active: true },
        { id: 'd_dep_id', name: 'dept_id', type: 'INT', isFk: true, active: true },
        { id: 'd_name', name: 'name', type: 'VARCHAR', active: true },
        { id: 'd_crm', name: 'crm', type: 'VARCHAR', active: true },
        { id: 'd_photo', name: 'avatar_url', type: 'VARCHAR', active: true, isImagePath: true },
      ]
    },
    active: true,
    columns: []
  },
  {
    id: 'medications',
    type: 'table',
    position: { x: 750, y: 750 },
    data: { 
      label: 'medications',
      active: false,
      columns: [
        { id: 'med_id', name: 'id', type: 'INT', isPk: true, active: false },
        { id: 'med_name', name: 'name', type: 'VARCHAR', active: false },
        { id: 'med_desc', name: 'description', type: 'TEXT', active: false },
        { id: 'med_stock', name: 'stock_qty', type: 'INT', active: false },
      ]
    },
    active: false,
    columns: []
  }
];

const INITIAL_EDGES = [
  { id: 'e_ins_p', source: 'insurances', target: 'patients', sourceHandle: 'i_id-right', targetHandle: 'p_ins_id-left', animated: false, type: 'smoothstep', style: { stroke: '#2563eb', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' }, data: { cardinality: '1:N', joinType: 'FULL' } },
  { id: 'e_dep_d', source: 'departments', target: 'doctors', sourceHandle: 'dep_id-right', targetHandle: 'd_dep_id-left', animated: false, type: 'smoothstep', style: { stroke: '#2563eb', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' }, data: { cardinality: '1:N', joinType: 'FULL' } },
  { id: 'e_p_a', source: 'patients', target: 'appointments', sourceHandle: 'p_id-right', targetHandle: 'a_pid-left', animated: false, type: 'smoothstep', style: { stroke: '#2563eb', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' }, data: { cardinality: '1:N', joinType: 'FULL' } },
  { id: 'e_d_a', source: 'doctors', target: 'appointments', sourceHandle: 'd_id-left', targetHandle: 'a_did-right', animated: false, type: 'smoothstep', style: { stroke: '#2563eb', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' }, data: { cardinality: '1:N', joinType: 'LEFT' } },
  { id: 'e_a_m', source: 'appointments', target: 'medical_records', sourceHandle: 'a_id-right', targetHandle: 'm_aid-left', animated: false, type: 'smoothstep', style: { stroke: '#2563eb', strokeWidth: 2 }, markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' }, data: { cardinality: '1:1', joinType: 'INNER' } },
  { id: 'e_m_pr_sug', source: 'medical_records', target: 'prescriptions', sourceHandle: 'm_id-right', targetHandle: 'pr_mid-left', animated: false, type: 'smoothstep', style: { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, data: { cardinality: '1:N', joinType: 'FULL', isSuggestion: true } },
  { id: 'e_med_pr_sug', source: 'medications', target: 'prescriptions', sourceHandle: 'med_id-right', targetHandle: 'pr_med_id-left', animated: false, type: 'smoothstep', style: { stroke: '#64748b', strokeWidth: 2, strokeDasharray: '5 5' }, markerEnd: { type: MarkerType.ArrowClosed, color: '#64748b' }, data: { cardinality: '1:N', joinType: 'FULL', isSuggestion: true } }
];

const INITIAL_SUGGESTIONS = [
  { id: 1, source: 'medical_records.id', target: 'prescriptions.record_id', confidence: 0.98 },
  { id: 2, source: 'medications.id', target: 'prescriptions.medication_id', confidence: 0.95 },
  { id: 3, source: 'doctors.id', target: 'prescriptions.doctor_id', confidence: 0.40, warning: 'Column missing in target' },
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges) => {
  dagreGraph.setGraph({ rankdir: 'LR' });
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 300, height: 200 });
  });
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });
  dagre.layout(dagreGraph);
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return { ...node, position: { x: nodeWithPosition.x - 150, y: nodeWithPosition.y - 100 } };
  });
  return { nodes: layoutedNodes, edges };
};

const Accordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  count,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200 dark:border-zinc-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.accordionBtn}
      >
        <div className={styles.accordionTitle}>
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span>
          {count !== undefined && (
            <span className={styles.accordionCount}>
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className={styles.accordionContent}>
          {children}
        </div>
      )}
    </div>
  );
};

const AcceptedRejectedItem = ({ item, status }) => (
  <div className={styles.historyItem}>
    <div className={styles.historyText}>
      {item.source} → {item.target}
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {status === 'accepted' ? (
        <span className={styles.statusAccepted}>
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </span>
      ) : (
        <span className={styles.statusRejected}>
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      )}
    </div>
  </div>
);

function SchemaEditorContent() {
  const [viewMode, setViewMode] = useState('canvas');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState(null);
  const [activeSampleModal, setActiveSampleModal] = useState(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_TABLES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [newRel, setNewRel] = useState({ sourceTable: '', sourceCol: '', targetTable: '', targetCol: '', cardinality: '1:N', joinType: 'FULL' });
  const [editingEdge, setEditingEdge] = useState(null);

  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState([]);

  const handleToggleActive = useCallback((id) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, active: !node.data.active }, active: !node.active };
      }
      return node;
    }));
  }, [setNodes]);

  const handleToggleColumnActive = useCallback((tableId, columnId) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === tableId) {
        const newColumns = node.data.columns.map((col) => {
          if (col.id === columnId) return { ...col, active: !col.active };
          return col;
        });
        return { ...node, data: { ...node.data, columns: newColumns }, columns: newColumns };
      }
      return node;
    }));
  }, [setNodes]);

  const handleLinkImage = useCallback((id) => setActiveImageModal(id), []);
  const handleViewSample = useCallback((id) => setActiveSampleModal(id), []);

  useEffect(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onToggleActive: handleToggleActive,
        onToggleColumnActive: (colId) => handleToggleColumnActive(node.id, colId),
        onLinkImage: handleLinkImage,
        onViewSample: handleViewSample,
      }
    })));
  }, [setNodes, handleToggleActive, handleToggleColumnActive, handleLinkImage, handleViewSample]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: false, 
      style: { stroke: '#2563eb', strokeWidth: 2 }, 
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' },
      data: { cardinality: '1:N', joinType: 'FULL' }
    }, eds));
  }, [setEdges]);

  const onEdgeClick = useCallback((_, edge) => {
    setEditingEdge(edge);
  }, []);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const handleManualCreate = () => {
    if (!newRel.sourceTable || !newRel.targetTable) return;
    const newEdge = {
      id: `e_${newRel.sourceTable}_${newRel.targetTable}_${Date.now()}`,
      source: newRel.sourceTable,
      target: newRel.targetTable,
      sourceHandle: newRel.sourceCol ? `${newRel.sourceCol}-right` : undefined, 
      targetHandle: newRel.targetCol ? `${newRel.targetCol}-left` : undefined,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#2563eb', strokeWidth: 2 },
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' },
      data: { cardinality: newRel.cardinality, joinType: newRel.joinType }
    };
    setEdges((eds) => addEdge(newEdge, eds));
    setIsRelModalOpen(false);
    setNewRel({ sourceTable: '', sourceCol: '', targetTable: '', targetCol: '', cardinality: '1:N', joinType: 'FULL' });
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

  const handleAcceptSuggestion = (suggestion) => {
    setAcceptedSuggestions([...acceptedSuggestions, suggestion]);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  const handleRejectSuggestion = (suggestion) => {
    setRejectedSuggestions([...rejectedSuggestions, suggestion]);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  INITIAL_TABLES.forEach(t => t.columns = t.data.columns);

  return (
    <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.headerTitle}>
            <h1 className="font-bold text-gray-900 dark:text-white">Schema Editor</h1>
            <div className={styles.viewToggle}>
              <button 
                onClick={() => setViewMode('list')} 
                className={clsx(styles.toggleButton, viewMode === 'list' && styles.toggleButtonActive)} 
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('canvas')} 
                className={clsx(styles.toggleButton, viewMode === 'canvas' && styles.toggleButtonActive)} 
                title="Graph View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className={styles.headerActions}>
             <button onClick={onLayout} className={styles.layoutButton} title="Auto Layout">
               <Wand2 className="w-4 h-4" />Auto Layout
             </button>
            <button 
              onClick={() => setShowSuggestions(!showSuggestions)} 
              className={clsx(styles.suggestionsButton, showSuggestions && styles.suggestionsButtonActive)}
            >
              <Sparkles className="w-4 h-4" />
              {showSuggestions ? 'Hide' : 'Suggestions'}
            </button>
            <button 
              onClick={() => setIsRelModalOpen(true)} 
              className={styles.addButton}
            >
              <Plus className="w-4 h-4" />
              Add Relationship
            </button>
            <div className={styles.divider}></div>
            <button className={styles.saveButton}>
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        </header>

        <div className={styles.workspace}>
          <div className={styles.mainArea}>
            {viewMode === 'canvas' ? (
              <SchemaCanvas nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onEdgeClick={onEdgeClick} />
            ) : (
              <div className={styles.listViewContainer}>
                <SchemaListView tables={nodes} />
              </div>
            )}
          </div>

          <div className={clsx(styles.suggestionsPanel, !showSuggestions && styles.suggestionsPanelHidden)}>
            <div className={styles.suggestionsHeader}>
              <div className={styles.suggestionsTitle}>
                <Sparkles className="w-4 h-4" />
                <h3>Relationship Suggestions</h3>
              </div>
              <button onClick={() => setShowSuggestions(false)} className={styles.closeSuggestions}>
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className={styles.suggestionsList}>
              <div className={styles.suggestionsContent}>
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className={styles.suggestionCard}>
                    <div className={styles.suggestionHeader}>
                      <div className={styles.suggestionText}>
                        {suggestion.source} <span className={styles.suggestionArrow}>→</span> {suggestion.target}
                      </div>
                      <span className={clsx(styles.confidenceBadge, suggestion.confidence > 0.8 ? styles.confidenceHigh : styles.confidenceMed)}>
                        {Math.round(suggestion.confidence * 100)}%
                      </span>
                    </div>
                    {suggestion.warning && (
                      <div className={styles.warningBox}>
                        <AlertCircle className="w-3 h-3" />
                        {suggestion.warning}
                      </div>
                    )}
                    <div className={styles.suggestionActions}>
                      <button 
                        className={styles.confirmButton}
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        Confirm
                      </button>
                      <button 
                        className={styles.ignoreButton}
                        onClick={() => handleRejectSuggestion(suggestion)}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
                
                {suggestions.length === 0 && (
                  <div className={styles.emptySuggestions}>
                    No new suggestions
                  </div>
                )}
              </div>

              <Accordion title="Accepted" count={acceptedSuggestions.length} icon={CheckCircle2} defaultOpen={false}>
                {acceptedSuggestions.length > 0 ? (
                  acceptedSuggestions.map(s => <AcceptedRejectedItem key={s.id} item={s} status="accepted" />)
                ) : (
                  <div className={styles.emptyHistory}>No accepted items yet</div>
                )}
              </Accordion>

              <Accordion title="Rejected" count={rejectedSuggestions.length} icon={XCircle} defaultOpen={false}>
                {rejectedSuggestions.length > 0 ? (
                  rejectedSuggestions.map(s => <AcceptedRejectedItem key={s.id} item={s} status="rejected" />)
                ) : (
                  <div className={styles.emptyHistory}>No rejected items yet</div>
                )}
              </Accordion>
            </div>
          </div>
        </div>

      {isRelModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Relationship</h3>
              <button onClick={() => setIsRelModalOpen(false)} className={styles.closeButton}><X className="w-5 h-5" /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Source Table</label>
                  <select className={styles.select} value={newRel.sourceTable} onChange={(e) => setNewRel({...newRel, sourceTable: e.target.value})}>
                    <option value="">Select Table</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-6" />
                <div className={styles.formGroup}>
                  <label className={styles.label}>Target Table</label>
                  <select className={styles.select} value={newRel.targetTable} onChange={(e) => setNewRel({...newRel, targetTable: e.target.value})}>
                    <option value="">Select Table</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
              </div>
              
              {newRel.sourceTable && newRel.targetTable && (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Source Column</label>
                    <select className={styles.select} value={newRel.sourceCol} onChange={(e) => setNewRel({...newRel, sourceCol: e.target.value})}>
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.sourceTable)?.data.columns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div className="w-4"></div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Target Column</label>
                    <select className={styles.select} value={newRel.targetCol} onChange={(e) => setNewRel({...newRel, targetCol: e.target.value})}>
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.targetTable)?.data.columns.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                </div>
              )}
              
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Cardinality</label>
                    <select className={styles.select} value={newRel.cardinality} onChange={(e) => setNewRel({...newRel, cardinality: e.target.value})}>
                      <option value="1:1">1:1 (One to One)</option>
                      <option value="1:N">1:N (One to Many)</option>
                      <option value="N:N">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Join Type</label>
                    <select className={styles.select} value={newRel.joinType} onChange={(e) => setNewRel({...newRel, joinType: e.target.value})}>
                      <option value="FULL">FULL OUTER JOIN</option>
                      <option value="INNER">INNER JOIN</option>
                      <option value="LEFT">LEFT JOIN</option>
                      <option value="RIGHT">RIGHT JOIN</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setIsRelModalOpen(false)} className={styles.cancelButton}>Cancel</button>
              <button onClick={handleManualCreate} disabled={!newRel.sourceTable || !newRel.targetTable || !newRel.sourceCol || !newRel.targetCol} className={styles.createButton}>Create Relationship</button>
            </div>
          </div>
        </div>
      )}

      {editingEdge && (() => {
        const getColumnInfo = (tableId, handleId) => {
          if (!handleId) return { table: tableId, column: '?' };
          const colId = handleId.replace(/-right$/, '').replace(/-left$/, '');
          const table = nodes.find(n => n.id === tableId);
          const column = table?.data.columns.find((c) => c.id === colId);
          return { 
            table: table?.data.label || tableId, 
            column: column?.name || colId 
          };
        };
        
        const sourceInfo = getColumnInfo(editingEdge.source, editingEdge.sourceHandle);
        const targetInfo = getColumnInfo(editingEdge.target, editingEdge.targetHandle);
        
        return (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>Edit Relationship</h3>
                <button onClick={() => setEditingEdge(null)} className={styles.closeButton}><X className="w-5 h-5" /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.connectionInfoBox}>
                  <div className={styles.relationRow}>
                    <span className={styles.columnRef}>{sourceInfo.table}<span className={styles.columnDot}>.</span>{sourceInfo.column}</span>
                    <ArrowRight className={styles.relationArrow} />
                    <span className={styles.columnRef}>{targetInfo.table}<span className={styles.columnDot}>.</span>{targetInfo.column}</span>
                  </div>
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
                
                {editingEdge.data?.isSuggestion && (
                  <div className={styles.crossDbBadge}>
                    <AlertCircle className="w-3.5 h-3.5" />
                    This is a suggested relationship (not yet confirmed)
                  </div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this relationship?')) {
                      setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
                      setEditingEdge(null);
                    }
                  }} 
                  className={styles.deleteEdgeButton}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className={styles.footerButtons}>
                  <button onClick={() => setEditingEdge(null)} className={styles.cancelButton}>Cancel</button>
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

      {activeImageModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Configure Image Storage</h3>
              <button onClick={() => setActiveImageModal(null)} className={styles.closeButton}><X className="w-5 h-5" /></button>
            </div>
            <div className={styles.modalBody}>
              <p className={styles.description}>
                Select a column in <strong>{nodes.find(n => n.id === activeImageModal)?.data.label}</strong> that contains the file path for images.
              </p>
              <div className={styles.formGroup}>
                <label className={styles.label}>Image Path Column</label>
                <select className={styles.select}>
                  <option value="">Select Column</option>
                  {nodes.find(n => n.id === activeImageModal)?.data.columns.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Storage Provider</label>
                <select className={styles.select}>
                  <option value="s3">Amazon S3 (Main)</option>
                  <option value="minio">MinIO (Backup)</option>
                </select>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button onClick={() => setActiveImageModal(null)} className={styles.cancelButton}>Cancel</button>
              <button onClick={() => setActiveImageModal(null)} className={styles.confirmButton}>Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {activeSampleModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '42rem'}}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Data Sample: {nodes.find(n => n.id === activeSampleModal)?.data.label}
              </h3>
              <button onClick={() => setActiveSampleModal(null)} className={styles.closeButton}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px]">
              <table className={styles.dataSampleTable}>
                <thead className={styles.sampleThead}>
                  <tr>
                    {nodes.find(n => n.id === activeSampleModal)?.data.columns.slice(0, 5).map((col) => (
                      <th key={col.id} className={styles.sampleTh}>{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={styles.sampleTbody}>
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className={styles.sampleTr}>
                      {nodes.find(n => n.id === activeSampleModal)?.data.columns.slice(0, 5).map((col) => (
                        <td key={col.id} className={styles.sampleTd}>
                          {col.isPk ? row : col.type === 'INT' ? Math.floor(Math.random() * 100) : `Sample ${col.name} ${row}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.modalFooter} style={{backgroundColor: '#f9fafb', borderBottomLeftRadius: '0.75rem', borderBottomRightRadius: '0.75rem'}}>
              <span className={styles.description} style={{fontSize: '0.75rem'}}>Showing first 5 rows</span>
              <button onClick={() => setActiveSampleModal(null)} className={styles.cancelButton}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemaEditorPage() {
  return (
    <DashboardLayout>
      <ReactFlowProvider>
        <SchemaEditorContent />
      </ReactFlowProvider>
    </DashboardLayout>
  );
}