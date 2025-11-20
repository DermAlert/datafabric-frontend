import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, Maximize, Move, ChevronRight, BrainCircuit } from 'lucide-react';
import styles from './InjuryGallery.module.css';

export default function InjuryGallery({ injuries, selectedInjuryId, onSelectInjury }) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef(null);

  const activeInjury = injuries.find(i => i.id === selectedInjuryId) || injuries[0];

  useEffect(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [selectedInjuryId]);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 1));
  
  const handleReset = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging) {
      e.preventDefault();
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getConfidenceColor = (prediction) => {
    if (prediction.includes('Benigno')) return styles.badgeSuccess;
    return styles.badgeDanger;
  };

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>Lesões Identificadas</h3>
          <span className={styles.countBadge}>{injuries.length}</span>
        </div>
        
        <div className={styles.list}>
          {injuries.map((injury) => (
            <div 
              key={injury.id}
              className={`${styles.listItem} ${activeInjury?.id === injury.id ? styles.listItemActive : ''}`}
              onClick={() => onSelectInjury(injury.id)}
            >
              <div className={styles.imageWrapper}>
                <img src={injury.fotoUrl} alt="" />
              </div>
              <div className={styles.itemContent}>
                <span className={styles.itemTitle}>{injury.localizacao}</span>
                <div className={styles.itemMeta}>
                   <BrainCircuit size={12} />
                   <span>{injury.predicaoML.split(' ')[0]}</span>
                </div>
              </div>
              {activeInjury?.id === injury.id && <ChevronRight size={16} className={styles.activeArrow} />}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.viewer}>
        <div className={styles.viewerOverlayTop}>
          <div>
            <h2 className={styles.overlayTitle}>{activeInjury?.localizacao}</h2>
            <p className={styles.overlayDesc}>{activeInjury?.descricao}</p>
          </div>
          <div className={`${styles.aiTag} ${getConfidenceColor(activeInjury?.predicaoML || '')}`}>
             <BrainCircuit size={14} />
             {activeInjury?.predicaoML}
          </div>
        </div>

        <div 
          className={styles.stage}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : (zoomLevel > 1 ? 'grab' : 'default') }}
        >
          {activeInjury && (
            <img 
              ref={imageRef}
              src={activeInjury.fotoUrl} 
              className={styles.mainImage}
              style={{ 
                transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
              }}
              draggable={false}
            />
          )}
        </div>

        <div className={styles.controlsHud}>
          <button onClick={handleZoomOut} disabled={zoomLevel <= 1} className={styles.hudBtn}>
            <ZoomOut size={20} />
          </button>
          <span className={styles.hudValue}>{Math.round(zoomLevel * 100)}%</span>
          <button onClick={handleZoomIn} disabled={zoomLevel >= 5} className={styles.hudBtn}>
            <ZoomIn size={20} />
          </button>
          <div className={styles.hudDivider} />
          <button onClick={handleReset} className={styles.hudBtn} title="Ajustar à tela">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}