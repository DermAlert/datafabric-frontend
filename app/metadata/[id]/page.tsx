'use client';

import React, { useState, useCallback, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import SchemaCanvas from '@/components/metadata/SchemaCanvas';
import SchemaListView from '@/components/metadata/SchemaListView';
import { 
  LayoutGrid, 
  List, 
  Save, 
  Settings, 
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
  Link as LinkIcon,
  Trash2
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

// ... (INITIAL_TABLES and INITIAL_EDGES remain the same, simplified here for brevity but kept in actual file)
const INITIAL_TABLES = [
  // --- Left Column (Patient & Insurance) ---
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

const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
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

// --- Helper Components for Sidebar ---

const Accordion = ({ 
  title, 
  children, 
  defaultOpen = false,
  count,
  icon: Icon
}: { 
  title: string, 
  children: React.ReactNode, 
  defaultOpen?: boolean,
  count?: number,
  icon?: any
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-t border-gray-200 dark:border-zinc-800">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-gray-500" />}
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{title}</span>
          {count !== undefined && (
            <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          )}
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 space-y-3 bg-gray-50/30 dark:bg-zinc-900/30">
          {children}
        </div>
      )}
    </div>
  );
};

const AcceptedRejectedItem = ({ item, status }: { item: any, status: 'accepted' | 'rejected' }) => (
  <div className="flex items-start justify-between p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
    <div className="flex-1 mr-2 break-all font-mono text-gray-600 dark:text-gray-300">
      {item.source} → {item.target}
    </div>
    <div className="flex items-center gap-1.5 shrink-0">
      {status === 'accepted' ? (
        <span className="flex items-center gap-1 text-green-600 font-medium">
          <CheckCircle2 className="w-3 h-3" />
          Accepted
        </span>
      ) : (
        <span className="flex items-center gap-1 text-red-600 font-medium">
          <XCircle className="w-3 h-3" />
          Rejected
        </span>
      )}
    </div>
  </div>
);

// --- Main Component ---

function SchemaEditorContent() {
  // ... (State setup)
  const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState<string | null>(null);
  const [activeSampleModal, setActiveSampleModal] = useState<string | null>(null);
  
  const [nodes, setNodes, onNodesChange] = useNodesState(INITIAL_TABLES);
  const [edges, setEdges, onEdgesChange] = useEdgesState(INITIAL_EDGES);
  const [newRel, setNewRel] = useState({ sourceTable: '', sourceCol: '', targetTable: '', targetCol: '', cardinality: '1:N', joinType: 'FULL' });
  const [editingEdge, setEditingEdge] = useState<Edge | null>(null);

  // Suggestions State
  const [suggestions, setSuggestions] = useState(INITIAL_SUGGESTIONS);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<any[]>([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState<any[]>([]);

  // ... (Callbacks remain the same)
  const handleToggleActive = useCallback((id: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, active: !node.data.active }, active: !node.active };
      }
      return node;
    }));
  }, [setNodes]);

  const handleToggleColumnActive = useCallback((tableId: string, columnId: string) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === tableId) {
        const newColumns = node.data.columns.map((col: any) => {
          if (col.id === columnId) return { ...col, active: !col.active };
          return col;
        });
        return { ...node, data: { ...node.data, columns: newColumns }, columns: newColumns };
      }
      return node;
    }));
  }, [setNodes]);

  const handleLinkImage = useCallback((id: string) => setActiveImageModal(id), []);
  const handleViewSample = useCallback((id: string) => setActiveSampleModal(id), []);

  useEffect(() => {
    setNodes((nds) => nds.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onToggleActive: handleToggleActive,
        onToggleColumnActive: (colId: string) => handleToggleColumnActive(node.id, colId),
        onLinkImage: handleLinkImage,
        onViewSample: handleViewSample,
      }
    })));
  }, [setNodes, handleToggleActive, handleToggleColumnActive, handleLinkImage, handleViewSample]);

  const onConnect = useCallback((params: Connection) => {
    setEdges((eds) => addEdge({ 
      ...params, 
      type: 'smoothstep', 
      animated: false, 
      style: { stroke: '#2563eb', strokeWidth: 2 }, 
      markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' },
      data: { cardinality: '1:N', joinType: 'FULL' }
    }, eds));
  }, [setEdges]);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setEditingEdge(edge);
  }, []);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
  }, [nodes, edges, setNodes, setEdges]);

  const handleManualCreate = () => {
    if (!newRel.sourceTable || !newRel.targetTable) return;
    const newEdge: Edge = {
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

  // Suggestion Handlers
  const handleAcceptSuggestion = (suggestion: any) => {
    // Logic to add edge would go here (already partly in mock, but ensuring state update)
    // For demo, we just move it to accepted list
    setAcceptedSuggestions([...acceptedSuggestions, suggestion]);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  const handleRejectSuggestion = (suggestion: any) => {
    setRejectedSuggestions([...rejectedSuggestions, suggestion]);
    setSuggestions(suggestions.filter(s => s.id !== suggestion.id));
  };

  // Populate columns for List View compatibility
  INITIAL_TABLES.forEach(t => t.columns = t.data.columns as any);

  return (
    <div className="h-screen flex flex-col">
        {/* Header - Same as before */}
        <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 px-6 py-3 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-gray-900 dark:text-white">Schema Editor</h1>
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
              <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="List View"><List className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('canvas')} className={`p-1.5 rounded-md transition-all ${viewMode === 'canvas' ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`} title="Graph View"><LayoutGrid className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={onLayout} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700" title="Auto Layout"><Wand2 className="w-4 h-4" />Auto Layout</button>
            <button onClick={() => setShowSuggestions(!showSuggestions)} className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border ${showSuggestions ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' : 'bg-white text-gray-700 border-gray-200 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-700'}`}><Sparkles className="w-4 h-4" />{showSuggestions ? 'Hide' : 'Suggestions'}</button>
            <button onClick={() => setIsRelModalOpen(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Plus className="w-4 h-4" />Add Relationship</button>
            <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1"></div>
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><Save className="w-4 h-4" />Save</button>
          </div>
        </header>

        {/* Main Workspace */}
        <div className="flex-1 relative overflow-hidden flex">
          <div className="flex-1 h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
            {viewMode === 'canvas' ? (
              <SchemaCanvas nodes={nodes} edges={edges} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} onEdgeClick={onEdgeClick} />
            ) : (
              <div className="p-8 max-w-5xl mx-auto overflow-auto h-full">
                <SchemaListView tables={nodes} />
              </div>
            )}
          </div>

          {/* Suggestions Panel */}
          <div className={`bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col z-20 transition-all duration-300 ease-in-out ${showSuggestions ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'}`}>
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 min-w-[320px] shrink-0">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Relationship Suggestions</h3>
              </div>
              <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-4 h-4" /></button>
            </div>
            
            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto min-w-[320px]">
              <div className="p-4 space-y-4">
                {suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all pr-2">
                        {suggestion.source} <span className="text-gray-400 mx-1">→</span> {suggestion.target}
                      </div>
                      <span className={clsx("text-[10px] font-bold px-1.5 py-0.5 rounded", suggestion.confidence > 0.8 ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20")}>{Math.round(suggestion.confidence * 100)}%</span>
                    </div>
                    {suggestion.warning && (<div className="flex items-center gap-1.5 text-[10px] text-amber-600 mb-2"><AlertCircle className="w-3 h-3" />{suggestion.warning}</div>)}
                    <div className="flex gap-2 mt-3">
                      <button 
                        className="flex-1 px-2 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        onClick={() => handleAcceptSuggestion(suggestion)}
                      >
                        Confirm
                      </button>
                      <button 
                        className="flex-1 px-2 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-zinc-700 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors"
                        onClick={() => handleRejectSuggestion(suggestion)}
                      >
                        Ignore
                      </button>
                    </div>
                  </div>
                ))}
                
                {suggestions.length === 0 && (
                  <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                    No new suggestions
                  </div>
                )}
              </div>

              {/* Accordions for History */}
              <Accordion title="Accepted" count={acceptedSuggestions.length} icon={CheckCircle2} defaultOpen={false}>
                {acceptedSuggestions.length > 0 ? (
                  acceptedSuggestions.map(s => <AcceptedRejectedItem key={s.id} item={s} status="accepted" />)
                ) : (
                  <div className="text-xs text-gray-400 text-center py-2">No accepted items yet</div>
                )}
              </Accordion>

              <Accordion title="Rejected" count={rejectedSuggestions.length} icon={XCircle} defaultOpen={false}>
                {rejectedSuggestions.length > 0 ? (
                  rejectedSuggestions.map(s => <AcceptedRejectedItem key={s.id} item={s} status="rejected" />)
                ) : (
                  <div className="text-xs text-gray-400 text-center py-2">No rejected items yet</div>
                )}
              </Accordion>
            </div>
          </div>
        </div>

      {/* Manual Relationship Modal */}
      {isRelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-lg w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white">Add Relationship</h3>
              <button onClick={() => setIsRelModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Tables Selection */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Table</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.sourceTable} onChange={(e) => setNewRel({...newRel, sourceTable: e.target.value})}>
                    <option value="">Select Table</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-6" />
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Table</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.targetTable} onChange={(e) => setNewRel({...newRel, targetTable: e.target.value})}>
                    <option value="">Select Table</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
              </div>
              
              {/* Columns Selection */}
              {newRel.sourceTable && newRel.targetTable && (
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Column</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.sourceCol} onChange={(e) => setNewRel({...newRel, sourceCol: e.target.value})}>
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.sourceTable)?.data.columns.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                  <div className="w-4"></div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Column</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.targetCol} onChange={(e) => setNewRel({...newRel, targetCol: e.target.value})}>
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.targetTable)?.data.columns.map((c: any) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* Cardinality & Join Type */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cardinality</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.cardinality} onChange={(e) => setNewRel({...newRel, cardinality: e.target.value})}>
                      <option value="1:1">1:1 (One to One)</option>
                      <option value="1:N">1:N (One to Many)</option>
                      <option value="N:N">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Type</label>
                    <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" value={newRel.joinType} onChange={(e) => setNewRel({...newRel, joinType: e.target.value})}>
                      <option value="FULL">FULL OUTER JOIN</option>
                      <option value="INNER">INNER JOIN</option>
                      <option value="LEFT">LEFT JOIN</option>
                      <option value="RIGHT">RIGHT JOIN</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setIsRelModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancel</button>
              <button onClick={handleManualCreate} disabled={!newRel.sourceTable || !newRel.targetTable || !newRel.sourceCol || !newRel.targetCol} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed">Create Relationship</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Relationship Modal */}
      {editingEdge && (() => {
        // Helper to get column name from handle ID
        const getColumnInfo = (tableId: string, handleId: string | null | undefined) => {
          if (!handleId) return { table: tableId, column: '?' };
          const colId = handleId.replace(/-right$/, '').replace(/-left$/, '');
          const table = nodes.find(n => n.id === tableId);
          const column = table?.data.columns.find((c: any) => c.id === colId);
          return { 
            table: table?.data.label || tableId, 
            column: column?.name || colId 
          };
        };
        
        const sourceInfo = getColumnInfo(editingEdge.source, editingEdge.sourceHandle);
        const targetInfo = getColumnInfo(editingEdge.target, editingEdge.targetHandle);
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  Edit Relationship
                </h3>
                <button onClick={() => setEditingEdge(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 space-y-5">
                {/* Info - table.column format */}
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <span className="font-mono text-blue-600 dark:text-blue-400">{sourceInfo.table}<span className="text-gray-400">.</span>{sourceInfo.column}</span>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono text-blue-600 dark:text-blue-400">{targetInfo.table}<span className="text-gray-400">.</span>{targetInfo.column}</span>
                  </div>
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
                
                {/* Suggestion Badge */}
                {editingEdge.data?.isSuggestion && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    This is a suggested relationship (not yet confirmed)
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between">
                <button 
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this relationship?')) {
                      setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
                      setEditingEdge(null);
                    }
                  }} 
                  className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setEditingEdge(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancel</button>
                  <button 
                    onClick={() => {
                      const cardinality = (document.getElementById('edit-cardinality') as HTMLSelectElement)?.value || '1:N';
                      const joinType = (document.getElementById('edit-jointype') as HTMLSelectElement)?.value || 'FULL';
                      handleUpdateEdge(cardinality, joinType);
                    }} 
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Image Storage Modal */}
      {activeImageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-purple-600" />
                Configure Image Storage
              </h3>
              <button onClick={() => setActiveImageModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a column in <strong>{nodes.find(n => n.id === activeImageModal)?.data.label}</strong> that contains the file path for images.
              </p>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Image Path Column</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm">
                  <option value="">Select Column</option>
                  {nodes.find(n => n.id === activeImageModal)?.data.columns.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Storage Provider</label>
                <select className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm">
                  <option value="s3">Amazon S3 (Main)</option>
                  <option value="minio">MinIO (Backup)</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
              <button onClick={() => setActiveImageModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg">Cancel</button>
              <button onClick={() => setActiveImageModal(null)} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg">Save Configuration</button>
            </div>
          </div>
        </div>
      )}

      {/* Data Sample Modal */}
      {activeSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Data Sample: {nodes.find(n => n.id === activeSampleModal)?.data.label}
              </h3>
              <button onClick={() => setActiveSampleModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px]">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0">
                  <tr>
                    {nodes.find(n => n.id === activeSampleModal)?.data.columns.slice(0, 5).map((col: any) => (
                      <th key={col.id} className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{col.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {[1, 2, 3, 4, 5].map((row) => (
                    <tr key={row} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                      {nodes.find(n => n.id === activeSampleModal)?.data.columns.slice(0, 5).map((col: any) => (
                        <td key={col.id} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {col.isPk ? row : col.type === 'INT' ? Math.floor(Math.random() * 100) : `Sample ${col.name} ${row}`}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 rounded-b-xl">
              <span className="text-xs text-gray-500">Showing first 5 rows</span>
              <button onClick={() => setActiveSampleModal(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">Close</button>
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
