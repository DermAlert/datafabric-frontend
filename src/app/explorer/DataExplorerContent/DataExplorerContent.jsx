import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Star, Share2, Download, Folder, BarChart2, Code, FileText, Search as SearchIcon, Grid, Table, Filter, Info, PlusCircle, X, Eye, Image, PieChart, BarChart, AreaChart, RefreshCw
} from 'lucide-react';
import styles from '../explorer.module.css';
import explorerStyles from './DataExplorerContent.module.css';

// --- Helper to get dataset ID from URL as query param (?id=123) ---
function getDatasetIdFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  return params.get('id');
}

const API_BASE = 'http://localhost:8004/api';

// ---------- Modal for searching datasets ----------
function SearchDatasetsModal({ onClose, onSelectDataset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/datasets/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        page,
        size: 10,
        query: searchTerm
      })
    })
      .then(res => res.json())
      .then(data => {
        setResults(data.items || []);
        setTotal(data.total || 0);
        setIsLoading(false);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
        setIsLoading(false);
      });
  }, [searchTerm, page]);

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSelect = (dataset) => {
    if (onSelectDataset) onSelectDataset(dataset);
    if (onClose) onClose();
  };

  return (
    <div className={explorerStyles.modalOverlay}>
      <div className={explorerStyles.modal}>
        <div className={explorerStyles.modalHeader}>
          <h2 className={explorerStyles.modalTitle}>Buscar Datasets</h2>
          <button onClick={onClose} className={explorerStyles.closeModalButton}>
            <X />
          </button>
        </div>
        <div className={explorerStyles.modalContent}>
          <div className={explorerStyles.modalSearchBar}>
            <SearchIcon className={explorerStyles.searchIcon} />
            <input
              type="text"
              placeholder="Digite o nome do dataset..."
              value={searchTerm}
              onChange={handleSearchInput}
              className={explorerStyles.searchInput}
              disabled={isLoading}
            />
          </div>
          <div className={explorerStyles.modalResults}>
            {isLoading ? (
              <div className={explorerStyles.loadingSpinner}>
                <div className={explorerStyles.spinner}></div>
                <span className={explorerStyles.loadingText}>Buscando datasets...</span>
              </div>
            ) : results.length === 0 ? (
              <div className={explorerStyles.noResults}>
                <SearchIcon className={explorerStyles.noResultsIcon} />
                <h3 className={explorerStyles.noResultsTitle}>Nenhum dataset encontrado</h3>
                <p className={explorerStyles.noResultsText}>
                  Tente um termo diferente.
                </p>
              </div>
            ) : (
              <ul className={explorerStyles.datasetList}>
                {results.map(ds => (
                  <li
                    key={ds.id}
                    className={explorerStyles.datasetListItem}
                    onClick={() => handleSelect(ds)}
                  >
                    <div className={explorerStyles.datasetListName}>{ds.name}</div>
                    <div className={explorerStyles.datasetListDescription}>{ds.description}</div>
                    <div className={explorerStyles.datasetListMeta}>
                      <span>Tipo: {ds.storage_type}</span>
                      <span>Status: {ds.status}</span>
                      <span>Versão: {ds.version}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={explorerStyles.paginationControls}>
            <button
              className={explorerStyles.pageButton}
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </button>
            <span className={explorerStyles.pageIndicator}>
              Página {page} de {Math.ceil(total / 10) || 1}
            </span>
            <button
              className={explorerStyles.pageButton}
              onClick={() => setPage(page + 1)}
              disabled={isLoading || page * 10 >= total}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Main Explorer Content ----------
export default function DataExplorerContent({ dataset, returnToDashboard }) {
const [showSearchModal, setShowSearchModal] = useState(false);
const [selectedDataset, setSelectedDataset] = useState(null);
const [datasetLoaded, setDatasetLoaded] = useState(false);

useEffect(() => {
  const id = getDatasetIdFromUrl();
  if (id) {
    setSelectedDataset({ id });
    setShowSearchModal(false);
    setDatasetLoaded(false);
  } else if (dataset && dataset.id) {
    setSelectedDataset(dataset);
    setShowSearchModal(false);
    setDatasetLoaded(true);
  } else {
    setSelectedDataset(null);
    setShowSearchModal(true);
    setDatasetLoaded(false);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
  // Tabs and explorer state
  const [activeTab, setActiveTab] = useState("browse");
  const [currentView, setCurrentView] = useState("grid");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isStarred, setIsStarred] = useState(false);

  // API states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalFiles, setTotalFiles] = useState(0);

  // --- Fetch dataset details if only id is available from URL ---
  useEffect(() => {
    let ignore = false;
    async function fetchDatasetDetails() {
      if (selectedDataset && selectedDataset.id && !selectedDataset.name) {
        setIsLoading(true);
        try {
          const res = await fetch(`${API_BASE}/datasets/${selectedDataset.id}`, {
            headers: { accept: 'application/json' }
          });
          if (!res.ok) throw new Error('Failed to fetch dataset');
          const data = await res.json();
          if (!ignore) {
            setSelectedDataset(data);
            setDatasetLoaded(true);
            setShowSearchModal(false);
          }
        } catch (err) {
          // If not found, allow modal to open
          setShowSearchModal(true);
        } finally {
          setIsLoading(false);
        }
      } else if (selectedDataset && selectedDataset.id && selectedDataset.name) {
        setDatasetLoaded(true);
        setShowSearchModal(false);
      }
    }
    fetchDatasetDetails();
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataset && selectedDataset.id]);

  // Dataset metadata (fallbacks if not loaded)
  const datasetDetails = {
    id: (selectedDataset && selectedDataset.id) || "dataset-id",
    name: (selectedDataset && selectedDataset.name) || "Dataset Name",
    type: (selectedDataset && selectedDataset.storage_type) || "Dataset Type",
    source: "MinIO Storage",
    created: (selectedDataset && selectedDataset.data_criacao) || "2024-12-10",
    updated: (selectedDataset && selectedDataset.data_atualizacao) || "2025-04-13",
    owner: "Research Team",
    size: "Calculating...",
    files: totalFiles,
    description: (selectedDataset && selectedDataset.description) || "No description available",
    tags: (selectedDataset && selectedDataset.tags) || ["medical", "images", "dermatology"],
    access: (selectedDataset && selectedDataset.access) || "Restricted - Research Team"
  };

  // When a dataset is selected from modal, update state and close modal
  const handleSelectDataset = (ds) => {
    setSelectedDataset(ds);
    setShowSearchModal(false);
    setCurrentPage(1); // Reset pagination/search if you want
    setSearchQuery('');
    setSelectedFile(null);
    setDatasetLoaded(true);
  };

  // Fetch images from API for the selected dataset
  const fetchImages = async (page = 1, size = pageSize) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/datasets/${datasetDetails.id}/images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          page: page,
          size: size
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }

      const data = await response.json();
      setFiles(data.items);
      setFilteredFiles(data.items);
      setTotalFiles(data.total);

      // Calculate size for dataset details
      const totalSizeBytes = data.items.reduce((acc, file) => acc + (file.metadata.file_size || 0), 0);
      const totalSizeGB = (totalSizeBytes / (1024 * 1024 * 1024)).toFixed(2);
      datasetDetails.size = `${totalSizeGB} GB`;
      datasetDetails.files = data.total;

      setIsLoading(false);
      return data;
    } catch (error) {
      console.error('Error fetching images:', error);
      setIsLoading(false);
      return { items: [], total: 0 };
    }
  };

  // Fetch data on component mount and whenever dataset or pagination changes
  useEffect(() => {
    if (!selectedDataset || !selectedDataset.id || showSearchModal || !datasetLoaded) return;
    fetchImages(currentPage, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDataset && selectedDataset.id, currentPage, pageSize, showSearchModal, datasetLoaded]);

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchImages(currentPage, pageSize);
    setIsRefreshing(false);
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredFiles(files);
    } else {
      const filtered = files.filter(file =>
        file.image_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredFiles(filtered);
    }
  }, [searchQuery, files]);

  // Toggle starred status
  const toggleStarred = () => setIsStarred(!isStarred);

  // Toggle metadata panel
  const toggleMetadataPanel = () => setShowMetadataPanel(!showMetadataPanel);

  // Zoom control
  const handleZoomChange = (newZoom) => setZoomLevel(newZoom);

  // Handle file selection
  const handleFileSelect = (fileId) => {
    const file = filteredFiles.find(f => f.image_id === fileId);
    setSelectedFile(file);
  };

  // Handle search input
  const handleSearchChange = (e) => setSearchQuery(e.target.value);

  // Handle page change
  const handlePageChange = (newPage) => setCurrentPage(newPage);

  // Handle page size change
  const handlePageSizeChange = (e) => {
    const newSize = parseInt(e.target.value);
    setPageSize(newSize);
    setCurrentPage(1);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Skeleton loader component
  const SkeletonLoader = ({ type = 'grid' }) => {
    if (type === 'grid') {
      return (
        <div className={explorerStyles.gridView} style={{ '--zoom-level': zoomLevel }}>
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className={explorerStyles.skeletonGridItem}>
              <div className={explorerStyles.skeletonImage}></div>
              <div className={explorerStyles.skeletonText}>
                <div className={explorerStyles.skeletonLine}></div>
                <div className={explorerStyles.skeletonLineShort}></div>
              </div>
            </div>
          ))}
        </div>
      );
    }
    return (
      <div className={explorerStyles.skeletonTable}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className={explorerStyles.skeletonTableRow}>
            <div className={explorerStyles.skeletonLine}></div>
            <div className={explorerStyles.skeletonLineShort}></div>
            <div className={explorerStyles.skeletonLineShort}></div>
            <div className={explorerStyles.skeletonLine}></div>
            <div className={explorerStyles.skeletonLineShort}></div>
          </div>
        ))}
      </div>
    );
  };

  // Pagination controls
  const PaginationControls = () => {
    const totalPages = Math.ceil(totalFiles / pageSize);
    return (
      <div className={explorerStyles.paginationControls}>
        <div className={explorerStyles.paginationInfo}>
          Showing {(currentPage - 1) * pageSize + 1} - 
          {Math.min(currentPage * pageSize, totalFiles)} of {totalFiles} files
        </div>
        <div className={explorerStyles.pageSizeSelector}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={handlePageSizeChange}
            className={explorerStyles.pageSizeSelect}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className={explorerStyles.pageNavigation}>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={explorerStyles.pageButton}
          >Previous</button>
          <span className={explorerStyles.pageIndicator}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className={explorerStyles.pageButton}
          >Next</button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.mainContent}>
      {showSearchModal && (
        <SearchDatasetsModal
          onClose={() => setShowSearchModal(false)}
          onSelectDataset={handleSelectDataset}
        />
      )}

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <button className={explorerStyles.backButton} onClick={returnToDashboard}>
            <ArrowLeft className={explorerStyles.backIcon} />
          </button>
          <div className={explorerStyles.datasetTitleContainer}>
            <h1 className={styles.pageTitle}>
              <span className={explorerStyles.datasetTitle}>{datasetDetails.name}</span>
            </h1>
            <div className={explorerStyles.datasetSource}>{datasetDetails.source} • {datasetDetails.type}</div>
          </div>
        </div>
        <div className={explorerStyles.datasetActions}>
          <div className={explorerStyles.actionGroup}>
            <button
              className={`${explorerStyles.actionButton} ${isRefreshing ? explorerStyles.actionButtonLoading : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`${explorerStyles.actionIcon} ${isRefreshing ? explorerStyles.spinning : ''}`} />
            </button>
            <button
              className={`${explorerStyles.actionButton} ${isStarred ? explorerStyles.actionButtonActive : ''}`}
              onClick={toggleStarred}
            >
              <Star className={explorerStyles.actionIcon} />
            </button>
            <button className={explorerStyles.actionButton}>
              <Share2 className={explorerStyles.actionIcon} />
            </button>
            <button className={explorerStyles.actionButton}>
              <Download className={explorerStyles.actionIcon} />
            </button>
          </div>
          <div className={styles.userAvatar}>
            <span className={styles.userInitials}>US</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={explorerStyles.tabsContainer}>
        <div className={explorerStyles.tabs}>
          <button
            className={`${explorerStyles.tab} ${activeTab === "browse" ? explorerStyles.tabActive : ""}`}
            onClick={() => setActiveTab("browse")}
          >
            <Folder className={explorerStyles.tabIcon} />
            <span>Explorar</span>
          </button>
          <button
            className={`${explorerStyles.tab} ${activeTab === "analytics" ? explorerStyles.tabActive : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <BarChart2 className={explorerStyles.tabIcon} />
            <span>Análise</span>
          </button>
          <button
            className={`${explorerStyles.tab} ${activeTab === "query" ? explorerStyles.tabActive : ""}`}
            onClick={() => setActiveTab("query")}
          >
            <Code className={explorerStyles.tabIcon} />
            <span>Consulta</span>
          </button>
          <button
            className={`${explorerStyles.tab} ${activeTab === "docs" ? explorerStyles.tabActive : ""}`}
            onClick={() => setActiveTab("docs")}
          >
            <FileText className={explorerStyles.tabIcon} />
            <span>Documentação</span>
          </button>
        </div>
        <div className={explorerStyles.metaInfo}>
          <div className={explorerStyles.metaDetail}>
            <span className={explorerStyles.metaLabel}>Atualizado</span>
            <span className={explorerStyles.metaValue}>{datasetDetails.updated}</span>
          </div>
          <div className={explorerStyles.metaDetail}>
            <span className={explorerStyles.metaLabel}>Tamanho</span>
            <span className={explorerStyles.metaValue}>{datasetDetails.size}</span>
          </div>
          <div className={explorerStyles.metaDetail}>
            <span className={explorerStyles.metaLabel}>Arquivos</span>
            <span className={explorerStyles.metaValue}>{isLoading ? '...' : totalFiles}</span>
          </div>
        </div>
      </div>

      {/* Main content area based on active tab */}
      <div className={explorerStyles.mainContentArea}>
        {activeTab === "browse" && (
          <div className={explorerStyles.exploreContainer}>
            {/* Toolbar */}
            <div className={explorerStyles.explorerToolbar}>
              <div className={explorerStyles.toolbarSearch}>
                <input
                  type="text"
                  placeholder="Buscar arquivos..."
                  className={explorerStyles.searchInput}
                  value={searchQuery}
                  onChange={handleSearchChange}
                  disabled={isLoading}
                />
              </div>
              <div className={explorerStyles.toolbarActions}>
                <div className={explorerStyles.viewToggle}>
                  <button
                    className={`${explorerStyles.viewButton} ${currentView === "grid" ? explorerStyles.viewButtonActive : ""}`}
                    onClick={() => setCurrentView("grid")}
                    disabled={isLoading}
                  >
                    <Grid className={explorerStyles.viewIcon} />
                  </button>
                  <button
                    className={`${explorerStyles.viewButton} ${currentView === "table" ? explorerStyles.viewButtonActive : ""}`}
                    onClick={() => setCurrentView("table")}
                    disabled={isLoading}
                  >
                    <Table className={explorerStyles.viewIcon} />
                  </button>
                </div>
                {currentView === "grid" && (
                  <div className={explorerStyles.zoomControls}>
                    <button
                      className={explorerStyles.zoomButton}
                      onClick={() => handleZoomChange(Math.max(0.5, zoomLevel - 0.25))}
                      disabled={zoomLevel <= 0.5 || isLoading}
                    >-</button>
                    <span className={explorerStyles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                    <button
                      className={explorerStyles.zoomButton}
                      onClick={() => handleZoomChange(Math.min(2, zoomLevel + 0.25))}
                      disabled={zoomLevel >= 2 || isLoading}
                    >+</button>
                  </div>
                )}
                <button
                  className={`${explorerStyles.infoButton} ${showMetadataPanel ? explorerStyles.infoButtonActive : ""}`}
                  onClick={toggleMetadataPanel}
                >
                  <Info className={explorerStyles.infoIcon} />
                </button>
                <button className={explorerStyles.filterButton} disabled={isLoading}>
                  <Filter className={explorerStyles.filterIcon} />
                  <span>Filtros</span>
                </button>
              </div>
            </div>
            {/* Content container */}
            <div className={explorerStyles.contentContainer}>
              {isLoading && (
                <div className={explorerStyles.loadingOverlay}>
                  <div className={explorerStyles.loadingSpinner}>
                    <div className={explorerStyles.spinner}></div>
                    <span className={explorerStyles.loadingText}>Carregando dados...</span>
                  </div>
                </div>
              )}
              {/* Files grid/table */}
              <div className={`${explorerStyles.filesContainer} ${isLoading ? explorerStyles.contentLoading : ''}`}>
                {isLoading ? (
                  <SkeletonLoader type={currentView} />
                ) : currentView === "grid" ? (
                  <div className={explorerStyles.gridView} style={{ '--zoom-level': zoomLevel }}>
                    {filteredFiles.map(file => (
                      <div
                        key={file.image_id}
                        className={`${explorerStyles.gridItem} ${selectedFile && selectedFile.image_id === file.image_id ? explorerStyles.gridItemSelected : ''}`}
                        onClick={() => handleFileSelect(file.image_id)}
                      >
                        <div className={explorerStyles.gridItemImageContainer}>
                          <div className={explorerStyles.gridItemImage}>
                            <img
                              src={file.presigned_url}
                              alt={file.image_name}
                              className={explorerStyles.actualImage}
                            />
                          </div>
                        </div>
                        <div className={explorerStyles.gridItemInfo}>
                          <div className={explorerStyles.gridItemName}>{file.image_name}</div>
                          <div className={explorerStyles.gridItemMeta}>
                            {formatFileSize(file.metadata.file_size || 0)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={explorerStyles.tableViewContainer}>
                    <table className={styles.table}>
                      <thead className={styles.tableHeader}>
                        <tr>
                          <th className={styles.tableHeaderCell}>Nome</th>
                          <th className={styles.tableHeaderCell}>Tamanho</th>
                          <th className={styles.tableHeaderCell}>Tipo</th>
                          <th className={styles.tableHeaderCell}>Última Modificação</th>
                          <th className={styles.tableHeaderCell}>ID</th>
                        </tr>
                      </thead>
                      <tbody className={styles.tableBody}>
                        {filteredFiles.map(file => (
                          <tr
                            key={file.image_id}
                            className={`${styles.tableRow} ${selectedFile && selectedFile.image_id === file.image_id ? explorerStyles.tableRowSelected : ''}`}
                            onClick={() => handleFileSelect(file.image_id)}
                          >
                            <td className={styles.tableCell}>
                              <div className={explorerStyles.fileNameCell}>
                                <img
                                  src={file.presigned_url}
                                  alt={file.image_name}
                                  className={explorerStyles.fileThumbnail}
                                />
                                {file.image_name}
                              </div>
                            </td>
                            <td className={styles.tableCellMuted}>
                              {formatFileSize(file.metadata.file_size || 0)}
                            </td>
                            <td className={styles.tableCellMuted}>
                              {file.metadata.content_type || 'image/jpeg'}
                            </td>
                            <td className={styles.tableCellMuted}>
                              {new Date(file.metadata.data_atualizacao).toLocaleDateString()}
                            </td>
                            <td className={styles.tableCellMuted}>
                              {file.image_id.slice(0, 8)}...
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {!isLoading && filteredFiles.length === 0 && searchQuery && (
                  <div className={explorerStyles.noResults}>
                    <SearchIcon className={explorerStyles.noResultsIcon} />
                    <h3 className={explorerStyles.noResultsTitle}>Nenhum arquivo encontrado</h3>
                    <p className={explorerStyles.noResultsText}>
                      Tente ajustar sua busca ou limpar os filtros.
                    </p>
                  </div>
                )}
                {!isLoading && filteredFiles.length > 0 && (
                  <PaginationControls />
                )}
              </div>
              {/* Metadata panel */}
              {showMetadataPanel && (
                <div className={explorerStyles.metadataPanel}>
                  <div className={explorerStyles.metadataPanelHeader}>
                    <h3 className={explorerStyles.metadataPanelTitle}>
                      {selectedFile ? 'Detalhes do Arquivo' : 'Detalhes do Dataset'}
                    </h3>
                    <button
                      className={explorerStyles.closeMetadataButton}
                      onClick={toggleMetadataPanel}
                    >
                      <X className={explorerStyles.closeMetadataIcon} />
                    </button>
                  </div>
                  <div className={explorerStyles.metadataPanelContent}>
                    {selectedFile ? (
                      <div className={explorerStyles.fileDetails}>
                        <div className={explorerStyles.filePreview}>
                          <img
                            src={selectedFile.presigned_url}
                            alt={selectedFile.image_name}
                            className={explorerStyles.filePreviewImage}
                          />
                        </div>
                        <div className={explorerStyles.fileInfo}>
                          <h4 className={explorerStyles.fileName}>{selectedFile.image_name}</h4>
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Tipo</span>
                            <span className={explorerStyles.propertyValue}>
                              {selectedFile.metadata.content_type || 'image/jpeg'}
                            </span>
                          </div>
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Tamanho</span>
                            <span className={explorerStyles.propertyValue}>
                              {formatFileSize(selectedFile.metadata.file_size || 0)}
                            </span>
                          </div>
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Última Modificação</span>
                            <span className={explorerStyles.propertyValue}>
                              {new Date(selectedFile.metadata.data_atualizacao).toLocaleString()}
                            </span>
                          </div>
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>ID</span>
                            <span className={explorerStyles.propertyValue}>
                              {selectedFile.image_id}
                            </span>
                          </div>
                        </div>
                        <div className={explorerStyles.fileActions}>
                          <a
                            href={selectedFile.presigned_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={explorerStyles.fileActionButton}
                          >
                            <Eye className={explorerStyles.fileActionIcon} />
                            <span>Visualizar</span>
                          </a>
                          <a
                            href={selectedFile.presigned_url}
                            download={selectedFile.image_name}
                            className={explorerStyles.fileActionButton}
                          >
                            <Download className={explorerStyles.fileActionIcon} />
                            <span>Baixar</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className={explorerStyles.datasetDetails}>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Descrição</span>
                          <p className={explorerStyles.propertyDescription}>{datasetDetails.description}</p>
                        </div>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>ID do Dataset</span>
                          <span className={explorerStyles.propertyValue}>{datasetDetails.id}</span>
                        </div>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Data de Criação</span>
                          <span className={explorerStyles.propertyValue}>{datasetDetails.created}</span>
                        </div>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Acesso</span>
                          <span className={explorerStyles.propertyValue}>{datasetDetails.access}</span>
                        </div>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Tags</span>
                          <div className={explorerStyles.propertyTags}>
                            {datasetDetails.tags.map((tag, index) => (
                              <span key={index} className={explorerStyles.tagBadge}>{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className={explorerStyles.datasetUsage}>
                          <span className={explorerStyles.propertyLabel}>Arquivos</span>
                          <div className={explorerStyles.usageBarContainer}>
                            <div
                              className={explorerStyles.usageBar}
                              style={{
                                width: `${Math.min(100, (files.length / totalFiles) * 100)}%`,
                                backgroundColor: '#3b82f6'
                              }}
                            ></div>
                          </div>
                          <div className={explorerStyles.usageDetails}>
                            <span>
                              {files.length} de {totalFiles} arquivos carregados
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        {activeTab === "analytics" && (
          <div className={explorerStyles.analyticsContainer}>
            {isLoading ? (
              <div className={explorerStyles.analyticsLoading}>
                <div className={explorerStyles.spinner}></div>
                <span className={explorerStyles.loadingText}>Carregando análises...</span>
              </div>
            ) : (
              <div className={explorerStyles.analyticsRow}>
                <div className={explorerStyles.analyticsCard}>
                  <div className={explorerStyles.analyticsCardHeader}>
                    <h3 className={explorerStyles.analyticsCardTitle}>Distribuição por Tipo</h3>
                    <div className={explorerStyles.analyticsTypeSelector}>
                      <button className={explorerStyles.analyticsTypeButton}><PieChart className={explorerStyles.analyticsTypeIcon} /></button>
                      <button className={explorerStyles.analyticsTypeButton}><BarChart className={explorerStyles.analyticsTypeIcon} /></button>
                    </div>
                  </div>
                  <div className={explorerStyles.chartContainer}>
                    <div className={explorerStyles.chartPlaceholder}>
                      <BarChart2 className={explorerStyles.chartPlaceholderIcon} />
                      <p>Dados de análise não disponíveis</p>
                    </div>
                  </div>
                </div>
                <div className={explorerStyles.analyticsCard}>
                  <div className={explorerStyles.analyticsCardHeader}>
                    <h3 className={explorerStyles.analyticsCardTitle}>Distribuição por Tamanho</h3>
                    <div className={explorerStyles.analyticsTypeSelector}>
                      <button className={explorerStyles.analyticsTypeButton}><BarChart className={explorerStyles.analyticsTypeIcon} /></button>
                      <button className={explorerStyles.analyticsTypeButton}><AreaChart className={explorerStyles.analyticsTypeIcon} /></button>
                    </div>
                  </div>
                  <div className={explorerStyles.chartContainer}>
                    <div className={explorerStyles.chartPlaceholder}>
                      <PieChart className={explorerStyles.chartPlaceholderIcon} />
                      <p>Dados de análise não disponíveis</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "query" && (
          <div className={explorerStyles.queryContainer}>
            <div className={explorerStyles.queryHeader}>
              <h2 className={explorerStyles.queryTitle}>Consulta SQL</h2>
              <div className={explorerStyles.queryLanguageSelector}>
                <span className={explorerStyles.queryLanguageLabel}>Linguagem:</span>
                <select className={explorerStyles.queryLanguageSelect}>
                  <option>SQL</option>
                  <option>Python</option>
                  <option>R</option>
                </select>
              </div>
            </div>
            <div className={explorerStyles.queryEditor}>
              <div className={explorerStyles.codeEditorHeader}>
                <div className={explorerStyles.codeEditorTabs}>
                  <div className={`${explorerStyles.codeEditorTab} ${explorerStyles.codeEditorTabActive}`}>
                    Query 1
                  </div>
                  <button className={explorerStyles.addTabButton}>
                    <PlusCircle className={explorerStyles.addTabIcon} />
                  </button>
                </div>
                <div className={explorerStyles.codeEditorActions}>
                  <button className={explorerStyles.runQueryButton}>
                    <span>Executar</span>
                  </button>
                </div>
              </div>
              <div className={explorerStyles.codeEditorContent}>
                <pre className={explorerStyles.codeBlock}>
{`SELECT 
  image_name,
  file_size,
  content_type,
  data_atualizacao
FROM dataset_files 
WHERE dataset_id = '${datasetDetails.id}'
ORDER BY data_atualizacao DESC
LIMIT 10;`}
                </pre>
              </div>
            </div>
            <div className={explorerStyles.queryResultsHeader}>
              <h3 className={explorerStyles.queryResultsTitle}>Resultados</h3>
              <span className={explorerStyles.queryResultsMeta}>
                {files.length} linhas retornadas
              </span>
            </div>
            <div className={explorerStyles.queryResults}>
              <table className={`${styles.table} ${explorerStyles.resultsTable}`}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>Nome</th>
                    <th className={styles.tableHeaderCell}>Tamanho</th>
                    <th className={styles.tableHeaderCell}>Tipo</th>
                    <th className={styles.tableHeaderCell}>Última Modificação</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {files.slice(0, 10).map(file => (
                    <tr key={file.image_id} className={styles.tableRow}>
                      <td className={styles.tableCell}>{file.image_name}</td>
                      <td className={styles.tableCellMuted}>
                        {formatFileSize(file.metadata.file_size || 0)}
                      </td>
                      <td className={styles.tableCellMuted}>
                        {file.metadata.content_type || 'image/jpeg'}
                      </td>
                      <td className={styles.tableCellMuted}>
                        {new Date(file.metadata.data_atualizacao).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {activeTab === "docs" && (
          <div className={explorerStyles.docsContainer}>
            <div className={explorerStyles.docsHeader}>
              <h2 className={explorerStyles.docsTitle}>Documentação do Dataset</h2>
              <span className={explorerStyles.docsVersion}>v{selectedDataset && selectedDataset.version || '1.0'}</span>
            </div>
            <div className={explorerStyles.docsContent}>
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Visão Geral</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>{selectedDataset && selectedDataset.description || 'Este dataset contém imagens médicas para pesquisa e análise.'}</p>
                </div>
              </div>
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Estrutura dos Dados</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>Cada arquivo de imagem possui as seguintes propriedades:</p>
                  <ul>
                    <li><code>image_id</code>: Identificador único da imagem</li>
                    <li><code>image_name</code>: Nome do arquivo da imagem</li>
                    <li><code>file_size</code>: Tamanho do arquivo em bytes</li>
                    <li><code>content_type</code>: Tipo MIME do arquivo</li>
                    <li><code>data_atualizacao</code>: Data da última modificação</li>
                  </ul>
                </div>
              </div>
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Acesso aos Dados</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>Os dados podem ser acessados através de:</p>
                  <ul>
                    <li>Interface web (atual)</li>
                    <li>API REST: <code>{API_BASE}/datasets/{datasetDetails.id}/images</code></li>
                    <li>MinIO: <code>{selectedDataset && selectedDataset.storage_type === 'copy_to_minio' ? 'Disponível' : 'Não disponível'}</code></li>
                  </ul>
                </div>
              </div>
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Uso e Licenciamento</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>Este dataset é restrito para uso acadêmico e de pesquisa. O acesso é limitado à equipe de pesquisa autorizada.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}