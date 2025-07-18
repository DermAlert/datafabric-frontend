import { PlusCircle, RefreshCw, Play, Pause, Folder, Clock, Edit } from 'lucide-react';
import StatusBadge from '../StatusBadge/StatusBadge';
import styles from './DagsList.module.css';

export default function DagsList({ dags, openDagDetails, openCreateDagModal }) {
  return (
    <>
      <div className={styles.dagsHeader}>
        <div className={styles.dagsHeaderTitle}>
          <h2 className={styles.sectionTitle}>Lista de DAGs</h2>
          <span className={styles.dagsCounter}>Total: {dags.length}</span>
        </div>
        
        <div className={styles.dagsHeaderActions}>
          <button className={styles.refreshButton}>
            <RefreshCw className={styles.refreshIcon} />
            <span>Atualizar</span>
          </button>
          <button className={styles.primaryButton} onClick={openCreateDagModal}>
            <PlusCircle className={styles.buttonIcon} />
            <span>Criar DAG</span>
          </button>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead className={styles.tableHeader}>
            <tr>
              <th className={styles.tableHeaderCell}>Nome do DAG</th>
              <th className={styles.tableHeaderCell}>Agendamento</th>
              <th className={styles.tableHeaderCell}>Última Execução</th>
              <th className={styles.tableHeaderCell}>Próxima Execução</th>
              <th className={styles.tableHeaderCell}>Status</th>
              <th className={styles.tableHeaderCell}>Ações</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {dags.map(dag => (
              <tr key={dag.id} className={styles.tableRow}>
                <td className={styles.tableCell}>
                  <div className={styles.dagNameCell} onClick={() => openDagDetails(dag.id)}>
                    <Folder className={styles.dagIcon} />
                    <span className={styles.dagName}>{dag.name}</span>
                  </div>
                </td>
                <td className={styles.tableCellMuted}>
                  <div className={styles.scheduleCell}>
                    <Clock className={styles.scheduleIcon} />
                    <span>{dag.schedule}</span>
                  </div>
                </td>
                <td className={styles.tableCellMuted}>{dag.lastRun}</td>
                <td className={styles.tableCellMuted}>{dag.nextRun}</td>
                <td className={styles.tableCell}>
                  <StatusBadge status={dag.status} />
                </td>
                <td className={styles.tableCell}>
                  <div className={styles.actionButtons}>
                    <button className={styles.iconButton}>
                      <Play className={styles.iconButtonIcon} />
                    </button>
                    <button className={styles.iconButton}>
                      {dag.status === "paused" ? <Play className={styles.iconButtonIcon} /> : <Pause className={styles.iconButtonIcon} />}
                    </button>
                    <button className={styles.iconButton}>
                      <Edit className={styles.iconButtonIcon} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}