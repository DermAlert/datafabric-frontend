'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
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
  Mail,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  X,
  Download,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { useDeltaSharing, useDisclosure } from '@/hooks';
import { Modal } from '@/components/ui';
import { Input, Textarea } from '@/components/ui/Input';

// ===========================================
// Constants
// ===========================================

const DELTA_SHARING_ENDPOINT = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:8004/api/delta-sharing`
  : 'http://localhost:8004/api/delta-sharing';

// ===========================================
// Status Badge Component
// ===========================================

const StatusBadge = memo(function StatusBadge({ isActive }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" />
        Active
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
      <AlertCircle className="w-3 h-3" />
      Inactive
    </span>
  );
});

// ===========================================
// Token Display Component
// ===========================================

const TokenDisplay = memo(function TokenDisplay({ token, recipientId, showToken, onToggle, onCopy, copied }) {
  const maskToken = (t) => {
    if (!t) return '••••••••';
    return t.substring(0, 8) + '••••' + t.substring(t.length - 4);
  };

  return (
    <div className="flex items-center gap-1">
      <code className="text-xs bg-gray-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-gray-600 dark:text-gray-400">
        {showToken ? token : maskToken(token)}
      </code>
      <button
        onClick={() => onToggle(recipientId)}
        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        title={showToken ? 'Hide token' : 'Show token'}
      >
        {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <button
        onClick={() => onCopy(recipientId, token)}
        className="p-1 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
        title="Copy token"
      >
        {copied ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </button>
    </div>
  );
});

// ===========================================
// Share Badges Component
// ===========================================

const ShareBadges = memo(function ShareBadges({ shares }) {
  if (!shares || shares.length === 0) {
    return <span className="text-xs text-gray-400 dark:text-gray-500">No shares</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {shares.slice(0, 2).map((share) => (
        <Link
          key={share.id}
          href="/sharing"
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400 hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors whitespace-nowrap"
        >
          <Share2 className="w-3 h-3 flex-shrink-0" />
          <span className="truncate max-w-[100px]">{share.name}</span>
        </Link>
      ))}
      {shares.length > 2 && (
        <div className="relative group">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 cursor-default">
            +{shares.length - 2}
          </span>
          <div className="absolute left-0 top-full mt-1 z-50 hidden group-hover:block">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 min-w-[160px]">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">
                All shares:
              </div>
              <div className="flex flex-col gap-1">
                {shares.map((share) => (
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
  );
});

// ===========================================
// Create Recipient Modal
// ===========================================

const CreateRecipientModal = memo(function CreateRecipientModal({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization_name: '',
  });
  const [createdToken, setCreatedToken] = useState(null);
  const [copiedNew, setCopiedNew] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    const result = await onCreate({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      organization_name: formData.organization_name.trim() || undefined,
    });
    if (result?.bearer_token) {
      setCreatedToken(result.bearer_token);
    }
  };

  const handleCopyNewToken = () => {
    if (createdToken) {
      navigator.clipboard.writeText(createdToken);
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', email: '', organization_name: '' });
    setCreatedToken(null);
    setCopiedNew(false);
    onClose();
  };

  if (createdToken) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Recipient Created">
        <div className="py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-center text-gray-900 dark:text-white mb-2">
            Success!
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
            Copy the bearer token below and share it securely with the recipient.
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  Bearer Token
                </p>
                <code className="block text-xs bg-white dark:bg-zinc-800 p-2 rounded font-mono text-gray-700 dark:text-gray-300 break-all">
                  {createdToken}
                </code>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={handleCopyNewToken}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {copiedNew ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Token
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Recipient">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Add a new recipient to share data with
      </p>
      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g., Data Team, Analytics Department"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          hint="Must be unique"
        />
        <Input
          label="Email"
          type="email"
          placeholder="contact@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Organization"
          placeholder="Company Inc."
          value={formData.organization_name}
          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
        />
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-300">
                Token will be generated automatically
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-1">
                A secure access token will be created when you save. Make sure to copy and share it
                with the recipient securely.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || isLoading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Recipient
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Edit Recipient Modal
// ===========================================

const EditRecipientModal = memo(function EditRecipientModal({
  isOpen,
  onClose,
  onSave,
  recipient,
  isLoading,
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization_name: '',
    is_active: true,
  });

  useEffect(() => {
    if (recipient) {
      setFormData({
        name: recipient.name || '',
        email: recipient.email || '',
        organization_name: recipient.organization_name || '',
        is_active: recipient.is_active ?? true,
      });
    }
  }, [recipient]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;
    const success = await onSave(recipient.id, {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
      organization_name: formData.organization_name.trim() || null,
      is_active: formData.is_active,
    });
    if (success) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Recipient">
      <div className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g., Data Team, Analytics Department"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
          hint="Must be unique"
        />
        <Input
          label="Email"
          type="email"
          placeholder="contact@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Organization"
          placeholder="Company Inc."
          value={formData.organization_name}
          onChange={(e) => setFormData({ ...formData, organization_name: e.target.value })}
        />
        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-violet-300 dark:peer-focus:ring-violet-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-violet-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">Active</span>
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!formData.name.trim() || isLoading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Regenerate Token Modal
// ===========================================

const RegenerateTokenModal = memo(function RegenerateTokenModal({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  isLoading,
  newToken,
}) {
  const [copiedNew, setCopiedNew] = useState(false);

  const handleCopyNewToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setCopiedNew(true);
      setTimeout(() => setCopiedNew(false), 2000);
    }
  };

  const handleClose = () => {
    setCopiedNew(false);
    onClose();
  };

  if (newToken) {
    return (
      <Modal isOpen={isOpen} onClose={handleClose} title="Token Regenerated">
        <div className="py-4">
          <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
            The new token for <strong>{recipient?.name}</strong> has been generated. Copy it now!
          </p>
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                  New Bearer Token
                </p>
                <code className="block text-xs bg-white dark:bg-zinc-800 p-2 rounded font-mono text-gray-700 dark:text-gray-300 break-all">
                  {newToken}
                </code>
              </div>
            </div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mt-3">
            <p className="text-xs text-red-700 dark:text-red-400">
              <strong>Important:</strong> The previous token is now invalid. Make sure to share the
              new token with the recipient.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
          <button
            onClick={handleCopyNewToken}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            {copiedNew ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy Token
              </>
            )}
          </button>
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Regenerate Token?">
      <div className="py-4">
        <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
          <RefreshCw className="w-6 h-6 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          This will invalidate the current token for <strong>{recipient?.name}</strong>. The
          recipient will need to update their configuration with the new token.
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Regenerate
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Delete Confirmation Modal
// ===========================================

const DeleteConfirmModal = memo(function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Recipient?">
      <div className="py-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
          Are you sure you want to delete <strong>{recipient?.name}</strong>? This action cannot be
          undone and the recipient will immediately lose access to all shared data.
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function RecipientsPage() {
  const {
    recipients,
    shares,
    isLoadingRecipients,
    error,
    refreshRecipients,
    createRecipient,
    updateRecipient,
    deleteRecipient,
    regenerateToken,
    associateRecipientToShares,
    clearError,
  } = useDeltaSharing();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedToken, setCopiedToken] = useState(null);
  const [showToken, setShowToken] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [newToken, setNewToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createModal = useDisclosure();
  const editModal = useDisclosure();
  const regenerateModal = useDisclosure();
  const deleteModal = useDisclosure();

  const filteredRecipients = recipients.filter((recipient) => {
    const matchesSearch = 
      recipient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipient.email && recipient.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      recipient.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && recipient.is_active) ||
      (statusFilter === 'inactive' && !recipient.is_active);
    return matchesSearch && matchesStatus;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCopyToken = (recipientId, token) => {
    if (token) {
    navigator.clipboard.writeText(token);
    setCopiedToken(recipientId);
    setTimeout(() => setCopiedToken(null), 2000);
    }
  };

  const handleToggleToken = (recipientId) => {
    setShowToken(showToken === recipientId ? null : recipientId);
  };

  const handleCreateRecipient = useCallback(
    async (data) => {
      setIsSubmitting(true);
      const result = await createRecipient(data);
      setIsSubmitting(false);
      return result;
    },
    [createRecipient]
  );

  const handleUpdateRecipient = useCallback(
    async (recipientId, data) => {
      setIsSubmitting(true);
      const result = await updateRecipient(recipientId, data);
      setIsSubmitting(false);
      return !!result;
    },
    [updateRecipient]
  );

  const handleDeleteRecipient = useCallback(async () => {
    if (!selectedRecipient) return;
    setIsSubmitting(true);
    const success = await deleteRecipient(selectedRecipient.id);
    setIsSubmitting(false);
    if (success) {
      deleteModal.onClose();
      setSelectedRecipient(null);
    }
  }, [selectedRecipient, deleteRecipient, deleteModal]);

  const handleRegenerateToken = useCallback(async () => {
    if (!selectedRecipient) return;
    setIsSubmitting(true);
    const token = await regenerateToken(selectedRecipient.id);
    setIsSubmitting(false);
    if (token) {
      setNewToken(token);
    }
  }, [selectedRecipient, regenerateToken]);

  const handleOpenEdit = (recipient) => {
    setSelectedRecipient(recipient);
    setOpenMenu(null);
    editModal.onOpen();
  };

  const handleOpenRegenerate = (recipient) => {
    setSelectedRecipient(recipient);
    setNewToken(null);
    setOpenMenu(null);
    regenerateModal.onOpen();
  };

  const handleOpenDelete = (recipient) => {
    setSelectedRecipient(recipient);
    setOpenMenu(null);
    deleteModal.onOpen();
  };

  const handleDownloadProfile = (recipient) => {
    const token = recipient.bearer_token || recipient.identifier || '<TOKEN>';
    const profileJson = {
      shareCredentialsVersion: 1,
      endpoint: DELTA_SHARING_ENDPOINT,
      bearerToken: token
    };
    const blob = new Blob([JSON.stringify(profileJson, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipient.name.replace(/\s+/g, '_')}.share`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpenMenu(null);
  };

  const activeCount = recipients.filter((r) => r.is_active).length;
  const inactiveCount = recipients.filter((r) => !r.is_active).length;

  return (
    <DashboardLayout>
      <div className="p-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-700 dark:text-red-400 hover:underline text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <Link
              href="/sharing"
              className="hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Delta Sharing
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
                <p className="text-gray-500 dark:text-gray-400">
                  Manage who can access your shared data
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshRecipients}
                disabled={isLoadingRecipients}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw
                  className={clsx('w-5 h-5', isLoadingRecipients && 'animate-spin')}
                />
              </button>
            <button
                onClick={createModal.onOpen}
              className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              New Recipient
            </button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-6 mt-4 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4" />
              <span>{recipients.length} total recipients</span>
            </div>
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>{activeCount} active</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-500">
              <AlertCircle className="w-4 h-4" />
              <span>{inactiveCount} inactive</span>
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
              {['all', 'active', 'inactive'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={clsx(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors capitalize',
                    statusFilter === status
                      ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-visible">
          {isLoadingRecipients && recipients.length === 0 ? (
            <div className="p-12 text-center">
              <Loader2 className="w-8 h-8 text-violet-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-500 dark:text-gray-400">Loading recipients...</p>
            </div>
          ) : filteredRecipients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No recipients found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                {searchTerm || statusFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'Create your first recipient to start sharing data'}
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <button
                  onClick={createModal.onOpen}
                  className="mt-4 text-sm text-violet-600 dark:text-violet-400 hover:underline"
                >
                  Create recipient
                </button>
              )}
            </div>
          ) : (
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
                    Token Expiry
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
                  className={clsx(
                    "transition-colors",
                    openMenu !== recipient.id && "hover:bg-gray-50 dark:hover:bg-zinc-800/50"
                  )}
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
                            {recipient.email ? (
                              <>
                          <Mail className="w-3 h-3" />
                          {recipient.email}
                              </>
                            ) : (
                              <span className="text-gray-400">@{recipient.identifier}</span>
                            )}
                          </div>
                          {recipient.organization_name && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="w-3 h-3" />
                              {recipient.organization_name}
                        </div>
                          )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                      <StatusBadge isActive={recipient.is_active} />
                  </td>
                  <td className="px-3 py-3">
                      <TokenDisplay
                        token={recipient.bearer_token}
                        recipientId={recipient.id}
                        showToken={showToken === recipient.id}
                        onToggle={handleToggleToken}
                        onCopy={handleCopyToken}
                        copied={copiedToken === recipient.id}
                      />
                  </td>
                  <td className="px-3 py-3">
                      <ShareBadges shares={recipient.shares} />
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(recipient.token_expiry)}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                      <div className="flex justify-end">
                      <button
                        id={`menu-btn-${recipient.id}`}
                        onClick={() => setOpenMenu(openMenu === recipient.id ? null : recipient.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      </div>

      {/* Dropdown Menu - Rendered outside table */}
      {openMenu && (() => {
        const recipient = filteredRecipients.find(r => r.id === openMenu);
        const button = document.getElementById(`menu-btn-${openMenu}`);
        if (!recipient || !button) return null;
        const rect = button.getBoundingClientRect();
        return (
          <>
            <div className="fixed inset-0 z-[99]" onClick={() => setOpenMenu(null)} />
            <div 
              className="fixed z-[100] bg-white dark:bg-zinc-800 rounded-lg shadow-xl border border-gray-200 dark:border-zinc-700 py-1 min-w-[160px]"
              style={{ top: rect.bottom + 4, right: window.innerWidth - rect.right }}
            >
              <button
                onClick={() => handleDownloadProfile(recipient)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <Download className="w-4 h-4" />
                Download .share
              </button>
              <button
                onClick={() => handleOpenRegenerate(recipient)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
              <div className="border-t border-gray-100 dark:border-zinc-700 my-1" />
              <button
                onClick={() => handleOpenEdit(recipient)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <Pencil className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleOpenDelete(recipient)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-700"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        );
      })()}

      {/* Modals */}
      <CreateRecipientModal
        isOpen={createModal.isOpen}
        onClose={createModal.onClose}
        onCreate={handleCreateRecipient}
        isLoading={isSubmitting}
      />

      <EditRecipientModal
        isOpen={editModal.isOpen}
        onClose={editModal.onClose}
        onSave={handleUpdateRecipient}
        recipient={selectedRecipient}
        isLoading={isSubmitting}
      />

      <RegenerateTokenModal
        isOpen={regenerateModal.isOpen}
        onClose={() => {
          regenerateModal.onClose();
          setNewToken(null);
        }}
        onConfirm={handleRegenerateToken}
        recipient={selectedRecipient}
        isLoading={isSubmitting}
        newToken={newToken}
      />

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={deleteModal.onClose}
        onConfirm={handleDeleteRecipient}
        recipient={selectedRecipient}
        isLoading={isSubmitting}
      />

    </DashboardLayout>
  );
}
