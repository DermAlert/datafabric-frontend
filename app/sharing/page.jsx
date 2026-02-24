'use client';

import React, { useState, useCallback, memo, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';
import { clsx } from 'clsx';
import {
  Plus,
  Share2,
  Users,
  Trash2,
  ChevronRight,
  Database,
  HardDrive,
  Sparkles,
  Info,
  Loader2,
  AlertCircle,
  RefreshCw,
  FolderOpen,
  FolderPlus,
  ChevronDown,
  Copy,
  Key,
  UserPlus,
  Clock,
  Building2,
  Code,
  Check,
  Download,
  HelpCircle,
  ExternalLink,
  Pin,
  CheckCircle2,
} from 'lucide-react';
import { useDisclosure, useDeltaSharing } from '@/hooks';
import { Modal, EmptyState, LayerBadge, TypeBadge, VersionStrategyPicker } from '@/components/ui';
import { Input, SearchInput, Textarea } from '@/components/ui/Input';
import { formatDate, formatNumber } from '@/lib/utils';
import { bronzeService } from '@/lib/api/services/bronze';
import { silverService } from '@/lib/api/services/silver';

// Nome do schema padrão (criado automaticamente)
const DEFAULT_SCHEMA_NAME = 'default';

// ─── Python code-generation helpers ───────────────────────────────────────────

/** Convert a Delta table name to a safe Python identifier (df_<name>). */
const toPythonVar = (name) => {
  const sanitized = name
    .replace(/[^a-zA-Z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
  // Prefix with df_ so variable names are always valid and self-describing
  return `df_${sanitized || 'table'}`;
};

/**
 * Build the ready-to-copy Python snippet for a dataset card.
 *
 * Cases handled:
 *  1. Virtualized (Bronze or Silver)   → REST API via requests
 *  2. Persistent, single table, pinned  → load_as_pandas(..., version=N)
 *  3. Persistent, single table, latest → load_as_pandas(...)
 *  4. Persistent, multiple paths        → one load_as_pandas per path, each
 *                                         with its own pin (or latest) comment
 */
const buildPythonCode = (configType, allTables, share, schema, dataset) => {
  // ── 1. Virtualized: query via REST Data API ────────────────────────────────
  if (configType === 'virtualized') {
    const tableName = dataset.protocol_table_name || dataset.table_name;
    return (
`import requests

API_BASE = "http://localhost:8004/api/delta-sharing"
TOKEN = "<recipient-bearer-token>"

response = requests.get(
    f"{API_BASE}/shares/${share}/schemas/${schema}/tables/${tableName}/data",
    headers={"Authorization": f"Bearer {TOKEN}"},
    params={"limit": 100, "offset": 0},
)
response.raise_for_status()
payload = response.json()
print(payload["data"][:3])`
    );
  }

  // ── 2-4. Persistent: Delta Sharing protocol ────────────────────────────────
  const header =
`import delta_sharing

# Download your .share credential file from the Recipients tab
profile_file = "<profile-file-path>"`;

  // ── 2 & 3. Single table ────────────────────────────────────────────────────
  if (allTables.length === 1) {
    const t = allTables[0];
    const tableName = t.protocol_table_name || t.table_name;
    const layer = getDatasetLayer(t.source_type);
    const isPinned = t.pinned_delta_version != null;

    if (isPinned) {
      return (
`${header}

# Pinned to v${t.pinned_delta_version} — always returns this exact ${layer} snapshot
df = delta_sharing.load_as_pandas(
    f"{profile_file}#${share}.${schema}.${tableName}",
    version=${t.pinned_delta_version},
)
print(df.head())`
      );
    }
    return (
`${header}

# Always-latest ${layer} data — auto-updates with each execution
df = delta_sharing.load_as_pandas(f"{profile_file}#${share}.${schema}.${tableName}")
print(df.head())`
    );
  }

  // ── 4. Multiple paths (logical Bronze with several source tables) ───────────
  // When any sibling is pinned, only show pinned siblings (others don't have
  // data at that execution). When none are pinned, show all.
  const anyPinned = allTables.some((t) => t.pinned_delta_version != null);
  const visibleTables = anyPinned
    ? allTables.filter((t) => t.pinned_delta_version != null)
    : allTables;

  // If filtering left us with exactly one table, use the single-table format
  if (visibleTables.length === 1) {
    const t = visibleTables[0];
    const tableName = t.protocol_table_name || t.table_name;
    const layer = getDatasetLayer(t.source_type);
    if (t.pinned_delta_version != null) {
      return (
`${header}

# Pinned to v${t.pinned_delta_version} — always returns this exact ${layer} snapshot
df = delta_sharing.load_as_pandas(
    f"{profile_file}#${share}.${schema}.${tableName}",
    version=${t.pinned_delta_version},
)
print(df.head())`
      );
    }
    return (
`${header}

# Always-latest ${layer} data — auto-updates with each execution
df = delta_sharing.load_as_pandas(f"{profile_file}#${share}.${schema}.${tableName}")
print(df.head())`
    );
  }

  const blocks = visibleTables.map((t) => {
    const tableName = t.protocol_table_name || t.table_name;
    const varName = toPythonVar(tableName);
    const layer = getDatasetLayer(t.source_type);
    const isPinned = t.pinned_delta_version != null;

    if (isPinned) {
      return (
`# ${tableName} — pinned to v${t.pinned_delta_version}
${varName} = delta_sharing.load_as_pandas(
    f"{profile_file}#${share}.${schema}.${tableName}",
    version=${t.pinned_delta_version},
)
print("=== ${tableName} ===")
print(${varName}.head())`
      );
    }
    return (
`# ${tableName} — always-latest ${layer} data
${varName} = delta_sharing.load_as_pandas(f"{profile_file}#${share}.${schema}.${tableName}")
print("=== ${tableName} ===")
print(${varName}.head())`
    );
  }).join('\n\n');

  return `${header}\n\n${blocks}`;
};

// ===========================================
// Share List Item Component
// ===========================================

// Helper para obter todos os datasets de um share (achatando schemas)
const getShareDatasets = (share) => {
  if (!share?.schemas) return [];
  return share.schemas.flatMap((schema) => schema.tables || []);
};

const getDatasetLayer = (sourceType) =>
  sourceType === 'bronze' || sourceType === 'bronze_virtualized' ? 'bronze' : 'silver';

const isVirtualizedDataset = (dataset) =>
  dataset?.config_type === 'virtualized' ||
  dataset?.source_type === 'bronze_virtualized' ||
  dataset?.source_type === 'silver_virtualized';

// Group tables that share the same persistent config into a single visual entry.
// Returns { representative, siblings[] } for each group.
const groupTablesByConfig = (tables) => {
  if (!tables || !tables.length) return [];

  const configGroups = new Map();
  const standalone = [];

  for (const t of tables) {
    const configId = t.bronze_persistent_config_id || t.silver_persistent_config_id;
    const configType = t.config_type || (isVirtualizedDataset(t) ? 'virtualized' : 'persistent');
    if (configId && configType === 'persistent') {
      const key = `${t.source_type}_${configId}_${t.schema_id || ''}`;
      if (!configGroups.has(key)) {
        configGroups.set(key, []);
      }
      configGroups.get(key).push(t);
    } else {
      standalone.push({ representative: t, siblings: [t] });
    }
  }

  const grouped = [];
  for (const members of configGroups.values()) {
    grouped.push({ representative: members[0], siblings: members });
  }

  return [...grouped, ...standalone];
};

const ShareListItem = memo(function ShareListItem({ share, isSelected, onSelect }) {
  const datasetCount = getShareDatasets(share).length;

  return (
    <button
      onClick={() => onSelect(share)}
      className={clsx(
        'w-full p-4 text-left transition-colors',
        isSelected
          ? 'bg-violet-50 dark:bg-violet-900/20 border-l-2 border-violet-500'
          : 'hover:bg-gray-50 dark:hover:bg-zinc-800/50 border-l-2 border-transparent'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-900 dark:text-white truncate">{share.name}</span>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {share.description || 'No description'}
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <Database className="w-3 h-3" />
              {datasetCount} datasets
            </span>
          </div>
        </div>
        <ChevronRight
          className={clsx(
            'w-4 h-4 text-gray-400 flex-shrink-0 transition-colors',
            isSelected && 'text-violet-500'
          )}
        />
      </div>
    </button>
  );
});

// ===========================================
// Dataset Card Component
// ===========================================

const DatasetCard = memo(function DatasetCard({ dataset, onRemove, onManagePin, shareName, siblingTables, executionVersion }) {
  const [copied, setCopied] = useState(false);
  const [derivedExecVersion, setDerivedExecVersion] = useState(null);
  const layer = getDatasetLayer(dataset.source_type);
  const isBronze = layer === 'bronze';
  const configType = dataset.config_type || (isVirtualizedDataset(dataset) ? 'virtualized' : 'persistent');
  const isPinnable = configType === 'persistent';
  const isPinned = dataset.pinned_delta_version != null;

  const allTables = siblingTables && siblingTables.length > 1 ? siblingTables : [dataset];
  const hasSiblingTables = allTables.length > 1;
  const share = shareName || dataset.share_name;
  const schema = dataset.schema_name;

  // For pinned multi-path Bronze datasets: lazily derive the logical execution version
  // by reverse-looking up which execution version's path_delta_versions matches the
  // primary path's current pinned_delta_version. Runs once per card on mount/pin change.
  useEffect(() => {
    if (executionVersion != null || !isBronze || !hasSiblingTables || !isPinned) {
      setDerivedExecVersion(null);
      return;
    }
    const configId = dataset.source_config_id;
    if (!configId) return;
    let cancelled = false;
    bronzeService.persistent.getVersions(configId)
      .then((res) => {
        if (cancelled) return;
        const versions = res.versions || [];
        const primaryLoc = dataset.storage_location
          ? dataset.storage_location.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '').replace(/\/+$/, '')
          : null;
        if (!primaryLoc) return;
        const match = versions.find((v) => {
          if (!v.path_delta_versions) return false;
          const normalizedPdv = Object.fromEntries(
            Object.entries(v.path_delta_versions).map(([k, val]) => [
              k.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '').replace(/\/+$/, ''), val,
            ])
          );
          return normalizedPdv[primaryLoc] === dataset.pinned_delta_version;
        });
        setDerivedExecVersion(match ? match.version : null);
      })
      .catch(() => { if (!cancelled) setDerivedExecVersion(null); });
    return () => { cancelled = true; };
  }, [isBronze, hasSiblingTables, isPinned, dataset.source_config_id, dataset.storage_location, dataset.pinned_delta_version, executionVersion]);

  // Effective execution version: prefer parent-provided (post-save), fall back to derived (on load)
  const effectiveExecVersion = executionVersion ?? derivedExecVersion;

  const pythonCode = buildPythonCode(configType, allTables, share, schema, dataset);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 border border-gray-200 dark:border-zinc-700 rounded-lg hover:border-violet-200 dark:hover:border-violet-800 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isBronze
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-purple-100 dark:bg-purple-900/30'
            )}
          >
            {isBronze ? (
              <HardDrive className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900 dark:text-white">
                {dataset.source_config_name || dataset.table_name}
              </span>
              <LayerBadge layer={layer} />
              <TypeBadge type={configType} variant={layer} />
            </div>
            {dataset.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dataset.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
              <span>v{dataset.current_version ?? '—'}</span>
              {allTables.length > 1 && (() => {
                const anyPinned = allTables.some((t) => t.pinned_delta_version != null);
                const pinnedCount = anyPinned
                  ? allTables.filter((t) => t.pinned_delta_version != null).length
                  : allTables.length;
                return (
                  <span className="text-violet-500 dark:text-violet-400">
                    {anyPinned ? `${pinnedCount}/${allTables.length}` : allTables.length} paths
                  </span>
                );
              })()}
              {isPinnable && allTables.some((t) => t.pinned_delta_version != null) && (() => {
                const pinnedVersions = [...new Set(
                  allTables.filter((t) => t.pinned_delta_version != null).map((t) => t.pinned_delta_version)
                )];
                // Use effective execution version when available, else derive from delta versions
                const versionLabel = effectiveExecVersion != null
                  ? ` v${effectiveExecVersion}`
                  : (pinnedVersions.length === 1 ? ` v${pinnedVersions[0]}` : '');
                return (
                  <span className="inline-flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    {`selected${versionLabel}`}
                  </span>
                );
              })()}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleCopyCode}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              copied
                ? 'text-green-500 bg-green-50 dark:bg-green-900/20'
                : 'text-gray-400 hover:text-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20'
            )}
            title={copied ? 'Copied!' : 'Copy Python code'}
          >
            {copied ? <Check className="w-4 h-4" /> : <Code className="w-4 h-4" />}
          </button>
          {isPinnable && (
            <button
              onClick={() => onManagePin(dataset, allTables)}
              className={clsx(
                'p-1.5 rounded-lg transition-colors',
                isPinned
                  ? 'text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20'
                  : 'text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20'
              )}
              title={isPinned ? `Serving v${effectiveExecVersion ?? dataset.pinned_delta_version} — click to change` : 'Select a version to serve'}
            >
              <Pin className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onRemove(dataset, allTables)}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            title="Remove dataset"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});

// ===========================================
// Schema Folder Component
// ===========================================

const SchemaFolder = memo(function SchemaFolder({
  schema,
  shareName,
  onAddDataset,
  onRemoveDataset,
  onDeleteSchema,
  onManagePin,
  pinnedExecutionVersions,
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const tables = schema.tables || [];

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg overflow-hidden">
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 cursor-pointer transition-colors',
          isExpanded
            ? 'bg-violet-50 dark:bg-violet-900/20'
            : 'bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800'
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ChevronDown
            className={clsx(
              'w-4 h-4 text-gray-400 transition-transform',
              !isExpanded && '-rotate-90'
            )}
          />
          <FolderOpen className="w-4 h-4 text-violet-500" />
          <span className="font-medium text-gray-900 dark:text-white">{schema.name}</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            ({tables.length} {tables.length === 1 ? 'dataset' : 'datasets'})
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddDataset(schema);
            }}
            className="p-1.5 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded transition-colors"
            title="Add dataset to this folder"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteSchema(schema);
            }}
            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
            title="Delete folder"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isExpanded && (
        <div className="p-3 space-y-2 bg-white dark:bg-zinc-900">
          {tables.length === 0 ? (
            <div className="text-center py-4 text-sm text-gray-500 dark:text-gray-400">
              No datasets in this folder.{' '}
              <button
                onClick={() => onAddDataset(schema)}
                className="text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add dataset
              </button>
            </div>
          ) : (
            groupTablesByConfig(tables).map(({ representative, siblings }) => (
              <DatasetCard
                key={representative.table_id}
                dataset={representative}
                shareName={shareName}
                onRemove={onRemoveDataset}
                onManagePin={onManagePin}
                siblingTables={siblings}
                executionVersion={pinnedExecutionVersions?.[representative.source_config_id]}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
});

// ===========================================
// Folders View Component (separates folders from loose datasets)
// ===========================================

const FoldersView = memo(function FoldersView({
  schemas,
  shareName,
  onAddDataset,
  onRemoveDataset,
  onDeleteSchema,
  onAddSchema,
  onManagePin,
  pinnedExecutionVersions,
}) {
  // Separar pastas customizadas do schema default
  const customFolders = schemas.filter((s) => s.name !== DEFAULT_SCHEMA_NAME);
  const defaultSchema = schemas.find((s) => s.name === DEFAULT_SCHEMA_NAME);
  const looseDatasets = defaultSchema?.tables || [];

  return (
    <div className="space-y-6">
      {/* Custom Folders Section */}
      {customFolders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <FolderOpen className="w-3.5 h-3.5" />
            Folders
          </div>
          {customFolders.map((schema) => (
            <SchemaFolder
              key={schema.id}
              schema={schema}
              shareName={shareName}
              onAddDataset={onAddDataset}
              onRemoveDataset={onRemoveDataset}
              onDeleteSchema={onDeleteSchema}
              onManagePin={onManagePin}
              pinnedExecutionVersions={pinnedExecutionVersions}
            />
          ))}
        </div>
      )}

      {/* Loose Datasets Section (from default schema) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            <Database className="w-3.5 h-3.5" />
            {customFolders.length > 0 ? 'Datasets (not in folders)' : 'Datasets'}
          </div>
          <button
            onClick={() => onAddDataset(defaultSchema)}
            className="p-1 text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-900/30 rounded transition-colors"
            title="Add dataset"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
        
        {looseDatasets.length === 0 ? (
          <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg p-6 text-center">
            <Database className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {customFolders.length > 0 
                ? 'No datasets outside of folders' 
                : 'No datasets yet'}
            </p>
            <button
              onClick={() => onAddDataset(defaultSchema)}
              className="mt-2 text-sm text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              Add dataset
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {groupTablesByConfig(looseDatasets).map(({ representative, siblings }) => (
              <DatasetCard
                key={representative.table_id}
                dataset={representative}
                shareName={shareName}
                onRemove={onRemoveDataset}
                onManagePin={onManagePin}
                siblingTables={siblings}
                executionVersion={pinnedExecutionVersions?.[representative.source_config_id]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty state when no folders */}
      {customFolders.length === 0 && looseDatasets.length > 0 && (
        <div className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Organize with folders
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create folders to better organize your shared datasets
              </p>
            </div>
            <button
              onClick={onAddSchema}
              className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors"
            >
              Create folder
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// ===========================================
// Recipient Card Component
// ===========================================

const DELTA_SHARING_ENDPOINT = typeof window !== 'undefined' 
  ? `${window.location.protocol}//${window.location.hostname}:8004/api/delta-sharing`
  : 'http://localhost:8004/api/delta-sharing';

const RecipientCard = memo(function RecipientCard({ recipient, shareName, onRemove, onCopyToken, onDownloadProfile }) {
  const [copying, setCopying] = useState(false);
  const initials = recipient.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';

  const handleCopyToken = async () => {
    setCopying(true);
    await onCopyToken(recipient);
    setTimeout(() => setCopying(false), 1500);
  };

  const handleDownloadProfile = () => {
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
    a.download = `${shareName || 'share'}_${recipient.name.replace(/\s+/g, '_')}.share`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-white dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold text-sm">
            {initials}
          </div>
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">{recipient.name}</h4>
            {recipient.email && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{recipient.email}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(recipient)}
          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
          title="Remove recipient"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-zinc-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-4 text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <Key className="w-3 h-3" />
            Token: {(recipient.bearer_token || recipient.identifier)?.slice(0, 8)}...{(recipient.bearer_token || recipient.identifier)?.slice(-4)}
          </span>
          {recipient.updated_at && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Last access: {formatDate(recipient.updated_at)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadProfile}
            className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline"
            title="Download .share credential file"
          >
            <Download className="w-3 h-3" />
            Download .share
          </button>
          <button
            onClick={handleCopyToken}
            className="flex items-center gap-1 text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400"
            title="Copy token"
          >
            <Copy className="w-3 h-3" />
            {copying ? 'Copied!' : 'Copy Token'}
          </button>
        </div>
      </div>
    </div>
  );
});

// ===========================================
// Recipients View Component
// ===========================================

const RecipientsView = memo(function RecipientsView({
  recipients,
  shareName,
  onAddRecipient,
  onRemoveRecipient,
  onCopyToken,
  onRegenerateToken,
  isLoading,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Authorized Recipients</h3>
        <button
          onClick={onAddRecipient}
          className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex items-center gap-1"
        >
          <UserPlus className="w-4 h-4" />
          Add Recipient
        </button>
      </div>

      {recipients.length === 0 ? (
        <EmptyState
          icon={<Users className="w-12 h-12" />}
          title="No recipients yet"
          description="Add recipients to grant them access to this share's datasets"
          action={
            <button
              onClick={onAddRecipient}
              className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Add Recipient
            </button>
          }
          className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg"
        />
      ) : (
        <div className="space-y-3">
          {recipients.map((recipient) => (
            <RecipientCard
              key={recipient.id}
              recipient={recipient}
              shareName={shareName}
              onRemove={onRemoveRecipient}
              onCopyToken={onCopyToken}
            />
          ))}
        </div>
      )}
    </div>
  );
});

// ===========================================
// Detail Panel Component
// ===========================================

const DetailPanel = memo(function DetailPanel({
  share,
  onRemoveDataset,
  onAddDataset,
  onAddSchema,
  onDeleteSchema,
  onDeleteShare,
  onShowHelp,
  onManagePin,
  recipients,
  onAddRecipient,
  onRemoveRecipient,
  onCopyToken,
  onRegenerateToken,
  isLoading,
  isLoadingRecipients,
  pinnedExecutionVersions,
}) {
  const [activeTab, setActiveTab] = useState('datasets'); // 'datasets' or 'recipients'
  const [viewMode, setViewMode] = useState('flat'); // 'flat' or 'folders'

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
        <Loader2 className="w-8 h-8 text-violet-500 mx-auto mb-4 animate-spin" />
        <p className="text-gray-500 dark:text-gray-400">Loading share details...</p>
      </div>
    );
  }

  if (!share) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 p-12 text-center">
        <Share2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select a Share</h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Choose a share from the list to view and manage its datasets.
        </p>
      </div>
    );
  }

  const datasets = getShareDatasets(share);
  const groupedDatasets = groupTablesByConfig(datasets);
  const schemas = share.schemas || [];
  const hasMultipleSchemas = schemas.filter((s) => s.name !== DEFAULT_SCHEMA_NAME).length > 0;
  const virtualizedCount = groupedDatasets.filter(({ representative }) => isVirtualizedDataset(representative)).length;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800">
      {/* Header */}
      <header className="p-6 border-b border-gray-200 dark:border-zinc-800">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{share.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {share.description || 'No description'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onShowHelp}
              className="p-2 text-gray-400 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="How to access datasets"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={() => onDeleteShare(share)}
              className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Delete share"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{groupedDatasets.length}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Datasets</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {groupedDatasets.filter(({ representative }) => getDatasetLayer(representative.source_type) === 'bronze').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Bronze</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {groupedDatasets.filter(({ representative }) => getDatasetLayer(representative.source_type) === 'silver').length}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Silver</div>
          </div>
          <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{virtualizedCount}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Virtualized</div>
          </div>
          {schemas.length > 1 && (
            <>
              <div className="w-px h-8 bg-gray-200 dark:bg-zinc-700" />
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">{schemas.length}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Folders</div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-zinc-800">
        <nav className="flex px-6 -mb-px">
          <button
            onClick={() => setActiveTab('datasets')}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'datasets'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-600'
            )}
          >
            <Database className="w-4 h-4" />
            Shared Datasets ({groupedDatasets.length})
          </button>
          <button
            onClick={() => setActiveTab('recipients')}
            className={clsx(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
              activeTab === 'recipients'
                ? 'border-violet-500 text-violet-600 dark:text-violet-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-zinc-600'
            )}
          >
            <Users className="w-4 h-4" />
            Recipients ({recipients?.length || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'datasets' ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {/* View Mode Toggle */}
                {(hasMultipleSchemas || schemas.length > 0) && (
                  <div className="flex items-center bg-gray-100 dark:bg-zinc-800 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('flat')}
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded transition-colors',
                        viewMode === 'flat'
                          ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      )}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setViewMode('folders')}
                      className={clsx(
                        'px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1',
                        viewMode === 'folders'
                          ? 'bg-white dark:bg-zinc-700 text-gray-900 dark:text-white shadow-sm'
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                      )}
                    >
                      <FolderOpen className="w-3 h-3" />
                      Folders
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {viewMode === 'folders' && (
                  <button
                    onClick={onAddSchema}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors flex items-center gap-1"
                    title="Create a new folder to organize datasets"
                  >
                    <FolderPlus className="w-4 h-4" />
                    New Folder
                  </button>
                )}
                <button
                  onClick={() => onAddDataset(null)}
                  className="px-3 py-1.5 text-sm font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Dataset
                </button>
              </div>
            </div>

            {datasets.length === 0 && schemas.length === 0 ? (
              <EmptyState
                icon={<Database className="w-12 h-12" />}
                title="No datasets yet"
                description="Add Bronze or Silver datasets to share with recipients"
                action={
                  <button
                    onClick={() => onAddDataset(null)}
                    className="mt-4 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Dataset
                  </button>
                }
                className="border border-dashed border-gray-200 dark:border-zinc-700 rounded-lg"
              />
            ) : viewMode === 'folders' ? (
              <FoldersView
                schemas={schemas}
                shareName={share.name}
                onAddDataset={onAddDataset}
                onRemoveDataset={onRemoveDataset}
                onDeleteSchema={onDeleteSchema}
                onAddSchema={onAddSchema}
                onManagePin={onManagePin}
                pinnedExecutionVersions={pinnedExecutionVersions}
              />
            ) : (
              <div className="space-y-2">
                {groupTablesByConfig(datasets).map(({ representative, siblings }) => (
                  <DatasetCard
                    key={representative.table_id}
                    dataset={representative}
                    shareName={share.name}
                    onRemove={onRemoveDataset}
                    onManagePin={onManagePin}
                    siblingTables={siblings}
                    executionVersion={pinnedExecutionVersions?.[representative.source_config_id]}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <RecipientsView
            recipients={recipients || []}
            shareName={share.name}
            onAddRecipient={onAddRecipient}
            onRemoveRecipient={onRemoveRecipient}
            onCopyToken={onCopyToken}
            onRegenerateToken={onRegenerateToken}
            isLoading={isLoadingRecipients}
          />
        )}
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/50">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Created {formatDate(share.data_criacao || share.created_at)}</span>
          <span>Last updated {formatDate(share.data_atualizacao || share.updated_at)}</span>
        </div>
      </footer>
    </div>
  );
});

// ===========================================
// Create Share Modal Component
// ===========================================

const CreateShareModal = memo(function CreateShareModal({ isOpen, onClose, onCreate, isLoading }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) return;
    const success = await onCreate({ name: name.trim(), description: description.trim() });
    if (success) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Share">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Create a new share to organize datasets for sharing
      </p>
      <div className="space-y-4">
        <Input
          label="Share Name"
          placeholder="e.g., healthcare_data"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Description"
          placeholder="Describe what data this share contains..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
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
          disabled={!name.trim() || isLoading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Share
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Create Schema (Folder) Modal Component
// ===========================================

const CreateSchemaModal = memo(function CreateSchemaModal({
  isOpen,
  onClose,
  onCreate,
  shareId,
  isLoading,
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async () => {
    if (!name.trim() || !shareId) return;
    const success = await onCreate(shareId, { name: name.trim(), description: description.trim() });
    if (success) {
      setName('');
      setDescription('');
      onClose();
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Folder">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Create a folder to organize your datasets within this share
      </p>
      <div className="space-y-4">
        <Input
          label="Folder Name"
          placeholder="e.g., raw_data, processed, reports"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <Textarea
          label="Description (optional)"
          placeholder="Describe what this folder contains..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
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
          disabled={!name.trim() || isLoading}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Folder
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Add Dataset Modal Component
// ===========================================

const AddDatasetModal = memo(function AddDatasetModal({
  isOpen,
  onClose,
  onAdd,
  datasets,
  isLoading,
  share,
  targetSchema,
}) {
  const [selectedDataset, setSelectedDataset] = useState(null);
  const [useLatestVersion, setUseLatestVersion] = useState(true);
  const [selectedPinVersion, setSelectedPinVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const getDatasetOptionKey = (dataset) =>
    `${dataset.source_type}-${dataset.config_type || 'persistent'}-${dataset.config_id}`;

  const bronzeDatasets = datasets.filter((d) => d.source_type === 'bronze');
  const silverDatasets = datasets.filter((d) => d.source_type === 'silver');

  const isPersistent = selectedDataset && selectedDataset.config_type !== 'virtualized';

  const handleSelectDataset = (dataset) => {
    setSelectedDataset(dataset);
    setUseLatestVersion(true);
    setSelectedPinVersion(null);
    setVersions([]);

    if (dataset.config_type !== 'virtualized' && dataset.config_id) {
      setIsLoadingVersions(true);
      const fetchVersions = dataset.source_type === 'bronze'
        ? bronzeService.persistent.getVersions(dataset.config_id)
        : silverService.persistent.getVersions(dataset.config_id);
      fetchVersions
        .then((res) => setVersions(res.versions || []))
        .catch(() => setVersions([]))
        .finally(() => setIsLoadingVersions(false));
    }
  };

  const handleSubmit = async () => {
    if (!selectedDataset || !share) return;
    setIsSubmitting(true);

    const pinnedDeltaVersion = isPersistent && !useLatestVersion && selectedPinVersion != null
      ? selectedPinVersion
      : null;

    const success = await onAdd(share, selectedDataset, targetSchema, pinnedDeltaVersion);
    
    if (success) {
      setSelectedDataset(null);
      setUseLatestVersion(true);
      setSelectedPinVersion(null);
      setVersions([]);
      onClose();
    }
    setIsSubmitting(false);
  };

  const handleClose = () => {
    setSelectedDataset(null);
    setUseLatestVersion(true);
    setSelectedPinVersion(null);
    setVersions([]);
    onClose();
  };

  const folderName = targetSchema?.name === DEFAULT_SCHEMA_NAME ? null : targetSchema?.name;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Dataset" size="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Select a dataset to add to <strong>{share?.name}</strong>
        {folderName && (
          <span className="text-violet-600 dark:text-violet-400"> → {folderName}</span>
        )}
      </p>

      {/* Info about Delta Sharing */}
      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-700 dark:text-blue-300">
            Persistent and virtualized datasets can be shared. Virtualized datasets are queried on-demand via Trino.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : datasets.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No datasets available for sharing.</p>
          <p className="text-sm mt-1">Execute some Bronze or Silver configs first.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
            {/* Bronze Datasets */}
            {bronzeDatasets.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-2 sticky top-0 bg-white dark:bg-zinc-900">
                  <HardDrive className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bronze Layer
                  </span>
                </div>
                {bronzeDatasets.map((dataset) => (
                  <label
                    key={getDatasetOptionKey(dataset)}
                    className={clsx(
                      'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      selectedDataset &&
                        getDatasetOptionKey(selectedDataset) === getDatasetOptionKey(dataset)
                        ? 'border-amber-400 bg-amber-50 dark:bg-amber-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-amber-300 dark:hover:border-amber-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      className="w-4 h-4 text-amber-600"
                      checked={Boolean(
                        selectedDataset &&
                          getDatasetOptionKey(selectedDataset) === getDatasetOptionKey(dataset)
                      )}
                      onChange={() => handleSelectDataset(dataset)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {dataset.name}
                        </span>
                        <TypeBadge
                          type={dataset.config_type || 'persistent'}
                          variant="bronze"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {dataset.description || 'No description'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {dataset.total_rows !== null && dataset.total_rows !== undefined
                        ? `${formatNumber(dataset.total_rows)} rows`
                        : 'On demand'}
                    </span>
                  </label>
                ))}
              </>
            )}

            {/* Silver Datasets */}
            {silverDatasets.length > 0 && (
              <>
                <div className="flex items-center gap-2 px-1 py-2 mt-4 sticky top-0 bg-white dark:bg-zinc-900">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Silver Layer
                  </span>
                </div>
                {silverDatasets.map((dataset) => (
                  <label
                    key={getDatasetOptionKey(dataset)}
                    className={clsx(
                      'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                      selectedDataset &&
                        getDatasetOptionKey(selectedDataset) === getDatasetOptionKey(dataset)
                        ? 'border-purple-400 bg-purple-50 dark:bg-purple-900/20'
                        : 'border-gray-200 dark:border-zinc-700 hover:border-purple-300 dark:hover:border-purple-700'
                    )}
                  >
                    <input
                      type="radio"
                      name="dataset"
                      className="w-4 h-4 text-purple-600"
                      checked={Boolean(
                        selectedDataset &&
                          getDatasetOptionKey(selectedDataset) === getDatasetOptionKey(dataset)
                      )}
                      onChange={() => handleSelectDataset(dataset)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {dataset.name}
                        </span>
                        <TypeBadge
                          type={dataset.config_type || 'persistent'}
                          variant="silver"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {dataset.description || 'No description'}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {dataset.total_rows !== null && dataset.total_rows !== undefined
                        ? `${formatNumber(dataset.total_rows)} rows`
                        : 'On demand'}
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>

          {/* Version Strategy — only for persistent datasets */}
          {isPersistent && (
            <div className="mt-4">
              <VersionStrategyPicker
                useLatest={useLatestVersion}
                onChangeStrategy={(latest) => {
                  setUseLatestVersion(latest);
                  if (latest) setSelectedPinVersion(null);
                }}
                selectedVersion={selectedPinVersion}
                onSelectVersion={setSelectedPinVersion}
                versions={versions}
                currentVersion={versions[0]?.version ?? selectedDataset?.current_version ?? null}
                isLoadingVersions={isLoadingVersions}
                latestHint="Auto-updates with each execution"
                pinHint="Lock to specific version for reproducibility"
              />
            </div>
          )}
        </>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedDataset || isSubmitting}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Add Dataset
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Add Recipient Modal (Select existing recipient)
// ===========================================

const AddRecipientModal = memo(function AddRecipientModal({
  isOpen,
  onClose,
  onAdd,
  isLoading,
  share,
  allRecipients,
  currentRecipients,
}) {
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out recipients already in this share
  const availableRecipients = allRecipients.filter(
    (r) => !currentRecipients.some((cr) => cr.id === r.id)
  );

  const handleSubmit = async () => {
    if (!selectedRecipient) return;
    setIsSubmitting(true);
    const success = await onAdd(selectedRecipient.id);
    setIsSubmitting(false);
    if (success) {
      setSelectedRecipient(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedRecipient(null);
    onClose();
  };

  const getInitials = (name) => {
    return name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Recipient">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Select a recipient to grant access to <strong>{share?.name}</strong>
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
        </div>
      ) : availableRecipients.length === 0 ? (
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">
            {allRecipients.length === 0
              ? 'No recipients created yet.'
              : 'All recipients are already added to this share.'}
          </p>
          <Link
            href="/sharing/recipients"
            className="mt-3 inline-flex items-center gap-1 text-sm text-violet-600 dark:text-violet-400 hover:underline"
          >
            <UserPlus className="w-4 h-4" />
            Manage Recipients
          </Link>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {availableRecipients.map((recipient) => (
            <label
              key={recipient.id}
              className={clsx(
                'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                selectedRecipient?.id === recipient.id
                  ? 'border-violet-400 bg-violet-50 dark:bg-violet-900/20'
                  : 'border-gray-200 dark:border-zinc-700 hover:border-violet-300 dark:hover:border-violet-700'
              )}
            >
              <input
                type="radio"
                name="recipient"
                className="w-4 h-4 text-violet-600"
                checked={selectedRecipient?.id === recipient.id}
                onChange={() => setSelectedRecipient(recipient)}
              />
              <div className="w-9 h-9 rounded-full bg-violet-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {getInitials(recipient.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {recipient.name}
                </div>
                {recipient.email && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {recipient.email}
                  </div>
                )}
              </div>
              {recipient.organization_name && (
                <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {recipient.organization_name}
                </span>
              )}
            </label>
          ))}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={handleClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!selectedRecipient || isSubmitting}
          className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors text-sm font-medium disabled:opacity-50 flex items-center gap-2"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Add to Share
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Code Example Modal
// ===========================================

const HelpModal = memo(function HelpModal({ isOpen, onClose, share }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const shareName = share?.name || '<SHARE>';

  const pythonCode =
`import delta_sharing

# Download your .share credential file from the Recipients tab
profile_file = "<profile-file-path>"

# ── Always-latest (auto-updates with each execution) ──────────────
df = delta_sharing.load_as_pandas(f"{profile_file}#${shareName}.<SCHEMA>.<TABLE>")
print(df.head())

# ── Pinned to a specific version (reproducible snapshot) ──────────
df_pinned = delta_sharing.load_as_pandas(
    f"{profile_file}#${shareName}.<SCHEMA>.<TABLE>",
    version=<VERSION>,
)
print(df_pinned.head())`;

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(pythonCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="How to Access Shared Datasets" size="lg">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Follow these steps to access datasets from <strong>{share?.name}</strong> using Python.
      </p>

      {/* Dependencies */}
      <div className="mb-6 p-3 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-lg">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">Dependencies:</span>
          <code className="bg-gray-200 dark:bg-zinc-700 px-2 py-0.5 rounded text-xs">pip install delta-sharing pandas requests</code>
        </div>
      </div>

      {/* Step 1: Download .share file */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">1</span>
          <h3 className="font-medium text-gray-900 dark:text-white">Download Profile File (.share)</h3>
        </div>
        <div className="ml-8">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Go to the <strong>Recipients</strong> tab, select a recipient, and download their <code className="bg-gray-100 dark:bg-zinc-800 px-1 rounded">.share</code> credential file.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500">
            The file contains the server endpoint and bearer token needed for authentication.
          </p>
        </div>
      </div>

      {/* Step 2: Python Code */}
      <div className="mb-5">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">2</span>
          <h3 className="font-medium text-gray-900 dark:text-white">Load Dataset in Python</h3>
        </div>
        <div className="relative ml-8">
          <div className="absolute top-2 right-2 z-10">
            <button
              onClick={handleCopyCode}
              className={clsx(
                'px-2 py-1 text-xs font-medium rounded transition-colors flex items-center gap-1',
                copiedCode
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-zinc-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-zinc-600'
              )}
            >
              {copiedCode ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedCode ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-zinc-900 text-gray-100 p-4 rounded-lg text-sm overflow-x-auto">
            <code>{pythonCode}</code>
          </pre>
        </div>
      </div>

      {/* Tip */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p>
              <strong>Tip:</strong> Click the <Code className="w-3 h-3 inline" /> button on each dataset card to copy a ready-to-run snippet.
              Persistent datasets (Bronze &amp; Silver) use the Delta Sharing protocol (<code>delta_sharing</code>).
              Virtualized datasets use the REST Data API (<code>requests</code>).
              Pinned tables automatically include <code>version=N</code>.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
});

// ===========================================
// Manage Pin Modal
// ===========================================

const ManagePinModal = memo(function ManagePinModal({
  isOpen,
  onClose,
  dataset,
  siblingTables,
  onPin,
  onUnpin,
  onPinSaved,
}) {
  const isPinned = dataset?.pinned_delta_version != null;
  const [useLatest, setUseLatest] = useState(!isPinned);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const allSiblings = siblingTables && siblingTables.length > 0 ? siblingTables : (dataset ? [dataset] : []);
  const hasSiblings = allSiblings.length > 1;

  // Inline normalizer (needed before full definition below for useEffect closure)
  const _normalizePath = (path) => {
    if (!path) return path;
    return path.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '').replace(/\/+$/, '');
  };

  useEffect(() => {
    if (!isOpen || !dataset) return;

    const pinned = dataset.pinned_delta_version != null;
    setUseLatest(!pinned);
    setError('');

    const configId = dataset.source_config_id;
    if (!configId) { setVersions([]); setSelectedVersion(pinned ? dataset.pinned_delta_version : null); return; }

    const layer = getDatasetLayer(dataset.source_type);
    setIsLoadingVersions(true);
    const fetchVersionsFn = layer === 'bronze'
      ? bronzeService.persistent.getVersions(configId)
      : silverService.persistent.getVersions(configId);

    fetchVersionsFn
      .then((res) => {
        const loadedVersions = res.versions || [];
        setVersions(loadedVersions);

        if (!pinned) {
          setSelectedVersion(null);
          return;
        }

        // For multi-path Bronze: reverse-lookup the execution version whose pdv entry
        // for the primary path matches the current pinned_delta_version.
        // This ensures the modal shows the correct logical version, not the raw delta version.
        if (hasSiblings && loadedVersions.length > 0) {
          const primaryLoc = _normalizePath(dataset.storage_location);
          const match = loadedVersions.find((v) => {
            if (!v.path_delta_versions) return false;
            const normalizedPdv = Object.fromEntries(
              Object.entries(v.path_delta_versions).map(([k, val]) => [_normalizePath(k), val])
            );
            return normalizedPdv[primaryLoc] === dataset.pinned_delta_version;
          });
          setSelectedVersion(match ? match.version : dataset.pinned_delta_version);
        } else {
          setSelectedVersion(dataset.pinned_delta_version);
        }
      })
      .catch(() => {
        setVersions([]);
        setSelectedVersion(pinned ? dataset.pinned_delta_version : null);
      })
      .finally(() => setIsLoadingVersions(false));
  }, [isOpen, dataset]);

  // Normalize storage paths for comparison: strip URI scheme (s3a://, s3://, abfss://, etc.) and trailing slashes.
  const normalizeStoragePath = (path) => {
    if (!path) return path;
    return path.replace(/^[a-z][a-z0-9+\-.]*:\/\//i, '').replace(/\/+$/, '');
  };

  const getPathDeltaVersionsForSelection = () => {
    if (selectedVersion == null) return null;
    const v = versions.find((ver) => ver.version === selectedVersion);
    const pdv = v?.path_delta_versions;
    if (!pdv || typeof pdv !== 'object' || Object.keys(pdv).length === 0) return null;
    // Return a normalized version of pdv with keys stripped of URI scheme and trailing slashes
    return Object.fromEntries(Object.entries(pdv).map(([k, val]) => [normalizeStoragePath(k), val]));
  };

  const countActivePathsForSelection = () => {
    const pdv = getPathDeltaVersionsForSelection();
    if (!pdv || !hasSiblings) return allSiblings.length;
    return allSiblings.filter((t) => t.storage_location && normalizeStoragePath(t.storage_location) in pdv).length;
  };

  const handleSave = async () => {
    if (useLatest) {
      const anyPinned = allSiblings.some((t) => t.pinned_delta_version != null);
      if (!anyPinned) { onClose(); return; }
      setIsSubmitting(true);
      setError('');
      const results = await Promise.all(
        allSiblings
          .filter((t) => t.pinned_delta_version != null)
          .map((t) => onUnpin(t))
      );
      setIsSubmitting(false);
      if (results.some(Boolean)) onClose();
      else setError('Failed to switch to latest version.');
    } else {
      if (selectedVersion == null || selectedVersion < 0) {
        setError('Select a version to serve.');
        return;
      }
      setIsSubmitting(true);
      setError('');

      const pdv = getPathDeltaVersionsForSelection();

      if (hasSiblings && pdv) {
        const promises = allSiblings.map((t) => {
          const loc = normalizeStoragePath(t.storage_location);
          if (loc && loc in pdv) {
            return onPin(t, pdv[loc]);
          }
          if (t.pinned_delta_version != null) {
            return onUnpin(t);
          }
          return Promise.resolve(true);
        });
        const results = await Promise.all(promises);
        setIsSubmitting(false);
        if (results.some(Boolean)) {
          onPinSaved?.(dataset.source_config_id, selectedVersion);
          onClose();
        } else setError('Failed to select version. Ensure the version exists.');
      } else {
        const result = await onPin(dataset, selectedVersion);
        setIsSubmitting(false);
        if (result) onClose();
        else setError('Failed to select version. Ensure the version exists.');
      }
    }
  };

  const layer = dataset ? getDatasetLayer(dataset.source_type) : 'bronze';
  const isBronze = layer === 'bronze';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Version Selection">
      {dataset && (
        <>
          {/* Dataset info */}
          <div className="flex items-center gap-3 mb-5 p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
            <div
              className={clsx(
                'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                isBronze ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-purple-100 dark:bg-purple-900/30'
              )}
            >
              {isBronze ? (
                <HardDrive className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              ) : (
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{dataset.table_name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Current version: <strong>v{dataset.current_version ?? '—'}</strong>
                {isPinned && (
                  <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                    · Serving v{hasSiblings && selectedVersion != null ? selectedVersion : dataset.pinned_delta_version}
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Explanation */}
          <div className="mb-5 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                When a version is selected, consumers always receive data from that specific Delta version,
                even when new executions create newer versions. Switch to &quot;Always Latest&quot; to always serve the most recent data.
              </p>
            </div>
          </div>

          <VersionStrategyPicker
            useLatest={useLatest}
            onChangeStrategy={setUseLatest}
            selectedVersion={selectedVersion}
            onSelectVersion={setSelectedVersion}
            versions={versions}
            currentVersion={versions[0]?.version ?? dataset.current_version}
            isLoadingVersions={isLoadingVersions}
            latestLabel="Always Latest"
            latestHint="Auto-updates with each execution"
            pinLabel="Select Version"
            pinHint="Serve a specific version to consumers"
            versionListLabel="Choose a version to serve"
          />

          {/* Active-paths hint for multi-source Bronze */}
          {!useLatest && hasSiblings && selectedVersion != null && (() => {
            const activePaths = countActivePathsForSelection();
            const total = allSiblings.length;
            if (activePaths < total) {
              return (
                <div className="mt-3 p-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-lg">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    <strong>{activePaths}</strong> of {total} source tables had data at this version.
                    {' '}Tables without data will be excluded from the code snippet.
                  </p>
                </div>
              );
            }
            return (
              <div className="mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 rounded-lg">
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  All <strong>{total}/{total}</strong> source tables have data at this version.
                </p>
              </div>
            );
          })()}

          {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-zinc-800">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2',
                useLatest
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              )}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {useLatest ? 'Use Latest' : 'Select Version'}
            </button>
          </div>
        </>
      )}
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
  title,
  message,
  isLoading,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="py-4">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="text-center text-gray-600 dark:text-gray-400">{message}</p>
      </div>
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-zinc-800">
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

export default function SharingPage() {
  const {
    shares,
    recipients,
    availableDatasets,
    isLoading,
    isLoadingDatasets,
    error,
    refresh,
    refreshDatasets,
    createShare,
    deleteShare,
    createSchema,
    deleteSchema,
    addTableFromBronze,
    addTableFromSilver,
    addTableFromBronzeVirtualized,
    addTableFromSilverVirtualized,
    removeTable,
    pinTableVersion,
    unpinTableVersion,
    associateRecipientToShares,
    removeRecipientFromShare,
    regenerateRecipientToken,
    clearError,
  } = useDeltaSharing();

  const [selectedShare, setSelectedShare] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [targetSchema, setTargetSchema] = useState(null);
  const [pinTarget, setPinTarget] = useState(null);
  const [pinSiblings, setPinSiblings] = useState([]);
  const [pinnedExecutionVersions, setPinnedExecutionVersions] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createShareModal = useDisclosure();
  const createSchemaModal = useDisclosure();
  const addDatasetModal = useDisclosure();
  const addRecipientModal = useDisclosure();
  const helpModal = useDisclosure();
  const deleteConfirmModal = useDisclosure();
  const managePinModal = useDisclosure();

  // Update selected share when shares change
  useEffect(() => {
    if (selectedShare) {
      const updated = shares.find((s) => s.id === selectedShare.id);
      if (updated) {
        setSelectedShare(updated);
      } else {
        setSelectedShare(shares[0] || null);
      }
    } else if (shares.length > 0) {
      setSelectedShare(shares[0]);
    }
  }, [shares, selectedShare]);

  // Filtered shares
  const filteredShares = shares.filter(
    (share) =>
      share.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (share.description && share.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handlers
  const handleSelectShare = useCallback((share) => {
    setSelectedShare(share);
  }, []);

  const handleCreateShare = useCallback(
    async (data) => {
      setIsSubmitting(true);
      const share = await createShare(data);
      // Criar schema "default" automaticamente
      if (share) {
        await createSchema(share.id, { name: DEFAULT_SCHEMA_NAME, description: 'Default schema' });
      }
      setIsSubmitting(false);
      return !!share;
    },
    [createShare, createSchema]
  );

  // Helper para obter ou criar schema default
  const getOrCreateDefaultSchema = useCallback(
    async (share) => {
      // Verificar se já existe um schema default
      const defaultSchema = share.schemas?.find((s) => s.name === DEFAULT_SCHEMA_NAME);
      if (defaultSchema) return defaultSchema;
      
      // Criar se não existir
      const schema = await createSchema(share.id, { name: DEFAULT_SCHEMA_NAME, description: 'Default schema' });
      return schema;
    },
    [createSchema]
  );

  const handleCreateSchema = useCallback(
    async (shareId, data) => {
      setIsSubmitting(true);
      const result = await createSchema(shareId, data);
      setIsSubmitting(false);
      return !!result;
    },
    [createSchema]
  );

  const handleAddDataset = useCallback(
    async (share, dataset, specifiedSchema, pinnedDeltaVersion) => {
      // Usar schema especificado ou criar/usar o default
      const schema = specifiedSchema || await getOrCreateDefaultSchema(share);
      if (!schema) return false;

      if (dataset.source_type === 'bronze') {
        if (dataset.config_type === 'virtualized') {
          const result = await addTableFromBronzeVirtualized(share.id, schema.id, {
            bronze_virtualized_config_id: dataset.config_id,
            description: dataset.description || '',
          });
          return !!result;
        }
        const result = await addTableFromBronze(share.id, schema.id, {
          bronze_config_id: dataset.config_id,
          description: dataset.description || '',
          ...(pinnedDeltaVersion != null && { pinned_delta_version: pinnedDeltaVersion }),
        });
        return !!result;
      } else {
        if (dataset.config_type === 'virtualized') {
          const result = await addTableFromSilverVirtualized(share.id, schema.id, {
            silver_virtualized_config_id: dataset.config_id,
            description: dataset.description || '',
          });
          return !!result;
        }
        const result = await addTableFromSilver(share.id, schema.id, {
          silver_config_id: dataset.config_id,
          description: dataset.description || '',
          ...(pinnedDeltaVersion != null && { pinned_delta_version: pinnedDeltaVersion }),
        });
        return !!result;
      }
    },
    [
      getOrCreateDefaultSchema,
      addTableFromBronze,
      addTableFromSilver,
      addTableFromBronzeVirtualized,
      addTableFromSilverVirtualized,
    ]
  );

  const handleRemoveDataset = useCallback(
    (dataset, allSiblings) => {
      setDeleteTarget({
        type: 'dataset',
        data: dataset,
        siblings: allSiblings || [dataset],
        title: 'Remove Dataset',
        message: allSiblings && allSiblings.length > 1
          ? `Are you sure you want to remove "${dataset.source_config_name || dataset.table_name}" (${allSiblings.length} tables) from this share?`
          : `Are you sure you want to remove "${dataset.table_name}" from this share?`,
      });
      deleteConfirmModal.onOpen();
    },
    [deleteConfirmModal]
  );

  const handleDeleteSchema = useCallback(
    (schema) => {
      setDeleteTarget({
        type: 'schema',
        data: schema,
        title: 'Delete Folder',
        message: `Are you sure you want to delete the folder "${schema.name}"? All datasets in this folder will also be removed.`,
      });
      deleteConfirmModal.onOpen();
    },
    [deleteConfirmModal]
  );

  const handleDeleteShare = useCallback(
    (share) => {
      setDeleteTarget({
        type: 'share',
        data: share,
        title: 'Delete Share',
        message: `Are you sure you want to delete the share "${share.name}"? All datasets will also be removed.`,
      });
      deleteConfirmModal.onOpen();
    },
    [deleteConfirmModal]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!deleteTarget) return;
    setIsSubmitting(true);

    let success = false;
    if (deleteTarget.type === 'dataset') {
      const siblings = deleteTarget.siblings || [deleteTarget.data];
      const results = await Promise.all(
        siblings.map((t) => removeTable(selectedShare.id, t.schema_id, t.table_id))
      );
      success = results.some(Boolean);
    } else if (deleteTarget.type === 'schema') {
      success = await deleteSchema(selectedShare.id, deleteTarget.data.id);
    } else if (deleteTarget.type === 'share') {
      success = await deleteShare(deleteTarget.data.id);
      if (success) {
        setSelectedShare(null);
      }
    } else if (deleteTarget.type === 'recipient') {
      // Remove recipient from this share only (not delete entirely)
      success = await removeRecipientFromShare(deleteTarget.data.id, selectedShare.id);
      if (success) {
        await refresh();
      }
    }

    setIsSubmitting(false);
    if (success) {
      deleteConfirmModal.onClose();
      setDeleteTarget(null);
    }
  }, [deleteTarget, selectedShare, removeTable, deleteSchema, deleteShare, removeRecipientFromShare, refresh, deleteConfirmModal]);

  const handleOpenAddDataset = useCallback((schema) => {
    setTargetSchema(schema);
    refreshDatasets();
    addDatasetModal.onOpen();
  }, [refreshDatasets, addDatasetModal]);

  const handleManagePin = useCallback((dataset, siblings) => {
    setPinTarget(dataset);
    setPinSiblings(siblings || [dataset]);
    managePinModal.onOpen();
  }, [managePinModal]);

  const handlePinVersion = useCallback(async (dataset, deltaVersion) => {
    const result = await pinTableVersion(dataset.share_id, dataset.schema_id, dataset.table_id, deltaVersion);
    return !!result;
  }, [pinTableVersion]);

  const handleUnpinVersion = useCallback(async (dataset) => {
    const result = await unpinTableVersion(dataset.share_id, dataset.schema_id, dataset.table_id);
    return result != null;
  }, [unpinTableVersion]);

  // Recipient handlers
  const handleAddRecipientToShare = useCallback(
    async (recipientId) => {
      setIsSubmitting(true);
      const success = await associateRecipientToShares(recipientId, [selectedShare.id]);
      if (success) {
        await refresh();
      }
      setIsSubmitting(false);
      return success;
    },
    [associateRecipientToShares, selectedShare, refresh]
  );

  const handleRemoveRecipient = useCallback(
    (recipient) => {
      setDeleteTarget({
        type: 'recipient',
        data: recipient,
        title: 'Remove Recipient',
        message: `Are you sure you want to remove "${recipient.name}" from this share? They will lose access to all shared datasets.`,
      });
      deleteConfirmModal.onOpen();
    },
    [deleteConfirmModal]
  );

  const handleCopyToken = useCallback(async (recipient) => {
    if (recipient.bearer_token) {
      await navigator.clipboard.writeText(recipient.bearer_token);
    } else {
      // If token is not available, regenerate and copy
      const newToken = await regenerateRecipientToken(recipient.id);
      if (newToken) {
        await navigator.clipboard.writeText(newToken);
      }
    }
  }, [regenerateRecipientToken]);

  const handleRegenerateToken = useCallback(
    async (recipient) => {
      const newToken = await regenerateRecipientToken(recipient.id);
      if (newToken) {
        await navigator.clipboard.writeText(newToken);
      }
      return !!newToken;
    },
    [regenerateRecipientToken]
  );

  // Get recipients for current share
  const shareRecipients = selectedShare
    ? recipients.filter((r) => r.shares?.some((s) => s.id === selectedShare.id))
    : [];

  // Stats
  const totalDatasets = shares.reduce(
    (acc, s) => acc + getShareDatasets(s).length,
    0
  );

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
        <header className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Delta Sharing</h1>
                <p className="text-gray-500 dark:text-gray-400">
                  Share datasets securely with external partners
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                title="Refresh"
              >
                <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
              </button>
              <Link
                href="/sharing/recipients"
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Recipients
              </Link>
              <button
                onClick={createShareModal.onOpen}
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
              <span>{shares.length} shares</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Database className="w-4 h-4" />
              <span>{totalDatasets} shared datasets</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex gap-6">
          {/* Shares List */}
          <aside className="w-96 flex-shrink-0">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-gray-200 dark:border-zinc-800 overflow-hidden">
              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
                <SearchInput
                  placeholder="Search shares..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClear={() => setSearchTerm('')}
                />
              </div>

              {/* Shares */}
              {isLoading && shares.length === 0 ? (
                <div className="p-8 text-center">
                  <Loader2 className="w-8 h-8 text-violet-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-500 dark:text-gray-400">Loading shares...</p>
                </div>
              ) : filteredShares.length === 0 ? (
                <div className="p-8 text-center">
                  <Share2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {searchTerm ? 'No shares match your search' : 'No shares yet'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={createShareModal.onOpen}
                      className="mt-3 text-sm text-violet-600 dark:text-violet-400 hover:underline"
                    >
                      Create your first share
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-zinc-800 max-h-[calc(100vh-320px)] overflow-y-auto">
                  {filteredShares.map((share) => (
                    <ShareListItem
                      key={share.id}
                      share={share}
                      isSelected={selectedShare?.id === share.id}
                      onSelect={handleSelectShare}
                    />
                  ))}
                </div>
              )}
            </div>
          </aside>

          {/* Share Details */}
          <main className="flex-1">
            <DetailPanel
              share={selectedShare}
              onRemoveDataset={handleRemoveDataset}
              onAddDataset={handleOpenAddDataset}
              onAddSchema={createSchemaModal.onOpen}
              onDeleteSchema={handleDeleteSchema}
              onDeleteShare={handleDeleteShare}
              onShowHelp={helpModal.onOpen}
              onManagePin={handleManagePin}
              recipients={shareRecipients}
              onAddRecipient={addRecipientModal.onOpen}
              onRemoveRecipient={handleRemoveRecipient}
              onCopyToken={handleCopyToken}
              onRegenerateToken={handleRegenerateToken}
              isLoading={isLoading && !selectedShare}
              isLoadingRecipients={isLoading}
              pinnedExecutionVersions={pinnedExecutionVersions}
            />
          </main>
        </div>
      </div>

      {/* Modals */}
      <CreateShareModal
        isOpen={createShareModal.isOpen}
        onClose={createShareModal.onClose}
        onCreate={handleCreateShare}
        isLoading={isSubmitting}
      />

      <CreateSchemaModal
        isOpen={createSchemaModal.isOpen}
        onClose={createSchemaModal.onClose}
        onCreate={handleCreateSchema}
        shareId={selectedShare?.id}
        isLoading={isSubmitting}
      />

      <AddDatasetModal
        isOpen={addDatasetModal.isOpen}
        onClose={() => {
          addDatasetModal.onClose();
          setTargetSchema(null);
        }}
        onAdd={handleAddDataset}
        datasets={availableDatasets}
        isLoading={isLoadingDatasets}
        share={selectedShare}
        targetSchema={targetSchema}
      />

      <AddRecipientModal
        isOpen={addRecipientModal.isOpen}
        onClose={addRecipientModal.onClose}
        onAdd={handleAddRecipientToShare}
        isLoading={isLoading}
        share={selectedShare}
        allRecipients={recipients}
        currentRecipients={shareRecipients}
      />

      <HelpModal
        isOpen={helpModal.isOpen}
        onClose={helpModal.onClose}
        share={selectedShare}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmModal.isOpen}
        onClose={deleteConfirmModal.onClose}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.title || 'Confirm Delete'}
        message={deleteTarget?.message || 'Are you sure you want to delete this item?'}
        isLoading={isSubmitting}
      />

      <ManagePinModal
        isOpen={managePinModal.isOpen}
        onClose={() => { managePinModal.onClose(); setPinTarget(null); setPinSiblings([]); }}
        dataset={pinTarget}
        siblingTables={pinSiblings}
        onPin={handlePinVersion}
        onUnpin={handleUnpinVersion}
        onPinSaved={(configId, execVersion) =>
          setPinnedExecutionVersions((prev) => ({ ...prev, [configId]: execVersion }))
        }
      />
    </DashboardLayout>
  );
}
