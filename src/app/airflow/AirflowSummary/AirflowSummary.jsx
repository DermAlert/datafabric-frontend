import styles from './AirflowSummary.module.css';

export default function AirflowSummary({ dags }) {
  // Calculate various metrics
  const totalDags = dags.length;
  const activeDags = dags.filter(dag => dag.status === "running" || dag.status === "success").length;
  const executionsToday = dags.filter(dag => dag.lastRun.startsWith("2025-04-15")).length;
  
  // Find the next scheduled execution
  const now = new Date("2025-04-15T20:51:00");
  let nextExecution = null;
  let timeUntilNext = null;
  
  dags.forEach(dag => {
    const nextRunTime = new Date(dag.nextRun);
    if (nextRunTime > now && (!nextExecution || nextRunTime < nextExecution)) {
      nextExecution = nextRunTime;
      timeUntilNext = Math.floor((nextRunTime - now) / 3600000); // Hours
    }
  });

  return (
    <div className={styles.airflowSummary}>
      <div className={styles.summaryCards}>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Total de DAGs</div>
          <div className={styles.cardValue}>{totalDags}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>DAGs Ativos</div>
          <div className={styles.cardValue}>{activeDags}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Execuções Hoje</div>
          <div className={styles.cardValue}>{executionsToday}</div>
        </div>
        <div className={styles.summaryCard}>
          <div className={styles.cardLabel}>Próxima Execução</div>
          <div className={styles.cardValueTime}>
            {nextExecution ? nextExecution.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : "N/A"}
          </div>
          {nextExecution && (
            <div className={styles.cardValueTimeDescription}>
              Em {timeUntilNext} {timeUntilNext === 1 ? 'hora' : 'horas'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}