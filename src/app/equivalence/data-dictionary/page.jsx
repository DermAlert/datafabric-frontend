'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  BookOpen,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Folder,
  Hash,
  Calendar,
  Type,
  ToggleLeft,
  List,
  Tag
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './DataDictionaryPage.module.css';

const DATA_TYPES = [
  { value: 'STRING', label: 'String', icon: Type },
  { value: 'INTEGER', label: 'Integer', icon: Hash },
  { value: 'DECIMAL', label: 'Decimal', icon: Hash },
  { value: 'DATE', label: 'Date', icon: Calendar },
  { value: 'DATETIME', label: 'DateTime', icon: Calendar },
  { value: 'BOOLEAN', label: 'Boolean', icon: ToggleLeft },
  { value: 'ENUM', label: 'Enum', icon: List },
];

const MOCK_DOMAINS = [
  { id: 'dom_1', name: 'Demographics', color: '#3b82f6', description: 'Personal demographic information' },
  { id: 'dom_2', name: 'Operations', color: '#22c55e', description: 'Operational and status data' },
  { id: 'dom_3', name: 'Location', color: '#f59e0b', description: 'Geographic and address data' },
  { id: 'dom_4', name: 'Contact', color: '#ec4899', description: 'Contact information' },
  { id: 'dom_5', name: 'Financial', color: '#8b5cf6', description: 'Financial and monetary data' },
];

const MOCK_TERMS = [
  {
    id: 'term_1',
    name: 'Sex/Gender',
    displayName: 'Sexo/Gênero',
    description: 'Biological sex or gender identity of a person',
    domainId: 'dom_1',
    dataType: 'ENUM',
    standardValues: ['M', 'F', 'O'],
    synonyms: ['gender', 'sexo', 'genero', 'sex'],
    usageCount: 3,
  },
  {
    id: 'term_2',
    name: 'Status',
    displayName: 'Status',
    description: 'Current state or condition of an entity',
    domainId: 'dom_2',
    dataType: 'ENUM',
    standardValues: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'],
    synonyms: ['state', 'estado', 'situacao'],
    usageCount: 2,
  },
  {
    id: 'term_3',
    name: 'Country',
    displayName: 'País',
    description: 'Country code or name',
    domainId: 'dom_3',
    dataType: 'STRING',
    standardValues: ['BR', 'US', 'UK', 'DE', 'FR'],
    synonyms: ['pais', 'nation', 'nacao'],
    usageCount: 2,
  },
  {
    id: 'term_4',
    name: 'Email',
    displayName: 'E-mail',
    description: 'Electronic mail address - used for grouping email columns without value normalization',
    domainId: 'dom_4',
    dataType: 'STRING',
    standardValues: [],
    synonyms: ['email_address', 'correio', 'mail', 'e_mail'],
    usageCount: 1,
  },
  {
    id: 'term_5',
    name: 'Date of Birth',
    displayName: 'Data de Nascimento',
    description: 'Birth date of a person - used for grouping birthdate columns',
    domainId: 'dom_1',
    dataType: 'DATE',
    standardValues: [],
    synonyms: ['birthdate', 'data_nasc', 'dob', 'nascimento', 'dt_nascimento'],
    usageCount: 1,
  },
  {
    id: 'term_6',
    name: 'Amount',
    displayName: 'Valor',
    description: 'Monetary amount or value - used for grouping price/value columns',
    domainId: 'dom_5',
    dataType: 'DECIMAL',
    standardValues: [],
    synonyms: ['value', 'valor', 'price', 'preco', 'total', 'amount'],
    usageCount: 1,
  },
];

export default function DataDictionaryPage() {
  const [terms, setTerms] = useState(MOCK_TERMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [newTermName, setNewTermName] = useState('');
  const [newTermDisplayName, setNewTermDisplayName] = useState('');
  const [newTermDescription, setNewTermDescription] = useState('');
  const [newTermDomain, setNewTermDomain] = useState('');
  const [newTermDataType, setNewTermDataType] = useState('STRING');
  const [newTermValues, setNewTermValues] = useState('');
  const [newTermSynonyms, setNewTermSynonyms] = useState('');

  const filteredTerms = terms.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.synonyms.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDomain = !selectedDomain || t.domainId === selectedDomain;
    return matchesSearch && matchesDomain;
  });

  const getDomain = (domainId) => MOCK_DOMAINS.find(d => d.id === domainId);

  const getDataTypeIcon = (dataType) => {
    const type = DATA_TYPES.find(t => t.value === dataType);
    return type?.icon || Type;
  };

  const handleCreateTerm = () => {
    if (!newTermName.trim() || !newTermDomain) return;
    
    const newTerm = {
      id: `term_${Date.now()}`,
      name: newTermName.trim(),
      displayName: newTermDisplayName.trim() || newTermName.trim(),
      description: newTermDescription.trim(),
      domainId: newTermDomain,
      dataType: newTermDataType,
      standardValues: newTermValues.split(',').map(v => v.trim()).filter(Boolean),
      synonyms: newTermSynonyms.split(',').map(s => s.trim()).filter(Boolean),
      usageCount: 0,
    };
    
    setTerms([newTerm, ...terms]);
    resetForm();
    setIsCreateModalOpen(false);
  };

  const resetForm = () => {
    setNewTermName('');
    setNewTermDisplayName('');
    setNewTermDescription('');
    setNewTermDomain('');
    setNewTermDataType('STRING');
    setNewTermValues('');
    setNewTermSynonyms('');
  };

  const handleDeleteTerm = (id) => {
    setTerms(terms.filter(t => t.id !== id));
    if (selectedTerm?.id === id) setSelectedTerm(null);
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.sidebarLeft}>
          <div className={styles.sidebarHeader}>
            <div className={styles.headerTitle}>
              <Folder className={styles.headerIcon} />
              <h2 className={styles.titleText} style={{fontSize: '1rem', fontWeight: 600}}>Semantic Domains</h2>
            </div>
          </div>
          
          <div className={styles.listArea}>
            <button
              onClick={() => setSelectedDomain(null)}
              className={clsx(
                styles.domainButton,
                !selectedDomain
                  ? styles.domainButtonActive
                  : styles.domainButtonInactive
              )}
            >
              All Domains
            </button>
            
            <div className={styles.termsStack} style={{marginTop: '0.5rem'}}>
              {MOCK_DOMAINS.map((domain) => {
                const count = terms.filter(t => t.domainId === domain.id).length;
                return (
                  <button
                    key={domain.id}
                    onClick={() => setSelectedDomain(domain.id)}
                    className={clsx(
                      styles.domainButtonItem,
                      selectedDomain === domain.id
                        ? styles.domainButtonActive
                        : styles.domainButtonInactive
                    )}
                  >
                    <div 
                      className={styles.domainColorDot} 
                      style={{ backgroundColor: domain.color }}
                    />
                    <span className={styles.domainName}>{domain.name}</span>
                    <span className={styles.domainCount}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <Link
              href="/equivalence/semantic-domains"
              className={styles.manageLink}
            >
              <Folder className={styles.linkIcon} />
              Manage Domains
              <ChevronRight className={styles.linkArrow} />
            </Link>
          </div>
        </div>

        <div className={styles.sidebarMiddle}>
          <div className={styles.sidebarHeader}>
            <div className={styles.middleHeaderTop}>
              <div className={styles.titleGroup}>
                <BookOpen className={styles.headerIcon} />
                <h1 className={styles.titleText}>Data Dictionary</h1>
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
                placeholder="Search terms or synonyms..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.listArea}>
            {filteredTerms.length === 0 ? (
              <div className={styles.emptyState}>
                <BookOpen className={styles.emptyIcon} />
                <p className="text-sm">No terms found</p>
              </div>
            ) : (
              <div className={styles.termsStack}>
                {filteredTerms.map((term) => {
                  const domain = getDomain(term.domainId);
                  const TypeIcon = getDataTypeIcon(term.dataType);
                  
                  return (
                    <div
                      key={term.id}
                      onClick={() => setSelectedTerm(term)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedTerm(term)}
                      className={clsx(
                        styles.termItem,
                        selectedTerm?.id === term.id
                          ? styles.termItemActive
                          : ""
                      )}
                    >
                      <div className={styles.termItemContent}>
                        <div className={styles.termInfo}>
                          <div className={styles.termHeader}>
                            <TypeIcon className={styles.termTypeIcon} />
                            <span className={styles.termName}>
                              {term.name}
                            </span>
                          </div>
                          {term.displayName !== term.name && (
                            <p className={styles.termDisplayName}>
                              {term.displayName}
                            </p>
                          )}
                          <div className={styles.termMeta}>
                            {domain && (
                              <span 
                                className={styles.termDomainBadge}
                                style={{ 
                                  backgroundColor: `${domain.color}20`, 
                                  color: domain.color 
                                }}
                              >
                                {domain.name}
                              </span>
                            )}
                            <span className={styles.termDataType}>
                              {term.dataType}
                            </span>
                            {term.usageCount > 0 && (
                              <span className={styles.termDataType}>
                                • {term.usageCount} groups
                              </span>
                            )}
                          </div>
                        </div>
                        <div className={styles.menuWrapper}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === term.id ? null : term.id);
                            }}
                            className={styles.menuButton}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {menuOpenId === term.id && (
                            <div className={styles.contextMenu}>
                              <button className={styles.menuItem}>
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteTerm(term.id);
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
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className={styles.detailPanel}>
          {selectedTerm ? (
            <div className={styles.detailContainer}>
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderTop}>
                  <div>
                    <div className={styles.detailTitleRow}>
                      {(() => {
                        const TypeIcon = getDataTypeIcon(selectedTerm.dataType);
                        return <TypeIcon className={styles.detailTypeIcon} />;
                      })()}
                      <h2 className={styles.detailTitle}>
                        {selectedTerm.name}
                      </h2>
                    </div>
                    {selectedTerm.displayName !== selectedTerm.name && (
                      <p className={styles.detailSubtitle}>
                        {selectedTerm.displayName}
                      </p>
                    )}
                    <p className={styles.detailDesc}>
                      {selectedTerm.description}
                    </p>
                  </div>
                  <button className={styles.editButton}>
                    Edit Term
                  </button>
                </div>
              </div>

              <div className={styles.detailBody}>
                <div className={styles.propertiesGrid}>
                  <div className={styles.propertyCard}>
                    <span className={styles.propertyLabel}>
                      Domain
                    </span>
                    <div className={styles.propertyValueRow}>
                      {(() => {
                        const domain = getDomain(selectedTerm.domainId);
                        return domain ? (
                          <>
                            <div 
                              className={styles.propertyDot} 
                              style={{ backgroundColor: domain.color }}
                            />
                            <span className={styles.propertyText}>{domain.name}</span>
                          </>
                        ) : null;
                      })()}
                    </div>
                  </div>

                  <div className={styles.propertyCard}>
                    <span className={styles.propertyLabel}>
                      Data Type
                    </span>
                    <div className={styles.propertyValueRow}>
                      {(() => {
                        const type = DATA_TYPES.find(t => t.value === selectedTerm.dataType);
                        const TypeIcon = type?.icon || Type;
                        return (
                          <>
                            <TypeIcon className={styles.propertyIcon} />
                            <span className={styles.propertyText}>{type?.label || selectedTerm.dataType}</span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {selectedTerm.standardValues && selectedTerm.standardValues.length > 0 && (
                  <div>
                    <h3 className={styles.sectionHeader}>
                      <List className={styles.sectionIcon} />
                      Standard Values
                    </h3>
                    <p className={styles.helperText}>
                      Output values used in Column Groups for normalization.
                    </p>
                    <div className={styles.tagList}>
                      {selectedTerm.standardValues.map((val, idx) => (
                        <code 
                          key={idx}
                          className={styles.tag}
                        >
                          {val}
                        </code>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTerm.synonyms.length > 0 && (
                  <div>
                    <h3 className={styles.sectionHeader}>
                      <Tag className={styles.sectionIcon} />
                      Synonyms
                    </h3>
                    <div className={styles.tagList}>
                      {selectedTerm.synonyms.map((syn, idx) => (
                        <span 
                          key={idx}
                          className={styles.synonymTag}
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                    <p className={styles.helperText} style={{marginTop: '0.5rem'}}>
                      These synonyms help identify columns that should map to this term.
                    </p>
                  </div>
                )}

                <div>
                  <h3 className={styles.sectionHeader} style={{marginBottom: '0.75rem'}}>
                    Usage
                  </h3>
                  <p className={styles.usageText}>
                    This term is used in <strong>{selectedTerm.usageCount}</strong> column group(s).
                  </p>
                  {selectedTerm.usageCount > 0 && (
                    <Link 
                      href={`/equivalence?term=${selectedTerm.id}`}
                      className={styles.usageLink}
                    >
                      View column groups
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <BookOpen className={styles.noSelectionIcon} />
              <h3 className={styles.noSelectionTitle}>Select a Term</h3>
              <p className={styles.noSelectionText}>
                Choose a term from the dictionary to view its properties, allowed values, and usage.
              </p>
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  New Dictionary Term
                </h3>
                <button 
                  onClick={() => { setIsCreateModalOpen(false); resetForm(); }} 
                  className={styles.closeButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Name <span className={styles.required}>*</span>
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., Sex/Gender"
                      value={newTermName}
                      onChange={(e) => setNewTermName(e.target.value)}
                      className={styles.input}
                      autoFocus
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Display Name
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g., Sexo/Gênero"
                      value={newTermDisplayName}
                      onChange={(e) => setNewTermDisplayName(e.target.value)}
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Description
                  </label>
                  <textarea 
                    placeholder="Describe what this term represents..."
                    value={newTermDescription}
                    onChange={(e) => setNewTermDescription(e.target.value)}
                    rows={2}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Semantic Domain <span className={styles.required}>*</span>
                    </label>
                    <select 
                      value={newTermDomain}
                      onChange={(e) => setNewTermDomain(e.target.value)}
                      className={styles.select}
                    >
                      <option value="">Select domain...</option>
                      {MOCK_DOMAINS.map(domain => (
                        <option key={domain.id} value={domain.id}>
                          {domain.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Data Type <span className={styles.required}>*</span>
                    </label>
                    <select 
                      value={newTermDataType}
                      onChange={(e) => setNewTermDataType(e.target.value)}
                      className={styles.select}
                    >
                      {DATA_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Standard Values
                  </label>
                  <input 
                    type="text"
                    placeholder="Comma-separated values (e.g., M, F, O)"
                    value={newTermValues}
                    onChange={(e) => setNewTermValues(e.target.value)}
                    className={styles.input}
                  />
                  <p className={styles.helperText}>
                    Leave empty if no value normalization is needed (e.g., email, dates).
                  </p>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Synonyms
                  </label>
                  <input 
                    type="text"
                    placeholder="Comma-separated synonyms (e.g., gender, sexo, genero)"
                    value={newTermSynonyms}
                    onChange={(e) => setNewTermSynonyms(e.target.value)}
                    className={styles.input}
                  />
                  <p className={styles.helperText}>
                    Synonyms help automatically match columns to this term.
                  </p>
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
                  onClick={handleCreateTerm}
                  disabled={!newTermName.trim() || !newTermDomain}
                  className={styles.createButton}
                >
                  Create Term
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}