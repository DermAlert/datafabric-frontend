import { Database, Server, Home, Grid, BarChart, Users, Settings, LogOut } from 'lucide-react';
import styles from './LeftNavigation.module.css';

export default function LeftNavigation({ activeSidebar, setActiveSidebar, openDatabaseConnect, openAirflowView }) {
  return (
    <div className={styles.leftNav}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Database className={styles.logoIconInner} />
        </div>
      </div>
      
      <div className={styles.navLinksContainer}>
        <button 
          className={`${styles.navButton} ${activeSidebar === "home" ? styles.navButtonActive : ""}`}
          onClick={() => setActiveSidebar("home")}
        >
          <Home className={styles.navIcon} />
        </button>
        <button 
          className={`${styles.navButton} ${activeSidebar === "sources" ? styles.navButtonActive : ""}`}
          onClick={() => {
            setActiveSidebar("sources");
          }}
        >
          <Database className={styles.navIcon} />
        </button>
        <button 
          className={`${styles.navButton} ${activeSidebar === "datasets" ? styles.navButtonActive : ""}`}
          onClick={() => setActiveSidebar("datasets")}
        >
          <Grid className={styles.navIcon} />
        </button>
        <button 
          className={`${styles.navButton} ${activeSidebar === "analytics" ? styles.navButtonActive : ""}`}
          onClick={() => {
            setActiveSidebar("analytics");
            openAirflowView(); 
          }}
        >
          <BarChart className={styles.navIcon} />
        </button>
        <button 
          className={`${styles.navButton} ${activeSidebar === "users" ? styles.navButtonActive : ""}`}
          onClick={() => setActiveSidebar("users")}
        >
          <Users className={styles.navIcon} />
        </button>
      </div>
      
      <div className={styles.bottomNavContainer}>
        <button className={styles.bottomNavButton}>
          <Settings className={styles.navIcon} />
        </button>
        <button className={`${styles.bottomNavButton} ${styles.bottomNavButtonMargin}`}>
          <LogOut className={styles.navIcon} />
        </button>
      </div>
    </div>
  );
}