"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '../components/Sidebar/Sidebar';
import styles from './airflow.module.css';
import LeftNavigation from '../components/LeftNavigation/LeftNavigation';
import AirflowContent from './AirflowContent/AirflowContent';
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


    const returnToDashboard = () => router.push('/');
  const currentUser = {
    username: "hh",
    initials: "HH"
  };
  const openDatabaseConnect = () => router.push('/database');
  const openAirflowView = () => router.push('/analytics');  

  return (
    <div className={styles.mainLayout}>
        <LeftNavigation />
    
  
        <AirflowContent
          returnToDashboard={returnToDashboard}
          currentUser={currentUser}
          expandedSources={expandedSources}
          toggleSource={toggleSource}
        />
    </div>
  );
}
