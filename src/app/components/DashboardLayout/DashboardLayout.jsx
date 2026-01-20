'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Layers, ChevronLeft, ChevronRight, ChevronDown, Link as LinkIcon, GitMerge, BookOpen, Folder, Columns, HardDrive, Sparkles, FileCode, Share2, Users } from 'lucide-react';
import { ModeToggle } from '../ModeToggle';
import styles from './DashboardLayout.module.css';
import { clsx } from 'clsx';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active, 
  collapsed 
}) => (
  <Link 
    href={href}
    className={clsx(
      styles.navItem,
      active ? styles.navItemActive : styles.navItemInactive,
      collapsed && styles.navItemCollapsed
    )}
  >
    <Icon className={clsx(styles.navIcon, collapsed && styles.navIconCollapsed)} />
    
    <span className={clsx(styles.navLabel, collapsed ? styles.navLabelHidden : styles.navLabelVisible)}>
      {label}
    </span>

    {collapsed && (
      <div className={styles.tooltip}>
        {label}
      </div>
    )}
  </Link>
);

const SidebarItemWithSub = ({ 
  icon: Icon, 
  label, 
  collapsed,
  isExpanded,
  onToggle,
  children
}) => (
  <div>
    <button 
      onClick={onToggle}
      className={clsx(
        styles.navItem,
        styles.navItemInactive,
        collapsed && styles.navItemCollapsed,
        "w-full"
      )}
    >
      <Icon className={clsx(styles.navIcon, collapsed && styles.navIconCollapsed)} />
      
      <span className={clsx(styles.navLabel, collapsed ? styles.navLabelHidden : styles.navLabelVisible)}>
        {label}
      </span>

      {!collapsed && (
        <ChevronDown className={clsx(styles.chevron, isExpanded && styles.chevronRotated)} />
      )}

      {collapsed && (
        <div className={styles.tooltip}>
          {label}
        </div>
      )}
    </button>

    {!collapsed && isExpanded && (
      <div className={styles.subMenu}>
        {children}
      </div>
    )}
  </div>
);

const SubItem = ({ label, href, active, icon: Icon }) => (
  <Link 
    href={href}
    className={clsx(
      styles.subItem,
      active ? styles.subItemActive : styles.subItemInactive
    )}
  >
    {Icon && <Icon className={styles.subIcon} />}
    {label}
  </Link>
);

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [connectionsExpanded, setConnectionsExpanded] = useState(true);
  const [equivalenceExpanded, setEquivalenceExpanded] = useState(true);
  const [silverExpanded, setSilverExpanded] = useState(true);
  const [sharingExpanded, setSharingExpanded] = useState(true);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentPath = mounted ? pathname : '';
  const isConnectionsActive = currentPath?.startsWith('/connections') || currentPath?.startsWith('/metadata');
  const isDataSourcesActive = currentPath === '/connections' || currentPath?.startsWith('/connections/new') || currentPath?.startsWith('/metadata');
  const isFederationActive = currentPath?.startsWith('/connections/federation');
  
  const isEquivalenceActive = currentPath?.startsWith('/equivalence');
  const isColumnGroupsActive = currentPath === '/equivalence' || currentPath?.startsWith('/equivalence/column-groups');
  const isDataDictionaryActive = currentPath?.startsWith('/equivalence/data-dictionary');
  const isSemanticDomainsActive = currentPath?.startsWith('/equivalence/semantic-domains');

  const isBronzeActive = currentPath?.startsWith('/bronze');

  const isSilverActive = currentPath?.startsWith('/silver');
  const isSilverDatasetsActive = currentPath === '/silver' || currentPath?.startsWith('/silver/new');
  const isSilverRulesActive = currentPath?.startsWith('/silver/rules');

  const isSharingActive = currentPath?.startsWith('/sharing');
  const isSharingSharesActive = currentPath === '/sharing' || (currentPath?.startsWith('/sharing') && !currentPath?.includes('/recipients'));
  const isSharingRecipientsActive = currentPath?.startsWith('/sharing/recipients');

  return (
    <div className={styles.layoutContainer}>
      <aside 
        className={clsx(
          styles.sidebar,
          collapsed ? styles.sidebarCollapsed : styles.sidebarExpanded
        )}
      >
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className={styles.toggleButton}
        >
          {collapsed ? <ChevronRight className={styles.subIcon} /> : <ChevronLeft className={styles.subIcon} />}
        </button>

        <div className={clsx(
          styles.header,
          collapsed ? styles.headerCollapsed : styles.headerExpanded
        )}>
          <div className={styles.brand}>
            <Layers className={styles.brandIcon} />
            <span className={clsx(styles.brandText, collapsed ? styles.brandTextHidden : styles.brandTextVisible)}>
              DataFabric
            </span>
          </div>
          <div className={collapsed ? styles.modeToggleWrapperCollapsed : styles.modeToggleWrapper}>
            <ModeToggle />
          </div>
        </div>
        
        <nav className={styles.nav}>
          <SidebarItem icon={LayoutDashboard} label="Dashboard" href="/" collapsed={collapsed} />
          
          {collapsed ? (
            <SidebarItem icon={Database} label="Connections" href="/connections" active={isConnectionsActive} collapsed={collapsed} />
          ) : (
            <SidebarItemWithSub 
              icon={Database} 
              label="Connections" 
              collapsed={collapsed}
              isExpanded={connectionsExpanded}
              onToggle={() => setConnectionsExpanded(!connectionsExpanded)}
            >
              <SubItem label="Data Sources" href="/connections" active={isDataSourcesActive} icon={Database} />
              <SubItem label="Federation" href="/connections/federation" active={isFederationActive} icon={LinkIcon} />
            </SidebarItemWithSub>
          )}

          {collapsed ? (
            <SidebarItem icon={GitMerge} label="Equivalence" href="/equivalence" active={isEquivalenceActive} collapsed={collapsed} />
          ) : (
            <SidebarItemWithSub 
              icon={GitMerge} 
              label="Equivalence" 
              collapsed={collapsed}
              isExpanded={equivalenceExpanded}
              onToggle={() => setEquivalenceExpanded(!equivalenceExpanded)}
            >
              <SubItem label="Semantic Domains" href="/equivalence/semantic-domains" active={isSemanticDomainsActive} icon={Folder} />
              <SubItem label="Data Dictionary" href="/equivalence/data-dictionary" active={isDataDictionaryActive} icon={BookOpen} />
              <SubItem label="Column Groups" href="/equivalence" active={isColumnGroupsActive} icon={Columns} />
            </SidebarItemWithSub>
          )}

          <SidebarItem icon={HardDrive} label="Bronze Layer" href="/bronze" active={isBronzeActive} collapsed={collapsed} />

          {collapsed ? (
            <SidebarItem icon={Sparkles} label="Silver Layer" href="/silver" active={isSilverActive} collapsed={collapsed} />
          ) : (
            <SidebarItemWithSub 
              icon={Sparkles} 
              label="Silver Layer" 
              collapsed={collapsed}
              isExpanded={silverExpanded}
              onToggle={() => setSilverExpanded(!silverExpanded)}
            >
              <SubItem label="Datasets" href="/silver" active={isSilverDatasetsActive} icon={Layers} />
              <SubItem label="Rules" href="/silver/rules" active={isSilverRulesActive} icon={FileCode} />
            </SidebarItemWithSub>
          )}

          {collapsed ? (
            <SidebarItem icon={Share2} label="Share" href="/sharing" active={isSharingActive} collapsed={collapsed} />
          ) : (
            <SidebarItemWithSub 
              icon={Share2} 
              label="Share" 
              collapsed={collapsed}
              isExpanded={sharingExpanded}
              onToggle={() => setSharingExpanded(!sharingExpanded)}
            >
              <SubItem label="Datasets" href="/sharing" active={isSharingSharesActive} icon={Share2} />
              <SubItem label="Recipients" href="/sharing/recipients" active={isSharingRecipientsActive} icon={Users} />
            </SidebarItemWithSub>
          )}
        </nav>
      </aside>

      <main className={styles.mainContent}>
        {children}
      </main>
    </div>
  );
}