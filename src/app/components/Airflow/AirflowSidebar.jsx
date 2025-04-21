import { PlusCircle, Server, ChevronRight, ChevronDown, Database, Folder, Table } from 'lucide-react';
import styles from './AirflowSidebar.module.css';

export default function AirflowSidebar({ expandedSources, toggleSource, openCreateDagModal }) {
  return (
    <div className={styles.mainSidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>DataFabric</h2>
        <p className={styles.sidebarSubtitle}>Gerenciador de Fluxos de Dados</p>
      </div>
      
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSectionHeader}>
          <h3 className={styles.sidebarSectionTitle}>Fontes de Dados</h3>
          <button className={styles.addButton}>
            <PlusCircle className={styles.navIcon} />
          </button>
        </div>
        
        {/* Source List */}
        <div className={styles.sourcesList}>
          {/* MinIO Source */}
          <div className={styles.sourceItem}>
            <div 
              className={styles.sourceHeader}
              onClick={() => toggleSource("minio-1")}
            >
              <div className={styles.sourceHeaderLeft}>
                {expandedSources["minio-1"] ? 
                  <ChevronDown className={styles.chevron} /> : 
                  <ChevronRight className={styles.chevron} />
                }
                <Server className={styles.sourceIconMinio} />
                <span className={styles.sourceLabel}>MinIO Principal</span>
              </div>
              <div className={styles.sourceBadgeMinio}>
                MinIO
              </div>
            </div>
            
            {expandedSources["minio-1"] && (
              <div className={styles.sourceContent}>
                <div className={styles.sourceContentLabel}>Datasets</div>
                <div className={styles.datasetList}>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>Imagens - Câncer de Pele (Pele Branca)</span>
                  </div>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>Imagens - Câncer de Pele (Pele Negra)</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Postgres Source */}
          <div className={styles.sourceItem}>
            <div 
              className={styles.sourceHeader}
              onClick={() => toggleSource("postgres-1")}
            >
              <div className={styles.sourceHeaderLeft}>
                {expandedSources["postgres-1"] ? 
                  <ChevronDown className={styles.chevron} /> : 
                  <ChevronRight className={styles.chevron} />
                }
                <Server className={styles.sourceIconPostgres} />
                <span className={styles.sourceLabel}>PostgreSQL Analytics</span>
              </div>
              <div className={styles.sourceBadgePostgres}>
                PostgreSQL
              </div>
            </div>
            
            {expandedSources["postgres-1"] && (
              <div className={styles.sourceContent}>
                <div className={styles.sourceContentLabel}>Datasets</div>
                <div className={styles.datasetList}>
                  <div className={styles.datasetItem}>
                    <Table className={styles.datasetIcon} />
                    <span>Dados Pacientes - Hospital A</span>
                  </div>
                  <div className={styles.datasetItem}>
                    <Table className={styles.datasetIcon} />
                    <span>Dados Pacientes - Hospital B</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Airflow Source */}
          <div className={styles.sourceItem}>
            <div 
              className={styles.sourceHeader}
              onClick={() => toggleSource("airflow-1")}
            >
              <div className={styles.sourceHeaderLeft}>
                {expandedSources["airflow-1"] ? 
                  <ChevronDown className={styles.chevron} /> : 
                  <ChevronRight className={styles.chevron} />
                }
                <Server className={styles.sourceIconAirflow} />
                <span className={styles.sourceLabel}>Airflow Pipeline</span>
              </div>
              <div className={styles.sourceBadgeAirflow}>
                Airflow
              </div>
            </div>
            
            {expandedSources["airflow-1"] && (
              <div className={styles.sourceContent}>
                <div className={styles.sourceContentLabel}>Pipelines</div>
                <div className={styles.datasetList}>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>ETL - Dados Clinicos</span>
                  </div>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>Processamento de Imagens</span>
                  </div>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>Exportação de Dados - Hospital</span>
                  </div>
                  <div className={styles.datasetItem}>
                    <Folder className={styles.datasetIcon} />
                    <span>Análise de Métricas de Pacientes</span>
                  </div>
                  <div className={styles.addDatasetButton} onClick={openCreateDagModal}>
                    <PlusCircle className={styles.addDatasetIcon} />
                    <span>Adicionar Pipeline</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}