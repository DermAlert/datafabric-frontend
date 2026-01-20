"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import LeftNavigation from '../components/LeftNavigation/LeftNavigation';
import Sidebar from '../components/Sidebar/Sidebar';
import TriageContent from './TriageContent/TriageContent';
import styles from './triagePage.module.css';

export default function TriagePage() {
  const router = useRouter();
  const [expandedSources, setExpandedSources] = useState({
    "minio-1": true,
    "postgres-1": false
  });

  const toggleSource = (sourceId) => {
    setExpandedSources((prev) => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };

  const openDatasetExplorer = (dataset) => {
    router.push(`/explorer/${encodeURIComponent(dataset.name)}`);
  };

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

      <div className={styles.contentWrapper}>
        <TriageContent />
      </div>
    </div>
  );
}