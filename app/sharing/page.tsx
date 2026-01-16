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

// Mock data for shares - only Persistent datasets can be shared via Delta Sharing
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

// Mock recipients
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

type Share = typeof MOCK_SHARES[0];
type Dataset = Share['datasets'][0];
type Recipient = typeof MOCK_RECIPIENTS[0];

export default function SharingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShare, setSelectedShare] = useState<Share | null>(MOCK_SHARES[0]);
  const [activeTab, setActiveTab] = useState<'schemas' | 'recipients'>('schemas');
  const [showNewShareModal, setShowNewShareModal] = useState(false);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const filteredShares = MOCK_SHARES.filter(share =>
    share.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    share.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTotalDatasets = (share: Share) => {
    return share.datasets.length;
  };

  const getTotalRows = (share: Share) => {
    return share.datasets.reduce((acc, ds) => acc + ds.rowCount, 0);
  };

  const getLayerBadge = (layer: string) => {
    if (layer === 'bronze') {
      return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', label: 'Bronze' };
    }
    return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-400', label: 'Silver' };
  };

  const handleCopyToken = (recipientId: string, token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(recipientId);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Share</h1>
                <p className="text-gray-500 dark:text-gray-400">Share datasets securely with external partners</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/sharing/recipients"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Recipients
              </Link>
              <button
                onClick={() => setShowNewShareModal(true)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                New Share
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Share2 className="w-4 h-4" />
              <span>{MOCK_SHARES.length} shares</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{MOCK_RECIPIENTS.length} recipients</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Table2 className="w-4 h-4" />
              <span>{MOCK_SHARES.reduce((acc, s) => acc + getTotalDatasets(s), 0)} shared datasets</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Shares List */}
          <div className="w-96 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search shares..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 dark:border-zinc-700 rounded-lg bg-gray-50 dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                  />
                </div>
              </div>

              {/* Shares */}
              <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[calc(100vh-320px)] overflow-y-auto">
                {filteredShares.map((share) => (
                  <button
                    key={share.id}
                    onClick={() => setSelectedShare(share)}
                    className={clsx(
                      "w-full p-4 text-left transition-colors",
                      selectedShare?.id === share.id
                        ? "bg-violet-50 dark:bg-violet-900/20 border-l-2 border-violet-500"
                        : "hover:bg-gray-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {share.name}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {share.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
                          <span className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            {share.datasets.length} datasets
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {share.recipients.length}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className={clsx(
                        "w-4 h-4 text-gray-400 flex-shrink-0 transition-colors",
                        selectedShare?.id === share.id && "text-violet-500"
                      )} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Share Details */}
          <div className="flex-1">
            {selectedShare ? (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
                {/* Header */}
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                          <Share2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                            {selectedShare.name}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {selectedShare.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <Settings2 className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedShare.datasets.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Datasets</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatNumber(getTotalRows(selectedShare))}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Total Rows</div>
                    </div>
                    <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {selectedShare.recipients.length}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Recipients</div>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-zinc-800">
                  <div className="flex">
                    <button
                      onClick={() => setActiveTab('schemas')}
                      className={clsx(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'schemas'
                          ? "border-violet-500 text-violet-600 dark:text-violet-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Database className="w-4 h-4" />
                        Shared Datasets ({selectedShare.datasets.length})
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('recipients')}
                      className={clsx(
                        "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'recipients'
                          ? "border-violet-500 text-violet-600 dark:text-violet-400"
                          : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Recipients ({selectedShare.recipients.length})
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'schemas' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Datasets in this Share
                        </h3>
                        <button
                          onClick={() => setShowAddTableModal(true)}
                          className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-4 h-4" />
                          Add Dataset
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedShare.datasets.map((dataset) => {
                          const layerBadge = getLayerBadge(dataset.layer);
                          return (
                            <div
                              key={dataset.id}
                              className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <div className={clsx(
                                    "w-10 h-10 rounded-lg flex items-center justify-center",
                                    dataset.layer === 'bronze' 
                                      ? "bg-amber-100 dark:bg-amber-900/30" 
                                      : "bg-purple-100 dark:bg-purple-900/30"
                                  )}>
                                    {dataset.layer === 'bronze' ? (
                                      <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                                    ) : (
                                      <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-gray-900 dark:text-white">
                                        {dataset.name}
                                      </span>
                                      <span className={clsx("px-2 py-0.5 rounded text-xs font-medium", layerBadge.bg, layerBadge.text)}>
                                        {layerBadge.label}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                      {dataset.description}
                                    </p>
                                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 dark:text-gray-500">
                                      <span>{formatNumber(dataset.rowCount)} rows</span>
                                    </div>
                                  </div>
                                </div>
                                <button className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {selectedShare.datasets.length === 0 && (
                        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                          <Database className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No datasets shared yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Add Bronze or Silver datasets to this share
                          </p>
                          <button
                            onClick={() => setShowAddTableModal(true)}
                            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Dataset
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'recipients' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Authorized Recipients
                        </h3>
                        <button
                          onClick={() => setShowAddRecipientModal(true)}
                          className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex items-center gap-1"
                        >
                          <UserPlus className="w-4 h-4" />
                          Add Recipient
                        </button>
                      </div>

                      {selectedShare.recipients.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg">
                          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                          <p className="text-gray-500 dark:text-gray-400 font-medium">No recipients yet</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                            Add recipients to share this data
                          </p>
                          <button
                            onClick={() => setShowAddRecipientModal(true)}
                            className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                          >
                            <UserPlus className="w-4 h-4" />
                            Add Recipient
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedShare.recipients.map((recipient) => {
                            const fullRecipient = MOCK_RECIPIENTS.find(r => r.id === recipient.id);
                            return (
                              <div
                                key={recipient.id}
                                className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-violet-200 dark:hover:border-violet-800 transition-colors"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-medium">
                                      {recipient.name.charAt(0)}
                                    </div>
                                    <div>
                                      <div className="font-medium text-gray-900 dark:text-white">
                                        {recipient.name}
                                      </div>
                                      <div className="text-sm text-gray-500 dark:text-gray-400">
                                        {recipient.email}
                                      </div>
                                    </div>
                                  </div>
                                  <button className="p-1 text-gray-400 hover:text-red-500 rounded">
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                {fullRecipient && (
                                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between">
                                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Key className="w-3 h-3" />
                                        Token: {fullRecipient.tokenPrefix}
                                      </span>
                                      {fullRecipient.lastAccess && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" />
                                          Last access: {formatDate(fullRecipient.lastAccess)}
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleCopyToken(recipient.id, 'full-token-here')}
                                      className="text-xs text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                                    >
                                      {copiedToken === recipient.id ? (
                                        <>
                                          <CheckCircle2 className="w-3 h-3" />
                                          Copied!
                                        </>
                                      ) : (
                                        <>
                                          <Copy className="w-3 h-3" />
                                          Copy Token
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
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Created {formatDate(selectedShare.createdAt)}</span>
                    <span>Last updated {formatDate(selectedShare.updatedAt)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
                <Share2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a Share</h3>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Choose a share from the list to view its schemas, tables, and recipients.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New Share Modal */}
      {showNewShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Share</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Create a new share to organize datasets for sharing
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Share Name
                </label>
                <input
                  type="text"
                  placeholder="e.g., healthcare_data"
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe what data this share contains..."
                  className="w-full px-3 py-2 border border-gray-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowNewShareModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowNewShareModal(false)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                Create Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Recipient Modal */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Recipient</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Grant access to this share
              </p>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select existing recipients:
                </p>
                {MOCK_RECIPIENTS.filter(r => !selectedShare?.recipients.find(sr => sr.id === r.id)).map((recipient) => (
                  <label
                    key={recipient.id}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-violet-300 dark:hover:border-violet-700 transition-colors"
                  >
                    <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                      {recipient.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {recipient.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {recipient.email}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
                <Link
                  href="/sharing/recipients"
                  className="text-sm text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" />
                  Create new recipient
                </Link>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowAddRecipientModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddRecipientModal(false)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
              >
                Add Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Dataset Modal */}
      {showAddTableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl mx-4">
            <div className="p-6 border-b border-gray-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Add Dataset to Share</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Select Persistent datasets stored in Delta Lake
              </p>
            </div>
            <div className="p-6">
              {/* Info about Delta Sharing */}
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Only <strong>Persistent</strong> datasets can be shared via Delta Sharing. 
                    Virtualized datasets query data on-demand and are not stored in Delta Lake.
                  </p>
                </div>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto">
                {/* Bronze Datasets */}
                <div className="flex items-center gap-2 px-1 py-2">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Bronze Layer</span>
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
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-amber-300 dark:hover:border-amber-700 transition-colors"
                  >
                    <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{dataset.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dataset.desc}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatNumber(dataset.rows)} rows</span>
                  </label>
                ))}

                {/* Silver Datasets */}
                <div className="flex items-center gap-2 px-1 py-2 mt-4">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Silver Layer</span>
                </div>
                {[
                  { name: 'patients_normalized', desc: 'Normalized patient data with CPF formatting', rows: 125430 },
                  { name: 'customer_360_silver', desc: 'Customer 360 with phone normalization', rows: 89012 },
                  { name: 'transactions_clean', desc: 'Cleaned transaction data', rows: 456789 },
                  { name: 'visits_clean', desc: 'Cleaned visit records', rows: 567890 },
                ].map((dataset) => (
                  <label
                    key={dataset.name}
                    className="flex items-center gap-3 p-3 border border-gray-200 dark:border-zinc-700 rounded-lg cursor-pointer hover:border-purple-300 dark:hover:border-purple-700 transition-colors"
                  >
                    <input type="checkbox" className="w-4 h-4 text-violet-600 rounded" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{dataset.name}</span>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{dataset.desc}</p>
                    </div>
                    <span className="text-xs text-gray-400">{formatNumber(dataset.rows)} rows</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-zinc-800 flex justify-end gap-3">
              <button
                onClick={() => setShowAddTableModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAddTableModal(false)}
                className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium"
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

