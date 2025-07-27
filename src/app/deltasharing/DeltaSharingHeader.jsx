import { Search } from 'lucide-react';
import styles from './delta-sharing.module.css';

export default function DeltaSharingHeader({ currentUser }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <h1 className={styles.pageTitle}>Delta Sharing Management</h1>
      </div>
      
      <div className={styles.headerRight}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search shares, schemas, tables..."
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

