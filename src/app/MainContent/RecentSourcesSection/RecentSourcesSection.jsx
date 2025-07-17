import styles from './RecentSourcesSection.module.css';

export default function RecentSourcesSection() {
  const recentSources = [
    { name: "MinIO Principal", type: "MinIO", server: "storage-1.example.com", datasets: 2, status: "Conectado" },
    { name: "PostgreSQL Analytics", type: "PostgreSQL", server: "db-1.example.com", datasets: 2, status: "Conectado" },
    { name: "Airflow Pipeline", type: "Airflow", server: "workflow.example.com", datasets: 1, status: "Conectado" }
  ];

  return (
    <div className={styles.recentSourcesSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Fontes Recentes</h2>
        <button className={styles.sectionTitleLink}>Ver Todas</button>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Nome</th>
              <th className={styles.tableHeaderCell}>Tipo</th>
              <th className={styles.tableHeaderCell}>Servidor</th>
              <th className={styles.tableHeaderCell}>Datasets</th>
              <th className={styles.tableHeaderCell}>Status</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {recentSources.map((source, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableCell}>{source.name}</td>
                <td className={styles.tableCellMuted}>{source.type}</td>
                <td className={styles.tableCellMuted}>{source.server}</td>
                <td className={styles.tableCellMuted}>{source.datasets}</td>
                <td className={styles.tableCell}>
                  <span className={styles.statusBadge}>{source.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}