import React, { useState, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  BaseEdge,
  getSmoothStepPath,
  MiniMap,
  Handle, 
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';
import { MoreVertical, Key, Link as LinkIcon, Image as ImageIcon, Plus, Eye, EyeOff, Database } from 'lucide-react';
import { clsx } from 'clsx';
import styles from './SchemaCanvas.module.css';

const TableNode = ({ data, id }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };
    
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className={styles.nodeCard}>
      <div className={styles.nodeHeader}>
        <div className={styles.headerTitle}>
          <span className={styles.titleText}>{data.label}</span>
          {!data.active && (
            <span className={styles.inactiveBadge}>
              Inactive
            </span>
          )}
        </div>
        
        <div className={styles.menuContainer} ref={menuRef}>
          <button 
            className={clsx(
              styles.menuButton,
              showMenu && styles.menuButtonActive
            )}
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
          >
            <MoreVertical className={styles.iconStandard} />
          </button>

          {showMenu && (
            <div className={styles.contextMenu}>
              <button 
                className={styles.menuItem}
                onClick={() => {
                  data.onToggleActive?.(id);
                  setShowMenu(false);
                }}
              >
                {data.active === false ? <Eye className={styles.iconMedium} /> : <EyeOff className={styles.iconMedium} />}
                {data.active === false ? 'Activate Table' : 'Deactivate Table'}
              </button>
              
              <button 
                className={styles.menuItem}
                onClick={() => {
                  data.onLinkImage?.(id);
                  setShowMenu(false);
                }}
              >
                <ImageIcon className={styles.iconMedium} />
                Link Image Storage
              </button>

              <div className={styles.menuDivider} />
              
              <button 
                className={styles.menuItem}
                onClick={() => {
                  data.onViewSample?.(id);
                  setShowMenu(false);
                }}
              >
                <Database className={styles.iconMedium} />
                View Data Sample
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className={clsx(styles.columnsContainer, !data.active && styles.columnsContainerInactive)}>
        {data.columns.map((col) => (
          <div 
            key={col.id} 
            className={styles.columnRow}
            onClick={() => data.onToggleColumnActive?.(col.id)}
            title={col.active ? "Click to deactivate column" : "Click to activate column"}
          >
            <div className={styles.columnLeft}>
              <div 
                className={col.active ? styles.eyeIcon : styles.eyeIconInactive}
              >
                {col.active ? <Eye className={styles.iconSmall} /> : <EyeOff className={styles.iconSmall} />}
              </div>
              <span className={col.active ? styles.colNameActive : styles.colNameInactive}>
                {col.name}
              </span>
              {col.isPk && <Key className={styles.pkIcon} />}
              {col.isFk && <LinkIcon className={styles.fkIcon} />}
            </div>
            <div className={styles.columnRight}>
              <span className={styles.colType}>{col.type}</span>
              {col.isImagePath && (
                <div className={styles.imagePathIndicator} title="Image Path Configured">
                   <ImageIcon className={styles.iconSmall} />
                </div>
              )}
            </div>

            <Handle 
              type="target" 
              position={Position.Left} 
              id={`${col.id}-left`}
              className={styles.handleLeft} 
            />
            
            <Handle 
              type="source" 
              position={Position.Right} 
              id={`${col.id}-right`}
              className={styles.handleRight}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.handleIconWrapper}>
                <Plus className={styles.iconSmall} />
              </div>
            </Handle>
          </div>
        ))}
      </div>
    </div>
  );
};

const CustomEdge = ({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}) => {
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
};

const nodeTypes = {
  table: TableNode,
};

const edgeTypes = {
  smoothstep: CustomEdge,
};

export default function SchemaCanvas({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onEdgeClick 
}) {
  return (
    <div className={styles.canvasWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onEdgeClick={onEdgeClick}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.5}
        maxZoom={1.5}
        deleteKeyCode={['Backspace', 'Delete']}
      >
        <Background color="#94a3b8" gap={20} size={1} />
        <Controls className={styles.controls} />
        <MiniMap 
          className={styles.miniMap}
          nodeColor={() => '#e2e8f0'}
          maskColor="rgba(0, 0, 0, 0.1)"
        />
      </ReactFlow>
    </div>
  );
}