'use client';

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  Search, 
  Share2, 
  Users, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ChevronRight, 
  Database, 
  Table2, 
  FolderOpen, 
  Key, 
  Copy, 
  CheckCircle2, 
  Clock, 
  UserPlus, 
  ExternalLink, 
  Shield, 
  RefreshCw, 
  Eye, 
  Settings2, 
  Layers, 
  Link2, 
  HardDrive, 
  Sparkles, 
  Info
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_SHARES = [
  {
    id: 'share_1',
    name: 'healthcare_data',
    description: 'Healthcare datasets for partner hospitals',
    createdAt: '2026-01-10T14:00:00Z',
    updatedAt: '2026-01-15T09:30:00Z',
    datasets: [
      { id: 'ds_1', name: 'patients_normalized', layer: 'silver', rowCount: 125430, description: 'Normalized patient data with CPF formatting' },
      { id: 'ds_2', name: 'patients_raw', layer: 'bronze', rowCount: 234567, description: 'Raw patient data from healthcare sources' },
      { id: 'ds_3', name: 'visits_clean', layer: 'silver', rowCount: 567890, description: 'Cleaned visit records' },
    ],
    recipients: [
      { id: 'rec_1', name: 'Hospital São Paulo', email: 'data@hospitalsaopaulo.com.br' },
      { id: 'rec_2', name: 'Clínica Santa Maria', email: 'analytics@clinicasm.com' },
    ]
  },
  {
    id: 'share_2',
    name: 'ecommerce_analytics',
    description: 'E-commerce data for BI team',
    createdAt: '2026-01-12T10:00:00Z',
    updatedAt: '2026-01-14T16:45:00Z',
    datasets: [
      { id: 'ds_4', name: 'orders_unified', layer: 'bronze', rowCount: 1234567, description: 'Unified orders from all channels' },
      { id: 'ds_5', name: 'customer_360_silver', layer: 'silver', rowCount: 89012, description: 'Customer 360 view with transformations' },
    ],
    recipients: [
      { id: 'rec_3', name: 'BI Team', email: 'bi@company.com' },
    ]
  },
  {
    id: 'share_3',
    name: 'inventory_data',
    description: 'Inventory snapshots for suppliers',
    createdAt: '2026-01-13T08:00:00Z',
    updatedAt: '2026-01-13T08:00:00Z',
    datasets: [
      { id: 'ds_6', name: 'inventory_snapshot', layer: 'bronze', rowCount: 45678, description: 'Daily inventory snapshots' },
    ],
    recipients: []
  },
];

const MOCK_RECIPIENTS = [
  { 
    id: 'rec_1', 
    name: 'Hospital São Paulo', 
    email: 'data@hospitalsaopaulo.com.br',
    tokenPrefix: 'dsp_abc123...',
    tokenCreatedAt: '2026-01-10T14:30:00Z',
    lastAccess: '2026-01-15T10:23:00Z',
    shares: ['healthcare_data']
  },
  { 
    id: 'rec_2', 
    name: 'Clínica Santa Maria', 
    email: 'analytics@clinicasm.com',
    tokenPrefix: 'dsp_def456...',
    tokenCreatedAt: '2026-01-11T09:00:00Z',
    lastAccess: '2026-01-14T18:45:00Z',
    shares: ['healthcare_data']
  },
  { 
    id: 'rec_3', 
    name: 'BI Team', 
    email: 'bi@company.com',
    tokenPrefix: 'dsp_ghi789...',
    tokenCreatedAt: '2026-01-12T11:00:00Z',
    lastAccess: '2026-01-15T08:12:00Z',
    shares: ['ecommerce_analytics']
  },
  { 
    id: 'rec_4', 
    name: 'External Analytics', 
    email: 'analytics@partner.com',
    tokenPrefix: 'dsp_jkl012...',
    tokenCreatedAt: '2026-01-13T14:00:00Z',
    lastAccess: null,
    shares: []
  },
];

export default function SharingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShare, setSelectedShare] = useState(MOCK_SHARES[0]);
  const [activeTab, setActiveTab] = useState('schemas');
  const [showNewShareModal, setShowNewShareModal] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState(null);

  const filteredShares = MOCK_SHARES.filter(share =>
    share.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    share.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTotalDatasets = (share) => {
    return share.datasets.length;
  };

  const getTotalRows = (share) => {
    return share.datasets.reduce((acc, ds) => acc + ds.rowCount, 0);
  };

  const getLayerBadge = (layer) => {
    if (layer === 'bronze') {
      return { bg: styles.badgeBronze, label: 'Bronze' };
    }
    return { bg: styles.badgeSilver, label: 'Silver' };
  };

  const handleCopyToken = (recipientId, token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(recipientId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <div className={styles.gradientIcon}>
                <Share2 className={styles.iconWhite} />
              </div>
              <div>
                <h1 className={styles.title}>Share</h1>
                <p className={styles.description}>Share datasets securely with external partners</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <Link
                href="/sharing/recipients"
                className={clsx(styles.actionButton, styles.btnSecondary)}
              >
                <Users className="w-4 h-4" />
                Recipients
              </Link>
              <button
                onClick={() => setShowNewShareModal(true)}
                className={clsx(styles.actionButton, styles.btnPrimary)}
              >
                <Plus className="w-4 h-4" />
                New Share
              </button>
            </div>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Share2 className={styles.statIcon} />
              <span>{MOCK_SHARES.length} shares</span>
            </div>
            <div className={styles.statItem}>
              <Users className={styles.statIcon} />
              <span>{MOCK_RECIPIENTS.length} recipients</span>
            </div>
            <div className={styles.statItem}>
              <Table2 className={styles.statIcon} />
              <span>{MOCK_SHARES.reduce((acc, s) => acc + getTotalDatasets(s), 0)} shared datasets</span>
            </div>
          </div>
        </div>

        <div className={styles.layout}>
          <div className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div className={styles.searchWrapper}>
                <Search className={styles.searchIcon} />
                <input
                  type="text"
                  placeholder="Search shares..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.searchInput}
                />
              </div>
            </div>

            <div className={styles.shareList}>
              {filteredShares.map((share) => (
                <button
                  key={share.id}
                  onClick={() => setSelectedShare(share)}
                  className={clsx(
                    styles.shareButton,
                    selectedShare?.id === share.id && styles.shareActive
                  )}
                >
                  <div className={styles.shareHeader}>
                    <div className={styles.shareInfo}>
                      <div className={styles.shareTitleRow}>
                        <span className={styles.shareTitle}>
                          {share.name}
                        </span>
                      </div>
                      <p className={styles.shareDesc}>
                        {share.description}
                      </p>
                      <div className={styles.shareMeta}>
                        <span className={styles.shareMetaItem}>
                          <Database className="w-3 h-3" />
                          {share.datasets.length} datasets
                        </span>
                        <span className={styles.shareMetaItem}>
                          <Users className="w-3 h-3" />
                          {share.recipients.length}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={styles.chevron} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.detailPanel}>
            {selectedShare ? (
              <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
                <div className={styles.detailHeader}>
                  <div className={styles.detailTop}>
                    <div className={styles.detailInfo}>
                      <div className={styles.detailIconBox}>
                        <Share2 className={styles.detailIcon} />
                      </div>
                      <div>
                        <h2 className={styles.detailTitleText}>
                          {selectedShare.name}
                        </h2>
                        <p className={styles.detailDescText}>
                          {selectedShare.description}
                        </p>
                      </div>
                    </div>
                    <div className={styles.detailActions}>
                      <button className={styles.iconButton}>
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button className={clsx(styles.iconButton, styles.deleteButton)}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className={styles.detailStats}>
                    <div className={styles.detailStatItem}>
                      <div className={styles.detailStatValue}>
                        {selectedShare.datasets.length}
                      </div>
                      <div className={styles.detailStatLabel}>Datasets</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.detailStatItem}>
                      <div className={styles.detailStatValue}>
                        {formatNumber(getTotalRows(selectedShare))}
                      </div>
                      <div className={styles.detailStatLabel}>Total Rows</div>
                    </div>
                    <div className={styles.statDivider} />
                    <div className={styles.detailStatItem}>
                      <div className={styles.detailStatValue}>
                        {selectedShare.recipients.length}
                      </div>
                      <div className={styles.detailStatLabel}>Recipients</div>
                    </div>
                  </div>
                </div>

                <div className={styles.tabs}>
                  <div className={styles.tabList}>
                    <button
                      onClick={() => setActiveTab('schemas')}
                      className={clsx(
                        styles.tabButton,
                        activeTab === 'schemas' && styles.tabActive
                      )}
                    >
                      <span className={styles.tabContent}>
                        <Database className="w-4 h-4" />
                        Shared Datasets ({selectedShare.datasets.length})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('recipients')}
                      className={clsx(
                        styles.tabButton,
                        activeTab === 'recipients' && styles.tabActive
                      )}
                    >
                      <span className={styles.tabContent}>
                        <Users className="w-4 h-4" />
                        Recipients ({selectedShare.recipients.length})
                      </span>
                    </button>
                  </div>
                </div>

                <div style={{flex: 1, overflowY: 'auto'}}>
                  <div className={styles.tabContentInner}>
                    {activeTab === 'schemas' && (
                      <div className={styles.cardList}>
                        <div className={styles.sectionHeader}>
                          <h3 className={styles.sectionTitle}>
                            Datasets in this Share
                          </h3>
                          <button
                            onClick={() => setShowAddTableModal(true)}
                            className={styles.sectionAction}
                          >
                            <Plus className="w-4 h-4" />
                            Add Dataset
                          </button>
                        </div>

                        <div className={styles.cardList}>
                          {selectedShare.datasets.map((dataset) => {
                            const layerBadge = getLayerBadge(dataset.layer);
                            return (
                              <div
                                key={dataset.id}
                                className={styles.datasetCard}
                              >
                                <div className={styles.datasetHeader}>
                                  <div className={styles.datasetInfo}>
                                    <div className={clsx(
                                      styles.datasetIconBox,
                                      dataset.layer === 'bronze' ? styles.bronzeIcon : styles.silverIcon
                                    )}>
                                      {dataset.layer === 'bronze' ? (
                                        <HardDrive className="w-5 h-5" />
                                      ) : (
                                        <Sparkles className="w-5 h-5" />
                                      )}
                                    </div>
                                    <div>
                                      <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem'}}>
                                        <span className={styles.datasetName}>
                                          {dataset.name}
                                        </span>
                                        <span className={clsx(styles.layerBadge, layerBadge.bg)}>
                                          {layerBadge.label}
                                        </span>
                                      </div>
                                      <p className={styles.datasetDesc}>
                                        {dataset.description}
                                      </p>
                                      <div className={styles.datasetStats}>
                                        <span>{formatNumber(dataset.rowCount)} rows</span>
                                      </div>
                                    </div>
                                  </div>
                                  <button className={clsx(styles.iconButton, styles.deleteButton)}>
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {selectedShare.datasets.length === 0 && (
                          <div className={styles.emptyState}>
                            <Database className={styles.emptyIcon} />
                            <p className={styles.emptyText}>No datasets shared yet</p>
                            <p className={styles.emptySubtext}>
                              Add Bronze or Silver datasets to this share
                            </p>
                            <button
                              onClick={() => setShowAddTableModal(true)}
                              className={styles.emptyButton}
                            >
                              <Plus className="w-4 h-4" />
                              Add Dataset
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'recipients' && (
                      <div className={styles.cardList}>
                        <div className={styles.sectionHeader}>
                          <h3 className={styles.sectionTitle}>
                            Authorized Recipients
                          </h3>
                          <button
                            onClick={() => setShowAddRecipientModal(true)}
                            className={styles.sectionAction}
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Recipient
                          </button>
                        </div>

                        {selectedShare.recipients.length === 0 ? (
                          <div className={styles.emptyState}>
                            <Users className={styles.emptyIcon} />
                            <p className={styles.emptyText}>No recipients yet</p>
                            <p className={styles.emptySubtext}>
                              Add recipients to share this data
                            </p>
                            <button
                              onClick={() => setShowAddRecipientModal(true)}
                              className={styles.emptyButton}
                            >
                              <UserPlus className="w-4 h-4" />
                              Add Recipient
                            </button>
                          </div>
                        ) : (
                          <div className={styles.cardList}>
                            {selectedShare.recipients.map((recipient) => {
                              const fullRecipient = MOCK_RECIPIENTS.find(r => r.id === recipient.id);
                              return (
                                <div
                                  key={recipient.id}
                                  className={styles.recipientCard}
                                >
                                  <div className={styles.recipientHeader}>
                                    <div className={styles.datasetInfo}>
                                      <div className={styles.recipientAvatar}>
                                        {recipient.name.charAt(0)}
                                      </div>
                                      <div>
                                        <div className={styles.recipientName}>
                                          {recipient.name}
                                        </div>
                                        <div className={styles.recipientEmail}>
                                          {recipient.email}
                                        </div>
                                      </div>
                                    </div>
                                    <button className={clsx(styles.iconButton, styles.deleteButton)}>
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                  {fullRecipient && (
                                    <div style={{marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                      <div className={styles.datasetStats}>
                                        <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                          <Key className="w-3 h-3" />
                                          Token: {fullRecipient.tokenPrefix}
                                        </span>
                                        {fullRecipient.lastAccess && (
                                          <span style={{display: 'flex', alignItems: 'center', gap: '0.25rem'}}>
                                            <Clock className="w-3 h-3" />
                                            Last access: {formatDate(fullRecipient.lastAccess)}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => handleCopyToken(recipient.id, 'full-token-here')}
                                        className={styles.sectionAction}
                                        style={{backgroundColor: 'transparent', padding: 0}}
                                      >
                                        {copiedToken === recipient.id ? (
                                          <>
                                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                                            <span style={{fontSize: '0.75rem', color: '#15803d'}}>Copied!</span>
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" />
                                            <span style={{fontSize: '0.75rem'}}>Copy Token</span>
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb'}}>
                          <Link
                            href="/sharing/recipients"
                            className={styles.sectionAction}
                            style={{backgroundColor: 'transparent', padding: 0}}
                          >
                            <UserPlus className="w-4 h-4" />
                            Create new recipient
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className={styles.detailFooter}>
                  <div className={styles.footerContent}>
                    <span>Created {formatDate(selectedShare.createdAt)}</span>
                    <span>Last updated {formatDate(selectedShare.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className={styles.emptySelect}>
                <Share2 className={styles.emptySelectIcon} />
                <h3 className={styles.emptySelectTitle}>Select a Share</h3>
                <p className={styles.emptySelectDesc}>
                  Choose a share from the list to view its schemas, tables, and recipients.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showNewShareModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Share</h2>
              <p className={styles.modalDesc}>
                Create a new share to organize datasets for sharing
              </p>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Share Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., healthcare_data"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what data this share contains..."
                  className={styles.textarea}
                />
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowNewShareModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewShareModal(false)}
                className={styles.createBtn}
              >
                Create Share
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddRecipientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Recipient</h2>
              <p className={styles.modalDesc}>
                Grant access to this share
              </p>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.scrollList}>
                <p className={styles.label}>
                  Select existing recipients:
                </p>
                {MOCK_RECIPIENTS.filter(r => !selectedShare?.recipients.find(sr => sr.id === r.id)).map((recipient) => (
                  <label
                    key={recipient.id}
                    className={styles.checkboxLabel}
                  >
                    <input type="checkbox" className={styles.checkboxInput} />
                    <div className={styles.recipientAvatar}>
                      {recipient.name.charAt(0)}
                    </div>
                    <div className={styles.checkboxContent}>
                      <div className={styles.checkboxTitle}>
                        {recipient.name}
                      </div>
                      <div className={styles.checkboxDesc}>
                        {recipient.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div style={{marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6'}}>
                <Link
                  href="/sharing/recipients"
                  className={styles.sectionAction}
                  style={{backgroundColor: 'transparent', padding: 0}}
                >
                  <UserPlus className="w-4 h-4" />
                  Create new recipient
                </Link>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowAddRecipientModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddRecipientModal(false)}
                className={styles.createBtn}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTableModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{maxWidth: '42rem'}}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Dataset to Share</h2>
              <p className={styles.modalDesc}>
                Select Persistent datasets stored in Delta Lake
              </p>
            </div>
            <div className={styles.modalBody}>
              <div style={{padding: '0.75rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #dbeafe', display: 'flex', gap: '0.5rem'}}>
                <Info className="w-4 h-4 text-blue-600 flex-shrink-0" style={{marginTop: '0.125rem'}} />
                <p className={styles.checkboxDesc} style={{color: '#1d4ed8'}}>
                  Only <strong>Persistent</strong> datasets can be shared via Delta Sharing. 
                  Virtualized datasets query data on-demand and are not stored in Delta Lake.
                </p>
              </div>

              <div className={styles.scrollList} style={{maxHeight: '20rem'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.25rem 0.25rem 0.5rem'}}>
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span className={styles.label}>Bronze Layer</span>
                </div>
                {[
                  { name: 'patients_raw', desc: 'Raw patient data from healthcare sources', rows: 125430 },
                  { name: 'orders_unified', desc: 'Unified orders from all channels', rows: 1234567 },
                  { name: 'product_catalog', desc: 'Product images with metadata', rows: 5678 },
                  { name: 'customer_360', desc: 'Customer data consolidated from CRM', rows: 89012 },
                  { name: 'inventory_snapshot', desc: 'Daily inventory snapshots', rows: 45678 },
                ].map((dataset) => (
                  <label
                    key={dataset.name}
                    className={styles.checkboxLabel}
                  >
                    <input type="checkbox" className={styles.checkboxInput} />
                    <div className={styles.checkboxContent}>
                      <span className={styles.checkboxTitle}>{dataset.name}</span>
                      <p className={styles.checkboxDesc}>{dataset.desc}</p>
                    </div>
                    <span className={styles.checkboxDesc}>{formatNumber(dataset.rows)} rows</span>
                  </label>
                ))}

                <div style={{display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 0.25rem 0.5rem'}}>
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className={styles.label}>Silver Layer</span>
                </div>
                {[
                  { name: 'patients_normalized', desc: 'Normalized patient data with CPF formatting', rows: 125430 },
                  { name: 'customer_360_silver', desc: 'Customer 360 with phone normalization', rows: 89012 },
                  { name: 'transactions_clean', desc: 'Cleaned transaction data', rows: 456789 },
                  { name: 'visits_clean', desc: 'Cleaned visit records', rows: 567890 },
                ].map((dataset) => (
                  <label
                    key={dataset.name}
                    className={styles.checkboxLabel}
                  >
                    <input type="checkbox" className={styles.checkboxInput} />
                    <div className={styles.checkboxContent}>
                      <span className={styles.checkboxTitle}>{dataset.name}</span>
                      <p className={styles.checkboxDesc}>{dataset.desc}</p>
                    </div>
                    <span className={styles.checkboxDesc}>{formatNumber(dataset.rows)} rows</span>
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowAddTableModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddTableModal(false)}
                className={styles.createBtn}
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}