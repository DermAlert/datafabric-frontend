import styles from './RecentSourcesSection.module.css';

export default function RecentSourcesSection() {
const recentSources = [
  { name: "PostgreSQL Local", type: "PostgreSQL", server: "localhost:5432", datasets: 3, status: "Conectado" },
  { name: "MinIO Local", type: "MinIO", server: "localhost:9000", datasets: 2, status: "Conectado" },
  { name: "Delta Lake Local", type: "DeltaLake", server: "localhost:8765", datasets: 1, status: "Conectado" }
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
              <th className={styles.tableHeaderCell}>Status</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {recentSources.map((source, index) => (
              <tr key={index} className={styles.tableRow}>
                <td className={styles.tableCell}>{source.name}</td>
                <td className={styles.tableCellMuted}>{source.type}</td>
                <td className={styles.tableCellMuted}>{source.server}</td>
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