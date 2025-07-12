import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import SourceItem from '../SourceItem/SourceItem';
import ConnectionExplorerModal from './ConnectionExplorerModal/ConnectionExplorerModal';
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

  return (
    <div className={styles.mainSidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>DataFabric</h2>
        <p className={styles.sidebarSubtitle}>Gerenciador de Fontes de Dados</p>
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSectionHeader}>
          <h3 className={styles.sidebarSectionTitle}>Fontes de Dados</h3>
          <button className={styles.addButton} onClick={openDataDefineModal}>
            <PlusCircle className={styles.navIcon} />
          </button>
        </div>
        <div className={styles.sourcesList}>
          <SourceItem
            id="minio-1"
            name="MinIO Principal"
            type="MinIO"
            iconColor="Minio"
            expanded={expandedSources["minio-1"]}
            toggleSource={() => toggleSource("minio-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            datasets={[
              { name: "Imagens - Câncer de Pele (Pele Branca)" },
              { name: "Imagens - Câncer de Pele (Pele Negra)" }
            ]}
          />
          <SourceItem
            id="postgres-1"
            name="PostgreSQL Analytics"
            type="PostgreSQL"
            iconColor="Postgres"
            expanded={expandedSources["postgres-1"]}
            toggleSource={() => toggleSource("postgres-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            datasets={[
              { name: "Dados Pacientes - Hospital A", isTable: true },
              { name: "Dados Pacientes - Hospital B", isTable: true }
            ]}
          />
          <SourceItem
            id="airflow-1"
            name="Airflow Pipeline"
            type="Airflow"
            iconColor="Airflow"
            expanded={expandedSources["airflow-1"]}
            toggleSource={() => toggleSource("airflow-1")}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            openAirflowView={openAirflowView}
            datasets={[
              { name: "ETL - Dados Clinicos" }
            ]}
            isPipeline={true}
          />
          <div
            className={styles.addSourceButton}
            onClick={openDataDefineModal}
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
            <span>Explorar Conexões</span>
          </div>
        </div>
      </div>
      <ConnectionExplorerModal isOpen={explorerOpen} onClose={() => setExplorerOpen(false)} />
    </div>
  );
}