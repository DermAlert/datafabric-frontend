import styles from './DagsTabs.module.css';

export default function DagsTabs({ activeTab, setActiveTab }) {
  return (
    <div className={styles.dagsTabs}>
      <button 
        className={`${styles.dagsTab} ${activeTab === "dags" ? styles.dagsTabActive : ""}`}
        onClick={() => setActiveTab("dags")}
      >
        DAGs
      </button>
      <button 
        className={`${styles.dagsTab} ${activeTab === "runs" ? styles.dagsTabActive : ""}`}
        onClick={() => setActiveTab("runs")}
      >
        Execuções
      </button>
      <button 
        className={`${styles.dagsTab} ${activeTab === "logs" ? styles.dagsTabActive : ""}`}
        onClick={() => setActiveTab("logs")}
      >
        Logs
      </button>
    </div>
  );
}