'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Database, Layers, ChevronLeft, ChevronRight, ChevronDown, Link as LinkIcon, GitMerge, BookOpen, Folder, Columns, HardDrive, Sparkles, FileCode, Share2, Users } from 'lucide-react';
import { ModeToggle } from '@/components/ModeToggle';

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  href, 
  active, 
  collapsed 
}: { 
  icon: any, 
  label: string, 
  href: string, 
  active?: boolean, 
  collapsed: boolean 
}) => (
  <Link 
    href={href}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative ${
      active 
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
        : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800/50'
    } ${collapsed ? 'justify-center px-2' : ''}`}
  >
    <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${collapsed ? 'w-6 h-6' : ''}`} />
    
    {/* Label text - hidden when collapsed */}
    <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${
      collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
    }`}>
      {label}
    </span>

    {/* Tooltip on hover when collapsed */}
    {collapsed && (
      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
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
}: { 
  icon: any, 
  label: string, 
  collapsed: boolean,
  isExpanded: boolean,
  onToggle: () => void,
  children: React.ReactNode
}) => (
  <div>
    <button 
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-zinc-800/50 ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 transition-all ${collapsed ? 'w-6 h-6' : ''}`} />
      
      <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden flex-1 text-left ${
        collapsed ? 'w-0 opacity-0' : 'w-auto opacity-100'
      }`}>
        {label}
      </span>

      {!collapsed && (
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      )}

      {collapsed && (
        <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">
          {label}
        </div>
      )}
    </button>

    {/* Submenu */}
    {!collapsed && isExpanded && (
      <div className="ml-4 mt-1 space-y-1 border-l-2 border-gray-100 dark:border-zinc-800 pl-3">
        {children}
      </div>
    )}
  </div>
);

const SubItem = ({ label, href, active, icon: Icon }: { label: string, href: string, active?: boolean, icon?: any }) => (
  <Link 
    href={href}
    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
      active 
        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' 
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-zinc-800/50'
    }`}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {label}
  </Link>
);

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
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

  // Default values for SSR, then real values after mount
  const currentPath = mounted ? pathname : '';
  const isConnectionsActive = currentPath?.startsWith('/connections') || currentPath?.startsWith('/metadata');
  const isDataSourcesActive = currentPath === '/connections' || currentPath?.startsWith('/connections/new') || currentPath?.startsWith('/metadata');
  const isFederationActive = currentPath?.startsWith('/connections/federation');
  
  // Equivalence routes
  const isEquivalenceActive = currentPath?.startsWith('/equivalence');
  const isColumnGroupsActive = currentPath === '/equivalence' || currentPath?.startsWith('/equivalence/column-groups');
  const isDataDictionaryActive = currentPath?.startsWith('/equivalence/data-dictionary');
  const isSemanticDomainsActive = currentPath?.startsWith('/equivalence/semantic-domains');

  // Bronze route
  const isBronzeActive = currentPath?.startsWith('/bronze');

  // Silver routes
  const isSilverActive = currentPath?.startsWith('/silver');
  const isSilverDatasetsActive = currentPath === '/silver' || currentPath?.startsWith('/silver/new');
  const isSilverRulesActive = currentPath?.startsWith('/silver/rules');

  // Sharing routes
  const isSharingActive = currentPath?.startsWith('/sharing');
  const isSharingSharesActive = currentPath === '/sharing' || (currentPath?.startsWith('/sharing') && !currentPath?.includes('/recipients'));
  const isSharingRecipientsActive = currentPath?.startsWith('/sharing/recipients');

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={`border-r border-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 hidden md:flex flex-col transition-all duration-300 ease-in-out relative ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 z-10 shadow-sm"
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>

        <div className={`p-6 flex items-center ${collapsed ? 'justify-center flex-col gap-4' : 'justify-between'}`}>
          <div className="flex items-center gap-2 font-bold text-xl text-gray-900 dark:text-white transition-all overflow-hidden">
            <Layers className="w-6 h-6 text-blue-600 dark:text-blue-500 flex-shrink-0" />
            <span className={`whitespace-nowrap transition-all duration-300 ${
              collapsed ? 'w-0 opacity-0 hidden' : 'w-auto opacity-100'
            }`}>
              DataFabric
            </span>
          </div>
          <div className={collapsed ? 'scale-75' : ''}>
            <ModeToggle />
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
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

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
