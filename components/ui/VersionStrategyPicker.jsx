'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import { RefreshCw, GitCommit, Check } from 'lucide-react';

/**
 * Reusable version strategy picker (Always Latest vs Pin to Version).
 * Matches the visual pattern from the Silver edit page.
 *
 * Props:
 *  - useLatest        : boolean — current strategy
 *  - onChangeStrategy : (latest: boolean) => void
 *  - selectedVersion  : number | null — currently selected version to pin
 *  - onSelectVersion  : (version: number) => void
 *  - versions         : Array<{ version: number, timestamp?: string, total_rows?: number,
 *                        rows_inserted?: number, rows_updated?: number, rows_deleted?: number,
 *                        operation?: string }> | null
 *                        Pass a list to render clickable version cards.
 *                        Pass null/undefined to render a plain numeric input.
 *  - currentVersion   : number | null — latest version displayed in the "Always Latest" card
 *  - isLoadingVersions: boolean
 *  - latestLabel      : string (default "Always Latest")
 *  - latestHint       : string (default "Auto-updates with each execution")
 *  - pinLabel         : string (default "Pin to Version")
 *  - pinHint          : string (default "Lock to specific version for reproducibility")
 *  - className        : string
 */
export function VersionStrategyPicker({
  useLatest,
  onChangeStrategy,
  selectedVersion,
  onSelectVersion,
  versions,
  currentVersion,
  isLoadingVersions = false,
  latestLabel = 'Always Latest',
  latestHint = 'Auto-updates with each execution',
  pinLabel = 'Pin to Version',
  pinHint = 'Lock to specific version for reproducibility',
  versionListLabel = 'Select Version to Pin',
  className,
}) {
  const [manualInput, setManualInput] = useState(
    selectedVersion != null ? String(selectedVersion) : ''
  );

  const hasVersionList = Array.isArray(versions) && versions.length > 0;
  const noVersionsYet = Array.isArray(versions) && versions.length === 0;
  const useInput = !Array.isArray(versions);

  const handlePinClick = () => {
    onChangeStrategy(false);
    if (useInput && !manualInput && currentVersion != null) {
      setManualInput(String(currentVersion));
    }
  };

  const handleManualChange = (e) => {
    const val = e.target.value;
    setManualInput(val);
    const n = parseInt(val, 10);
    if (!isNaN(n) && n >= 0) onSelectVersion(n);
  };

  return (
    <div className={clsx('space-y-3', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Version Strategy
        </h3>
        {!isLoadingVersions && hasVersionList && (
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {versions.length} version{versions.length !== 1 ? 's' : ''} available
          </span>
        )}
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Always Latest */}
        <button
          type="button"
          onClick={() => {
            onChangeStrategy(true);
            onSelectVersion(null);
          }}
          className={clsx(
            'relative p-4 rounded-xl border-2 text-left transition-all',
            useLatest
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600'
          )}
        >
          {useLatest && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div
              className={clsx(
                'p-2 rounded-lg',
                useLatest
                  ? 'bg-green-100 dark:bg-green-900/40'
                  : 'bg-gray-100 dark:bg-zinc-800'
              )}
            >
              <RefreshCw
                className={clsx(
                  'w-5 h-5',
                  useLatest
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              />
            </div>
            <div>
              <span
                className={clsx(
                  'font-semibold text-sm',
                  useLatest
                    ? 'text-green-700 dark:text-green-300'
                    : 'text-gray-900 dark:text-white'
                )}
              >
                {latestLabel}
              </span>
              {currentVersion != null && (
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                  (currently v{currentVersion})
                </span>
              )}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-11">
            {latestHint}
          </p>
        </button>

        {/* Pin to Version */}
        <button
          type="button"
          onClick={handlePinClick}
          disabled={isLoadingVersions || noVersionsYet}
          className={clsx(
            'relative p-4 rounded-xl border-2 text-left transition-all',
            !useLatest
              ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20'
              : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600',
            (isLoadingVersions || noVersionsYet) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {!useLatest && (
            <div className="absolute top-2 right-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                <Check className="w-3 h-3 text-white" />
              </div>
            </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div
              className={clsx(
                'p-2 rounded-lg',
                !useLatest
                  ? 'bg-amber-100 dark:bg-amber-900/40'
                  : 'bg-gray-100 dark:bg-zinc-800'
              )}
            >
              <GitCommit
                className={clsx(
                  'w-5 h-5',
                  !useLatest
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-gray-500 dark:text-gray-400'
                )}
              />
            </div>
            <span
              className={clsx(
                'font-semibold text-sm',
                !useLatest
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-gray-900 dark:text-white'
              )}
            >
              {pinLabel}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-11">
            {isLoadingVersions
              ? 'Loading versions...'
              : noVersionsYet
              ? 'No versions available yet'
              : pinHint}
          </p>
        </button>
      </div>

      {/* Version Selector — list mode */}
      {!useLatest && hasVersionList && (
        <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
          <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            {versionListLabel}
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-auto">
            {versions.map((v, idx) => (
              <button
                key={`${v.version}-${v.timestamp || idx}`}
                type="button"
                onClick={() => onSelectVersion(v.version)}
                className={clsx(
                  'flex items-center justify-between p-3 rounded-lg border text-left transition-all',
                  selectedVersion === v.version
                    ? 'border-amber-500 bg-white dark:bg-zinc-800 shadow-sm'
                    : 'border-amber-200 dark:border-amber-800/30 bg-white/50 dark:bg-zinc-800/50 hover:bg-white dark:hover:bg-zinc-800'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      selectedVersion === v.version
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    )}
                  >
                    {v.version}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-900 dark:text-white">
                        Version {v.version}
                      </span>
                      {idx === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          LATEST
                        </span>
                      )}
                    </div>
                    {v.timestamp && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(v.timestamp).toLocaleDateString()} at{' '}
                        {new Date(v.timestamp).toLocaleTimeString()}
                        {v.total_rows != null && ` · ${v.total_rows.toLocaleString()} rows`}
                      </span>
                    )}
                  </div>
                </div>
                {selectedVersion === v.version && (
                  <Check className="w-5 h-5 text-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Version Selector — input mode (no version list provided) */}
      {!useLatest && useInput && (
        <div className="mt-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
          <label className="block text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
            Version to Pin
          </label>
          <input
            type="number"
            min="0"
            value={manualInput}
            onChange={handleManualChange}
            placeholder={`e.g. ${currentVersion ?? 1}`}
            className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-700 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
            Must correspond to a successful execution. Invalid versions will be rejected.
          </p>
        </div>
      )}
    </div>
  );
}
