"use client";

import { Database, Home, Grid, BarChart, Users, Settings, LogOut } from 'lucide-react';
import styles from './LeftNavigation.module.css';
import { usePathname, useRouter } from 'next/navigation';

export default function LeftNavigation() {
  const pathname = usePathname();
  const router = useRouter();

  // Map route paths to the corresponding sidebar keys for active styling
  const routeSidebarMap = {
    '/': 'home',
    '/sources': 'sources',
    '/datasets': 'datasets',
    '/analytics': 'analytics',
    '/users': 'users',
  };

  // Find the active route
  const activeSidebar = routeSidebarMap[pathname] || '';

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
          className={`${styles.navButton} ${activeSidebar === "sources" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/sources')}
          aria-label="Sources"
        >
          <Database className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "datasets" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/datasets')}
          aria-label="Datasets"
        >
          <Grid className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "analytics" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/analytics')}
          aria-label="Analytics"
        >
          <BarChart className={styles.navIcon} />
        </button>
        <button
          className={`${styles.navButton} ${activeSidebar === "users" ? styles.navButtonActive : ""}`}
          onClick={() => router.push('/users')}
          aria-label="Users"
        >
          <Users className={styles.navIcon} />
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