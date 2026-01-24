'use client';

import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  Shield,
  Mail,
  ExternalLink,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock recipients
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
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
            <CheckCircle2 className="w-3 h-3" />
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
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
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link href="/sharing" className="hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              Share
            </Link>
            <span>/</span>
            <span className="text-gray-900 dark:text-white">Recipients</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Recipients</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage who can access your shared data</p>
              </div>
            </div>
            <button
              onClick={() => setShowNewRecipientModal(true)}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Recipient
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{MOCK_RECIPIENTS.length} total recipients</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{MOCK_RECIPIENTS.filter(r => r.status === 'active').length} active</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
              <span>{MOCK_RECIPIENTS.filter(r => r.status === 'pending').length} pending</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search recipients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
            </div>
            <div className="flex items-center gap-2">
              {['all', 'active', 'pending', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    "px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize",
                    statusFilter === status
                      ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-zinc-800">
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recipient
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Shares
                </th>
                <th className="text-left px-3 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                  Last Access
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
              {filteredRecipients.map((recipient) => (
                <tr 
                  key={recipient.id}
                  className="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
                        {recipient.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">
                          {recipient.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {recipient.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {getStatusBadge(recipient.status)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">
                        {showToken === recipient.id ? recipient.token : maskToken(recipient.token)}
                      </code>
                      <button
                        onClick={() => setShowToken(showToken === recipient.id ? null : recipient.id)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
                        className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
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
                  <td className="px-3 py-3">
                    {recipient.shares.length > 0 ? (
                      <div className="flex items-center gap-1">
                        {recipient.shares.slice(0, 2).map((share) => (
                          <Link
                            key={share.id}
                            href="/sharing"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors whitespace-nowrap"
                          >
                            <Share2 className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">{share.name}</span>
                          </Link>
                        ))}
                        {recipient.shares.length > 2 && (
                          <div className="relative group">
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-default">
                              +{recipient.shares.length - 2}
                            </span>
                            <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
                              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[160px]">
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">All shares:</div>
                                <div className="flex flex-col gap-1">
                                  {recipient.shares.map((share) => (
                                    <Link
                                      key={share.id}
                                      href="/sharing"
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-violet-700 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors"
                                    >
                                      <Share2 className="w-3 h-3" />
                                      {share.name}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 dark:text-gray-500">No shares</span>
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <div className="text-xs">
                      {recipient.lastAccess ? (
                        <>
                          <div className="text-gray-900 dark:text-white">
                            {formatDate(recipient.lastAccess)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatNumber(recipient.accessCount)} requests
                          </div>
                        </>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">Never connected</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenu(openMenu === recipient.id ? null : recipient.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {openMenu === recipient.id && (
                        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 min-w-[140px]">
                          <button
                            onClick={() => {
                              setShowRegenerateConfirm(recipient.id);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Regenerate
                          </button>
                          <button
                            onClick={() => {
                              setSelectedRecipient(recipient);
                              setOpenMenu(null);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                            onClick={() => setOpenMenu(null)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
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
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No recipients found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Recipient Modal */}
      {showNewRecipientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Recipient</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Add a new recipient to share data with
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Partner Company"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  placeholder="contact@partner.com"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Comment (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Internal notes about this recipient..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-amber-800 dark:text-amber-300">
                      Token will be generated automatically
                    </p>
                    <p className="text-amber-700 dark:text-amber-400 mt-1">
                      A secure access token will be created when you save. Make sure to copy and share it with the recipient securely.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowNewRecipientModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewRecipientModal(false)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                Create Recipient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Regenerate Token Confirmation */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
                Regenerate Token?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                This will invalidate the current token. The recipient will need to update their configuration with the new token.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowRegenerateConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowRegenerateConfirm(null)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
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
