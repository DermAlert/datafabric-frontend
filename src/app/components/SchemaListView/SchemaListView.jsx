import React, { useState, useRef, useEffect } from 'react';
import { 
  Table, 
  Eye, 
  EyeOff, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  MoreVertical,
  Search,
  Database
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './SchemaListView.module.css';

export default function SchemaListView({ tables }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTables = tables.filter(table => {
    const label = table.data?.label || '';
    const columns = table.data?.columns || [];
    
    return label.toLowerCase().includes(searchTerm.toLowerCase()) || 
      columns.some((col) => col.name.toLowerCase().includes(searchTerm.toLowerCase()));
  });

  return (
    <div className={styles.container}>
      <div className={styles.searchBar}>
        <div className={styles.inputWrapper}>
          <Search className={styles.searchIcon} />
          <input 
            type="text" 
            placeholder="Search tables and columns..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.input}
          />
        </div>
      </div>

      <div className={styles.listBody}>
        {filteredTables.map((table) => {
          const label = table.data?.label || table.label || 'Unknown Table';
          const isActive = table.data?.active !== false;
          const columns = table.data?.columns || table.columns || [];
          
          return (
            <div key={table.id} className={styles.tableRow}>
              <div className={styles.tableHeader}>
                <div className={styles.headerLeft}>
                  <div className={clsx(
                    styles.iconBox,
                    isActive ? styles.iconBoxActive : styles.iconBoxInactive
                  )}>
                    <Table className={styles.tableIcon} />
                  </div>
                  <div>
                    <h3 className={clsx(styles.tableTitle, isActive ? styles.textActive : styles.textInactive)}>
                      {label}
                      {!isActive && <span className={styles.inactiveBadge}>Inactive</span>}
                    </h3>
                    <p className={styles.columnCount}>{columns.length} columns</p>
                  </div>
                </div>
                
                <div className={styles.headerRight}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => table.data?.onToggleActive?.(table.id)}
                    title={isActive ? "Deactivate Table" : "Activate Table"}
                  >
                    {isActive ? <Eye className={styles.iconStandard} /> : <EyeOff className={styles.iconStandard} />}
                  </button>
                  
                  <div className={styles.menuContainer}>
                    <button 
                      className={clsx(
                        styles.actionButton,
                        openMenu === table.id && styles.menuButtonOpen
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(openMenu === table.id ? null : table.id);
                      }}
                    >
                      <MoreVertical className={styles.iconStandard} />
                    </button>

                    {openMenu === table.id && (
                      <div ref={menuRef} className={styles.contextMenu}>
                        <button 
                          className={styles.menuItem}
                          onClick={() => {
                            table.data?.onLinkImage?.(table.id);
                            setOpenMenu(null);
                          }}
                        >
                          <ImageIcon className={styles.iconMedium} />
                          Link Image Storage
                        </button>
                        <button 
                          className={styles.menuItem}
                          onClick={() => {
                            table.data?.onViewSample?.(table.id);
                            setOpenMenu(null);
                          }}
                        >
                          <Database className={styles.iconMedium} />
                          View Data Sample
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className={clsx(styles.columnList, !isActive && styles.columnListInactive)}>
                {columns.map((col) => (
                  <div key={col.id} className={styles.columnRow}>
                    <div className={styles.colInfo}>
                      <span className={clsx(
                        styles.colName,
                        col.active ? styles.colNameActive : styles.colNameInactive
                      )}>{col.name}</span>
                      <span className={styles.colType}>{col.type}</span>
                    </div>
                    
                    <div className={styles.colActions}>
                      <button 
                        className={clsx(
                          styles.imageButton,
                          col.isImagePath 
                            ? styles.imageButtonLinked 
                            : styles.imageButtonUnlinked
                        )}
                        title="Link to Image Storage"
                        onClick={() => table.data?.onLinkImage?.(table.id)}
                      >
                        <ImageIcon className={styles.iconSmall} />
                        {col.isImagePath && <span style={{fontSize: '10px', fontWeight: 500}}>Linked</span>}
                      </button>
                      
                      <button 
                        className={clsx(
                          styles.visibilityButton,
                          col.active ? styles.visibilityButtonActive : styles.visibilityButtonInactive
                        )}
                        title={col.active ? "Deactivate Column" : "Activate Column"}
                        onClick={() => table.data?.onToggleColumnActive?.(col.id)}
                      >
                        {col.active ? <Eye className={styles.iconSmall} /> : <EyeOff className={styles.iconSmall} />}
                      </button>
                    </div>
                    
                    <div className={styles.indicators}>
                       {col.isPk && <span className={styles.pkBadge}>PK</span>}
                       {col.isFk && <span className={styles.fkBadge}>FK</span>}
                       {col.isImagePath && <ImageIcon className={styles.imageIndicator} />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        
        {filteredTables.length === 0 && (
          <div className={styles.emptyState}>
            No tables found matching "{searchTerm}"
          </div>
        )}
      </div>
    </div>
  );
}