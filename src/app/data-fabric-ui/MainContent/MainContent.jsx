import { Search } from 'lucide-react';
import SummarySection from '../SummarySection/SummarySection';
import RecentSourcesSection from '../RecentSourcesSection/RecentSourcesSection';
import FeaturedDatasetsSection from '../FeaturedDatasetsSection/FeaturedDatasetsSection';
import styles from './MainContent.module.css';

export default function MainContent({ openDatasetExplorer }) {
  return (
    <div className={styles.mainContent}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <h1 className={styles.pageTitle}>Visão Geral</h1>
        </div>
        
        <div className={styles.headerRight}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Pesquisar..."
              className={styles.searchInput}
            />
            <Search className={styles.searchIcon} />
          </div>
          
          <div className={styles.userAvatar}>
            <span className={styles.userInitials}>US</span>
          </div>
        </div>
      </div>
      
      <div className={styles.content}>
        <SummarySection />
        <RecentSourcesSection />
        <FeaturedDatasetsSection openDatasetExplorer={openDatasetExplorer} />
      </div>
    </div>
  );
}