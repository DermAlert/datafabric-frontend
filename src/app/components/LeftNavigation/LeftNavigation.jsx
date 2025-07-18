"use client";

import { Database, Home, Grid, BarChart, Users, Settings, LogOut, Server, Activity, Compass } from 'lucide-react';
import styles from './LeftNavigation.module.css';
import { usePathname, useRouter } from 'next/navigation';

export default function LeftNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  const routeSidebarMap = {
    '/': 'home',
    '/airflow': 'airflow',
    '/databaseconnect': 'databaseconnect',
    '/explorer': 'explorer',
    '/maincontent': 'maincontent'
  };

  // Find the active route
  const activeSidebar = routeSidebarMap[pathname.toLowerCase()] || '';

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
          onClick={() => router.push('/')}
          aria-label="Home"
        >
          <Home className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "airflow" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/airflow')}
          aria-label="Airflow"
        >
          <Activity className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "databaseconnect" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/databaseconnect')}
          aria-label="Database Connect"
        >
          <Server className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "explorer" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/explorer')}
          aria-label="Explorer"
        >
          <Compass className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "maincontent" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/maincontent')}
          aria-label="Main Content"
        >
          <Grid className={styles.navIcon} />
        </button>
      </div>
      
      <div className={styles.bottomNavContainer}>
        <button className={styles.bottomNavButton} aria-label="Settings">
          <Settings className={styles.navIcon} />
        </button>
        <button className={`${styles.bottomNavButton} ${styles.bottomNavButtonMargin}`} aria-label="Logout">
          <LogOut className={styles.navIcon} />
        </button>
      </div>
    </div>
  );
}