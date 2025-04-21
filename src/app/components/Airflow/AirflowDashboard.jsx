import AirflowSummary from './AirflowSummary';
import DagsTabs from './DagsTabs';
import DagsList from './DagsList';
import styles from './AirflowDashboard.module.css';

export default function AirflowDashboard({
  dags,
  activeTab,
  setActiveTab,
  openDagDetails,
  openCreateDagModal
}) {
  return (
    <>
      <AirflowSummary dags={dags} />
      
      <DagsTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <DagsList 
        dags={dags} 
        openDagDetails={openDagDetails} 
        openCreateDagModal={openCreateDagModal} 
      />
    </>
  );
}