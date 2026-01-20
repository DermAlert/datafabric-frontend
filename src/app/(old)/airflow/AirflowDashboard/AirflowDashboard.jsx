import AirflowSummary from '../AirflowSummary/AirflowSummary';
import DagsTabs from '../DagsTabs/DagsTabs';
import DagsList from '../DagsList/DagsList';
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