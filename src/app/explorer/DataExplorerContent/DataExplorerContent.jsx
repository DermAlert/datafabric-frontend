"use client";
import { useState, useEffect } from 'react';
import { 
  ArrowLeft, Star, Share2, Download, Folder, BarChart2, Code, FileText, RefreshCw 
} from 'lucide-react';
import SearchDatasetsModal from '../SearchDatasetsModal/SearchDatasetsModal';
import BrowseTab from '../BrowseTab/BrowseTab';
import styles from './DataExplorerContent.module.css';

const AnalyticsTab = () => <div className={styles.placeholderTab}>Análise em breve</div>;
const QueryTab = () => <div className={styles.placeholderTab}>Query Editor em breve</div>;
const DocsTab = ({ dataset }) => <div className={styles.placeholderTab}>Documentação v{dataset.version}</div>;

const API_BASE = 'http://localhost:8004/api';

export default function DataExplorerContent({ dataset, returnToDashboard }) {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [datasetLoaded, setDatasetLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("browse");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStarred, setIsStarred] = useState(false);
  
  // Data State
  const [files, setFiles] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
      setSelectedDataset({ id });
      setShowSearchModal(false);
    } else if (dataset && dataset.id) {
      setSelectedDataset(dataset);
      setDatasetLoaded(true);
    } else {
      setShowSearchModal(true);
    }
  }, []);

  useEffect(() => {
    if (selectedDataset?.id && !selectedDataset.name) {
      fetch(`${API_BASE}/datasets/${selectedDataset.id}`)
        .then(res => res.json())
        .then(data => {
          setSelectedDataset(data);
          setDatasetLoaded(true);
        })
        .catch(() => setShowSearchModal(true));
    } else if (selectedDataset?.name) {
      setDatasetLoaded(true);
    }
  }, [selectedDataset?.id]);

  const fetchImages = async (page = 1, size = 20) => {
    if (!selectedDataset?.id) return;
    setIsLoadingFiles(true);
    try {
      const response = await fetch(`${API_BASE}/datasets/${selectedDataset.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ page, size })
      });
      const data = await response.json();
      setFiles(data.items || []);
      setTotalFiles(data.total || 0);
    } catch (error) {
      console.error(error);
      setFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchImages(1, 20);
    setIsRefreshing(false);
  };

  const datasetDetails = selectedDataset || {
    name: "Dataset desconhecido",
    source: "N/A",
    type: "N/A",
    updated: "N/A",
    version: "1.0",
    description: "Sem descrição",
    tags: []
  };

  return (
    <div className={styles.mainContainer}>
      {showSearchModal && (
        <SearchDatasetsModal
          onClose={() => setShowSearchModal(false)}
          onSelectDataset={(ds) => {
            setSelectedDataset(ds);
            setShowSearchModal(false);
            setDatasetLoaded(true);
          }}
        />
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={returnToDashboard}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className={styles.title}>{datasetDetails.name}</h1>
            <div className={styles.subtitle}>{datasetDetails.source} • {datasetDetails.storage_type}</div>
          </div>
        </div>
        <div className={styles.headerActions}>
           <button 
             className={`${styles.actionBtn} ${isRefreshing ? styles.spinning : ''}`} 
             onClick={handleRefresh}
           ><RefreshCw size={18} /></button>import LeftNavigation from '../components/LeftNavigation/LeftNavigation';

           <button 
             className={`${styles.actionBtn} ${isStarred ? styles.active : ''}`}
             onClick={() => setIsStarred(!isStarred)}
           ><Star size={18} /></button>
           <button className={styles.actionBtn}><Share2 size={18} /></button>
           <button className={styles.actionBtn}><Download size={18} /></button>
           <div className={styles.avatar}>US</div>
        </div>
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
           {['browse', 'analytics', 'query', 'docs'].map(tab => (
             <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
                onClick={() => setActiveTab(tab)}
             >
                {tab === 'browse' && <Folder size={16}/>}
                {tab === 'analytics' && <BarChart2 size={16}/>}
                {tab === 'query' && <Code size={16}/>}
                {tab === 'docs' && <FileText size={16}/>}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
             </button>
           ))}
        </div>
        <div className={styles.metaSummary}>
            <div className={styles.metaItem}>
                <label>Updated</label>
                <span>{new Date().toLocaleDateString()}</span>
            </div>
            <div className={styles.metaItem}>
                <label>Files</label>
                <span>{totalFiles}</span>
            </div>
        </div>
      </div>

      <div className={styles.contentBody}>
        {activeTab === 'browse' && (
            <BrowseTab 
                datasetDetails={datasetDetails}
                files={files}
                totalFiles={totalFiles}
                isLoading={isLoadingFiles}
                onFetchImages={fetchImages}
                onRefresh={handleRefresh}
            />
        )}
        {activeTab === 'analytics' && <AnalyticsTab />}
        {activeTab === 'query' && <QueryTab />}
        {activeTab === 'docs' && <DocsTab dataset={datasetDetails} />}
      </div>
    </div>
  );
}