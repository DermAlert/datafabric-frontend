'use client';

import React, { useState, useEffect, useCallback, memo, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Link as LinkIcon,
  GitMerge,
  BookOpen,
  Folder,
  Columns,
  HardDrive,
  Sparkles,
  FileCode,
  Share2,
  Users,
} from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';
import { clsx } from 'clsx';

// ===========================================
// Navigation Config
// ===========================================

const NAVIGATION_CONFIG = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  {
    icon: Database,
    label: 'Connections',
    subItems: [
      { icon: Database, label: 'Data Sources', href: '/connections' },
      { icon: LinkIcon, label: 'Federation', href: '/connections/federation' },
    ],
  },
  {
    icon: GitMerge,
    label: 'Equivalence',
    subItems: [
      { icon: Folder, label: 'Semantic Domains', href: '/equivalence/semantic-domains' },
      { icon: BookOpen, label: 'Data Dictionary', href: '/equivalence/data-dictionary' },
      { icon: Columns, label: 'Column Groups', href: '/equivalence' },
    ],
  },
  { icon: HardDrive, label: 'Bronze Layer', href: '/bronze' },
  {
    icon: Sparkles,
    label: 'Silver Layer',
    subItems: [
      { icon: Layers, label: 'Datasets', href: '/silver' },
      { icon: FileCode, label: 'Rules', href: '/silver/rules' },
    ],
  },
  {
    icon: Share2,
    label: 'Share',
    subItems: [
      { icon: Share2, label: 'Datasets', href: '/sharing' },
      { icon: Users, label: 'Recipients', href: '/sharing/recipients' },
    ],
  },
];

// Type guard para verificar se é um item com submenu
function hasSubMenu(item) {
  return 'subItems' in item;
}

// ===========================================
// Sidebar Item Components
// ===========================================

const SidebarItem = memo(function SidebarItem({
  icon: Icon,
  label,
  href,
  active,
  collapsed,
}) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800/50',
        collapsed && 'justify-center px-2'
      )}
      aria-current={active ? 'page' : undefined}
    >
      <Icon
        className={clsx('w-5 h-5 flex-shrink-0 transition-all', collapsed && 'w-6 h-6')}
        aria-hidden="true"
      />

      {/* Label text - hidden when collapsed */}
      <span
        className={clsx(
          'whitespace-nowrap transition-all duration-300 overflow-hidden',
          collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
        )}
      >
        {label}
      </span>

      {/* Tooltip on hover when collapsed */}
      {collapsed && (
        <div
          className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none"
          role="tooltip"
        >
          {label}
        </div>
      )}
    </Link>
  );
});

const SidebarItemWithSub = memo(function SidebarItemWithSub({
  icon: Icon,
  label,
  collapsed,
  isExpanded,
  onToggle,
  children,
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className={clsx(
          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800/50',
          collapsed && 'justify-center px-2'
        )}
        aria-expanded={isExpanded}
      >
        <Icon
          className={clsx('w-5 h-5 flex-shrink-0 transition-all', collapsed && 'w-6 h-6')}
          aria-hidden="true"
        />

        <span
          className={clsx(
            'whitespace-nowrap transition-all duration-300 overflow-hidden flex-1 text-left',
            collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
          )}
        >
          {label}
        </span>

        {!collapsed && (
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-gray-400 transition-transform',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        )}

        {collapsed && (
          <div
            className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none"
            role="tooltip"
          >
            {label}
          </div>
        )}
      </button>

      {/* Submenu */}
      {!collapsed && isExpanded && (
        <div
          className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-zinc-800 pl-3"
          role="menu"
        >
          {children}
        </div>
      )}
    </div>
  );
});

const SubItem = memo(function SubItem({ label, href, active, icon: Icon }) {
  return (
    <Link
      href={href}
      className={clsx(
        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all',
        active
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-800/50'
      )}
      role="menuitem"
      aria-current={active ? 'page' : undefined}
    >
      {Icon && <Icon className="w-4 h-4" aria-hidden="true" />}
      {label}
    </Link>
  );
});

// ===========================================
// Main Layout Component
// ===========================================

export default function DashboardLayout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({
    Connections: true,
    Equivalence: true,
    'Silver Layer': true,
    Share: true,
  });
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = useCallback((label) => {
    setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  // Memoize active states
  const activeStates = useMemo(() => {
    if (!mounted) return {};

    return {
      isConnectionsActive: pathname?.startsWith('/connections') || pathname?.startsWith('/metadata'),
      isDataSourcesActive: pathname === '/connections' || pathname?.startsWith('/connections/new') || pathname?.startsWith('/metadata'),
      isFederationActive: pathname?.startsWith('/connections/federation'),
      isEquivalenceActive: pathname?.startsWith('/equivalence'),
      isColumnGroupsActive: pathname === '/equivalence' || pathname?.startsWith('/equivalence/column-groups'),
      isDataDictionaryActive: pathname?.startsWith('/equivalence/data-dictionary'),
      isSemanticDomainsActive: pathname?.startsWith('/equivalence/semantic-domains'),
      isBronzeActive: pathname?.startsWith('/bronze'),
      isSilverActive: pathname?.startsWith('/silver'),
      isSilverDatasetsActive: pathname === '/silver' || pathname?.startsWith('/silver/new'),
      isSilverRulesActive: pathname?.startsWith('/silver/rules'),
      isSharingActive: pathname?.startsWith('/sharing'),
      isSharingSharesActive: pathname === '/sharing' || (pathname?.startsWith('/sharing') && !pathname?.includes('/recipients')),
      isSharingRecipientsActive: pathname?.startsWith('/sharing/recipients'),
    };
  }, [mounted, pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside
        className={clsx(
          'border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hidden md:flex flex-col transition-all duration-300 ease-in-out relative z-30',
          collapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 z-40 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" aria-hidden="true" />
          ) : (
            <ChevronLeft className="w-3 h-3" aria-hidden="true" />
          )}
        </button>

        {/* Header */}
        <div
          className={clsx(
            'p-6 flex items-center',
            collapsed ? 'justify-center flex-col gap-4' : 'justify-between'
          )}
        >
          <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white transition-all overflow-hidden">
            <Layers
              className="w-6 h-6 text-blue-600 dark:text-blue-500 flex-shrink-0"
              aria-hidden="true"
            />
            <span
              className={clsx(
                'whitespace-nowrap transition-all duration-300',
                collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
              )}
            >
              DataFabric
            </span>
          </div>
          <div className={collapsed ? 'scale-75' : ''}>
            <ModeToggle />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 mt-4" aria-label="Menu principal">
          <SidebarItem
            icon={LayoutDashboard}
            label="Dashboard"
            href="/"
            collapsed={collapsed}
          />

          {collapsed ? (
            <SidebarItem
              icon={Database}
              label="Connections"
              href="/connections"
              active={activeStates.isConnectionsActive}
              collapsed={collapsed}
            />
          ) : (
            <SidebarItemWithSub
              icon={Database}
              label="Connections"
              collapsed={collapsed}
              isExpanded={expandedMenus.Connections}
              onToggle={() => toggleMenu('Connections')}
            >
              <SubItem
                label="Data Sources"
                href="/connections"
                active={activeStates.isDataSourcesActive}
                icon={Database}
              />
              <SubItem
                label="Federation"
                href="/connections/federation"
                active={activeStates.isFederationActive}
                icon={LinkIcon}
              />
            </SidebarItemWithSub>
          )}

          {collapsed ? (
            <SidebarItem
              icon={GitMerge}
              label="Equivalence"
              href="/equivalence"
              active={activeStates.isEquivalenceActive}
              collapsed={collapsed}
            />
          ) : (
            <SidebarItemWithSub
              icon={GitMerge}
              label="Equivalence"
              collapsed={collapsed}
              isExpanded={expandedMenus.Equivalence}
              onToggle={() => toggleMenu('Equivalence')}
            >
              <SubItem
                label="Semantic Domains"
                href="/equivalence/semantic-domains"
                active={activeStates.isSemanticDomainsActive}
                icon={Folder}
              />
              <SubItem
                label="Data Dictionary"
                href="/equivalence/data-dictionary"
                active={activeStates.isDataDictionaryActive}
                icon={BookOpen}
              />
              <SubItem
                label="Column Groups"
                href="/equivalence"
                active={activeStates.isColumnGroupsActive}
                icon={Columns}
              />
            </SidebarItemWithSub>
          )}

          <SidebarItem
            icon={HardDrive}
            label="Bronze Layer"
            href="/bronze"
            active={activeStates.isBronzeActive}
            collapsed={collapsed}
          />

          {collapsed ? (
            <SidebarItem
              icon={Sparkles}
              label="Silver Layer"
              href="/silver"
              active={activeStates.isSilverActive}
              collapsed={collapsed}
            />
          ) : (
            <SidebarItemWithSub
              icon={Sparkles}
              label="Silver Layer"
              collapsed={collapsed}
              isExpanded={expandedMenus['Silver Layer']}
              onToggle={() => toggleMenu('Silver Layer')}
            >
              <SubItem
                label="Datasets"
                href="/silver"
                active={activeStates.isSilverDatasetsActive}
                icon={Layers}
              />
              <SubItem
                label="Rules"
                href="/silver/rules"
                active={activeStates.isSilverRulesActive}
                icon={FileCode}
              />
            </SidebarItemWithSub>
          )}

          {collapsed ? (
            <SidebarItem
              icon={Share2}
              label="Share"
              href="/sharing"
              active={activeStates.isSharingActive}
              collapsed={collapsed}
            />
          ) : (
            <SidebarItemWithSub
              icon={Share2}
              label="Share"
              collapsed={collapsed}
              isExpanded={expandedMenus.Share}
              onToggle={() => toggleMenu('Share')}
            >
              <SubItem
                label="Datasets"
                href="/sharing"
                active={activeStates.isSharingSharesActive}
                icon={Share2}
              />
              <SubItem
                label="Recipients"
                href="/sharing/recipients"
                active={activeStates.isSharingRecipientsActive}
                icon={Users}
              />
            </SidebarItemWithSub>
          )}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
