'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import {
  Plus,
  Database,
  RefreshCw,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  LayoutGrid,
  Activity,
  HardDrive,
  Edit,
  Trash2,
  FolderOpen,
  Clock,
  X,
  Save,
  Shield,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useDisclosure } from '@/hooks';
import { DropdownMenu, DropdownItem, Select } from '@/components/ui';
import { SearchInput } from '@/components/ui/Input';
import { EmptyState } from '@/components/ui/EmptyState';
import { connectionService } from '@/lib/api';
import { toast } from 'sonner';
import SshTunnelSection from '@/components/connections/SshTunnelSection';

const ENCRYPTED_SENTINEL = '[ENCRYPTED]';

// ===========================================
// Helper Functions
// ===========================================

function formatLastSync(lastSyncTime) {
  if (!lastSyncTime) return 'Never';
  
  const date = new Date(lastSyncTime);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function getConnectionHost(params) {
  return params.host || 
         params.endpoint || 
         params.account_name ||
         params.bucket ||
         'N/A';
}

// ===========================================
// Connection Card Component
// ===========================================

const ConnectionCard = memo(function ConnectionCard({
  connection,
  onSync,
  onTest,
  onDelete,
  onEdit,
  onBrowse,
  isSyncing,
  isTesting,
  testResult,
}) {
  const menuDisclosure = useDisclosure();
  const isMetadata = connection.content_type === 'metadata';
  const host = getConnectionHost(connection.connection_params);
  const typeName = connection.connectionType?.name || `Type ${connection.connection_type_id}`;
  const hasTunnel = connection.connection_params?.tunnel?.enabled === true;
  const tunnelHost = connection.connection_params?.tunnel?.ssh_host;

  return (
    <div className="group bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-5 hover:shadow-md transition-all relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center border',
              isMetadata
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-600 dark:text-purple-400'
            )}
          >
            {isMetadata ? (
              <Database className="w-5 h-5" aria-hidden="true" />
            ) : (
              <HardDrive className="w-5 h-5" aria-hidden="true" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{connection.name}</h3>
            <span className="text-xs text-gray-500 capitalize">{typeName}</span>
          </div>
        </div>

        <DropdownMenu
          isOpen={menuDisclosure.isOpen}
          onClose={menuDisclosure.onClose}
          trigger={
            <button
              className={clsx(
                'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors',
                menuDisclosure.isOpen && 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white'
              )}
              onClick={menuDisclosure.onToggle}
              aria-label="Opções da conexão"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          }
        >
          <DropdownItem icon={<Edit className="w-3.5 h-3.5" />} onClick={() => onEdit(connection.id)}>
            Edit
          </DropdownItem>
          <DropdownItem
            icon={<Trash2 className="w-3.5 h-3.5" />}
            onClick={() => onDelete(connection.id)}
            variant="danger"
          >
            Delete
          </DropdownItem>
        </DropdownMenu>
      </div>

      {/* Info */}
      <div className="space-y-3 mb-5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Host</span>
          <span
            className="font-mono text-xs bg-gray-100 dark:bg-zinc-800 px-2 py-1 rounded text-gray-700 dark:text-gray-300 max-w-[140px] truncate"
            title={host}
          >
            {host}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Status</span>
          <div className="flex items-center gap-1.5">
            {connection.status === 'active' ? (
              <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
            ) : connection.status === 'error' ? (
              <AlertCircle className="w-4 h-4 text-red-500" aria-hidden="true" />
            ) : (
              <Clock className="w-4 h-4 text-yellow-500" aria-hidden="true" />
            )}
            <span
              className={clsx(
                'capitalize',
                connection.status === 'active' && 'text-green-600',
                connection.status === 'error' && 'text-red-600',
                connection.status === 'inactive' && 'text-yellow-600'
              )}
            >
              {connection.status}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Last Sync</span>
          <span className="text-gray-700 dark:text-gray-300">
            {formatLastSync(connection.last_sync_time)}
          </span>
        </div>
        {hasTunnel && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Tunnel</span>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
              <Shield className="w-3 h-3" />
              SSH via {tunnelHost}
            </span>
          </div>
        )}
      </div>

      {/* Test Result Feedback */}
      {testResult && (
        <div className={clsx(
          "mb-4 p-2 rounded-lg text-xs flex items-center gap-2",
          testResult.success 
            ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
            : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
        )}>
          {testResult.success ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{testResult.success ? 'Connected!' : (testResult.message || 'Failed')}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
        <button
          onClick={() => onTest(connection.id)}
          disabled={isTesting}
          className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
          title="Test Connection"
          aria-label="Testar conexão"
        >
          {isTesting ? (
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          ) : (
            <Activity className="w-4 h-4" aria-hidden="true" />
          )}
        </button>

        {isMetadata ? (
          <>
            <Link
              href={`/metadata/${connection.id}`}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <LayoutGrid className="w-3.5 h-3.5" aria-hidden="true" />
              Schema
            </Link>
            <button
              onClick={() => onSync(connection.id)}
              disabled={isSyncing}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              <RefreshCw
                className={clsx('w-3.5 h-3.5', isSyncing && 'animate-spin')}
                aria-hidden="true"
              />
              {isSyncing ? 'Syncing' : 'Sync'}
            </button>
          </>
        ) : (
          <button
            onClick={() => onBrowse(connection.id)}
            className="flex-[2] flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FolderOpen className="w-4 h-4" aria-hidden="true" />
            Browse Files
          </button>
        )}
      </div>
    </div>
  );
});

// ===========================================
// Section Component
// ===========================================

const ConnectionSection = memo(function ConnectionSection({
  title,
  icon,
  connections,
  onSync,
  onTest,
  onDelete,
  onEdit,
  onBrowse,
  syncingId,
  testingId,
  testResults,
}) {
  if (connections.length === 0) return null;

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        <span className="text-xs bg-gray-100 dark:bg-zinc-800 text-gray-500 px-2 py-0.5 rounded-full">
          {connections.length}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {connections.map((conn) => (
          <ConnectionCard
            key={conn.id}
            connection={conn}
            onSync={onSync}
            onTest={onTest}
            onDelete={onDelete}
            onEdit={onEdit}
            onBrowse={onBrowse}
            isSyncing={syncingId === conn.id}
            isTesting={testingId === conn.id}
            testResult={testResults[conn.id]}
          />
        ))}
      </div>
    </section>
  );
});

// ===========================================
// Main Page Component
// ===========================================

export default function ConnectionsPage() {
  const [connections, setConnections] = useState([]);
  const [connectionTypes, setConnectionTypes] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [syncingId, setSyncingId] = useState(null);
  const [testingId, setTestingId] = useState(null);
  const [testResults, setTestResults] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  
  // Edit modal state
  const [editingConnection, setEditingConnection] = useState(null);
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    description: '',
    connectionParams: {}
  });
  const [isSaving, setIsSaving] = useState(false);
  const [editError, setEditError] = useState(null);

  // Edit modal tunnel state
  const [editTunnelEnabled, setEditTunnelEnabled] = useState(false);
  const [editTunnelData, setEditTunnelData] = useState({
    ssh_host: '',
    ssh_port: 22,
    ssh_username: '',
    auth_method: 'password',
    ssh_password: '',
    ssh_private_key: '',
    ssh_passphrase: '',
  });
  // Track which tunnel fields were originally encrypted (to avoid sending unchanged values)
  const [editTunnelOriginalEncrypted, setEditTunnelOriginalEncrypted] = useState({});

  // Delete modal state
  const [deletingConnection, setDeletingConnection] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Known field options for select dropdowns
  const KNOWN_FIELD_OPTIONS = {
    sslmode: ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'],
  };

  // Fetch data function (reusable)
  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);
    
    try {
      // Fetch connection types and data connections in parallel
      const [types, dataConnections] = await Promise.all([
        connectionService.getAll(),
        connectionService.list(),
      ]);

      // Create a map of connection types by ID
      const typesMap = {};
      types.forEach(t => { typesMap[t.id] = t; });
      setConnectionTypes(typesMap);

      // Enrich connections with their type info
      const enriched = dataConnections.map(conn => ({
        ...conn,
        connectionType: typesMap[conn.connection_type_id],
      }));
      setConnections(enriched);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
      setError('Failed to load connections. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refresh when window regains focus (user returns to tab)
  useEffect(() => {
    const handleFocus = () => {
      fetchData(false); // Silent refresh when user returns
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  // Manual refresh handler
  const handleRefresh = useCallback(() => {
    fetchData(false);
  }, [fetchData]);

  // Handlers
  const handleSync = useCallback(async (id) => {
    setSyncingId(id);
    try {
      await connectionService.sync(id);
      toast.success('Sync started successfully!');
      // Refetch all connections to get updated status
      await fetchData(false);
    } catch (err) {
      console.error('Sync failed:', JSON.stringify(err, null, 2), err);
      
      // Extract error message
      let errorMessage = 'Sync failed. Please try again.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const apiError = err;
        const detail = apiError.data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          errorMessage = detail[0].msg || errorMessage;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      
      toast.error(`Sync failed: ${errorMessage}`);
    } finally {
      setSyncingId(null);
    }
  }, [fetchData]);

  const handleTest = useCallback(async (id) => {
    setTestingId(id);
    // Clear previous result
    setTestResults(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    
    try {
      const result = await connectionService.testById(id);
      setTestResults(prev => ({ ...prev, [id]: result }));
      // Refetch to get updated status after test
      await fetchData(false);
    } catch (err) {
      const error = err;
      setTestResults(prev => ({ 
        ...prev, 
        [id]: { success: false, message: error.message || 'Connection test failed' } 
      }));
    } finally {
      setTestingId(null);
    }
  }, [fetchData]);

  const handleDelete = useCallback((id) => {
    const connection = connections.find(c => c.id === id);
    if (connection) {
      setDeletingConnection(connection);
    }
  }, [connections]);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletingConnection) return;
    
    setIsDeleting(true);
    try {
      await connectionService.delete(deletingConnection.id);
      // Success - update UI
      setConnections(prev => prev.filter(c => c.id !== deletingConnection.id));
      setDeletingConnection(null);
    } catch (err) {
      const error = err;
      // 502 errors from proxy usually mean the delete succeeded but response had issues
      // 204 No Content can also cause parsing issues - treat as success
      if (error.status === 502 || error.status === 204 || !error.status) {
        // Delete likely succeeded - close modal and update UI
        setConnections(prev => prev.filter(c => c.id !== deletingConnection.id));
        setDeletingConnection(null);
      } else {
        // Real error (4xx except 404, or 5xx except 502)
        console.error('Delete failed:', error.message || 'Unknown error');
        // Keep modal open on real errors
      }
    } finally {
      setIsDeleting(false);
    }
  }, [deletingConnection]);

  const handleCancelDelete = useCallback(() => {
    setDeletingConnection(null);
  }, []);

  const handleEdit = useCallback((id) => {
    const connection = connections.find(c => c.id === id);
    if (connection) {
      setEditingConnection(connection);
      // Convert connection_params to the expected format, excluding tunnel
      const params = {};
      Object.entries(connection.connection_params || {}).forEach(([key, value]) => {
        if (key === 'tunnel') return; // Handle tunnel separately
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          params[key] = value;
        } else {
          params[key] = String(value);
        }
      });
      setEditFormData({
        name: connection.name,
        description: connection.description || '',
        connectionParams: params,
      });

      // Populate tunnel state from existing connection
      const existingTunnel = connection.connection_params?.tunnel;
      if (existingTunnel && existingTunnel.enabled) {
        setEditTunnelEnabled(true);
        // Track which sensitive fields are encrypted
        const encryptedFields = {};
        ['ssh_password', 'ssh_private_key', 'ssh_passphrase'].forEach(field => {
          if (existingTunnel[field] === ENCRYPTED_SENTINEL) {
            encryptedFields[field] = true;
          }
        });
        setEditTunnelOriginalEncrypted(encryptedFields);
        setEditTunnelData({
          ssh_host: existingTunnel.ssh_host || '',
          ssh_port: existingTunnel.ssh_port ?? 22,
          ssh_username: existingTunnel.ssh_username || '',
          auth_method: existingTunnel.auth_method || 'password',
          ssh_password: existingTunnel.ssh_password || '',
          ssh_private_key: existingTunnel.ssh_private_key || '',
          ssh_passphrase: existingTunnel.ssh_passphrase || '',
        });
      } else {
        setEditTunnelEnabled(false);
        setEditTunnelOriginalEncrypted({});
        setEditTunnelData({
          ssh_host: '',
          ssh_port: 22,
          ssh_username: '',
          auth_method: 'password',
          ssh_password: '',
          ssh_private_key: '',
          ssh_passphrase: '',
        });
      }

      setEditError(null);
    }
  }, [connections]);

  const handleCloseEditModal = useCallback(() => {
    setEditingConnection(null);
    setEditFormData({ name: '', description: '', connectionParams: {} });
    setEditError(null);
    setEditTunnelEnabled(false);
    setEditTunnelOriginalEncrypted({});
    setEditTunnelData({
      ssh_host: '',
      ssh_port: 22,
      ssh_username: '',
      auth_method: 'password',
      ssh_password: '',
      ssh_private_key: '',
      ssh_passphrase: '',
    });
  }, []);

  // Handle input change for connection params
  const handleParamChange = useCallback((key, value) => {
    setEditFormData(prev => ({
      ...prev,
      connectionParams: { ...prev.connectionParams, [key]: value }
    }));
    setEditError(null);
  }, []);

  // Handle tunnel field change in edit mode
  const handleEditTunnelFieldChange = useCallback((field, value) => {
    setEditTunnelData(prev => ({ ...prev, [field]: value }));
    setEditError(null);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingConnection) return;
    if (!editFormData.name.trim()) {
      setEditError('Connection name is required');
      return;
    }

    // Validate required fields from schema
    const schema = editingConnection.connectionType?.connection_params_schema;
    const editHasTunnelSupport = schema?.properties?.tunnel?.type === 'object';

    if (schema) {
      const requiredFields = schema.required || [];
      for (const field of requiredFields) {
        if (field === 'tunnel') continue; // Tunnel has its own validation
        const value = editFormData.connectionParams[field];
        if (value === undefined || value === '' || value === null) {
          const property = schema.properties?.[field];
          const fieldName = property?.title || field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
          setEditError(`${fieldName} is required`);
          return;
        }
      }
    }

    // Validate tunnel fields when enabled
    if (editTunnelEnabled && editHasTunnelSupport) {
      const td = editTunnelData;
      const isFieldEmpty = (field) => {
        const val = td[field];
        // If field was originally encrypted and user hasn't entered a new value, that's OK
        if (editTunnelOriginalEncrypted[field] && (!val || val === ENCRYPTED_SENTINEL)) return false;
        return !val || (typeof val === 'string' && !val.trim());
      };

      if (isFieldEmpty('ssh_host')) {
        setEditError('SSH Host is required when tunnel is enabled');
        return;
      }
      if (isFieldEmpty('ssh_username')) {
        setEditError('SSH Username is required when tunnel is enabled');
        return;
      }
      if (td.auth_method === 'password' && isFieldEmpty('ssh_password')) {
        setEditError('SSH Password is required when using password authentication');
        return;
      }
      if (td.auth_method === 'private_key' && isFieldEmpty('ssh_private_key')) {
        setEditError('SSH Private Key is required when using key authentication');
        return;
      }
    }

    setIsSaving(true);
    setEditError(null);

    try {
      // Build connection_params, filtering out empty values and excluding tunnel
      const connectionParams = {};
      Object.entries(editFormData.connectionParams).forEach(([key, value]) => {
        if (key === 'tunnel') return; // Handle tunnel separately
        if (value !== '' && value !== undefined && value !== null) {
          // Skip [ENCRYPTED] sentinel values (the backend keeps the existing encrypted value)
          if (value === ENCRYPTED_SENTINEL) return;
          connectionParams[key] = value;
        }
      });

      // Build tunnel block
      if (editHasTunnelSupport) {
        if (editTunnelEnabled) {
          const tunnel = { enabled: true };
          tunnel.ssh_host = editTunnelData.ssh_host;
          tunnel.ssh_port = editTunnelData.ssh_port || 22;
          tunnel.ssh_username = editTunnelData.ssh_username;
          tunnel.auth_method = editTunnelData.auth_method || 'password';

          // For sensitive fields: only send if user changed them (not [ENCRYPTED])
          const sensitiveFields = ['ssh_password', 'ssh_private_key', 'ssh_passphrase'];
          sensitiveFields.forEach(field => {
            const val = editTunnelData[field];
            if (val && val !== ENCRYPTED_SENTINEL && val.trim()) {
              tunnel[field] = val;
            }
            // If originally encrypted and user left blank, don't send it (backend keeps existing)
          });

          connectionParams.tunnel = tunnel;
        } else {
          // Explicitly disable tunnel
          connectionParams.tunnel = { enabled: false };
        }
      }

      const updateData = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim() || undefined,
        connection_params: connectionParams,
      };

      const updated = await connectionService.update(editingConnection.id, updateData);
      
      // Update local state
      setConnections(prev =>
        prev.map(c => c.id === updated.id 
          ? { ...c, ...updated, connectionType: connectionTypes[updated.connection_type_id] }
          : c
        )
      );
      
      handleCloseEditModal();
    } catch (err) {
      console.error('Update failed:', err);
      const error = err;
      setEditError(error.data?.detail || error.message || 'Failed to update connection');
    } finally {
      setIsSaving(false);
    }
  }, [editingConnection, editFormData, editTunnelEnabled, editTunnelData, editTunnelOriginalEncrypted, connectionTypes, handleCloseEditModal]);

  const router = useRouter();
  const handleBrowse = useCallback((id) => {
    router.push(`/connections/browse/${id}`);
  }, [router]);

  // Render form field based on schema property for edit modal
  const renderEditFormField = useCallback((key, property, isRequired) => {
    // Skip tunnel — rendered separately via SshTunnelSection
    if (key === 'tunnel') return null;

    const value = editFormData.connectionParams[key] ?? '';
    const label = property.title || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    const isEncryptedValue = value === ENCRYPTED_SENTINEL;
    
    // Get enum options from property or known fields
    const enumOptions = property.enum || KNOWN_FIELD_OPTIONS[key.toLowerCase()];
    
    // Handle enum (select)
    if (enumOptions && enumOptions.length > 0) {
      return (
        <Select
          key={key}
          label={label}
          required={isRequired}
          value={String(value) || null}
          onChange={(val) => handleParamChange(key, val)}
          options={enumOptions.map(opt => ({ value: opt, label: opt }))}
          size="md"
        />
      );
    }

    // Handle boolean (checkbox)
    if (property.type === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-3">
          <input
            type="checkbox"
            id={`edit-${key}`}
            checked={Boolean(value)}
            onChange={(e) => handleParamChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={`edit-${key}`} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {property.description && (
              <span className="block text-xs text-gray-500 font-normal">{property.description}</span>
            )}
          </label>
        </div>
      );
    }

    // Handle password (with [ENCRYPTED] support)
    if (property.format === 'password') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="password"
            value={isEncryptedValue ? '' : String(value)}
            onChange={(e) => handleParamChange(key, e.target.value)}
            placeholder={isEncryptedValue ? 'Encrypted — leave blank to keep' : property.description}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      );
    }

    // Handle integer/number
    if (property.type === 'integer' || property.type === 'number') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="number"
            value={value === '' ? '' : Number(value)}
            onChange={(e) => handleParamChange(key, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={property.default?.toString() || property.description}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>
      );
    }

    // Default: text input
    return (
      <div key={key}>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </label>
        <input
          type="text"
          value={String(value)}
          onChange={(e) => handleParamChange(key, e.target.value)}
          placeholder={property.default?.toString() || property.description}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>
    );
  }, [editFormData.connectionParams, handleParamChange, KNOWN_FIELD_OPTIONS]);

  // Filtered connections
  const filteredConnections = connections.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.connectionType?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const metadataConnections = filteredConnections.filter((c) => c.content_type === 'metadata');
  const storageConnections = filteredConnections.filter((c) => c.content_type === 'image');

  return (
    <DashboardLayout>
      <div className="p-8 max-w-7xl mx-auto pb-20">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Connections</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your data sources and integrations.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
              title="Refresh connections"
            >
              <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} aria-hidden="true" />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <Link
              href="/connections/new"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              New Connection
            </Link>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-8">
          <div className="relative flex-1 max-w-md">
            <SearchInput
              type="text"
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
            />
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="ml-3 text-gray-500">Loading connections...</span>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !error && (
          <div className="space-y-10">
            <ConnectionSection
              title="Relational & Metadata"
              icon={<Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
              connections={metadataConnections}
              onSync={handleSync}
              onTest={handleTest}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onBrowse={handleBrowse}
              syncingId={syncingId}
              testingId={testingId}
              testResults={testResults}
            />

            <ConnectionSection
              title="Object Storage & Data Lake"
              icon={<HardDrive className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
              connections={storageConnections}
              onSync={handleSync}
              onTest={handleTest}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onBrowse={handleBrowse}
              syncingId={syncingId}
              testingId={testingId}
              testResults={testResults}
            />

            {filteredConnections.length === 0 && connections.length > 0 && (
              <EmptyState
                icon={<Search className="w-8 h-8" />}
                title="No connections found"
                description="Try adjusting your search terms"
                className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 border-dashed"
              />
            )}

            {connections.length === 0 && (
              <EmptyState
                icon={<Database className="w-8 h-8" />}
                title="No connections yet"
                description="Create your first data connection to get started"
                className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 border-dashed"
              >
                <Link
                  href="/connections/new"
                  className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Connection
                </Link>
              </EmptyState>
            )}
          </div>
        )}
      </div>

      {/* Edit Connection Modal */}
      {editingConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-zinc-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Connection</h2>
                  <p className="text-sm text-gray-500">{editingConnection.connectionType?.name}</p>
                </div>
              </div>
              <button
                onClick={handleCloseEditModal}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Basic Info Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Basic Information
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Connection Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.name}
                    onChange={(e) => {
                      setEditFormData(prev => ({ ...prev, name: e.target.value }));
                      setEditError(null);
                    }}
                    placeholder="My Connection"
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                  />
                </div>
              </div>

              {/* Connection Parameters Section */}
              {editingConnection.connectionType?.connection_params_schema && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    Connection Parameters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const schema = editingConnection.connectionType.connection_params_schema;
                      const properties = schema.properties || {};
                      const required = schema.required || [];
                      const keys = Object.keys(properties).filter(k => k !== 'tunnel');

                      return keys.map(key => {
                        const property = properties[key];
                        const isRequired = required.includes(key);
                        return renderEditFormField(key, property, isRequired);
                      });
                    })()}
                  </div>
                </div>
              )}

              {/* SSH Tunnel Section (Edit) */}
              {editingConnection.connectionType?.connection_params_schema?.properties?.tunnel?.type === 'object' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                    Network
                  </h3>
                  <SshTunnelSection
                    tunnelData={editTunnelData}
                    tunnelEnabled={editTunnelEnabled}
                    onTunnelEnabledChange={setEditTunnelEnabled}
                    onTunnelFieldChange={handleEditTunnelFieldChange}
                    isEditMode={true}
                    compact={true}
                  />
                </div>
              )}

              {/* Error Message */}
              {editError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{editError}</span>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-zinc-800 flex-shrink-0">
              <button
                onClick={handleCloseEditModal}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingConnection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                Delete Connection
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                Are you sure you want to delete{' '}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {deletingConnection.name}
                </span>
                ? This action cannot be undone.
              </p>
            </div>

            {/* Connection Info */}
            <div className="px-6 pb-4">
              <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Type</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {deletingConnection.connectionType?.name || 'Unknown'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Host</span>
                  <span className="font-mono text-xs text-gray-700 dark:text-gray-300 truncate max-w-[200px]">
                    {deletingConnection.connection_params?.host || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-6 border-t border-gray-200 dark:border-zinc-800">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete Connection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
