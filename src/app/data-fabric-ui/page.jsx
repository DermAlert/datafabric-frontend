"use client";
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import LeftNavigation from '../components/LeftNavigation/LeftNavigation';
import Sidebar from './Sidebar/Sidebar';
import MainContent from './MainContent/MainContent';
import AddDatasetModal from './AddDatasetModal/AddDatasetModal';
import styles from './globalOld.module.css';
import DataExplorerContent from './DataExplorerContent/DataExplorerContent';
import DatabaseConnectContent from '../components/DatabaseConnect/DatabaseConnectContent';
import AirflowContent from '../components/Airflow/AirflowContent';
import DataDefineModal from './Sidebar/AddDatasetModal/AddDatasetModal';

// Helper for simple route/page matching
function getRouteView(pathname) {
  if (pathname === '/' || pathname === '/home') return 'dashboard';
  if (pathname.startsWith('/explorer/')) return 'explorer';
  if (pathname === '/database') return 'database';
  if (pathname === '/analytics') return 'airflow';
  return 'dashboard';
}

export default function DataFabricUI() {
  const [expandedSources, setExpandedSources] = useState({
    "minio-1": true,
    "postgres-1": false,
    "airflow-1": false
  });
  const [showAddDatasetModal, setShowAddDatasetModal] = useState(false);
  const [showDataDefineModal, setShowDataDefineModal] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(null);

  const pathname = usePathname();
  const router = useRouter();

  const toggleSource = (sourceId) => {
    setExpandedSources({
      ...expandedSources,
      [sourceId]: !expandedSources[sourceId]
    });
  };

  // Modal handling
  const openDataDefineModal = () => setShowDataDefineModal(true);
  const closeDataDefineModal = () => setShowDataDefineModal(false);
  const openAddDatasetModal = () => setShowAddDatasetModal(true);
  const closeAddDatasetModal = () => setShowAddDatasetModal(false);

  // Dataset explorer navigation
  const openDatasetExplorer = (dataset) => {
    setSelectedDataset(dataset);
    router.push(`/explorer/${encodeURIComponent(dataset.name)}`);
  };

  // Navigation
  const openDatabaseConnect = () => router.push('/database');
  const openAirflowView = () => router.push('/analytics');
  const returnToDashboard = () => router.push('/');

  const currentUser = {
    username: "hannanhunny01",
    initials: "HH"
  };

  // Which view to render based on route
  const currentView = getRouteView(pathname);

  return (
    <div className={styles.mainLayout}>
      <LeftNavigation />

      {currentView === "dashboard" && (
        <>
          <Sidebar
            expandedSources={expandedSources}
            toggleSource={toggleSource}
            openAddDatasetModal={openAddDatasetModal}
            openDatasetExplorer={openDatasetExplorer}
            openAirflowView={openAirflowView}
            openDataDefineModal={openDataDefineModal}
          />
          <MainContent
            openDatasetExplorer={openDatasetExplorer}
            openDatabaseConnect={openDatabaseConnect}
            openAirflowView={openAirflowView}
            currentUser={currentUser}
          />
        </>
      )}

      {currentView === "explorer" && (
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
      {showDataDefineModal && (
        <DataDefineModal onClose={closeDataDefineModal} />
      )}
    </div>
  );
}