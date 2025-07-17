import styles from './SummarySection.module.css';

export default function SummarySection() {
  return (
    <div className={styles.summarySection}>
      <h2 className={styles.sectionTitle}>Resumo</h2>
      <div className={styles.summaryCards}>
        <SummaryCard label="Total de Fontes" value="3" />
        <SummaryCard label="Total de Datasets" value="5" />
        <SummaryCard label="Servidores Conectados" value="3" />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className={styles.summaryCard}>
      <div className={styles.cardLabel}>{label}</div>
      <div className={styles.cardValue}>{value}</div>
    </div>
  );
}