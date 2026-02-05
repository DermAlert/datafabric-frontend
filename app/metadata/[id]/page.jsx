'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import SchemaCanvas from '@/components/metadata/SchemaCanvas';
import SchemaListView from '@/components/metadata/SchemaListView';
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
  Link as LinkIcon,
  Trash2,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Layers,
  Table as TableIcon
} from 'lucide-react';
import { 
  MarkerType, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  ReactFlowProvider
} from 'reactflow';
import { clsx } from 'clsx';
import { metadataService, connectionService, imagePathService, relationshipsService } from '@/lib/api';
import { Select } from '@/components/ui';
import Link from 'next/link';
import { getLayoutedElements } from '@/components/canvas';

// Helper Components
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

// Schema selector component - shows dropdown only if multiple schemas
const SchemaSelector = ({
  schemas,
  selectedSchemaId,
  onSelect,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
        <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading schema...</span>
      </div>
    );
  }

  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);

  // If there's only one schema, show it as a label without dropdown
  if (schemas.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-zinc-800 rounded-lg">
        <Layers className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedSchema?.schema_name || 'No schema'}
        </span>
      </div>
    );
  }

  // Multiple schemas - show dropdown
  return (
    <div className="flex items-center gap-2">
      <Layers className="w-4 h-4 text-gray-500" />
      <select
        value={selectedSchemaId || ''}
        onChange={(e) => onSelect(Number(e.target.value))}
        className="px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
      >
        <option value="">Select Schema</option>
        {schemas.map(schema => (
          <option key={schema.id} value={schema.id}>
            {schema.schema_name}
          </option>
        ))}
      </select>
    </div>
  );
};

// Main Component
function SchemaEditorContent() {
  const params = useParams();
  const router = useRouter();
  const connectionId = Number(params.id);

  // Data state
  const [connection, setConnection] = useState(null);
  const [connectionType, setConnectionType] = useState(null);
  const [schemas, setSchemas] = useState([]);
  const [selectedSchemaId, setSelectedSchemaId] = useState(null);
  const [tables, setTables] = useState([]);
  const [tableDetails, setTableDetails] = useState({});

  // Loading states
  const [isLoadingConnection, setIsLoadingConnection] = useState(true);
  const [isLoadingSchemas, setIsLoadingSchemas] = useState(true);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [error, setError] = useState(null);

  // UI state
  const [viewMode, setViewMode] = useState('canvas');
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [isRelModalOpen, setIsRelModalOpen] = useState(false);
  const [activeImageModal, setActiveImageModal] = useState(null);
  const [activeSampleModal, setActiveSampleModal] = useState(null);
  const [sampleData, setSampleData] = useState(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  
  // Distinct values modal state
  const [activeDistinctModal, setActiveDistinctModal] = useState(null);
  const [distinctData, setDistinctData] = useState(null);
  const [isLoadingDistinct, setIsLoadingDistinct] = useState(false);
  
  // Image path modal state
  const [storageConnections, setStorageConnections] = useState([]);
  // Map of column ID -> connection ID for image path columns
  const [imagePathColumns, setImagePathColumns] = useState(new Map());
  const [imagePathForm, setImagePathForm] = useState({ 
    selectedColumnId: '', 
    selectedConnectionId: null
  });
  const [isSavingImagePath, setIsSavingImagePath] = useState(false);
  const [imagePathError, setImagePathError] = useState(null);
  
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [layoutVersion, setLayoutVersion] = useState(0); // Used to trigger recalculation after layout
  const [newRel, setNewRel] = useState({ 
    sourceTable: '', 
    sourceCol: '', 
    targetTable: '', 
    targetCol: '', 
    cardinality: 'one_to_many', 
    joinType: 'full' 
  });
  const [editingEdge, setEditingEdge] = useState(null);

  // Relationships State
  const [relationships, setRelationships] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState([]);
  const [rejectedSuggestions, setRejectedSuggestions] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [initialLayoutDone, setInitialLayoutDone] = useState(false);
  const [dataFullyLoaded, setDataFullyLoaded] = useState(false);
  const [highlightedColumns, setHighlightedColumns] = useState([]);
  const [clickedColumn, setClickedColumn] = useState(null);

  // Fetch connection data
  useEffect(() => {
    const fetchConnection = async () => {
      setIsLoadingConnection(true);
      setError(null);
      try {
        const [conn, types] = await Promise.all([
          connectionService.get(connectionId),
          connectionService.getAll()
        ]);
        setConnection(conn);
        const type = types.find(t => t.id === conn.connection_type_id);
        setConnectionType(type || null);
      } catch (err) {
        console.error('Failed to fetch connection:', err);
        setError('Failed to load connection details');
      } finally {
        setIsLoadingConnection(false);
      }
    };

    if (connectionId) {
      fetchConnection();
    }
  }, [connectionId]);

  // Helper function to get the target schema name based on connection type
  // This generalizes schema resolution for different database types
  const getTargetSchemaName = useCallback((conn, connType) => {
    const params = conn?.connection_params;
    if (!params) return null;
    
    // Check if there's an explicit schema configured
    if (params.schema) {
      return params.schema;
    }
    
    // For PostgreSQL-like databases, default to 'public' schema
    // PostgreSQL has separate concepts of database and schema
    const postgresLikeTypes = ['postgresql', 'postgres'];
    if (connType && postgresLikeTypes.some(t => 
      connType.name.toLowerCase().includes(t)
    )) {
      return 'public';
    }
    
    // For other databases (MySQL, MongoDB, etc.), database = schema
    return params.database;
  }, []);

  // Fetch schemas - filter to only show the target schema for the connection
  useEffect(() => {
    const fetchSchemas = async () => {
      if (!connection) return; // Wait for connection to be loaded
      
      setIsLoadingSchemas(true);
      try {
        const schemaList = await metadataService.listSchemas(connectionId);
        
        // Get the target schema name based on connection type
        const targetSchemaName = getTargetSchemaName(connection, connectionType);
        
        // Filter schemas to only include the target schema
        let filteredSchemas = schemaList;
        if (targetSchemaName) {
          filteredSchemas = schemaList.filter(
            schema => schema.schema_name.toLowerCase() === targetSchemaName.toLowerCase()
          );
          // If no match found, fallback to all schemas (shouldn't happen normally)
          if (filteredSchemas.length === 0) {
            console.warn(`Target schema "${targetSchemaName}" not found in schemas, showing all`);
            filteredSchemas = schemaList;
          }
        }
        
        setSchemas(filteredSchemas);
        // Auto-select the schema (should be only one now)
        if (filteredSchemas.length > 0 && !selectedSchemaId) {
          setSelectedSchemaId(filteredSchemas[0].id);
        }
      } catch (err) {
        console.error('Failed to fetch schemas:', err);
        setError('Failed to load schemas');
      } finally {
        setIsLoadingSchemas(false);
      }
    };

    if (connectionId && connection) {
      fetchSchemas();
    }
  }, [connectionId, connection, connectionType, getTargetSchemaName]);

  // Fetch tables and related data
  const refreshData = useCallback(async (isSilent = false) => {
    if (!selectedSchemaId) return;
    
    if (!isSilent) setIsLoadingTables(true);
    try {
      const tableList = await metadataService.listTables(selectedSchemaId);
      setTables(tableList);
      
      // Fetch details for each table (including columns)
      const detailsPromises = tableList.map(table => 
        metadataService.getTableDetails(table.id)
      );
      const details = await Promise.all(detailsPromises);
      
      const detailsMap = {};
      details.forEach(detail => {
        detailsMap[detail.id] = detail;
      });
      setTableDetails(detailsMap);

      // Fetch relationships and suggestions
      try {
        const [rels, pending, accepted, rejected] = await Promise.all([
          relationshipsService.listForConnection(connectionId),
          relationshipsService.listSuggestions(connectionId, undefined, undefined, 'pending'),
          relationshipsService.listSuggestions(connectionId, undefined, undefined, 'accepted'),
          relationshipsService.listSuggestions(connectionId, undefined, undefined, 'rejected')
        ]);
        setRelationships(rels);
        setSuggestions(pending);
        setAcceptedSuggestions(accepted);
        setRejectedSuggestions(rejected);
      } catch (err) {
        console.error('Failed to fetch relationships:', err);
      }

      // Fetch image path columns for all tables
      const imagePathPromises = tableList.map(table =>
        imagePathService.listTableColumns(table.id, false).catch(() => [])
      );
      const imagePathResults = await Promise.all(imagePathPromises);
      
      // Collect all column IDs that are marked as image paths with their connection IDs
      const imagePathColumnMap = new Map();
      imagePathResults.forEach(columns => {
        columns.forEach(col => {
          if (col.is_image_path) {
            imagePathColumnMap.set(col.id, col.image_connection_id);
          }
        });
      });
      setImagePathColumns(imagePathColumnMap);
      
      // Mark data as fully loaded for initial layout
      setDataFullyLoaded(true);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      if (!isSilent) setError('Failed to load tables');
    } finally {
      if (!isSilent) setIsLoadingTables(false);
    }
  }, [selectedSchemaId, connectionId]);

  // Initial fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Reset layout flags when connection changes
  useEffect(() => {
    setInitialLayoutDone(false);
    setDataFullyLoaded(false);
  }, [connectionId]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => {
      refreshData(true);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshData]);

  // Fetch storage connections (Object Storage & Data Lake)
  useEffect(() => {
    const fetchStorageConnections = async () => {
      try {
        const allConnections = await connectionService.list();
        // Filter to only storage connections (content_type === 'image')
        const storage = allConnections.filter(c => c.content_type === 'image');
        setStorageConnections(storage);
      } catch (err) {
        console.error('Failed to fetch storage connections:', err);
      }
    };

    fetchStorageConnections();
  }, []);

  // Callbacks - defined before the useEffect that uses them
  const handleToggleActive = useCallback((id) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, active: !node.data.active } };
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
        return { ...node, data: { ...node.data, columns: newColumns } };
      }
      return node;
    }));
  }, [setNodes]);

  const handleLinkImage = useCallback((tableId, columnId) => {
    setActiveImageModal(tableId);
    
    // Check if the column already has an image path configured
    let preSelectedConnectionId = null;
    if (columnId) {
      // Extract numeric column ID from format "col_123"
      const numericColId = parseInt(columnId.replace('col_', ''), 10);
      if (!isNaN(numericColId) && imagePathColumns.has(numericColId)) {
        preSelectedConnectionId = imagePathColumns.get(numericColId) ?? null;
      }
    }
    
    // Pre-select column and connection if already configured
    setImagePathForm({
      selectedColumnId: columnId || '',
      selectedConnectionId: preSelectedConnectionId
    });
    setImagePathError(null);
  }, [imagePathColumns]);

  const handleSaveImagePath = useCallback(async () => {
    if (!activeImageModal || !imagePathForm.selectedColumnId) {
      setImagePathError('Please select a column');
      return;
    }

    if (!imagePathForm.selectedConnectionId) {
      setImagePathError('Please select a storage provider');
      return;
    }

    // Extract column ID from format "col_123" -> 123
    const columnId = parseInt(imagePathForm.selectedColumnId.replace('col_', ''), 10);
    if (isNaN(columnId)) {
      setImagePathError('Invalid column selected');
      return;
    }

    setIsSavingImagePath(true);
    setImagePathError(null);

    try {
      await imagePathService.updateColumn(columnId, {
        is_image_path: true,
        image_connection_id: imagePathForm.selectedConnectionId
      });

      // Update the imagePathColumns Map
      setImagePathColumns(prev => new Map([...prev, [columnId, imagePathForm.selectedConnectionId]]));

      // Update the node to show the column as image path
      setNodes((nds) => nds.map((node) => {
        if (node.id === activeImageModal) {
          const newColumns = node.data.columns.map((col) => {
            if (col.id === imagePathForm.selectedColumnId) {
              return { ...col, isImagePath: true };
            }
            return col;
          });
          return { ...node, data: { ...node.data, columns: newColumns } };
        }
        return node;
      }));

      setActiveImageModal(null);
    } catch (err) {
      console.error('Failed to save image path:', err);
      const error = err;
      setImagePathError(error.message || 'Failed to save image path configuration');
    } finally {
      setIsSavingImagePath(false);
    }
  }, [activeImageModal, imagePathForm, setNodes]);
  
  const handleViewSample = useCallback(async (id) => {
    setActiveSampleModal(id);
    setSampleData(null);
    setIsLoadingSample(true);
    
    // Extract table ID from node ID (format: "table_6" -> 6)
    const tableId = parseInt(id.replace('table_', ''), 10);
    
    try {
      const data = await metadataService.getTableSample(tableId, 10);
      setSampleData(data);
    } catch (err) {
      console.error('Failed to fetch sample data:', err);
    } finally {
      setIsLoadingSample(false);
    }
  }, []);

  const handleViewDistinct = useCallback(async (colId, colName) => {
    // Extract column ID from col ID (format: "col_33" -> 33)
    const columnId = parseInt(colId.replace('col_', ''), 10);
    
    if (isNaN(columnId)) {
      console.error('Invalid column ID:', colId);
      return;
    }

    // Set the column name immediately (passed from the component)
    setActiveDistinctModal({ columnId: colId, columnName: colName });
    setDistinctData(null);
    setIsLoadingDistinct(true);
    
    try {
      const data = await metadataService.getDistinctValues(columnId, 10);
      setDistinctData(data);
    } catch (err) {
      console.error('Failed to fetch distinct values:', err);
    } finally {
      setIsLoadingDistinct(false);
    }
  }, []);

  // Clear highlights on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setHighlightedColumns([]);
        setClickedColumn(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle column click to highlight related columns
  const handleColumnClick = useCallback((colId, tableId) => {
    // If clicking the same column, toggle off
    if (clickedColumn === colId) {
      setHighlightedColumns([]);
      setClickedColumn(null);
      return;
    }

    // Find all relationships and suggestions involving this column
    const relatedColumns = [colId];
    
    // Check confirmed relationships
    relationships.forEach(rel => {
      const leftColId = `col_${rel.left_column?.column_id}`;
      const rightColId = `col_${rel.right_column?.column_id}`;
      
      if (leftColId === colId) {
        relatedColumns.push(rightColId);
      } else if (rightColId === colId) {
        relatedColumns.push(leftColId);
      }
    });

    // Check suggestions
    suggestions.forEach(sug => {
      const leftColId = `col_${sug.left_column?.column_id}`;
      const rightColId = `col_${sug.right_column?.column_id}`;
      
      if (leftColId === colId) {
        relatedColumns.push(rightColId);
      } else if (rightColId === colId) {
        relatedColumns.push(leftColId);
      }
    });

    // Remove duplicates and set highlighted columns
    setHighlightedColumns([...new Set(relatedColumns)]);
    setClickedColumn(colId);
  }, [clickedColumn, relationships, suggestions]);

  // Convert tables to React Flow nodes
  useEffect(() => {
    if (tables.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const newNodes = tables.map((table, index) => {
      const details = tableDetails[table.id];
      const nodeId = `table_${table.id}`;
      const columns = (details?.columns || []).map(col => ({
        id: `col_${col.id}`,
        name: col.column_name,
        type: col.data_type.toUpperCase().split('(')[0], // Simplify type display
        isPk: col.is_primary_key,
        isFk: col.is_foreign_key,
        active: true,
        isImagePath: imagePathColumns.has(col.id),
        originalColumn: col
      }));

      return {
        id: nodeId,
        type: 'table',
        position: { x: (index % 3) * 350, y: Math.floor(index / 3) * 300 },
        data: {
          label: table.table_name,
          active: true,
          columns,
          schemaName: details?.schema_name || '',
          rowCount: table.estimated_row_count,
          // Attach callbacks directly when creating nodes
          onToggleActive: handleToggleActive,
          onToggleColumnActive: (colId) => handleToggleColumnActive(nodeId, colId),
          onLinkImage: handleLinkImage,
          onViewSample: handleViewSample,
          onViewDistinct: handleViewDistinct,
          onColumnClick: handleColumnClick,
          highlightedColumns: highlightedColumns,
        }
      };
    });

    // Generate edges from Relationships (Blue)
    const newEdges = [];
    
    // Add confirmed relationships
    relationships.forEach(rel => {
      if (!rel.left_column || !rel.right_column) return;
      // Find source and target tables to ensure they exist in current view
      const sourceTable = tables.find(t => t.id === rel.left_column.table_id);
      const targetTable = tables.find(t => t.id === rel.right_column.table_id);

      if (sourceTable && targetTable) {
        const leftColId = `col_${rel.left_column.column_id}`;
        const rightColId = `col_${rel.right_column.column_id}`;
        // Only highlight if the CLICKED column is an endpoint of this edge
        const isHighlighted = clickedColumn === leftColId || clickedColumn === rightColId;
        
        newEdges.push({
          id: `rel_${rel.id}`,
          source: `table_${rel.left_column.table_id}`,
          target: `table_${rel.right_column.table_id}`,
          sourceHandle: `${leftColId}-right`,
          targetHandle: `${rightColId}-left`,
          type: 'smoothstep',
          animated: isHighlighted,
          style: { 
            stroke: isHighlighted ? '#3b82f6' : '#2563eb', 
            strokeWidth: isHighlighted ? 3 : 2,
            filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.5))' : undefined
          },
          markerEnd: { type: MarkerType.ArrowClosed, color: isHighlighted ? '#3b82f6' : '#2563eb' },
          data: { 
            cardinality: rel.cardinality || 'one_to_many', 
            joinType: rel.default_join_type || 'full',
            isVerified: rel.is_verified,
            relationshipId: rel.id
          }
        });
      }
    });

    // Add suggestions (Gray)
    suggestions.forEach(suggestion => {
      if (!suggestion.left_column || !suggestion.right_column) return;
      const sourceTable = tables.find(t => t.id === suggestion.left_column.table_id);
      const targetTable = tables.find(t => t.id === suggestion.right_column.table_id);

      if (sourceTable && targetTable) {
        const leftColId = `col_${suggestion.left_column.column_id}`;
        const rightColId = `col_${suggestion.right_column.column_id}`;
        // Only highlight if the CLICKED column is an endpoint of this edge
        const isHighlighted = clickedColumn === leftColId || clickedColumn === rightColId;
        
        newEdges.push({
          id: `sugg_${suggestion.id}`,
          source: `table_${suggestion.left_column.table_id}`,
          target: `table_${suggestion.right_column.table_id}`,
          sourceHandle: `${leftColId}-right`,
          targetHandle: `${rightColId}-left`,
          type: 'smoothstep',
          animated: true,
          style: { 
            stroke: isHighlighted ? '#60a5fa' : '#9ca3af', 
            strokeWidth: isHighlighted ? 3 : 2, 
            strokeDasharray: '5,5',
            filter: isHighlighted ? 'drop-shadow(0 0 4px rgba(96, 165, 250, 0.5))' : undefined
          },
          markerEnd: { 
            type: MarkerType.ArrowClosed, 
            color: isHighlighted ? '#60a5fa' : '#9ca3af' 
          },
          data: { 
            cardinality: 'one_to_many', // Default for suggestions
            joinType: 'full', // Default for suggestions
            isSuggestion: true,
            suggestionId: suggestion.id,
            confidence: suggestion.confidence_score
          }
        });
      }
    });

    // Apply layout logic: only auto-layout once when data is fully loaded
    if (dataFullyLoaded && !initialLayoutDone) {
      // First time with complete data: Apply DAGRE layout
      const { nodes: layoutedNodes } = getLayoutedElements(newNodes, newEdges);
      setNodes(layoutedNodes);
      setEdges(newEdges);
      setInitialLayoutDone(true);
      // Trigger fitView after layout
      setTimeout(() => setLayoutVersion(v => v + 1), 0);
    } else if (initialLayoutDone) {
      // After initial layout: preserve user positions, just update data
      setNodes((prevNodes) => {
        if (prevNodes.length > 0) {
          return newNodes.map(newNode => {
            const existing = prevNodes.find(n => n.id === newNode.id);
            return existing ? { ...newNode, position: existing.position } : newNode;
          });
        }
        return newNodes;
      });
      setEdges(newEdges);
    }
    // If !dataFullyLoaded, do nothing - wait for complete data

  }, [tables, tableDetails, relationships, suggestions, imagePathColumns, dataFullyLoaded, initialLayoutDone, highlightedColumns, clickedColumn, setNodes, setEdges, handleToggleActive, handleToggleColumnActive, handleLinkImage, handleViewSample, handleViewDistinct, handleColumnClick]);

  // Discover relationships
  const handleDiscover = async () => {
    setIsDiscovering(true);
    try {
      await relationshipsService.discover({
        connection_ids: [connectionId],
        auto_accept: false
      });
      // Refresh data to get new suggestions
      await refreshData(true);
    } catch (err) {
      console.error('Failed to discover relationships:', err);
    } finally {
      setIsDiscovering(false);
    }
  };

  const onConnect = useCallback(async (params) => {
    // Parse IDs
    // source: "table_1", sourceHandle: "col_1-right"
    const sourceTableId = parseInt(params.source.replace('table_', ''));
    const targetTableId = parseInt(params.target.replace('table_', ''));
    const sourceColId = parseInt(params.sourceHandle.replace('col_', '').replace('-right', ''));
    const targetColId = parseInt(params.targetHandle.replace('col_', '').replace('-left', ''));

    if (!sourceTableId || !targetTableId || !sourceColId || !targetColId) return;

    try {
      const newRel = await relationshipsService.create({
        left_table_id: sourceTableId,
        left_column_id: sourceColId,
        right_table_id: targetTableId,
        right_column_id: targetColId,
        cardinality: 'one_to_many', // Default
        default_join_type: 'full'
      });

      // Refresh data
      await refreshData(true);
    } catch (err) {
      console.error('Failed to create relationship:', err);
    }
  }, [setRelationships, refreshData]);

  const onEdgeClick = useCallback((_, edge) => {
    setEditingEdge(edge);
  }, []);

  const onLayout = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
    // Increment layoutVersion to trigger minZoom recalculation and fitView in SchemaCanvas
    setLayoutVersion(v => v + 1);
  }, [nodes, edges, setNodes, setEdges]);

  const handleManualCreate = async () => {
    if (!newRel.sourceTable || !newRel.targetTable) return;
    
    // Parse IDs
    const sourceTableId = parseInt(newRel.sourceTable.replace('table_', ''));
    const targetTableId = parseInt(newRel.targetTable.replace('table_', ''));
    const sourceColId = parseInt(newRel.sourceCol.replace('col_', ''));
    const targetColId = parseInt(newRel.targetCol.replace('col_', ''));

    if (!sourceTableId || !targetTableId || !sourceColId || !targetColId) return;

    try {
      await relationshipsService.create({
        left_table_id: sourceTableId,
        left_column_id: sourceColId,
        right_table_id: targetTableId,
        right_column_id: targetColId,
        cardinality: newRel.cardinality,
        default_join_type: newRel.joinType
      });

      await refreshData(true);
      setIsRelModalOpen(false);
      setNewRel({ sourceTable: '', sourceCol: '', targetTable: '', targetCol: '', cardinality: 'one_to_many', joinType: 'full' });
    } catch (err) {
      console.error('Failed to create relationship:', err);
    }
  };

  const handleDeleteEdge = async () => {
    if (!editingEdge) return;

    try {
      // Check if it's a suggestion
      if (editingEdge.data?.isSuggestion) {
        if (editingEdge.data.suggestionId) {
           try {
             await relationshipsService.rejectSuggestion(editingEdge.data.suggestionId);
           } catch (err) {
             // 502 errors from proxy usually mean the reject succeeded but response had issues
             // Empty object {} might be thrown if 204 No Content is mishandled
             if (err?.status === 502 || err?.status === 204 || (typeof err === 'object' && Object.keys(err || {}).length === 0)) {
               console.warn('Suppressing reject error, assuming success:', err);
             } else {
               throw err;
             }
           }
           await refreshData(true);
        }
      } else if (editingEdge.data?.relationshipId) {
        // It's a confirmed relationship
        try {
          await relationshipsService.remove(editingEdge.data.relationshipId);
        } catch (err) {
          // 502 errors from proxy usually mean the delete succeeded but response had issues
          // Empty object {} might be thrown if 204 No Content is mishandled by some client versions
          if (err?.status === 502 || err?.status === 204 || (typeof err === 'object' && Object.keys(err || {}).length === 0)) {
            console.warn('Suppressing delete error, assuming success:', err);
          } else {
            throw err;
          }
        }
        await refreshData(true);
      }
      
      // Update Graph
      setEdges((eds) => eds.filter((e) => e.id !== editingEdge.id));
      setEditingEdge(null);
      
    } catch (err) {
      console.error('Failed to delete relationship:', err);
    }
  };

  const handleUpdateEdge = async (cardinality, joinType) => {
    if (!editingEdge) return;
    
    try {
      if (editingEdge.data?.relationshipId && !editingEdge.data.isSuggestion) {
        await relationshipsService.update(editingEdge.data.relationshipId, {
          cardinality: cardinality,
          default_join_type: joinType
        });
        await refreshData(true);
      } else {
        // Fallback for visual-only updates (shouldn't be reachable for confirmed rels)
        setEdges((eds) => eds.map((e) => {
          if (e.id === editingEdge.id) {
            return { ...e, data: { ...e.data, cardinality, joinType } };
          }
          return e;
        }));
      }
      setEditingEdge(null);
    } catch (err) {
      console.error('Failed to update relationship:', err);
    }
  };

  // Suggestion Handlers
  const handleAcceptSuggestion = async (suggestion, options) => {
    try {
      await relationshipsService.acceptSuggestion(suggestion.id, options);
      await refreshData(true);
    } catch (err) {
      console.error('Failed to accept suggestion:', err);
    }
  };

  const handleRejectSuggestion = async (suggestion) => {
    try {
      await relationshipsService.rejectSuggestion(suggestion.id);
      await refreshData(true);
    } catch (err) {
      // 502 errors from proxy usually mean the reject succeeded but response had issues
      // Empty object {} might be thrown if 204 No Content is mishandled
      if (err?.status === 502 || err?.status === 204 || (typeof err === 'object' && Object.keys(err || {}).length === 0)) {
        console.warn('Suppressing reject error, assuming success:', err);
        await refreshData(true);
      } else {
        console.error('Failed to reject suggestion:', err);
      }
    }
  };

  const handleResetSuggestion = async (suggestion, type) => {
    try {
      await relationshipsService.resetSuggestion(suggestion.id);
      await refreshData(true);
    } catch (err) {
      console.error('Failed to reset suggestion:', err);
    }
  };

  // Helper to resolve table/column names for display
  const resolveNames = (rel) => {
    // API returns names in the object now
    let leftTable = rel.left_column?.table_name;
    let rightTable = rel.right_column?.table_name;
    let leftCol = rel.left_column?.column_name;
    let rightCol = rel.right_column?.column_name;
    
    // Debug if missing
    if (!leftTable || !leftCol) {
        console.warn('Missing names in relationship:', rel);
    }

    // Fallback: Try to find names from local state if missing in object
    if (!leftTable && rel.left_column?.table_id) {
       leftTable = tables.find(t => t.id === rel.left_column.table_id)?.table_name || '?';
    }
    if (!rightTable && rel.right_column?.table_id) {
       rightTable = tables.find(t => t.id === rel.right_column.table_id)?.table_name || '?';
    }
    
    // For columns, fallback to tableDetails
    if (!leftCol && rel.left_column?.table_id && rel.left_column?.column_id) {
        const details = tableDetails[rel.left_column.table_id];
        leftCol = details?.columns.find(c => c.id === rel.left_column.column_id)?.column_name || '?';
    }
    if (!rightCol && rel.right_column?.table_id && rel.right_column?.column_id) {
        const details = tableDetails[rel.right_column.table_id];
        rightCol = details?.columns.find(c => c.id === rel.right_column.column_id)?.column_name || '?';
    }
    
    return { leftTable, leftCol, rightTable, rightCol };
  };

  // Get selected schema name
  const selectedSchema = schemas.find(s => s.id === selectedSchemaId);

  // Loading state
  if (isLoadingConnection) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading connection...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !connection) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <Link 
            href="/connections"
            className="text-blue-600 hover:underline"
          >
            Back to Connections
          </Link>
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
            href="/connections"
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </Link>
          <div>
            <h1 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              {connection?.name || 'Schema Editor'}
              {connectionType && (
                <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                  {connectionType.name}
                </span>
              )}
            </h1>
            {selectedSchema && (
              <p className="text-xs text-gray-500">
                Schema: {selectedSchema.schema_name} • {tables.length} tables
              </p>
            )}
          </div>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2" />
          
          <SchemaSelector
            schemas={schemas}
            selectedSchemaId={selectedSchemaId}
            onSelect={setSelectedSchemaId}
            isLoading={isLoadingSchemas}
          />
          
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-2" />
          
          <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-1">
            <button 
              onClick={() => setViewMode('list')} 
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'list' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )} 
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('canvas')} 
              className={clsx(
                "p-1.5 rounded-md transition-all",
                viewMode === 'canvas' 
                  ? 'bg-white dark:bg-zinc-700 shadow-sm text-blue-600 dark:text-blue-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              )} 
              title="Graph View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={onLayout} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors border border-transparent hover:border-gray-200 dark:hover:border-zinc-700" 
            title="Auto Layout"
          >
            <Wand2 className="w-4 h-4" />
            Auto Layout
          </button>
          <button 
            onClick={() => setShowSuggestions(!showSuggestions)} 
            className={clsx(
              "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors border",
              showSuggestions 
                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' 
                : 'bg-white text-gray-700 border-gray-200 dark:bg-zinc-900 dark:text-gray-300 dark:border-zinc-700'
            )}
          >
            <Sparkles className="w-4 h-4" />
            {showSuggestions ? 'Hide' : 'Suggestions'}
          </button>
          <button 
            onClick={() => setIsRelModalOpen(true)} 
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Relationship
          </button>
          <div className="h-6 w-px bg-gray-200 dark:bg-zinc-800 mx-1" />
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 relative overflow-hidden flex">
        <div className="flex-1 h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden relative">
          {isLoadingTables ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-500">Loading tables...</p>
              </div>
            </div>
          ) : tables.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <TableIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No tables found</h3>
                <p className="text-gray-500 mb-4">
                  {selectedSchemaId 
                    ? 'This schema has no tables. Try syncing the connection.'
                    : 'Select a schema to view its tables.'}
                </p>
                {selectedSchemaId && (
                  <Link
                    href="/connections"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Go to Connections
                  </Link>
                )}
              </div>
            </div>
          ) : viewMode === 'canvas' ? (
            <SchemaCanvas 
              nodes={nodes} 
              edges={edges} 
              onNodesChange={onNodesChange} 
              onEdgesChange={onEdgesChange} 
              onConnect={onConnect} 
              onEdgeClick={onEdgeClick}
              onPaneClick={() => { setHighlightedColumns([]); setClickedColumn(null); }}
              layoutVersion={layoutVersion}
            />
          ) : (
            <div className="h-full overflow-y-auto">
              <div className="p-8 max-w-5xl mx-auto">
                <SchemaListView tables={nodes} />
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Panel */}
        <div className={clsx(
          "bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-xl flex flex-col z-20 transition-all duration-300 ease-in-out",
          showSuggestions ? 'w-80 translate-x-0' : 'w-0 translate-x-full opacity-0'
        )}>
          <div className="p-4 border-b border-gray-200 dark:border-zinc-800 flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 min-w-[320px] shrink-0">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Relationship Suggestions</h3>
            </div>
            <button onClick={() => setShowSuggestions(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Discover Button */}
          <div className="p-3 border-b border-gray-200 dark:border-zinc-800 min-w-[320px] shrink-0">
            <button 
              onClick={handleDiscover}
              disabled={isDiscovering}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded-lg transition-colors"
            >
              <RefreshCw className={clsx("w-4 h-4", isDiscovering && "animate-spin")} />
              {isDiscovering ? 'Discovering...' : 'Discover Relationships'}
            </button>
          </div>
          
          {/* Scrollable Content Area */}
          <div className="flex-1 overflow-y-auto min-w-[320px]">
            <div className="p-4 space-y-4">
              {suggestions.map((suggestion) => {
                const names = resolveNames(suggestion);
                return (
                  <div key={suggestion.id} className="bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg p-3 shadow-sm animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-xs font-mono text-gray-600 dark:text-gray-300 break-all pr-2">
                        {names.leftTable}.{names.leftCol} <span className="text-gray-400 mx-1">→</span> {names.rightTable}.{names.rightCol}
                      </div>
                      <span className={clsx(
                        "text-[10px] font-bold px-1.5 py-0.5 rounded",
                        suggestion.confidence_score > 0.8 
                          ? "text-green-600 bg-green-50 dark:bg-green-900/20" 
                          : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
                      )}>
                        {Math.round(suggestion.confidence_score * 100)}%
                      </span>
                    </div>
                    {suggestion.warning && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-600 mb-2">
                        <AlertCircle className="w-3 h-3" />
                        {suggestion.warning}
                      </div>
                    )}
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
                );
              })}
              
              {suggestions.length === 0 && (
                <div className="p-4 text-center text-xs text-gray-500 bg-gray-50 dark:bg-zinc-800/50 rounded-lg">
                  No new suggestions
                </div>
              )}
            </div>

            {/* Accordions for History */}
            <Accordion title="Accepted" count={acceptedSuggestions.length} icon={CheckCircle2} defaultOpen={false}>
              {acceptedSuggestions.length > 0 ? (
                acceptedSuggestions.map(s => {
                  const names = resolveNames(s);
                  return (
                    <div key={s.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2 break-all font-mono text-gray-600 dark:text-gray-300">
                          {names.leftTable}.{names.leftCol} → {names.rightTable}.{names.rightCol}
                        </div>
                        <span className="flex items-center gap-1 text-green-600 font-medium shrink-0">
                          <CheckCircle2 className="w-3 h-3" />
                          Accepted
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-gray-400 text-center py-2">No accepted items yet</div>
              )}
            </Accordion>

            <Accordion title="Rejected" count={rejectedSuggestions.length} icon={XCircle} defaultOpen={false}>
              {rejectedSuggestions.length > 0 ? (
                rejectedSuggestions.map(s => {
                  const names = resolveNames(s);
                  return (
                    <div key={s.id} className="flex flex-col gap-2 p-3 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg text-xs opacity-75 hover:opacity-100 transition-opacity">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 mr-2 break-all font-mono text-gray-600 dark:text-gray-300">
                          {names.leftTable}.{names.leftCol} → {names.rightTable}.{names.rightCol}
                        </div>
                        <span className="flex items-center gap-1 text-red-600 font-medium shrink-0">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      </div>
                      <button 
                        onClick={() => handleResetSuggestion(s, 'rejected')}
                        className="self-end text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Reset to Pending
                      </button>
                    </div>
                  );
                })
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
              <button onClick={() => setIsRelModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Tables Selection */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Table</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                    value={newRel.sourceTable} 
                    onChange={(e) => setNewRel({...newRel, sourceTable: e.target.value, sourceCol: ''})}
                  >
                    <option value="">Select Table</option>
                    {nodes.map(n => <option key={n.id} value={n.id}>{n.data.label}</option>)}
                  </select>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 mt-6" />
                <div className="flex-1 space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Table</label>
                  <select 
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                    value={newRel.targetTable} 
                    onChange={(e) => setNewRel({...newRel, targetTable: e.target.value, targetCol: ''})}
                  >
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
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      value={newRel.sourceCol} 
                      onChange={(e) => setNewRel({...newRel, sourceCol: e.target.value})}
                    >
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.sourceTable)?.data.columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="w-4" />
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Target Column</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      value={newRel.targetCol} 
                      onChange={(e) => setNewRel({...newRel, targetCol: e.target.value})}
                    >
                      <option value="">Select Column</option>
                      {nodes.find(n => n.id === newRel.targetTable)?.data.columns.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              
              {/* Cardinality & Join Type */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cardinality</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      value={newRel.cardinality} 
                      onChange={(e) => setNewRel({...newRel, cardinality: e.target.value})}
                    >
                      <option value="one_to_one">1:1 (One to One)</option>
                      <option value="one_to_many">1:N (One to Many)</option>
                      <option value="many_to_one">N:1 (Many to One)</option>
                      <option value="many_to_many">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Type</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      value={newRel.joinType} 
                      onChange={(e) => setNewRel({...newRel, joinType: e.target.value})}
                    >
                      <option value="full">FULL OUTER JOIN</option>
                      <option value="inner">INNER JOIN</option>
                      <option value="left">LEFT JOIN</option>
                      <option value="right">RIGHT JOIN</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={() => setIsRelModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
              >
                Cancel
              </button>
              <button 
                onClick={handleManualCreate} 
                disabled={!newRel.sourceTable || !newRel.targetTable || !newRel.sourceCol || !newRel.targetCol} 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Relationship
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Relationship Modal */}
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
        
        const normalizeCardinality = (val) => {
          if (val === '1:1') return 'one_to_one';
          if (val === '1:N') return 'one_to_many';
          if (val === 'N:1') return 'many_to_one';
          if (val === 'N:N') return 'many_to_many';
          return val || 'one_to_many';
        };

        const normalizeJoinType = (val) => {
          if (val === 'FULL') return 'full';
          if (val === 'INNER') return 'inner';
          if (val === 'LEFT') return 'left';
          if (val === 'RIGHT') return 'right';
          return val?.toLowerCase() || 'full';
        };
        
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-md w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
                <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                  <LinkIcon className="w-5 h-5 text-blue-600" />
                  Edit Relationship
                </h3>
                <button onClick={() => setEditingEdge(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5">
                <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 text-sm">
                  <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {sourceInfo.table}<span className="text-gray-400">.</span>{sourceInfo.column}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {targetInfo.table}<span className="text-gray-400">.</span>{targetInfo.column}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cardinality</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      defaultValue={normalizeCardinality(editingEdge.data?.cardinality)}
                      id="edit-cardinality"
                    >
                      <option value="one_to_one">1:1 (One to One)</option>
                      <option value="one_to_many">1:N (One to Many)</option>
                      <option value="many_to_one">N:1 (Many to One)</option>
                      <option value="many_to_many">N:N (Many to Many)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Join Type</label>
                    <select 
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm" 
                      defaultValue={normalizeJoinType(editingEdge.data?.joinType)}
                      id="edit-jointype"
                    >
                      <option value="full">FULL OUTER JOIN</option>
                      <option value="inner">INNER JOIN</option>
                      <option value="left">LEFT JOIN</option>
                      <option value="right">RIGHT JOIN</option>
                    </select>
                  </div>
                </div>
                
                {editingEdge.data?.isSuggestion && (
                  <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5" />
                    This is a suggested relationship (not yet confirmed)
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between">
                {editingEdge.data?.isSuggestion ? (
                  <>
                    <button 
                      onClick={handleDeleteEdge} 
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setEditingEdge(null)} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          const suggestion = suggestions.find(s => s.id === editingEdge.data.suggestionId);
                          if (suggestion) {
                            const cardinality = document.getElementById('edit-cardinality')?.value || 'one_to_many';
                            const joinType = document.getElementById('edit-jointype')?.value || 'full';
                            handleAcceptSuggestion(suggestion, {
                              cardinality,
                              default_join_type: joinType
                            });
                            setEditingEdge(null);
                          }
                        }} 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Accept
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={handleDeleteEdge} 
                      className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setEditingEdge(null)} 
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          const cardinality = document.getElementById('edit-cardinality')?.value || 'one_to_many';
                          const joinType = document.getElementById('edit-jointype')?.value || 'full';
                          handleUpdateEdge(cardinality, joinType);
                        }} 
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                      >
                        Save Changes
                      </button>
                    </div>
                  </>
                )}
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
                Link to Image Store
              </h3>
              <button onClick={() => setActiveImageModal(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Select a column in <strong>{nodes.find(n => n.id === activeImageModal)?.data.label}</strong> that contains the file path for images.
              </p>
              
              {/* Image Path Column */}
              <Select
                label="Image Path Column"
                required
                placeholder="Select Column"
                value={imagePathForm.selectedColumnId || null}
                onChange={(val) => setImagePathForm(prev => ({ ...prev, selectedColumnId: val || '' }))}
                options={(nodes.find(n => n.id === activeImageModal)?.data.columns || []).map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.type})`,
                  description: c.isImagePath ? '✓ Already linked' : undefined,
                }))}
              />
              
              {/* Storage Provider */}
              {storageConnections.length > 0 ? (
                <Select
                  label="Storage Provider"
                  placeholder="Select Provider"
                  badge={
                    <span className="text-xs font-normal text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                      Object Storage & Data Lake
                    </span>
                  }
                  value={imagePathForm.selectedConnectionId}
                  onChange={(val) => setImagePathForm(prev => ({ 
                    ...prev, 
                    selectedConnectionId: val
                  }))}
                  options={storageConnections.map((conn) => ({
                    value: conn.id,
                    label: conn.name,
                    icon: <HardDrive className="w-4 h-4 text-purple-500" />,
                  }))}
                />
              ) : (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Storage Provider
                    <span className="text-xs font-normal text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                      Object Storage & Data Lake
                    </span>
                  </label>
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">
                          No storage connections available
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-500 mt-1">
                          Create an Object Storage connection (S3, MinIO, GCS, Azure) to link image paths.
                        </p>
                        <Link 
                          href="/connections/new"
                          className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 mt-2"
                        >
                          <Plus className="w-3 h-3" />
                          Add Storage Connection
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Error Message */}
              {imagePathError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{imagePathError}</span>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-end gap-3">
              <button 
                onClick={() => setActiveImageModal(null)} 
                disabled={isSavingImagePath}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveImagePath}
                disabled={isSavingImagePath || !imagePathForm.selectedColumnId || storageConnections.length === 0}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingImagePath ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Link Column'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Sample Modal */}
      {activeSampleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-4xl w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-600" />
                Data Sample: {sampleData?.table_name || nodes.find(n => n.id === activeSampleModal)?.data.label}
                {sampleData && (
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {sampleData.schema_name}
                  </span>
                )}
              </h3>
              <button onClick={() => { setActiveSampleModal(null); setSampleData(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-0 overflow-x-auto max-h-[400px]">
              {isLoadingSample ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                  <span className="text-gray-500">Loading sample data...</span>
                </div>
              ) : sampleData && sampleData.sample_data.length > 0 ? (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700 sticky top-0">
                    <tr>
                      {sampleData.columns.map((col) => (
                        <th key={col.column_name} className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span>{col.column_name}</span>
                            <span className="text-[10px] text-gray-400 uppercase font-normal">{col.data_type.split('(')[0]}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                    {sampleData.sample_data.map((row, rowIdx) => (
                      <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-zinc-800/50">
                        {sampleData.columns.map((col) => (
                          <td key={col.column_name} className="px-4 py-2.5 text-gray-600 dark:text-gray-400 whitespace-nowrap max-w-[200px] truncate" title={String(row[col.column_name] ?? '')}>
                            {row[col.column_name] !== null && row[col.column_name] !== undefined 
                              ? String(row[col.column_name]) 
                              : <span className="text-gray-400 italic">null</span>}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  No sample data available
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-gray-50 dark:bg-zinc-800/50 rounded-b-xl">
              <span className="text-xs text-gray-500">
                {sampleData 
                  ? `Showing ${sampleData.total_returned} of max ${sampleData.max_samples} rows from live database`
                  : 'Fetching sample data...'}
              </span>
              <button onClick={() => { setActiveSampleModal(null); setSampleData(null); }} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distinct Values Modal */}
      {activeDistinctModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-sm w-full border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-zinc-800">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <List className="w-5 h-5 text-emerald-600" />
                <span>Distinct Values</span>
              </h3>
              <button onClick={() => { setActiveDistinctModal(null); setDistinctData(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Column Name */}
            <div className="px-4 py-2 bg-gray-50 dark:bg-zinc-800/50 border-b border-gray-100 dark:border-zinc-800">
              <span className="text-xs text-gray-500">Column:</span>
              <span className="ml-2 text-sm font-mono text-gray-700 dark:text-gray-300">{activeDistinctModal.columnName}</span>
            </div>
            
            {/* Values List */}
            <div className="p-4 max-h-[300px] overflow-y-auto">
              {isLoadingDistinct ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-600 mr-2" />
                  <span className="text-gray-500 text-sm">Loading...</span>
                </div>
              ) : distinctData && distinctData.distinct_values.length > 0 ? (
                <div className="space-y-1.5">
                  {distinctData.distinct_values.map((value, idx) => (
                    <div 
                      key={idx}
                      className={clsx(
                        "px-3 py-2 rounded-lg text-sm font-mono",
                        value === null 
                          ? "text-gray-400 italic bg-gray-100 dark:bg-zinc-800" 
                          : "text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-zinc-800"
                      )}
                      title={String(value)}
                    >
                      {value === null ? 'null' : typeof value === 'string' && value.length > 40 ? value.slice(0, 40) + '...' : String(value)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-gray-500">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  <span className="text-sm">No values found</span>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="px-4 py-3 border-t border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50 rounded-b-xl flex justify-between items-center">
              <span className="text-xs text-gray-500">
                {distinctData 
                  ? `Showing ${distinctData.total_returned} of ${distinctData.total_distinct} unique values`
                  : 'Loading...'}
              </span>
              <button onClick={() => { setActiveDistinctModal(null); setDistinctData(null); }} className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors">
                Close
              </button>
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
