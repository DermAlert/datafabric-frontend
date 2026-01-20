'use client';

import React, { useState } from 'react';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  Plus, 
  Search, 
  Share2, 
  Users, 
  MoreVertical, 
  Pencil, 
  Trash2, 
  ChevronLeft, 
  Key, 
  Copy, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertCircle, 
  Mail, 
  Eye, 
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import styles from './page.module.css';

const MOCK_RECIPIENTS = [
  { 
    id: 'rec_1', 
    name: 'Hospital São Paulo', 
    email: 'data@hospitalsaopaulo.com.br',
    comment: 'Main healthcare partner',
    token: 'dspt_abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
    tokenCreatedAt: '2026-01-10T14:30:00Z',
    lastAccess: '2026-01-15T10:23:00Z',
    accessCount: 1234,
    shares: [
      { id: 'share_1', name: 'healthcare_data' },
      { id: 'share_2', name: 'ecommerce_analytics' },
      { id: 'share_3', name: 'inventory_data' },
      { id: 'share_4', name: 'financial_reports' },
      { id: 'share_5', name: 'customer_insights' }
    ],
    status: 'active'
  },
  { 
    id: 'rec_2', 
    name: 'Clínica Santa Maria', 
    email: 'analytics@clinicasm.com',
    comment: 'Analytics team contact',
    token: 'dspt_def456ghi789jkl012mno345pqr678stu901vwx234yzabc123',
    tokenCreatedAt: '2026-01-11T09:00:00Z',
    lastAccess: '2026-01-14T18:45:00Z',
    accessCount: 567,
    shares: [
      { id: 'share_1', name: 'healthcare_data' }
    ],
    status: 'active'
  },
  { 
    id: 'rec_3', 
    name: 'BI Team', 
    email: 'bi@company.com',
    comment: 'Internal business intelligence',
    token: 'dspt_ghi789jkl012mno345pqr678stu901vwx234yzabc123def456',
    tokenCreatedAt: '2026-01-12T11:00:00Z',
    lastAccess: '2026-01-15T08:12:00Z',
    accessCount: 2345,
    shares: [
      { id: 'share_2', name: 'ecommerce_analytics' },
      { id: 'share_3', name: 'inventory_data' }
    ],
    status: 'active'
  },
  { 
    id: 'rec_4', 
    name: 'External Analytics', 
    email: 'analytics@partner.com',
    comment: 'New partner - pending first connection',
    token: 'dspt_jkl012mno345pqr678stu901vwx234yzabc123def456ghi789',
    tokenCreatedAt: '2026-01-13T14:00:00Z',
    lastAccess: null,
    accessCount: 0,
    shares: [],
    status: 'pending'
  },
  { 
    id: 'rec_5', 
    name: 'Legacy System', 
    email: 'legacy@oldpartner.com',
    comment: 'Deactivated - contract ended',
    token: 'dspt_mno345pqr678stu901vwx234yzabc123def456ghi789jkl012',
    tokenCreatedAt: '2025-06-01T10:00:00Z',
    lastAccess: '2025-12-15T16:30:00Z',
    accessCount: 8901,
    shares: [],
    status: 'inactive'
  },
];

export default function RecipientsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewRecipientModal, setShowNewRecipientModal] = useState(false);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [copiedToken, setCopiedToken] = useState(null);
  const [showToken, setShowToken] = useState(null);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const filteredRecipients = MOCK_RECIPIENTS.filter(recipient => {
    const matchesSearch = 
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || recipient.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
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

  const handleCopyToken = (recipientId, token) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(recipientId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className={clsx(styles.statusBadge, styles.statusActive)}>
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className={clsx(styles.statusBadge, styles.statusPending)}>
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className={clsx(styles.statusBadge, styles.statusInactive)}>
            <AlertCircle className="w-3 h-3" />
            Inactive
          </span>
        );
    }
  };

  const maskToken = (token) => {
    return token.substring(0, 8) + '••••' + token.substring(token.length - 4);
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.breadcrumb}>
            <Link href="/sharing" className={styles.backLink}>
              <ChevronLeft className="w-4 h-4" />
              Share
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Recipients</span>
          </div>

          <div className={styles.headerContent}>
            <div className={styles.titleSection}>
              <div className={styles.iconBox}>
                <Users className={styles.icon} />
              </div>
              <div>
                <h1 className={styles.title}>Recipients</h1>
                <p className={styles.description}>Manage who can access your shared data</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewRecipientModal(true)}
              className={styles.newButton}
            >
              <Plus className="w-4 h-4" />
              New Recipient
            </button>
          </div>

          <div className={styles.statsRow}>
            <div className={styles.statItem}>
              <Users className={clsx(styles.statIcon, styles.statGray)} />
              <span className={styles.statText}>{MOCK_RECIPIENTS.length} total recipients</span>
            </div>
            <div className={styles.statItem}>
              <CheckCircle2 className={clsx(styles.statIcon, styles.statGreen)} />
              <span className={styles.statText}>{MOCK_RECIPIENTS.filter(r => r.status === 'active').length} active</span>
            </div>
            <div className={styles.statItem}>
              <Clock className={clsx(styles.statIcon, styles.statAmber)} />
              <span className={styles.statText}>{MOCK_RECIPIENTS.filter(r => r.status === 'pending').length} pending</span>
            </div>
          </div>
        </div>

        <div className={styles.filters}>
          <div className={styles.filtersContent}>
            <div className={styles.searchWrapper}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
            </div>
            <div className={styles.statusFilter}>
              {['all', 'active', 'pending', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    styles.statusBtn,
                    statusFilter === status
                      ? styles.statusBtnActive
                      : styles.statusBtnInactive
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr className={styles.thead}>
                <th className={styles.th}>Recipient</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th}>Token</th>
                <th className={styles.th}>Shares</th>
                <th className={styles.th}>Last Access</th>
                <th className={clsx(styles.th, styles.thRight)}>Actions</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {filteredRecipients.map((recipient) => (
                <tr 
                  key={recipient.id}
                  className={styles.tr}
                >
                  <td className={styles.td}>
                    <div className={styles.recipientInfo}>
                      <div className={styles.avatar}>
                        {recipient.name.charAt(0)}
                      </div>
                      <div>
                        <div className={styles.recipientName}>
                          {recipient.name}
                        </div>
                        <div className={styles.recipientEmail}>
                          <Mail className={styles.emailIcon} />
                          {recipient.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {getStatusBadge(recipient.status)}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.tokenWrapper}>
                      <code className={styles.tokenCode}>
                        {showToken === recipient.id ? recipient.token : maskToken(recipient.token)}
                      </code>
                      <button
                        onClick={() => setShowToken(showToken === recipient.id ? null : recipient.id)}
                        className={styles.tokenBtn}
                        title={showToken === recipient.id ? "Hide token" : "Show token"}
                      >
                        {showToken === recipient.id ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCopyToken(recipient.id, recipient.token)}
                        className={styles.tokenBtn}
                        title="Copy token"
                      >
                        {copiedToken === recipient.id ? (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className={styles.td}>
                    {recipient.shares.length > 0 ? (
                      <div className={styles.shareList}>
                        {recipient.shares.slice(0, 2).map((share) => (
                          <Link
                            key={share.id}
                            href="/sharing"
                            className={styles.shareLink}
                          >
                            <Share2 className="w-3 h-3 flex-shrink-0" />
                            {share.name}
                          </Link>
                        ))}
                        {recipient.shares.length > 2 && (
                          <div className={clsx(styles.moreShares, "group relative moreSharesGroup")}>
                            <span>+{recipient.shares.length - 2}</span>
                            <div className={styles.sharePopup}>
                              <div className={styles.popupHeader}>All shares:</div>
                              <div className={styles.popupList}>
                                {recipient.shares.map((share) => (
                                  <Link
                                    key={share.id}
                                    href="/sharing"
                                    className={styles.shareLink}
                                    style={{maxWidth: 'none'}}
                                  >
                                    <Share2 className="w-3 h-3" />
                                    {share.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className={styles.neverAccess}>No shares</span>
                    )}
                  </td>
                  <td className={styles.td}>
                    <div className={styles.accessInfo}>
                      {recipient.lastAccess ? (
                        <>
                          <div className={styles.accessTime}>
                            {formatDate(recipient.lastAccess)}
                          </div>
                          <div className={styles.accessCount}>
                            {formatNumber(recipient.accessCount)} requests
                          </div>
                        </>
                      ) : (
                        <span className={styles.neverAccess}>Never connected</span>
                      )}
                    </div>
                  </td>
                  <td className={clsx(styles.td, styles.thRight)}>
                    <div className={styles.actionMenu}>
                      <button
                        onClick={() => setOpenMenu(openMenu === recipient.id ? null : recipient.id)}
                        className={styles.menuTrigger}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === recipient.id && (
                        <div className={styles.menuDropdown}>
                          <button
                            onClick={() => {
                              setShowRegenerateConfirm(recipient.id);
                              setOpenMenu(null);
                            }}
                            className={styles.menuOption}
                          >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecipient(recipient);
                              setOpenMenu(null);
                            }}
                            className={styles.menuOption}
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setOpenMenu(null)}
                            className={clsx(styles.menuOption, styles.menuOptionDelete)}
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRecipients.length === 0 && (
            <div className={styles.emptyState}>
              <Users className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>No recipients found</p>
              <p className={styles.emptyDesc}>
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Recipient Modal */}
      {showNewRecipientModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Create New Recipient</h2>
              <p className={styles.modalDesc}>
                Add a new recipient to share data with
              </p>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Recipient Name <span className={styles.required} style={{color: '#ef4444'}}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Partner Company"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email <span className={styles.required} style={{color: '#ef4444'}}>*</span>
                </label>
                <input
                  type="email"
                  placeholder="contact@partner.com"
                  className={styles.input}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Comment (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Internal notes about this recipient..."
                  className={styles.textarea}
                />
              </div>
              <div className={styles.tokenInfo}>
                <Key className={styles.keyIcon} />
                <div>
                  <p className={styles.tokenTitle}>
                    Token will be generated automatically
                  </p>
                  <p className={styles.tokenDesc}>
                    A secure access token will be created when you save. Make sure to copy and share it with the recipient securely.
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowNewRecipientModal(false)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewRecipientModal(false)}
                className={styles.createBtn}
              >
                Create Recipient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Token Confirmation */}
      {showRegenerateConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmContent}>
            <div className={styles.confirmBody}>
              <div className={styles.confirmIconBox}>
                <RefreshCw className={styles.refreshIcon} />
              </div>
              <h2 className={styles.confirmTitle}>
                Regenerate Token?
              </h2>
              <p className={styles.confirmText}>
                This will invalidate the current token. The recipient will need to update their configuration with the new token.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowRegenerateConfirm(null)}
                className={styles.cancelBtn}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRegenerateConfirm(null)}
                className={styles.confirmBtn}
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}