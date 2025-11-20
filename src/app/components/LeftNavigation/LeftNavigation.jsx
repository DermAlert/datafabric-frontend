"use client";

import { Database, Home, Grid, LogOut, Server, Activity, Compass, Settings } from 'lucide-react';
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

  const activeSidebar = routeSidebarMap[pathname.toLowerCase()] || '';

  return (
    <div className={styles.leftNav}>
      <div className={styles.logoContainer}>
        <div className={styles.logoIcon}>
          <Database size={20} />
        </div>
      </div>
      
      <div className={styles.navLinksContainer}>
        <button
          className={`${styles.navButton} ${activeSidebar === "home" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/deltasharing')}
          aria-label="Home"
        >
          <Home size={20} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "airflow" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/airflow')}
          aria-label="Airflow"
        >
          <Activity size={20} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "databaseconnect" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/databaseconnect')}
          aria-label="Database Connect"
        >
          <Server size={20} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "explorer" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/explorer')}
          aria-label="Explorer"
        >
          <Compass size={20} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "maincontent" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/maincontent')}
          aria-label="Main Content"
        >
          <Grid size={20} />
        </button>
      </div>
      
      <div className={styles.bottomNavContainer}>
        <button className={styles.bottomNavButton} aria-label="Settings">
          <Settings size={20} />
        </button>
        <button className={styles.bottomNavButton} aria-label="Logout">
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}