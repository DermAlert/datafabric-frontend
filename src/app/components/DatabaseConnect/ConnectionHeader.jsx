import { Search } from 'lucide-react';
import styles from '../../data-fabric-ui/globalOld.module.css'

export default function ConnectionHeader({ currentUser }) {
  return (
    <div className={styles.header}>
      <div className={styles.headerTitle}>
        <h1 className={styles.pageTitle}>Gerenciar Conexões de Banco de Dados</h1>
      </div>
      
      <div className={styles.headerRight}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Buscar conexões..."
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