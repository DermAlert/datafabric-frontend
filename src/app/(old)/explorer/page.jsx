"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar/Sidebar';
import DataExplorerContent from './DataExplorerContent/DataExplorerContent';
import styles from './explorer.module.css';
import LeftNavigation from '../components/LeftNavigation/LeftNavigation';

export default function MainContentPage() {
  const [expandedSources, setExpandedSources] = useState({
    "minio-1": true,
    "postgres-1": false,
    "airflow-1": false
  });

  const router = useRouter();

  const toggleSource = (sourceId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const openDatasetExplorer = (dataset) => {
    router.push(`/explorer/${encodeURIComponent(dataset.name)}`);
  };

  const openDatabaseConnect = () => router.push('/database');
  const openAirflowView = () => router.push('/analytics');
  const [selectedDataset, setSelectedDataset] = useState([
              { name: "Imagens - Câncer de Pele (Pele Brancaaaa)" },
              { name: "Imagens - Câncer de Pele (Pele Negra)" }
            ]);
    const returnToDashboard = () => router.push('/');
  const currentUser = {
    username: "hannanhunny01",
    initials: "HH"
  };

  return (
    <div className={styles.mainLayout}>
        <LeftNavigation />
    
      <Sidebar
        expandedSources={expandedSources}
        toggleSource={toggleSource}
        openAddDatasetModal={() => {}}
        openDatasetExplorer={openDatasetExplorer}
        openAirflowView={openAirflowView}
        openDataDefineModal={() => {}}
      />
        <DataExplorerContent
          dataset={selectedDataset}
          returnToDashboard={returnToDashboard}
          currentUser={currentUser}
        />
    </div>
  );
}
