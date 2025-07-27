"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './delta-sharing.module.css';
import LeftNavigation from '../components/LeftNavigation/LeftNavigation';
import DeltaSharingContent from './DeltaSharingContent';

export default function DeltaSharingPage() {
  const [expandedSources, setExpandedSources] = useState({
    "shares-1": true,
    "schemas-1": false,
    "tables-1": false,
    "recipients-1": false
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

  const returnToDashboard = () => router.push('/');
  const currentUser = {
    username: "user-teste",
    initials: "HH"
  };
  const openDatabaseConnect = () => router.push('/database');
  const openAirflowView = () => router.push('/analytics');  

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
      <DeltaSharingContent
        returnToDashboard={returnToDashboard}
        currentUser={currentUser}
      />
    </div>
  );
}

