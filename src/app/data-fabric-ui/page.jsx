"use client";
import { useState } from 'react';
import LeftNavigation from './LeftNavigation/LeftNavigation';
import Sidebar from './Sidebar/Sidebar';
import MainContent from './MainContent/MainContent';
import AddDatasetModal from './AddDatasetModal/AddDatasetModal';
import styles from './globalOld.module.css';
import DataExplorerContent from './DataExplorerContent/DataExplorerContent';
import DatabaseConnectContent from '../components/DatabaseConnect/DatabaseConnectContent';
import AirflowContent from '../components/Airflow/AirflowContent';

export default function DataFabricUI() {
  const [activeSidebar, setActiveSidebar] = useState("sources");
  const [expandedSources, setExpandedSources] = useState({
    "minio-1": true,
    "postgres-1": false,
    "airflow-1": false
  });
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  // State to track which view we're in: "dashboard", "explorer", "database", or "airflow"
  const [currentView, setCurrentView] = useState("dashboard");
  const [selectedDataset, setSelectedDataset] = useState(null);
  
  const toggleSource = (sourceId) => {
    setExpandedSources({
      ...expandedSources,
      [sourceId]: !expandedSources[sourceId]
    });
  };

  const openAddDatasetModal = () => {
    setShowAddDatasetModal(true);
  };

  const closeAddDatasetModal = () => {
    setShowAddDatasetModal(false);
  };

  const openDatasetExplorer = (dataset) => {
    setSelectedDataset(dataset);
    setCurrentView("explorer");
  };

  const openDatabaseConnect = () => {
    setCurrentView("database");
  };
  
  const openAirflowView = () => {
    setActiveSidebar("analytics");
    setCurrentView("airflow");
  };

  const returnToDashboard = () => {
    setCurrentView("dashboard");
    setSelectedDataset(null);
  };

  // Getting user info
  const currentUser = {
    username: "hannanhunny01", 
    initials: "HH"
  };

  return (
    <div className={styles.mainLayout}>
      <LeftNavigation 
        activeSidebar={activeSidebar} 
        setActiveSidebar={setActiveSidebar}
        openDatabaseConnect={openDatabaseConnect}
        openAirflowView={openAirflowView}
      />
      
      {currentView === "dashboard" && (
        <>
          <Sidebar 
            expandedSources={expandedSources}
            toggleSource={toggleSource}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            openAirflowView={openAirflowView}
          />
          
          <MainContent 
            openDatasetExplorer={openDatasetExplorer}
            openDatabaseConnect={openDatabaseConnect}
            openAirflowView={openAirflowView}
            currentUser={currentUser}  
          />
        </>
      )}
      
      {currentView === "explorer" && selectedDataset && (
        <DataExplorerContent 
          dataset={selectedDataset}
          returnToDashboard={returnToDashboard}
          currentUser={currentUser}
        />
      )}
      
      {currentView === "database" && (
        <DatabaseConnectContent 
          returnToDashboard={returnToDashboard}
          currentUser={currentUser}
        />
      )}
      
      {currentView === "airflow" && (
        <AirflowContent 
          returnToDashboard={returnToDashboard}
          currentUser={currentUser}
          expandedSources={expandedSources}
          toggleSource={toggleSource}
        />
      )}
      
      {showAddDatasetModal && (
        <AddDatasetModal onClose={closeAddDatasetModal} />
      )}
    </div>
  );
}