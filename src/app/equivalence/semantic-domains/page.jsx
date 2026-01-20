'use client';

import React, { useState } from 'react';
import  DashboardLayout  from '../../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  Folder,
  MoreVertical,
  Pencil,
  Trash2,
  BookOpen,
  ChevronRight,
  Palette
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './SemanticDomainsPage.module.css';

const COLOR_OPTIONS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#6366f1',
];

const TERMS_BY_DOMAIN = {
  dom_1: [
    { name: 'Sex/Gender', type: 'ENUM' },
    { name: 'Date of Birth', type: 'DATE' },
  ],
  dom_2: [
    { name: 'Status', type: 'ENUM' },
  ],
  dom_3: [
    { name: 'Country', type: 'STRING' },
  ],
  dom_4: [
    { name: 'Email', type: 'STRING' },
  ],
  dom_5: [
    { name: 'Amount', type: 'DECIMAL' },
  ],
};

const MOCK_DOMAINS = [
  { 
    id: 'dom_1', 
    name: 'Demographics', 
    color: '#3b82f6', 
    description: 'Personal demographic information like age, gender, birth date',
    parentId: null,
    termCount: 2,
    updatedAt: '2026-01-12T10:30:00Z',
  },
  { 
    id: 'dom_2', 
    name: 'Operations', 
    color: '#22c55e', 
    description: 'Operational and status data like workflow states, flags',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-11T14:20:00Z',
  },
  { 
    id: 'dom_3', 
    name: 'Location', 
    color: '#f59e0b', 
    description: 'Geographic and address data',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-10T09:15:00Z',
  },
  { 
    id: 'dom_4', 
    name: 'Contact', 
    color: '#ec4899', 
    description: 'Contact information like email, phone, social media',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-09T16:45:00Z',
  },
  { 
    id: 'dom_5', 
    name: 'Financial', 
    color: '#8b5cf6', 
    description: 'Financial and monetary data like prices, amounts, currencies',
    parentId: null,
    termCount: 1,
    updatedAt: '2026-01-08T11:30:00Z',
  },
];

export default function SemanticDomainsPage() {
  const [domains, setDomains] = useState(MOCK_DOMAINS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainDescription, setNewDomainDescription] = useState('');
  const [newDomainColor, setNewDomainColor] = useState(COLOR_OPTIONS[0]);

  const filteredDomains = domains.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateDomain = () => {
    if (!newDomainName.trim()) return;
    
    const newDomain = {
      id: `dom_${Date.now()}`,
      name: newDomainName.trim(),
      description: newDomainDescription.trim(),
      color: newDomainColor,
      parentId: null,
      termCount: 0,
      updatedAt: new Date().toISOString(),
    };
    
    setDomains([newDomain, ...domains]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const resetForm = () => {
    setNewDomainName('');
    setNewDomainDescription('');
    setNewDomainColor(COLOR_OPTIONS[0]);
  };

  const handleDeleteDomain = (id) => {
    setDomains(domains.filter(d => d.id !== id));
    if (selectedDomain?.id === id) setSelectedDomain(null);
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.headerTitleRow}>
              <div className={styles.titleGroup}>
                <Folder className={styles.titleIcon} />
                <h1 className={styles.titleText}>Semantic Domains</h1>
              </div>
              <button 
                onClick={() => setIsCreateModalOpen(true)}
                className={styles.newButton}
              >
                <Plus className="w-4 h-4" />
                New
              </button>
            </div>
            
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input 
                type="text"
                placeholder="Search domains..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.listArea}>
            {filteredDomains.length === 0 ? (
              <div className={styles.emptyState}>
                <Folder className={styles.emptyIcon} />
                <p className="text-sm">No domains found</p>
              </div>
            ) : (
              <div className={styles.listStack}>
                {filteredDomains.map((domain) => (
                  <div
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedDomain(domain)}
                    className={clsx(
                      styles.domainItem,
                      selectedDomain?.id === domain.id && styles.domainItemActive
                    )}
                  >
                    <div className={styles.itemContent}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemHeader}>
                          <div 
                            className={styles.colorDot}
                            style={{ backgroundColor: domain.color }}
                          />
                          <span className={styles.itemName}>
                            {domain.name}
                          </span>
                        </div>
                        <p className={styles.itemDesc}>
                          {domain.description}
                        </p>
                        <div className={styles.itemMeta}>
                          <span className={styles.metaBadge}>
                            <BookOpen className={styles.metaIcon} />
                            {domain.termCount} terms
                          </span>
                        </div>
                      </div>
                      <div className={styles.menuWrapper}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === domain.id ? null : domain.id);
                          }}
                          className={styles.menuButton}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === domain.id && (
                          <div className={styles.contextMenu}>
                            <button className={styles.menuItem}>
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDomain(domain.id);
                              }}
                              className={clsx(styles.menuItem, styles.menuItemDelete)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.mainPanel}>
          {selectedDomain ? (
            <div className={styles.detailContainer}>
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderTop}>
                  <div>
                    <div className={styles.detailTitleRow}>
                      <div 
                        className={styles.detailColorBox}
                        style={{ backgroundColor: selectedDomain.color }}
                      />
                      <h2 className={styles.detailTitle}>
                        {selectedDomain.name}
                      </h2>
                    </div>
                    <p className={styles.detailDesc}>
                      {selectedDomain.description}
                    </p>
                    <p className={styles.detailMeta}>
                      Last updated: {formatDate(selectedDomain.updatedAt)}
                    </p>
                  </div>
                  <button className={styles.editButton}>
                    Edit Domain
                  </button>
                </div>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.statsGrid}>
                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>
                      Dictionary Terms
                    </span>
                    <div className={styles.statValueRow}>
                      <BookOpen className={styles.statIcon} />
                      <span className={styles.statValue}>
                        {selectedDomain.termCount}
                      </span>
                    </div>
                    <p className={styles.statSubtext}>
                      Terms from Data Dictionary linked to this domain
                    </p>
                  </div>

                  <div className={styles.statCard}>
                    <span className={styles.statLabel}>
                      Color
                    </span>
                    <div className={styles.statValueRow}>
                      <div 
                        className={styles.colorBoxSmall}
                        style={{ backgroundColor: selectedDomain.color }}
                      />
                      <span className={styles.colorValue}>
                        {selectedDomain.color}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <BookOpen className={styles.sectionIcon} />
                      Terms in this Domain
                    </h3>
                    <Link 
                      href={`/equivalence/data-dictionary?domain=${selectedDomain.id}`}
                      className={styles.viewAllLink}
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                  
                  {selectedDomain.termCount > 0 && TERMS_BY_DOMAIN[selectedDomain.id] ? (
                    <div className={styles.termsList}>
                      {TERMS_BY_DOMAIN[selectedDomain.id].map((term, idx) => (
                        <div key={idx} className={styles.termItem}>
                          <div className={styles.termLeft}>
                            <BookOpen className="w-4 h-4 text-gray-400" />
                            <span className={styles.termName}>{term.name}</span>
                          </div>
                          <span className={styles.termType}>{term.type}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.emptyTerms}>
                      <BookOpen className={styles.emptyTermsIcon} />
                      <p className={styles.emptyTermsText}>
                        No terms in this domain yet.
                      </p>
                      <Link 
                        href="/equivalence/data-dictionary"
                        className={styles.createFirstLink}
                      >
                        <Plus className="w-4 h-4" />
                        Create first term
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <Folder className={styles.noSelectionIcon} />
              <h3 className={styles.noSelectionTitle}>Select a Domain</h3>
              <p className={styles.noSelectionText}>
                Semantic domains organize your dictionary terms into logical categories for easier management.
              </p>
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <Folder className="w-5 h-5 text-amber-500" />
                  New Semantic Domain
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className={styles.closeButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Domain Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., Demographics"
                    value={newDomainName}
                    onChange={(e) => setNewDomainName(e.target.value)}
                    className={styles.input}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Description
                  </label>
                  <textarea 
                    placeholder="Describe what kind of data belongs in this domain..."
                    value={newDomainDescription}
                    onChange={(e) => setNewDomainDescription(e.target.value)}
                    rows={2}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    <Palette className="w-4 h-4" />
                    Color
                  </label>
                  <div className={styles.colorGrid}>
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color}
                        onClick={() => setNewDomainColor(color)}
                        className={clsx(
                          styles.colorOption,
                          newDomainColor === color && styles.colorOptionSelected
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateDomain}
                  disabled={!newDomainName.trim()}
                  className={styles.createButton}
                >
                  Create Domain
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}