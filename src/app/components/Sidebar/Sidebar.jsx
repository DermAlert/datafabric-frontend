import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SourceItem from '../SourceItem/SourceItem';
import ConnectionExplorerModal from './ConnectionExplorerModal/ConnectionExplorerModal';
import DataDefineModal from './AddDatasetModal/AddDatasetModal';
import MetadataEquivalenceModal from './MetadataEquivalenceModal/MetadataEquivalenceModal';
import DataSetFilterModal from './DataSetFilterModal/DataSetFilterModal';
import EquivalenceManagerModal from './EquivalenceManagerModal/EquivalenceManagerModal';
import styles from './Sidebar.module.css';

export default function Sidebar({
  expandedSources,
  toggleSource,
  openAddDatasetModal,
  openDatasetExplorer,
  openAirflowView,
  openDataDefineModal
}) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [metadataEquivalenceOpen, setMetadataEquivalenceOpen] = useState(false);
  const [dataSetFilterOpen, setDataSetFilterOpen] = useState(false);
  const [dataDefineModalOpen, setDataDefineModalOpen] = useState(false);
  const [EquivalenceManagerOpen, setEquivalenceManagerOpen] = useState(false);

  // Fix: Use local modal state to control DataDefineModal visibility
  const handleOpenDataDefineModal = () => setDataDefineModalOpen(true);
  const handleCloseDataDefineModal = () => setDataDefineModalOpen(false);

  return (
    <div className={styles.mainSidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>DataFabric</h2>
        <p className={styles.sidebarSubtitle}>Gerenciador de Fontes de Dados</p>
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSectionHeader}>
          <h3 className={styles.sidebarSectionTitle}>Fontes de Dados</h3>
          <button className={styles.addButton} onClick={handleOpenDataDefineModal}>
            <PlusCircle className={styles.navIcon} />
          </button>
        </div>
        <div className={styles.sourcesList}>
          <SourceItem
            id="minio-1"
            name="MinIO Local"
            type="MinIO"
            iconColor="Minio"
            expanded={expandedSources["minio-1"]}
            toggleSource={() => toggleSource("minio-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            datasets={[
           
            ]}
          />
          <SourceItem
            id="postgres-1"
            name="PostgreSQL Local"
            type="PostgreSQL"
            iconColor="Postgres"
            expanded={expandedSources["postgres-1"]}
            toggleSource={() => toggleSource("postgres-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            datasets={[
              
            ]}
          />
          <SourceItem
            id="delta lake-1"
            name="Delta Lake Local"
            type="delta lake"
            iconColor="Airflow"
            expanded={expandedSources["airflow-1"]}
            toggleSource={() => toggleSource("airflow-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            openAirflowView={openAirflowView}
            datasets={[
              
            ]}
            isPipeline={true}
          />
          <div
            className={styles.addSourceButton}
            onClick={handleOpenDataDefineModal}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Adicionar Nova Fonte</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setExplorerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Explorar Colunas das Conexões</span>
          </div>
          
          <div
            className={styles.addSourceButton}
            onClick={() => setMetadataEquivalenceOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Camada de Equivalência</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setDataSetFilterOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Filtrar Dataset</span>  
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setEquivalenceManagerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Gerenciar Equivalência</span> 
        </div>
        </div>
        <DataDefineModal isOpen={dataDefineModalOpen} onClose={handleCloseDataDefineModal} /> 
        <ConnectionExplorerModal isOpen={explorerOpen} onClose={() => setExplorerOpen(false)} />
        <MetadataEquivalenceModal
          isOpen={metadataEquivalenceOpen}
          onClose={() => setMetadataEquivalenceOpen(false)}
        />
        <EquivalenceManagerModal
          isOpen={EquivalenceManagerOpen}
          onClose={() => setEquivalenceManagerOpen(false)}
        />
        
        <DataSetFilterModal
          isOpen={dataSetFilterOpen}
          onClose={() => setDataSetFilterOpen(false)}
        />
      </div>
    </div>
  );
}