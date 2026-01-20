import { useState } from 'react';
import AirflowSidebar from '../AirflowSidebar/AirflowSidebar';
import AirflowHeader from '../AirflowHeader/AirflowHeader';
import AirflowDashboard from '../AirflowDashboard/AirflowDashboard';
import DagDetails from '../DagDetails/DagDetails';
import CreateDagModal from '../CreateDagModal/CreateDagModal';
import styles from '../airflow.module.css';

export default function AirflowContent({ 
  returnToDashboard, 
  currentUser, 
  expandedSources,
  toggleSource 
}) {
  const [showCreateDagModal, setShowCreateDagModal] = useState(false);
  const [activeTab, setActiveTab] = useState("dags");
  const [selectedDag, setSelectedDag] = useState(null);
  
  const openCreateDagModal = () => {
    setShowCreateDagModal(true);
  };

  const closeCreateDagModal = () => {
    setShowCreateDagModal(false);
  };

  const openDagDetails = (dagId) => {
    setSelectedDag(dagId);
  };

  const closeDagDetails = () => {
    setSelectedDag(null);
  };
  
  const dags = [
    {
      id: "etl_dados_clinicos",
      name: "ETL - Dados Clínicos",
      schedule: "0 0 * * *",
      lastRun: "2025-04-14 22:30:05",
      nextRun: "2025-04-15 22:30:00",
      status: "success",
      owner: "Ana Silva",
      duration: "45 min",
      runs: 284
    },
    {
      id: "processamento_imagens",
      name: "Processamento de Imagens",
      schedule: "0 */12 * * *",
      lastRun: "2025-04-15 00:00:12",
      nextRun: "2025-04-15 12:00:00",
      status: "running",
      owner: "Carlos Mendes",
      duration: "1h 20min",
      runs: 126
    },
    {
      id: "exportacao_dados_hospital",
      name: "Exportação de Dados - Hospital",
      schedule: "0 6 * * 1-5",
      lastRun: "2025-04-15 06:00:23",
      nextRun: "2025-04-16 06:00:00",
      status: "success",
      owner: "Julia Santos",
      duration: "15 min",
      runs: 98
    },
    {
      id: "analise_metricas_pacientes",
      name: "Análise de Métricas de Pacientes",
      schedule: "0 9 1 * *",
      lastRun: "2025-04-01 09:00:07",
      nextRun: "2025-05-01 09:00:00",
      status: "failed",
      owner: "Rafael Gomes",
      duration: "2h 10min",
      runs: 12
    }
  ];

  return (
    <>
      <AirflowSidebar 
        expandedSources={expandedSources}
        toggleSource={toggleSource}
        openCreateDagModal={openCreateDagModal}
      />
      
      <div className={styles.mainContent}>
        <AirflowHeader currentUser={currentUser} />
        
        <div className={styles.content}>
          {selectedDag ? (
            <DagDetails 
              dag={dags.find(dag => dag.id === selectedDag)}
              closeDagDetails={closeDagDetails}
            />
          ) : (
            <AirflowDashboard
              dags={dags}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              openDagDetails={openDagDetails}
              openCreateDagModal={openCreateDagModal}
            />
          )}
        </div>
      </div>
      
      {showCreateDagModal && (
        <CreateDagModal onClose={closeCreateDagModal} />
      )}
    </>
  );
}