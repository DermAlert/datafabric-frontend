import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Server, Folder, Table, PlusCircle, RefreshCw } from 'lucide-react';
import styles from './SourceItem.module.css';

export default function SourceItem({ 
  id, 
  name, 
  type, 
  iconColor,
  expanded, 
  toggleSource, 
  datasets = [], 
  isPipeline = false,
  openAddDatasetModal,
  openDatasetExplorer 
}) {
  const [sourceDatasets, setSourceDatasets] = useState(datasets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch datasets for this source if expanded
  useEffect(() => {
    if (expanded && sourceDatasets.length === 0) {
      fetchSourceDatasets();
    }
  }, [expanded]);

  const fetchSourceDatasets = async () => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    try {
      // Fetch datasets for this connection - adjust endpoint as needed
      const response = await fetch(`http://localhost:8004/api/data-connections/${id}/datasets`);
      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setSourceDatasets(data.map(dataset => ({
        ...dataset,
        isTable: dataset.type === 'table' || dataset.type === 'view'
      })));
    } catch (err) {
      console.error(`Error fetching datasets for connection ${id}:`, err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.sourceItem}>
      <div 
        className={styles.sourceHeader}
        onClick={toggleSource}
      >
        <div className={styles.sourceHeaderLeft}>
          {expanded ? 
            <ChevronDown className={styles.chevron} /> : 
            <ChevronRight className={styles.chevron} />
          }
          <Server className={styles[`sourceIcon${iconColor}`]} />
          <span className={styles.sourceLabel}>{name}</span>
        </div>
        <div className={styles[`sourceBadge${iconColor}`]}>
          {type}
        </div>
      </div>
      
      {expanded && (
        <div className={styles.sourceContent}>
          <div className={styles.sourceContentLabel}>
            {isPipeline ? "Pipelines" : ""}
          </div>
          
          <div className={styles.datasetList}>
            {loading ? (
              <div className={styles.loadingIndicator}>
                <RefreshCw className={styles.spinningIcon} size={16} />
                <span>Carregando...</span>
              </div>
            ) : error ? (
              <div className={styles.errorMessage}>
                {error}
              </div>
            ) : sourceDatasets.length === 0 ? (
              <div className={styles.emptyMessage}>
                Nenhum dataset encontrado
              </div>
            ) : (
              sourceDatasets.map((dataset, index) => (
                <div 
                  key={dataset.id || index} 
                  className={styles.datasetItem}
                  onClick={(e) => {
                    e.stopPropagation();
                    openDatasetExplorer({
                      id: dataset.id || `${id}-dataset-${index}`,
                      name: dataset.name,
                      source: name,
                      source_id: id,
                      type: dataset.isTable ? "Database Table" : "File Collection",
                    });
                  }}
                >
                  {dataset.isTable ? 
                    <Table className={styles.datasetIcon} /> : 
                    <Folder className={styles.datasetIcon} />
                  }
                  <span>{dataset.name}</span>
                </div>
              ))
            )}
            <div 
              className={styles.addDatasetButton} 
              onClick={(e) => {
                e.stopPropagation();
                openAddDatasetModal(id);
              }}
            >
              <PlusCircle className={styles.addDatasetIcon} />
              {/* <span>Adicionar {isPipeline ? "Pipeline" : "Dataset"}</span> */}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}