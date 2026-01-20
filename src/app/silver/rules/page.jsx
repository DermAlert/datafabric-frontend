'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  Search, 
  FileCode, 
  X, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Play, 
  HelpCircle, 
  Copy, 
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_RULES = [
  {
    id: 1,
    name: 'CPF Format',
    description: 'Brazilian CPF document formatting',
    template: '{d3}.{d3}.{d3}-{d2}',
    example: '123.456.789-01',
    isActive: true,
    usageCount: 5,
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 2,
    name: 'Phone BR',
    description: 'Brazilian phone number with area code',
    template: '({d2}) {d5}-{d4}',
    example: '(61) 99999-8888',
    isActive: true,
    usageCount: 3,
    createdAt: '2026-01-09T14:30:00Z',
  },
  {
    id: 3,
    name: 'CEP Format',
    description: 'Brazilian postal code',
    template: '{d5}-{d3}',
    example: '70000-000',
    isActive: true,
    usageCount: 2,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 4,
    name: 'CNPJ Format',
    description: 'Brazilian company document formatting',
    template: '{d2}.{d3}.{d3}/{d4}-{d2}',
    example: '12.345.678/0001-90',
    isActive: true,
    usageCount: 1,
    createdAt: '2026-01-11T11:00:00Z',
  },
  {
    id: 5,
    name: 'Date BR',
    description: 'Brazilian date format',
    template: '{d2}/{d2}/{d4}',
    example: '13/01/2026',
    isActive: false,
    usageCount: 0,
    createdAt: '2026-01-12T16:00:00Z',
  },
  {
    id: 6,
    name: 'Currency BR',
    description: 'Brazilian currency format (requires amount)',
    template: 'R$ {D},{d2}',
    example: 'R$ 1234,56',
    isActive: true,
    usageCount: 4,
    createdAt: '2026-01-07T08:00:00Z',
  },
];

const TEMPLATE_HELP = [
  { placeholder: '{d}', description: 'Single digit', example: '5' },
  { placeholder: '{d3}', description: 'Exactly 3 digits', example: '123' },
  { placeholder: '{D}', description: 'One or more digits', example: '12345' },
  { placeholder: '{l}', description: 'Single letter', example: 'A' },
  { placeholder: '{l2}', description: 'Exactly 2 letters', example: 'AB' },
  { placeholder: '{L}', description: 'One or more letters', example: 'ABCD' },
  { placeholder: '{w}', description: 'Single alphanumeric', example: 'A' },
  { placeholder: '{W}', description: 'One or more alphanumerics', example: 'ABC123' },
  { placeholder: '{d?}', description: 'Optional single digit', example: '5 or empty' },
  { placeholder: '{d3?}', description: 'Optional 3 digits', example: '123 or empty' },
];

export default function NormalizationRulesPage() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    template: '',
  });

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteRule = (id) => {
    setRules(rules.filter(r => r.id !== id));
    if (selectedRule?.id === id) setSelectedRule(null);
    setMenuOpenId(null);
  };

  const handleToggleActive = (id) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    if (selectedRule?.id === id) {
      setSelectedRule({ ...selectedRule, isActive: !selectedRule.isActive });
    }
  };

  const handleTestRule = () => {
    if (!selectedRule || !testValue) return;
    
    const digitsOnly = testValue.replace(/\D/g, '');
    
    let output = selectedRule.template;
    let digitIndex = 0;
    
    output = output.replace(/\{d(\d*)\}/g, (match, count) => {
      const len = count ? parseInt(count) : 1;
      const chunk = digitsOnly.slice(digitIndex, digitIndex + len);
      digitIndex += len;
      return chunk.padEnd(len, '_');
    });
    
    output = output.replace(/\{D\}/g, () => {
      const remaining = digitsOnly.slice(digitIndex);
      digitIndex = digitsOnly.length;
      return remaining || '_';
    });

    const success = digitIndex === digitsOnly.length && !output.includes('_');
    setTestResult({ success, output });
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.template) return;
    
    const rule = {
      id: Math.max(...rules.map(r => r.id)) + 1,
      name: newRule.name,
      description: newRule.description,
      template: newRule.template,
      example: '',
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    setRules([...rules, rule]);
    setNewRule({ name: '', description: '', template: '' });
    setShowCreateModal(false);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.headerLeft}>
              <Link 
                href="/silver"
                className={styles.backButton}
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className={styles.iconBox}>
                <FileCode className={styles.icon} />
              </div>
              <div>
                <h1 className={styles.title}>Normalization Rules</h1>
                <p className={styles.description}>
                  Template-based data formatting rules
                </p>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => setShowHelpModal(true)}
                className={styles.helpButton}
              >
                <HelpCircle className="w-4 h-4" />
                Template Help
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className={styles.newButton}
              >
                <Plus className="w-4 h-4" />
                New Rule
              </button>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <div className={styles.searchContainer}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input 
                  type="text"
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.list}>
              {filteredRules.length === 0 ? (
                <div className={styles.emptyList}>
                  <FileCode className={styles.emptyListIcon} />
                  <p className={styles.description}>No rules found</p>
                </div>
              ) : (
                <div>
                  {filteredRules.map((rule) => (
                    <div
                      key={rule.id}
                      onClick={() => {
                        setSelectedRule(rule);
                        setTestValue('');
                        setTestResult(null);
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedRule(rule)}
                      className={clsx(
                        styles.item,
                        selectedRule?.id === rule.id && styles.itemActive
                      )}
                    >
                      <div className={styles.itemHeader}>
                        <div className={styles.itemInfo}>
                          <div className={styles.itemNameRow}>
                            <span className={styles.itemName}>
                              {rule.name}
                            </span>
                            {!rule.isActive && (
                              <span className={styles.inactiveBadge}>
                                Inactive
                              </span>
                            )}
                          </div>
                          <code className={styles.templateCode}>
                            {rule.template}
                          </code>
                          <p className={styles.itemExample}>
                            {rule.example && <>Example: <span className={styles.exampleMono}>{rule.example}</span></>}
                          </p>
                        </div>
                        <div className={styles.menuWrapper}>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === rule.id ? null : rule.id);
                            }}
                            className={styles.menuButton}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {menuOpenId === rule.id && (
                            <div className={styles.contextMenu}>
                              <button className={styles.menuItem}>
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(rule.id);
                                  setMenuOpenId(null);
                                }}
                                className={styles.menuItem}
                              >
                                {rule.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <div className={styles.menuDivider} />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRule(rule.id);
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

          <div className={styles.detailPanel}>
            {selectedRule ? (
              <div className={styles.detailContainer}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailHeaderTop}>
                    <div>
                      <div className={styles.detailTitleRow}>
                        <h2 className={styles.detailTitle}>
                          {selectedRule.name}
                        </h2>
                        <span className={clsx(
                          styles.statusBadge,
                          selectedRule.isActive ? styles.statusActive : styles.statusInactive
                        )}>
                          {selectedRule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className={styles.detailDesc}>
                        {selectedRule.description}
                      </p>
                    </div>
                    <button className={styles.editButton}>
                      <Pencil className="w-4 h-4" />
                      Edit Rule
                    </button>
                  </div>

                  <div className={styles.templateBox}>
                    <div className={styles.templateHeader}>
                      <span className={styles.metaLabel}>
                        Template Pattern
                      </span>
                      <button 
                        onClick={() => navigator.clipboard.writeText(selectedRule.template)}
                        className={styles.copyButton}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <code className={styles.templateValue}>
                      {selectedRule.template}
                    </code>
                    {selectedRule.example && (
                      <div className={styles.exampleBox}>
                        Example Output: <span className={styles.exampleValue}>{selectedRule.example}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.testPanel}>
                  <h3 className={styles.sectionTitle}>
                    <Play className="w-4 h-4 text-gray-400" />
                    Test Rule
                  </h3>
                  
                  <div className={styles.testForm}>
                    <div className={styles.inputGroup}>
                      <label className={styles.label}>
                        Input Value
                      </label>
                      <div className={styles.inputRow}>
                        <input 
                          type="text"
                          value={testValue}
                          onChange={(e) => setTestValue(e.target.value)}
                          placeholder="Enter a value to test (e.g., 12345678901)"
                          className={styles.testInput}
                        />
                        <button
                          onClick={handleTestRule}
                          disabled={!testValue}
                          className={styles.testBtn}
                        >
                          <Play className="w-4 h-4" />
                          Test
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div className={clsx(
                        styles.resultBox,
                        testResult.success ? styles.resultSuccess : styles.resultError
                      )}>
                        <div className={styles.resultHeader}>
                          {testResult.success ? (
                            <>
                              <CheckCircle2 className={clsx(styles.resultIcon, styles.iconGreen)} />
                              <span className={clsx(styles.resultTitle, styles.textGreen)}>Success</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className={clsx(styles.resultIcon, styles.iconRed)} />
                              <span className={clsx(styles.resultTitle, styles.textRed)}>Incomplete Match</span>
                            </>
                          )}
                        </div>
                        <div className={styles.resultOutput}>
                          {testResult.output}
                        </div>
                      </div>
                    )}

                    <div className={styles.usageBox}>
                      <h4 className={styles.label} style={{marginBottom: '0.5rem'}}>
                        Usage Statistics
                      </h4>
                      <div className={styles.usageStats}>
                        <span>Used in <strong>{selectedRule.usageCount}</strong> transformations</span>
                        <span>Created {new Date(selectedRule.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptyDetail}>
                <FileCode className={styles.emptyDetailIcon} />
                <h3 className="text-lg font-medium mb-2">Select a Rule</h3>
                <p className="text-sm text-center max-w-md">
                  Choose a normalization rule from the list to view details and test with sample values.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '32rem', maxHeight: 'none'}}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                Create Normalization Rule
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={styles.closeButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Rule Name
                </label>
                <input 
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="e.g., CPF Format"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Description
                </label>
                <input 
                  type="text"
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="e.g., Brazilian CPF document formatting"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Template Pattern
                </label>
                <input 
                  type="text"
                  value={newRule.template}
                  onChange={(e) => setNewRule({ ...newRule, template: e.target.value })}
                  placeholder="e.g., {d3}.{d3}.{d3}-{d2}"
                  className={clsx(styles.input, styles.exampleMono)}
                />
                <p className={styles.helperText}>
                  Use placeholders like {'{d3}'} for 3 digits, {'{L}'} for letters
                </p>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                onClick={() => setShowCreateModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateRule}
                disabled={!newRule.name || !newRule.template}
                className={styles.createButton}
              >
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {showHelpModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '42rem'}}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle} style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                <HelpCircle className="w-5 h-5 text-purple-500" />
                Template Placeholders
              </h3>
              <button 
                onClick={() => setShowHelpModal(false)}
                className={styles.closeButton}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className={styles.modalBody} style={{padding: 0}}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Placeholder</th>
                    <th className={styles.th}>Description</th>
                    <th className={styles.th}>Example</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {TEMPLATE_HELP.map((item) => (
                    <tr key={item.placeholder} className={styles.tr}>
                      <td className={styles.td}>
                        <code className={styles.codeCell}>
                          {item.placeholder}
                        </code>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.descCell}>{item.description}</span>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.exampleCell}>{item.example}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className={styles.examplesBox} style={{margin: '1rem', marginTop: 0}}>
                <h4 className={styles.itemName} style={{marginBottom: '0.75rem'}}>Examples</h4>
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
                  <div className={styles.exampleRow}>
                    <code className={styles.codeGray}>{'({d2}) {d5}-{d4}'}</code>
                    <ChevronRight className={styles.arrowIcon} />
                    <span className={styles.exampleMono}>(61) 99999-8888</span>
                    <span className={styles.descCell}>Phone BR</span>
                  </div>
                  <div className={styles.exampleRow}>
                    <code className={styles.codeGray}>{'{d3}.{d3}.{d3}-{d2}'}</code>
                    <ChevronRight className={styles.arrowIcon} />
                    <span className={styles.exampleMono}>123.456.789-01</span>
                    <span className={styles.descCell}>CPF</span>
                  </div>
                  <div className={styles.exampleRow}>
                    <code className={styles.codeGray}>{'{d5}-{d3}'}</code>
                    <ChevronRight className={styles.arrowIcon} />
                    <span className={styles.exampleMono}>70000-000</span>
                    <span className={styles.descCell}>CEP</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}