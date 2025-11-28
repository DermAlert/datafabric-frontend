"use client";
import { useState, useEffect } from 'react';
import { 
  Grid, Table, Info, Filter, Search as SearchIcon, Eye, Download, X 
} from 'lucide-react';
import styles from './BrowseTab.module.css';

export default function BrowseTab({ datasetDetails, files, isLoading, totalFiles, onFetchImages, onRefresh }) {
  const [currentView, setCurrentView] = useState("grid");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      setFilteredFiles(files.filter(file =>
        file.image_name.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    }
  }, [searchQuery, files]);

  useEffect(() => {
    onFetchImages(page, pageSize);
  }, [page, pageSize]);

  const handlePageChange = (newPage) => setPage(newPage);
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
  };

  const SkeletonLoader = () => (
    <div className={styles.skeletonContainer}>
        {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={styles.skeletonItem} />
        ))}
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.searchContainer}>
          <SearchIcon className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar arquivos..."
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={isLoading}
          />
        </div>
        <div className={styles.actions}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.iconButton} ${currentView === "grid" ? styles.active : ""}`}
              onClick={() => setCurrentView("grid")}
            ><Grid size={18} /></button>
            <button
              className={`${styles.iconButton} ${currentView === "table" ? styles.active : ""}`}
              onClick={() => setCurrentView("table")}
            ><Table size={18} /></button>
          </div>
          {currentView === "grid" && (
             <div className={styles.zoomControls}>
                <button onClick={() => setZoomLevel(Math.max(0.5, zoomLevel - 0.25))}>-</button>
                <span>{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(Math.min(2, zoomLevel + 0.25))}>+</button>
             </div>
          )}
          <button
            className={`${styles.iconButton} ${showMetadataPanel ? styles.active : ""}`}
            onClick={() => setShowMetadataPanel(!showMetadataPanel)}
          ><Info size={18} /></button>
          <button className={styles.filterButton}><Filter size={16} /> Filtros</button>
        </div>
      </div>

      <div className={styles.contentArea}>
        <div className={styles.filesArea}>
          {isLoading ? <SkeletonLoader /> : (
            currentView === "grid" ? (
              <div className={styles.gridView} style={{ '--zoom': zoomLevel }}>
                {filteredFiles.map(file => (
                  <div
                    key={file.image_id}
                    className={`${styles.gridItem} ${selectedFile?.image_id === file.image_id ? styles.selected : ''}`}
                    onClick={() => setSelectedFile(file)}
                  >
                    <div className={styles.imageWrapper}>
                      <img src={file.presigned_url} alt={file.image_name} />
                    </div>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemName}>{file.image_name}</span>
                      <span className={styles.itemSize}>{formatFileSize(file.metadata.file_size || 0)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Tamanho</th>
                    <th>Tipo</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFiles.map(file => (
                    <tr 
                      key={file.image_id} 
                      onClick={() => setSelectedFile(file)}
                      className={selectedFile?.image_id === file.image_id ? styles.selectedRow : ''}
                    >
                      <td>{file.image_name}</td>
                      <td>{formatFileSize(file.metadata.file_size || 0)}</td>
                      <td>{file.metadata.content_type}</td>
                      <td>{new Date(file.metadata.data_atualizacao).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
           {!isLoading && (
              <div className={styles.pagination}>
                 <button disabled={page === 1} onClick={() => handlePageChange(page - 1)}>Prev</button>
                 <span>Page {page}</span>
                 <button disabled={page * pageSize >= totalFiles} onClick={() => handlePageChange(page + 1)}>Next</button>
              </div>
           )}
        </div>

        {showMetadataPanel && (
          <div className={styles.metadataPanel}>
            <div className={styles.panelHeader}>
               <h3>{selectedFile ? 'Detalhes do Arquivo' : 'Sobre o Dataset'}</h3>
               <button onClick={() => setShowMetadataPanel(false)}><X size={16}/></button>
            </div>
            <div className={styles.panelContent}>
              {selectedFile ? (
                <>
                  <div className={styles.previewBox}>
                    <img src={selectedFile.presigned_url} alt="Preview" />
                  </div>
                  <div className={styles.propList}>
                    <label>Nome</label>
                    <p>{selectedFile.image_name}</p>
                    <label>ID</label>
                    <p className={styles.mono}>{selectedFile.image_id}</p>
                    <label>Tipo</label>
                    <p>{selectedFile.metadata.content_type}</p>
                  </div>
                  <div className={styles.fileActions}>
                    <a href={selectedFile.presigned_url} target="_blank" className={styles.actionBtn}>
                        <Eye size={14}/> Visualizar
                    </a>
                    <a href={selectedFile.presigned_url} download className={styles.actionBtn}>
                        <Download size={14}/> Baixar
                    </a>
                  </div>
                </>
              ) : (
                <div className={styles.propList}>
                    <label>Dataset</label>
                    <p>{datasetDetails.name}</p>
                    <label>Descrição</label>
                    <p>{datasetDetails.description}</p>
                    <label>Total de Arquivos</label>
                    <p>{totalFiles}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}