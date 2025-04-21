import { Search } from 'lucide-react';
import styles from './AirflowHeader.module.css';

export default function AirflowHeader({ currentUser }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <h1 className={styles.pageTitle}>Airflow - Gerenciador de Pipelines</h1>
      </div>
      
      <div className={styles.headerRight}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar DAGs..."
            className={styles.searchInput}
          />
          <Search className={styles.searchIcon} />
        </div>
        
        <div className={styles.userAvatar}>
          <span className={styles.userInitials}>{currentUser.initials}</span>
        </div>
      </div>
    </div>
  );
}