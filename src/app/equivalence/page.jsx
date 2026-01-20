'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  X, 
  Search, 
  Columns,
  ChevronRight,
  MoreVertical,
  Pencil,
  Trash2,
  Link as LinkIcon,
  Database,
  ArrowRight,
  GitMerge,
  BookOpen,
  Layers
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './EquivalencePage.module.css';

const MOCK_COLUMN_GROUPS = [
  {
    id: 'grp_1',
    name: 'sex_unified',
    description: 'Unified sex/gender column across all data sources',
    dictionaryTerm: { id: 'term_1', name: 'Sex/Gender', domain: 'Demographics', dataType: 'ENUM', standardValues: ['M', 'F', 'O'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_1', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'sex', sampleValues: ['M', 'F'] },
      { id: 'map_2', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'users', column: 'gender', sampleValues: ['male', 'female'] },
      { id: 'map_3', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'pacientes', column: 'sexo_paciente', sampleValues: ['masculino', 'feminino'] },
    ],
    valueMappings: [
      { source: 'male', target: 'M', count: 1523 },
      { source: 'female', target: 'F', count: 1891 },
      { source: 'masculino', target: 'M', count: 892 },
      { source: 'feminino', target: 'F', count: 1045 },
      { source: 'M', target: 'M', count: 3421 },
      { source: 'F', target: 'F', count: 3892 },
    ],
    updatedAt: '2026-01-12T10:30:00Z',
  },
  {
    id: 'grp_2',
    name: 'status_unified',
    description: 'Unified status column for orders and transactions',
    dictionaryTerm: { id: 'term_2', name: 'Status', domain: 'Operations', dataType: 'ENUM', standardValues: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_4', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'orders', column: 'status', sampleValues: ['active', 'pending', 'done'] },
      { id: 'map_5', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'transactions', column: 'estado', sampleValues: ['ativo', 'pendente', 'concluido'] },
    ],
    valueMappings: [
      { source: 'active', target: 'ACTIVE', count: 5432 },
      { source: 'ativo', target: 'ACTIVE', count: 2341 },
      { source: 'pending', target: 'PENDING', count: 892 },
      { source: 'pendente', target: 'PENDING', count: 234 },
      { source: 'done', target: 'COMPLETED', count: 8921 },
      { source: 'concluido', target: 'COMPLETED', count: 4521 },
    ],
    updatedAt: '2026-01-11T14:20:00Z',
  },
  {
    id: 'grp_3',
    name: 'country_unified',
    description: 'Unified country codes',
    dictionaryTerm: { id: 'term_3', name: 'Country', domain: 'Location', dataType: 'STRING', standardValues: ['BR', 'US', 'UK', 'DE', 'FR'] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_6', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'addresses', column: 'country', sampleValues: ['Brazil', 'USA'] },
      { id: 'map_7', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'locations', column: 'pais', sampleValues: ['Brasil', 'Estados Unidos'] },
    ],
    valueMappings: [
      { source: 'Brazil', target: 'BR', count: 12453 },
      { source: 'Brasil', target: 'BR', count: 8921 },
      { source: 'USA', target: 'US', count: 5432 },
      { source: 'Estados Unidos', target: 'US', count: 3211 },
    ],
    updatedAt: '2026-01-10T09:15:00Z',
  },
  {
    id: 'grp_4',
    name: 'email_unified',
    description: 'Unified email columns - semantic grouping without value normalization',
    dictionaryTerm: { id: 'term_4', name: 'Email', domain: 'Contact', dataType: 'STRING', standardValues: [] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_8', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'email', sampleValues: ['joao@email.com', 'maria@gmail.com'] },
      { id: 'map_9', connection: 'MongoDB UserData', connectionColor: '#a855f7', table: 'users', column: 'email', sampleValues: ['john@company.com', 'jane@work.org'] },
      { id: 'map_10', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'clientes', column: 'email_cliente', sampleValues: ['cliente1@loja.com', 'cliente2@shop.br'] },
    ],
    valueMappings: [],
    updatedAt: '2026-01-09T11:00:00Z',
  },
  {
    id: 'grp_5',
    name: 'birthdate_unified',
    description: 'Unified birth date columns - groups date columns without value transformation',
    dictionaryTerm: { id: 'term_5', name: 'Date of Birth', domain: 'Demographics', dataType: 'DATE', standardValues: [] },
    useTermStandardValues: true,
    customStandardValues: [],
    columnMappings: [
      { id: 'map_11', connection: 'PostgreSQL Production', connectionColor: '#3b82f6', table: 'patients', column: 'birth_date', sampleValues: ['1990-05-15', '1985-12-01'] },
      { id: 'map_12', connection: 'MySQL Analytics', connectionColor: '#22c55e', table: 'pacientes', column: 'data_nasc', sampleValues: ['1992-03-20', '1978-08-10'] },
    ],
    valueMappings: [],
    updatedAt: '2026-01-08T16:45:00Z',
  },
];

const MOCK_DICTIONARY_TERMS = [
  { id: 'term_1', name: 'Sex/Gender', domain: 'Demographics', dataType: 'ENUM', values: ['M', 'F'] },
  { id: 'term_2', name: 'Status', domain: 'Operations', dataType: 'ENUM', values: ['ACTIVE', 'INACTIVE', 'PENDING', 'COMPLETED'] },
  { id: 'term_3', name: 'Country', domain: 'Location', dataType: 'STRING', values: [] },
  { id: 'term_4', name: 'Email', domain: 'Contact', dataType: 'STRING', values: [] },
  { id: 'term_5', name: 'Date of Birth', domain: 'Demographics', dataType: 'DATE', values: [] },
];

export default function EquivalencePage() {
  const [groups, setGroups] = useState(MOCK_COLUMN_GROUPS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [newGroupTerm, setNewGroupTerm] = useState('');

  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    g.dictionaryTerm?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) return;
    
    const term = MOCK_DICTIONARY_TERMS.find(t => t.id === newGroupTerm);
    const newGroup = {
      id: `grp_${Date.now()}`,
      name: newGroupName.trim(),
      description: newGroupDescription.trim(),
      dictionaryTerm: term ? { id: term.id, name: term.name, domain: term.domain } : null,
      standardValues: term?.values || [],
      columnMappings: [],
      valueMappings: [],
      updatedAt: new Date().toISOString(),
    };
    
    setGroups([newGroup, ...groups]);
    setNewGroupName('');
    setNewGroupDescription('');
    setNewGroupTerm('');
    setIsCreateModalOpen(false);
  };

  const handleDeleteGroup = (id) => {
    setGroups(groups.filter(g => g.id !== id));
    if (selectedGroup?.id === id) setSelectedGroup(null);
    setMenuOpenId(null);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.sidebar}>
          <div className={styles.sidebarHeader}>
            <div className={styles.headerTop}>
              <div className={styles.titleWrapper}>
                <GitMerge className={styles.titleIcon} />
                <h1 className={styles.title}>Column Groups</h1>
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
                placeholder="Search groups..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={styles.searchInput}
              />
            </div>
          </div>

          <div className={styles.groupsList}>
            {filteredGroups.length === 0 ? (
              <div className={styles.emptyState}>
                <Columns className={styles.emptyIcon} />
                <p className="text-sm">No column groups found</p>
              </div>
            ) : (
              <div className={styles.groupsStack}>
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    onClick={() => setSelectedGroup(group)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedGroup(group)}
                    className={clsx(
                      styles.groupItem,
                      selectedGroup?.id === group.id && styles.groupItemActive
                    )}
                  >
                    <div className={styles.groupContent}>
                      <div className={styles.groupInfo}>
                        <div className={styles.groupHeader}>
                          <span className={styles.groupName}>
                            {group.name}
                          </span>
                          {group.dictionaryTerm && (
                            <span className={styles.termBadge}>
                              {group.dictionaryTerm.name}
                            </span>
                          )}
                        </div>
                        <p className={styles.groupDesc}>
                          {group.description}
                        </p>
                        <div className={styles.groupStats}>
                          <span className={styles.statItem}>
                            <Database className={styles.statIcon} />
                            {group.columnMappings.length} columns
                          </span>
                          <span className={styles.statItem}>
                            <ArrowRight className={styles.statIcon} />
                            {group.valueMappings.length} mappings
                          </span>
                        </div>
                      </div>
                      <div className={styles.menuWrapper}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === group.id ? null : group.id);
                          }}
                          className={styles.menuTrigger}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {menuOpenId === group.id && (
                          <div className={styles.contextMenu}>
                            <button className={styles.menuItem}>
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGroup(group.id);
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
          {selectedGroup ? (
            <div className={styles.detailContainer}>
              <div className={styles.detailHeader}>
                <div className={styles.detailHeaderTop}>
                  <div>
                    <div className={styles.detailTitleRow}>
                      <h2 className={styles.detailTitle}>
                        {selectedGroup.name}
                      </h2>
                      {selectedGroup.dictionaryTerm && (
                        <Link 
                          href={`/equivalence/data-dictionary?term=${selectedGroup.dictionaryTerm.id}`}
                          className={styles.termLink}
                        >
                          <BookOpen className="w-3 h-3" />
                          {selectedGroup.dictionaryTerm.name}
                        </Link>
                      )}
                    </div>
                    <p className={styles.detailDesc}>
                      {selectedGroup.description}
                    </p>
                    <p className={styles.lastUpdated}>
                      Last updated: {formatDate(selectedGroup.updatedAt)}
                    </p>
                  </div>
                  <button className={styles.editGroupButton}>
                    Edit Group
                  </button>
                </div>

                {selectedGroup.dictionaryTerm && (
                  <div className={styles.standardValuesSection}>
                    <div className={styles.sectionLabelRow}>
                      <span className={styles.sectionLabel}>
                        Standard Values
                      </span>
                      {selectedGroup.dictionaryTerm.standardValues.length > 0 ? (
                        selectedGroup.useTermStandardValues ? (
                          <span className={clsx(styles.sourceBadge, styles.sourceBadgeTerm)}>
                            <LinkIcon className="w-3 h-3" />
                            From Dictionary Term
                          </span>
                        ) : (
                          <span className={clsx(styles.sourceBadge, styles.sourceBadgeCustom)}>
                            <Pencil className="w-3 h-3" />
                            Custom Values
                          </span>
                        )
                      ) : (
                        <span className={clsx(styles.sourceBadge, styles.sourceBadgeSemantic)}>
                          <Layers className="w-3 h-3" />
                          Semantic Grouping Only
                        </span>
                      )}
                    </div>
                    {selectedGroup.dictionaryTerm.standardValues.length > 0 ? (
                      <>
                        <div className={styles.valuesList}>
                          {(selectedGroup.useTermStandardValues 
                            ? selectedGroup.dictionaryTerm.standardValues 
                            : selectedGroup.customStandardValues
                          ).map((val) => (
                            <span 
                              key={val}
                              className={styles.valuePill}
                            >
                              {val}
                            </span>
                          ))}
                          {!selectedGroup.useTermStandardValues && (
                            <button className={styles.addValueButton}>
                              + Add
                            </button>
                          )}
                        </div>
                        <p className={styles.detailDesc} style={{fontSize: '0.75rem', marginTop: '0.5rem'}}>
                          {selectedGroup.useTermStandardValues 
                            ? "Using standard values from the dictionary term."
                            : "Using custom values."}
                        </p>
                      </>
                    ) : (
                      <div className={styles.semanticInfoBox}>
                        <p className={styles.semanticText}>
                          This group unifies columns <strong>semantically</strong> without value normalization.
                        </p>
                        <p className={styles.detailDesc} style={{fontSize: '0.75rem'}}>
                          Useful for: federated queries, LGPD mapping, data cataloging, impact analysis.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.detailBody}>
                <div>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <Database className={styles.sectionIcon} />
                      Column Mappings
                    </h3>
                    <button className={styles.addButton}>
                      <Plus className="w-4 h-4" />
                      Add Column
                    </button>
                  </div>
                  
                  <div className={styles.mappingList}>
                    {selectedGroup.columnMappings.map((mapping) => (
                      <div 
                        key={mapping.id}
                        className={styles.mappingCard}
                      >
                        <div className={styles.mappingLeft}>
                          <div 
                            className={styles.connectionDot} 
                            style={{ backgroundColor: mapping.connectionColor }}
                          />
                          <div>
                            <div className={styles.mappingColumn}>
                              {mapping.table}.<span className={styles.mappingColName}>{mapping.column}</span>
                            </div>
                            <div className={styles.mappingConnectionName}>
                              {mapping.connection}
                            </div>
                          </div>
                        </div>
                        <div className={styles.mappingRight}>
                          <div className={styles.sampleValues}>
                            Sample: {mapping.sampleValues.slice(0, 3).join(', ')}
                          </div>
                          <button className={styles.removeButton}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {selectedGroup.valueMappings.length > 0 ? (
                <div>
                  <div className={styles.sectionHeader}>
                    <h3 className={styles.sectionTitle}>
                      <ArrowRight className={styles.sectionIcon} />
                      Value Mappings
                    </h3>
                    <button className={styles.addButton}>
                      <Plus className="w-4 h-4" />
                      Add Mapping
                    </button>
                  </div>

                  <div className={styles.tableContainer}>
                    <table className={styles.table}>
                      <thead className={styles.thead}>
                        <tr>
                          <th className={styles.th}>
                            Source Value
                          </th>
                          <th className={styles.th} style={{textAlign: 'center'}}>
                            →
                          </th>
                          <th className={styles.th}>
                            Standard Value
                          </th>
                          <th className={styles.th} style={{textAlign: 'right'}}>
                            Count
                          </th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody className={styles.tbody}>
                        {selectedGroup.valueMappings.map((mapping, idx) => (
                          <tr key={idx} className={styles.tr}>
                            <td className={styles.td}>
                              <code className={styles.codeCell}>
                                {mapping.source}
                              </code>
                            </td>
                            <td className={styles.td} style={{textAlign: 'center'}}>
                              <ArrowRight className="w-4 h-4 mx-auto" style={{color: '#d1d5db'}} />
                            </td>
                            <td className={styles.td}>
                              <code className={styles.targetCell}>
                                {mapping.target}
                              </code>
                            </td>
                            <td className={styles.td} style={{textAlign: 'right', color: '#6b7280', fontSize: '0.875rem'}}>
                              {mapping.count.toLocaleString()}
                            </td>
                            <td className="px-2 py-3">
                              <button className={styles.removeButton}>
                                <X className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                ) : (
                  <div>
                    <div className={styles.sectionHeader}>
                      <h3 className={styles.sectionTitle}>
                        <ArrowRight className={styles.sectionIcon} />
                        Value Mappings
                      </h3>
                    </div>
                    <div className={styles.emptyMappingsBox}>
                      <Layers className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No value mappings needed for this group.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Values are passed through without transformation.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.noSelection}>
              <GitMerge className={styles.noSelectionIcon} />
              <h3 className={styles.noSelectionTitle}>Select a Column Group</h3>
              <p className={styles.noSelectionText}>
                Choose a column group from the list to view and manage its column mappings and value transformations.
              </p>
            </div>
          )}
        </div>

        {isCreateModalOpen && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <h3 className={styles.modalTitle}>
                  <GitMerge className="w-5 h-5 text-purple-500" />
                  New Column Group
                </h3>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className={styles.closeButton}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Group Name <span className={styles.required}>*</span>
                  </label>
                  <input 
                    type="text"
                    placeholder="e.g., sex_unified"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className={clsx(styles.input, "font-mono")}
                    autoFocus
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Description
                  </label>
                  <textarea 
                    placeholder="What columns will this group unify?"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    rows={2}
                    className={styles.textarea}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Link to Dictionary Term <span className="text-gray-400">(optional)</span>
                  </label>
                  <select 
                    value={newGroupTerm}
                    onChange={(e) => setNewGroupTerm(e.target.value)}
                    className={styles.select}
                  >
                    <option value="">Select a term...</option>
                    {MOCK_DICTIONARY_TERMS.map(term => (
                      <option key={term.id} value={term.id}>
                        {term.name} ({term.domain})
                      </option>
                    ))}
                  </select>
                  <p className={styles.helperText}>
                    Linking to a dictionary term will inherit its standard values.
                  </p>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button 
                  onClick={() => setIsCreateModalOpen(false)} 
                  className={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className={styles.createButton}
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}