'use client';

import React, { useState } from 'react';
import { Shield, ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';

const ENCRYPTED_SENTINEL = '[ENCRYPTED]';

/**
 * SSH Tunnel configuration section for connection forms.
 *
 * Props:
 * - tunnelData: object with tunnel fields (ssh_host, ssh_port, ssh_username, auth_method, ssh_password, ssh_private_key, ssh_passphrase)
 * - tunnelEnabled: boolean
 * - onTunnelEnabledChange: (enabled: boolean) => void
 * - onTunnelFieldChange: (field: string, value: any) => void
 * - isEditMode: boolean — when true, handles [ENCRYPTED] sentinel values
 * - compact: boolean — when true, uses a more compact layout (for modals)
 */
export default function SshTunnelSection({
  tunnelData = {},
  tunnelEnabled = false,
  onTunnelEnabledChange,
  onTunnelFieldChange,
  isEditMode = false,
  compact = false,
}) {
  const [isExpanded, setIsExpanded] = useState(tunnelEnabled);
  const [showPassword, setShowPassword] = useState({});

  const handleToggle = (enabled) => {
    onTunnelEnabledChange(enabled);
    if (enabled) {
      setIsExpanded(true);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const isEncrypted = (value) => value === ENCRYPTED_SENTINEL;

  const getPlaceholder = (field, defaultPlaceholder) => {
    if (isEditMode && isEncrypted(tunnelData[field])) {
      return 'Encrypted — leave blank to keep';
    }
    return defaultPlaceholder;
  };

  const getFieldValue = (field) => {
    const value = tunnelData[field];
    if (isEditMode && isEncrypted(value)) {
      return '';
    }
    return value ?? '';
  };

  const authMethod = tunnelData.auth_method || 'password';

  const inputClassName = "w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm";
  const labelClassName = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="border border-gray-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      {/* Header / Toggle */}
      <button
        type="button"
        onClick={() => {
          if (tunnelEnabled) {
            setIsExpanded(!isExpanded);
          } else {
            handleToggle(true);
          }
        }}
        className={clsx(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          tunnelEnabled
            ? "bg-blue-50 dark:bg-blue-900/20"
            : "bg-gray-50 dark:bg-zinc-800/50 hover:bg-gray-100 dark:hover:bg-zinc-800"
        )}
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            tunnelEnabled
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400"
          )}>
            <Shield className="w-4 h-4" />
          </div>
          <div className="text-left">
            <span className={clsx(
              "text-sm font-medium",
              tunnelEnabled
                ? "text-blue-700 dark:text-blue-300"
                : "text-gray-700 dark:text-gray-300"
            )}>
              SSH Tunnel
            </span>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Connect through a bastion/jump host
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Toggle switch */}
          <div
            role="switch"
            aria-checked={tunnelEnabled}
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(!tunnelEnabled);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                handleToggle(!tunnelEnabled);
              }
            }}
            className={clsx(
              "relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer",
              tunnelEnabled ? "bg-blue-600" : "bg-gray-300 dark:bg-zinc-600"
            )}
          >
            <span
              className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                tunnelEnabled ? "translate-x-6" : "translate-x-1"
              )}
            />
          </div>

          {/* Expand/collapse indicator (only when enabled) */}
          {tunnelEnabled && (
            isExpanded
              ? <ChevronDown className="w-4 h-4 text-gray-400" />
              : <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {/* Tunnel Fields */}
      {tunnelEnabled && isExpanded && (
        <div className={clsx(
          "border-t border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900",
          compact ? "p-4 space-y-4" : "p-5 space-y-5"
        )}>
          {/* SSH Host & Port */}
          <div className={clsx(compact ? "grid grid-cols-1 gap-4" : "grid grid-cols-1 sm:grid-cols-3 gap-4")}>
            <div className={compact ? "" : "sm:col-span-2"}>
              <label className={labelClassName}>
                SSH Host
                <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                value={getFieldValue('ssh_host')}
                onChange={(e) => onTunnelFieldChange('ssh_host', e.target.value)}
                placeholder={getPlaceholder('ssh_host', 'bastion.example.com')}
                className={inputClassName}
              />
            </div>
            <div>
              <label className={labelClassName}>
                SSH Port
              </label>
              <input
                type="number"
                value={tunnelData.ssh_port ?? 22}
                onChange={(e) => onTunnelFieldChange('ssh_port', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="22"
                className={inputClassName}
              />
            </div>
          </div>

          {/* SSH Username */}
          <div>
            <label className={labelClassName}>
              SSH Username
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={getFieldValue('ssh_username')}
              onChange={(e) => onTunnelFieldChange('ssh_username', e.target.value)}
              placeholder={getPlaceholder('ssh_username', 'tunnel_user')}
              className={inputClassName}
            />
          </div>

          {/* Auth Method */}
          <div>
            <label className={labelClassName}>
              Authentication Method
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onTunnelFieldChange('auth_method', 'password')}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                  authMethod === 'password'
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                )}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => onTunnelFieldChange('auth_method', 'private_key')}
                className={clsx(
                  "flex-1 px-4 py-2 text-sm font-medium rounded-lg border transition-colors",
                  authMethod === 'private_key'
                    ? "bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300"
                    : "bg-white dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-700"
                )}
              >
                Private Key
              </button>
            </div>
          </div>

          {/* Password auth fields */}
          {authMethod === 'password' && (
            <div>
              <label className={labelClassName}>
                SSH Password
                <span className="text-red-500 ml-1">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword.ssh_password ? 'text' : 'password'}
                  value={getFieldValue('ssh_password')}
                  onChange={(e) => onTunnelFieldChange('ssh_password', e.target.value)}
                  placeholder={getPlaceholder('ssh_password', 'SSH password')}
                  className={clsx(inputClassName, "pr-10")}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('ssh_password')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword.ssh_password
                    ? <EyeOff className="w-4 h-4" />
                    : <Eye className="w-4 h-4" />
                  }
                </button>
              </div>
            </div>
          )}

          {/* Private key auth fields */}
          {authMethod === 'private_key' && (
            <>
              <div>
                <label className={labelClassName}>
                  SSH Private Key
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <textarea
                  value={getFieldValue('ssh_private_key')}
                  onChange={(e) => onTunnelFieldChange('ssh_private_key', e.target.value)}
                  placeholder={getPlaceholder('ssh_private_key', '-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----')}
                  rows={5}
                  className={clsx(inputClassName, "resize-none font-mono text-xs")}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Paste the full PEM-encoded private key content
                </p>
              </div>
              <div>
                <label className={labelClassName}>
                  SSH Passphrase
                  <span className="text-xs text-gray-400 ml-1">(optional)</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword.ssh_passphrase ? 'text' : 'password'}
                    value={getFieldValue('ssh_passphrase')}
                    onChange={(e) => onTunnelFieldChange('ssh_passphrase', e.target.value)}
                    placeholder={getPlaceholder('ssh_passphrase', 'Passphrase for the private key')}
                    className={clsx(inputClassName, "pr-10")}
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('ssh_passphrase')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword.ssh_passphrase
                      ? <EyeOff className="w-4 h-4" />
                      : <Eye className="w-4 h-4" />
                    }
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
