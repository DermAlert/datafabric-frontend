// Update to enable navigating to dataset explorer
import { ChevronRight, ChevronDown, Server, Folder, Table, PlusCircle } from 'lucide-react';
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
  openDatasetExplorer // New prop to handle dataset navigation
}) {
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
            {isPipeline ? "Pipelines" : "Datasets"}
          </div>
          <div className={styles.datasetList}>
            {datasets.map((dataset, index) => (
              <div 
                key={index} 
                className={styles.datasetItem}
                // Added onClick to navigate to the dataset explorer
                onClick={(e) => {
                  e.stopPropagation();
                  openDatasetExplorer({
                    id: `${id}-dataset-${index}`,
                    name: dataset.name,
                    source: name,
                    type: dataset.isTable ? "Database Table" : "File Collection",
                    // Include other dataset details as needed
                  });
                }}
              >
                {dataset.isTable ? 
                  <Table className={styles.datasetIcon} /> : 
                  <Folder className={styles.datasetIcon} />
                }
                <span>{dataset.name}</span>
              </div>
            ))}
            <div className={styles.addDatasetButton} onClick={openAddDatasetModal}>
              <PlusCircle className={styles.addDatasetIcon} />
              <span>Adicionar {isPipeline ? "Pipeline" : "Dataset"}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}