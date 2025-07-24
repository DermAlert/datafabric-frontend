import { useState, useEffect } from 'react';
import { ArrowLeft, Star, Share2, Download, Folder, BarChart2, Code, FileText, Search, Grid, Table, Filter, Info, PlusCircle, X, Eye, Image, PieChart, BarChart, AreaChart, RefreshCw } from 'lucide-react';
import styles from '../explorer.module.css';
import explorerStyles from './DataExplorerContent.module.css';

export default function DataExplorerContent({ dataset, returnToDashboard }) {
  const [activeTab, setActiveTab] = useState("browse");
  const [currentView, setCurrentView] = useState("grid");
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showMetadataPanel, setShowMetadataPanel] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isStarred, setIsStarred] = useState(false);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [files, setFiles] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  
  // Dataset metadata - in a real app, this would come from props or API
  const datasetDetails = {
    id: dataset.id || "dataset-id",
    name: dataset.name || "Dataset Name",
    type: dataset.type || "Dataset Type",
    source: dataset.source || "Source",
    created: "2024-12-10",
    updated: "2025-04-13",
    owner: "Dr. Ana Silva",
    size: "5.3 GB",
    files: 1245,
    description: "Conjunto de imagens dermatológicas para detecção de câncer de pele em pacientes com pele clara. Inclui imagens de melanoma, carcinoma basocelular e lesões benignas.",
    tags: ["cancer", "dermatologia", "imagens", "medicina", "pele clara"],
    access: "Restrito - Equipe de Pesquisa"
  };

  // Sample image files for the dataset
  const imageFiles = [
    { id: 1, name: "IMG_001_benign.jpg", size: "2.4 MB", type: "image/jpeg", lastModified: "2025-03-15", tags: ["benigno", "processed"] },
    { id: 2, name: "IMG_002_melanoma.jpg", size: "3.1 MB", type: "image/jpeg", lastModified: "2025-03-15", tags: ["melanoma", "stage-2"] },
    { id: 3, name: "IMG_003_basal.jpg", size: "2.8 MB", type: "image/jpeg", lastModified: "2025-03-16", tags: ["carcinoma", "basal"] },
    { id: 4, name: "IMG_004_benign.jpg", size: "2.2 MB", type: "image/jpeg", lastModified: "2025-03-16", tags: ["benigno"] },
    { id: 5, name: "IMG_005_melanoma.jpg", size: "3.5 MB", type: "image/jpeg", lastModified: "2025-03-17", tags: ["melanoma", "stage-1"] },
    { id: 6, name: "IMG_006_melanoma.jpg", size: "2.9 MB", type: "image/jpeg", lastModified: "2025-03-17", tags: ["melanoma", "stage-3"] },
    { id: 7, name: "IMG_007_benign.jpg", size: "2.3 MB", type: "image/jpeg", lastModified: "2025-03-18", tags: ["benigno", "processed"] },
    { id: 8, name: "IMG_008_basal.jpg", size: "2.7 MB", type: "image/jpeg", lastModified: "2025-03-18", tags: ["carcinoma", "basal"] },
    { id: 9, name: "IMG_009_melanoma.jpg", size: "3.0 MB", type: "image/jpeg", lastModified: "2025-03-19", tags: ["melanoma", "stage-2"] },
    { id: 10, name: "IMG_010_benign.jpg", size: "2.5 MB", type: "image/jpeg", lastModified: "2025-03-19", tags: ["benigno"] },
    { id: 11, name: "IMG_011_basal.jpg", size: "2.8 MB", type: "image/jpeg", lastModified: "2025-03-20", tags: ["carcinoma", "basal"] },
    { id: 12, name: "IMG_012_melanoma.jpg", size: "3.2 MB", type: "image/jpeg", lastModified: "2025-03-20", tags: ["melanoma", "stage-1"] },
    { id: 13, name: "IMG_013_benign.jpg", size: "2.1 MB", type: "image/jpeg", lastModified: "2025-03-21", tags: ["benigno", "processed"] },
    { id: 14, name: "IMG_014_melanoma.jpg", size: "3.4 MB", type: "image/jpeg", lastModified: "2025-03-21", tags: ["melanoma", "stage-3"] },
    { id: 15, name: "IMG_015_basal.jpg", size: "2.6 MB", type: "image/jpeg", lastModified: "2025-03-22", tags: ["carcinoma", "basal"] },
    { id: 16, name: "IMG_016_benign.jpg", size: "2.3 MB", type: "image/jpeg", lastModified: "2025-03-22", tags: ["benigno"] },
  ];

  // Simulate data fetching on component mount and tab changes
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1200 + Math.random() * 800));
      
      setFiles(imageFiles);
      setFilteredFiles(imageFiles);
      
      // Calculate analytics data from actual files
      const analytics = calculateAnalytics(imageFiles);
      setAnalyticsData(analytics);
      
      setIsLoading(false);
    };

    fetchData();
  }, [dataset.id]);

  // Simulate data refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Simulate network delay for refresh
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    
    // Simulate slight data changes
    const updatedFiles = imageFiles.map(file => ({
      ...file,
      lastModified: new Date().toISOString().split('T')[0]
    }));
    
    setFiles(updatedFiles);
    setFilteredFiles(updatedFiles.filter(file => 
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ));
    
    const analytics = calculateAnalytics(updatedFiles);
    setAnalyticsData(analytics);
    
    setIsRefreshing(false);
  };

  // Calculate analytics from file data
  const calculateAnalytics = (fileData) => {
    const typeCount = {};
    const stageCount = {};
    
    fileData.forEach(file => {
      file.tags.forEach(tag => {
        if (tag.includes('melanoma') || tag.includes('carcinoma') || tag.includes('benigno')) {
          const type = tag.includes('melanoma') ? 'Melanoma' : 
                      tag.includes('carcinoma') ? 'Carcinoma Basocelular' : 'Benigno';
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
        
        if (tag.includes('stage-')) {
          const stage = `Estágio ${tag.split('-')[1]}`;
          stageCount[stage] = (stageCount[stage] || 0) + 1;
        }
      });
    });

    return {
      byType: [
        { name: "Melanoma", count: typeCount['Melanoma'] || 0, color: "#f97316" },
        { name: "Carcinoma Basocelular", count: typeCount['Carcinoma Basocelular'] || 0, color: "#8b5cf6" },
        { name: "Benigno", count: typeCount['Benigno'] || 0, color: "#22c55e" },
      ],
      byStage: [
        { name: "Estágio 1", count: stageCount['Estágio 1'] || 0, color: "#22c55e" },
        { name: "Estágio 2", count: stageCount['Estágio 2'] || 0, color: "#eab308" },
        { name: "Estágio 3", count: stageCount['Estágio 3'] || 0, color: "#ef4444" },
        { name: "Não classificado", count: fileData.length - Object.values(stageCount).reduce((a, b) => a + b, 0), color: "#94a3b8" },
      ]
    };
  };

  // Handle search with debouncing effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim() === '') {
        setFilteredFiles(files);
      } else {
        const filtered = files.filter(file => 
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        setFilteredFiles(filtered);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, files]);

  // Toggle starred status
  const toggleStarred = () => {
    setIsStarred(!isStarred);
  };

  // Toggle metadata panel
  const toggleMetadataPanel = () => {
    setShowMetadataPanel(!showMetadataPanel);
  };
  
  // Zoom control
  const handleZoomChange = (newZoom) => {
    setZoomLevel(newZoom);
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    const file = filteredFiles.find(f => f.id === fileId);
    setSelectedFile(file);
  };

  // Handle search input
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
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

  return (
    <div className={styles.mainContent}>
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
            <span className={explorerStyles.metaValue}>{isLoading ? '...' : filteredFiles.length}</span>
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
                <Search className={explorerStyles.searchIcon} />
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
                    >
                      -
                    </button>
                    <span className={explorerStyles.zoomLevel}>{Math.round(zoomLevel * 100)}%</span>
                    <button 
                      className={explorerStyles.zoomButton}
                      onClick={() => handleZoomChange(Math.min(2, zoomLevel + 0.25))}
                      disabled={zoomLevel >= 2 || isLoading}
                    >
                      +
                    </button>
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
              {/* Loading overlay */}
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
                  // Grid view
                  <div className={explorerStyles.gridView} style={{ '--zoom-level': zoomLevel }}>
                    {filteredFiles.map(file => (
                      <div 
                        key={file.id} 
                        className={`${explorerStyles.gridItem} ${selectedFile && selectedFile.id === file.id ? explorerStyles.gridItemSelected : ''}`}
                        onClick={() => handleFileSelect(file.id)}
                      >
                        <div className={explorerStyles.gridItemImageContainer}>
                          <div className={explorerStyles.gridItemImage}>
                            <Image className={explorerStyles.placeholderIcon} />
                          </div>
                        </div>
                        <div className={explorerStyles.gridItemInfo}>
                          <div className={explorerStyles.gridItemName}>{file.name}</div>
                          <div className={explorerStyles.gridItemMeta}>{file.size}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Table view
                  <div className={explorerStyles.tableViewContainer}>
                    <table className={styles.table}>
                      <thead className={styles.tableHeader}>
                        <tr>
                          <th className={styles.tableHeaderCell}>Nome</th>
                          <th className={styles.tableHeaderCell}>Tamanho</th>
                          <th className={styles.tableHeaderCell}>Tipo</th>
                          <th className={styles.tableHeaderCell}>Última Modificação</th>
                          <th className={styles.tableHeaderCell}>Tags</th>
                        </tr>
                      </thead>
                      <tbody className={styles.tableBody}>
                        {filteredFiles.map(file => (
                          <tr 
                            key={file.id} 
                            className={`${styles.tableRow} ${selectedFile && selectedFile.id === file.id ? explorerStyles.tableRowSelected : ''}`}
                            onClick={() => handleFileSelect(file.id)}
                          >
                            <td className={styles.tableCell}>
                              <div className={explorerStyles.fileNameCell}>
                                <Image className={explorerStyles.fileIcon} />
                                {file.name}
                              </div>
                            </td>
                            <td className={styles.tableCellMuted}>{file.size}</td>
                            <td className={styles.tableCellMuted}>{file.type}</td>
                            <td className={styles.tableCellMuted}>{file.lastModified}</td>
                            <td className={styles.tableCell}>
                              <div className={explorerStyles.tagsList}>
                                {file.tags.map((tag, index) => (
                                  <span key={index} className={explorerStyles.tagBadge}>{tag}</span>
                                ))}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                
                {/* No results message */}
                {!isLoading && filteredFiles.length === 0 && searchQuery && (
                  <div className={explorerStyles.noResults}>
                    <Search className={explorerStyles.noResultsIcon} />
                    <h3 className={explorerStyles.noResultsTitle}>Nenhum arquivo encontrado</h3>
                    <p className={explorerStyles.noResultsText}>
                      Tente ajustar sua busca ou limpar os filtros.
                    </p>
                  </div>
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
                      // File metadata
                      <div className={explorerStyles.fileDetails}>
                        <div className={explorerStyles.filePreview}>
                          <Image className={explorerStyles.filePreviewIcon} />
                        </div>
                        
                        <div className={explorerStyles.fileInfo}>
                          <h4 className={explorerStyles.fileName}>{selectedFile.name}</h4>
                          
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Tipo</span>
                            <span className={explorerStyles.propertyValue}>{selectedFile.type}</span>
                          </div>
                          
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Tamanho</span>
                            <span className={explorerStyles.propertyValue}>{selectedFile.size}</span>
                          </div>
                          
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Última Modificação</span>
                            <span className={explorerStyles.propertyValue}>{selectedFile.lastModified}</span>
                          </div>
                          
                          <div className={explorerStyles.fileProperty}>
                            <span className={explorerStyles.propertyLabel}>Tags</span>
                            <div className={explorerStyles.propertyTags}>
                              {selectedFile.tags.map((tag, index) => (
                                <span key={index} className={explorerStyles.tagBadge}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <div className={explorerStyles.fileActions}>
                          <button className={explorerStyles.fileActionButton}>
                            <Eye className={explorerStyles.fileActionIcon} />
                            <span>Visualizar</span>
                          </button>
                          <button className={explorerStyles.fileActionButton}>
                            <Download className={explorerStyles.fileActionIcon} />
                            <span>Baixar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Dataset metadata
                      <div className={explorerStyles.datasetDetails}>
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Descrição</span>
                          <p className={explorerStyles.propertyDescription}>{datasetDetails.description}</p>
                        </div>
                        
                        <div className={explorerStyles.datasetProperty}>
                          <span className={explorerStyles.propertyLabel}>Proprietário</span>
                          <span className={explorerStyles.propertyValue}>{datasetDetails.owner}</span>
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
                          <span className={explorerStyles.propertyLabel}>Uso de Armazenamento</span>
                          <div className={explorerStyles.usageBarContainer}>
                            <div className={explorerStyles.usageBar} style={{ width: '65%' }}></div>
                          </div>
                          <div className={explorerStyles.usageDetails}>
                            <span>{datasetDetails.size} usado de 8.0 GB alocado</span>
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
        
        {/* Analytics tab content */}
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
                    <div className={explorerStyles.chartLegend}>
                      {analyticsData?.byType.map((item, index) => (
                        <div key={index} className={explorerStyles.legendItem}>
                          <div 
                            className={explorerStyles.legendColor} 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className={explorerStyles.legendLabel}>{item.name}</span>
                          <span className={explorerStyles.legendValue}>{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className={explorerStyles.analyticsCard}>
                  <div className={explorerStyles.analyticsCardHeader}>
                    <h3 className={explorerStyles.analyticsCardTitle}>Distribuição por Estágio</h3>
                    <div className={explorerStyles.analyticsTypeSelector}>
                      <button className={explorerStyles.analyticsTypeButton}><BarChart className={explorerStyles.analyticsTypeIcon} /></button>
                      <button className={explorerStyles.analyticsTypeButton}><AreaChart className={explorerStyles.analyticsTypeIcon} /></button>
                    </div>
                  </div>
                  <div className={explorerStyles.chartContainer}>
                    <div className={explorerStyles.barChartContainer}>
                      {analyticsData?.byStage.map((item, index) => (
                        <div key={index} className={explorerStyles.barChartItem}>
                          <div className={explorerStyles.barLabel}>{item.name}</div>
                          <div className={explorerStyles.barContainer}>
                            <div 
                              className={explorerStyles.barValue} 
                              style={{ 
                                backgroundColor: item.color,
                                width: `${(item.count / Math.max(...analyticsData.byStage.map(i => i.count))) * 100}%`
                              }}
                            ></div>
                          </div>
                          <div className={explorerStyles.barCount}>{item.count}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Query tab content */}
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
  name,
  size,
  tags,
  lastModified
FROM dataset_files 
WHERE tags LIKE '%melanoma%'
ORDER BY lastModified DESC
LIMIT 10;`}
                </pre>
              </div>
            </div>
            
            <div className={explorerStyles.queryResultsHeader}>
              <h3 className={explorerStyles.queryResultsTitle}>Resultados</h3>
              <span className={explorerStyles.queryResultsMeta}>
                {filteredFiles.filter(f => f.tags.some(tag => tag.includes('melanoma'))).length} linhas retornadas
              </span>
            </div>
            
            <div className={explorerStyles.queryResults}>
              <table className={`${styles.table} ${explorerStyles.resultsTable}`}>
                <thead className={styles.tableHeader}>
                  <tr>
                    <th className={styles.tableHeaderCell}>Nome</th>
                    <th className={styles.tableHeaderCell}>Tamanho</th>
                    <th className={styles.tableHeaderCell}>Tags</th>
                    <th className={styles.tableHeaderCell}>Última Modificação</th>
                  </tr>
                </thead>
                <tbody className={styles.tableBody}>
                  {filteredFiles
                    .filter(f => f.tags.some(tag => tag.includes('melanoma')))
                    .slice(0, 10)
                    .map(file => (
                    <tr key={file.id} className={styles.tableRow}>
                      <td className={styles.tableCell}>{file.name}</td>
                      <td className={styles.tableCellMuted}>{file.size}</td>
                      <td className={styles.tableCell}>
                        <div className={explorerStyles.tagsList}>
                          {file.tags.map((tag, index) => (
                            <span key={index} className={explorerStyles.tagBadge}>{tag}</span>
                          ))}
                        </div>
                      </td>
                      <td className={styles.tableCellMuted}>{file.lastModified}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Documentation tab content */}
        {activeTab === "docs" && (
          <div className={explorerStyles.docsContainer}>
            <div className={explorerStyles.docsHeader}>
              <h2 className={explorerStyles.docsTitle}>Documentação do Dataset</h2>
              <span className={explorerStyles.docsVersion}>v2.1.0</span>
            </div>
            
            <div className={explorerStyles.docsContent}>
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Visão Geral</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>Este dataset contém imagens dermatológicas para detecção de câncer de pele, especificamente focado em pacientes com pele clara. As imagens foram coletadas e anotadas por especialistas em dermatologia.</p>
                </div>
              </div>
              
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Estrutura dos Dados</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>Cada arquivo de imagem possui as seguintes propriedades:</p>
                  <ul>
                    <li><code>name</code>: Nome do arquivo da imagem</li>
                    <li><code>size</code>: Tamanho do arquivo em MB</li>
                    <li><code>type</code>: Tipo MIME do arquivo</li>
                    <li><code>lastModified</code>: Data da última modificação</li>
                    <li><code>tags</code>: Array de tags descritivas</li>
                  </ul>
                </div>
              </div>
              
              <div className={explorerStyles.docsSection}>
                <h3 className={explorerStyles.docsSectionTitle}>Classificações</h3>
                <div className={explorerStyles.docsSectionContent}>
                  <p>As imagens são classificadas em três categorias principais:</p>
                  <ul>
                    <li><strong>Melanoma</strong>: Lesões malignas com diferentes estágios</li>
                    <li><strong>Carcinoma Basocelular</strong>: Tipo mais comum de câncer de pele</li>
                    <li><strong>Benigno</strong>: Lesões não cancerígenas</li>
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

