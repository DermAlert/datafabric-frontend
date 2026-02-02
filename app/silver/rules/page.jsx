'use client';

import React, { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
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
  ArrowLeft,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';
import { silverService } from '@/lib/api/services/silver';
import { formatDate } from '@/lib/utils';

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
  { placeholder: '{l:upper}', description: 'Letter converted to uppercase', example: 'A' },
  { placeholder: '{l:lower}', description: 'Letter converted to lowercase', example: 'a' },
];

export default function NormalizationRulesPage() {
  const [rules, setRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Test panel state
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Create/Edit modal state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: '',
    example_input: '',
    example_output: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Load rules from API
  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await silverService.normalizationRules.list();
      setRules(data);
    } catch (err) {
      console.error('Failed to load rules:', err);
      setError(err.message || 'Failed to load normalization rules');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRules();
  }, [loadRules]);

  const filteredRules = rules.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteRule = async (id) => {
    if (!confirm('Are you sure you want to delete this rule?')) return;

    try {
      await silverService.normalizationRules.delete(id);
      setRules(rules.filter((r) => r.id !== id));
      if (selectedRule?.id === id) setSelectedRule(null);
      setMenuOpenId(null);
    } catch (err) {
      console.error('Failed to delete rule:', err);
      alert(err.message || 'Failed to delete rule');
    }
  };

  const handleTestRule = async () => {
    if (!selectedRule || !testValue) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const result = await silverService.normalizationRules.test({
        rule_id: selectedRule.id,
        value: testValue,
      });
      setTestResult({
        success: result.success,
        output: result.normalized_value,
        original: result.original_value,
        error: result.error,
      });
    } catch (err) {
      console.error('Test failed:', err);
      setTestResult({
        success: false,
        output: null,
        error: err.message || 'Test failed',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCreateRule = async () => {
    if (!formData.name || !formData.template) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const newRule = await silverService.normalizationRules.create({
        name: formData.name,
        description: formData.description || undefined,
        template: formData.template,
        example_input: formData.example_input || undefined,
        example_output: formData.example_output || undefined,
      });
      setRules([...rules, newRule]);
      setFormData({ name: '', description: '', template: '', example_input: '', example_output: '' });
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create rule:', err);
      setSubmitError(err.message || 'Failed to create rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRule = async () => {
    if (!formData.name || !formData.template || !selectedRule) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const updatedRule = await silverService.normalizationRules.update(selectedRule.id, {
        name: formData.name,
        description: formData.description || undefined,
        template: formData.template,
        example_input: formData.example_input || undefined,
        example_output: formData.example_output || undefined,
      });
      setRules(rules.map((r) => (r.id === selectedRule.id ? updatedRule : r)));
      setSelectedRule(updatedRule);
      setFormData({ name: '', description: '', template: '', example_input: '', example_output: '' });
      setShowEditModal(false);
    } catch (err) {
      console.error('Failed to update rule:', err);
      setSubmitError(err.message || 'Failed to update rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = () => {
    if (!selectedRule) return;
    setFormData({
      name: selectedRule.name,
      description: selectedRule.description || '',
      template: selectedRule.template,
      example_input: selectedRule.example_input || '',
      example_output: selectedRule.example_output || '',
    });
    setSubmitError(null);
    setShowEditModal(true);
  };

  const openCreateModal = () => {
    setFormData({ name: '', description: '', template: '', example_input: '', example_output: '' });
    setSubmitError(null);
    setShowCreateModal(true);
  };

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/silver"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 dark:text-gray-400"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <FileCode className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Normalization Rules
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Template-based data formatting rules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRules}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
                Refresh
              </button>
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Template Help
              </button>
              <button
                onClick={openCreateModal}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Rule
              </button>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
              <button onClick={loadRules} className="ml-auto text-sm underline hover:no-underline">
                Retry
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden">
          {/* List Panel */}
          <div className="w-[380px] border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-gray-200 dark:border-zinc-800">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-sm"
                />
              </div>
            </div>

            {/* Rules List */}
            <div className="flex-1 overflow-auto p-2">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">Loading rules...</p>
                </div>
              ) : filteredRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">
                    {rules.length === 0 ? 'No rules created yet' : 'No rules found'}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
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
                        'p-4 rounded-lg transition-all cursor-pointer',
                        selectedRule?.id === rule.id
                          ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800'
                          : 'hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {rule.name}
                            </span>
                            {!rule.is_active && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <code className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                            {rule.template}
                          </code>
                          {rule.example_output && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                              Example: <span className="font-mono">{rule.example_output}</span>
                            </p>
                          )}
                        </div>
                        <div className="relative ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMenuOpenId(menuOpenId === rule.id ? null : rule.id);
                            }}
                            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-zinc-700 text-gray-400"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {menuOpenId === rule.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg shadow-lg z-10 py-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedRule(rule);
                                  setMenuOpenId(null);
                                  setTimeout(() => openEditModal(), 0);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteRule(rule.id);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-red-600 dark:text-red-400"
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

          {/* Detail Panel */}
          <div className="flex-1 overflow-auto">
            {selectedRule ? (
              <div className="h-full flex flex-col">
                {/* Detail Header */}
                <div className="p-6 border-b border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                          {selectedRule.name}
                        </h2>
                        <span
                          className={clsx(
                            'px-2 py-0.5 rounded text-xs font-medium',
                            selectedRule.is_active
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                              : 'bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400'
                          )}
                        >
                          {selectedRule.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedRule.description || 'No description'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={openEditModal}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit Rule
                      </button>
                    </div>
                  </div>

                  {/* Template Display */}
                  <div className="p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        Template Pattern
                      </span>
                      <button
                        onClick={() => navigator.clipboard.writeText(selectedRule.template)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <code className="text-lg font-mono text-purple-600 dark:text-purple-400">
                      {selectedRule.template}
                    </code>
                    {(selectedRule.example_input || selectedRule.example_output) && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700 space-y-1">
                        {selectedRule.example_input && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Example Input:{' '}
                            </span>
                            <span className="font-mono text-gray-900 dark:text-white">
                              {selectedRule.example_input}
                            </span>
                          </div>
                        )}
                        {selectedRule.example_output && (
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Example Output:{' '}
                            </span>
                            <span className="font-mono text-gray-900 dark:text-white">
                              {selectedRule.example_output}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Panel */}
                <div className="flex-1 overflow-auto p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Play className="w-4 h-4 text-gray-400" />
                    Test Rule
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Input Value
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={testValue}
                          onChange={(e) => setTestValue(e.target.value)}
                          placeholder={
                            selectedRule.example_input
                              ? `e.g., ${selectedRule.example_input}`
                              : 'Enter a value to test'
                          }
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                          onKeyDown={(e) => e.key === 'Enter' && handleTestRule()}
                        />
                        <button
                          onClick={handleTestRule}
                          disabled={!testValue || isTesting}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          {isTesting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Play className="w-4 h-4" />
                          )}
                          Test
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div
                        className={clsx(
                          'p-4 rounded-lg border',
                          testResult.success && !testResult.error
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        )}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success && !testResult.error ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-700 dark:text-green-400">
                                Success
                              </span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              <span className="font-medium text-red-700 dark:text-red-400">
                                Failed
                              </span>
                            </>
                          )}
                        </div>
                        {testResult.success && !testResult.error ? (
                          <div className="font-mono text-lg text-gray-900 dark:text-white">
                            {testResult.output}
                          </div>
                        ) : (
                          <div className="text-sm text-red-600 dark:text-red-300">
                            {testResult.error || 'Pattern did not match input'}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Regex Info */}
                    {selectedRule.regex_pattern && (
                      <div className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Generated Regex Pattern
                        </h4>
                        <code className="text-xs text-gray-600 dark:text-gray-400 font-mono break-all">
                          {selectedRule.regex_pattern}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <FileCode className="w-16 h-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a Rule</h3>
                <p className="text-sm text-center max-w-md">
                  Choose a normalization rule from the list to view details and test with sample
                  values.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Rule Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create Normalization Rule
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., CPF Format"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Brazilian CPF document formatting"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Pattern *
                </label>
                <input
                  type="text"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="e.g., {d3}.{d3}.{d3}-{d2}"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use placeholders like {'{d3}'} for 3 digits, {'{L}'} for letters
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example Input
                  </label>
                  <input
                    type="text"
                    value={formData.example_input}
                    onChange={(e) => setFormData({ ...formData, example_input: e.target.value })}
                    placeholder="e.g., 12345678901"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example Output
                  </label>
                  <input
                    type="text"
                    value={formData.example_output}
                    onChange={(e) => setFormData({ ...formData, example_output: e.target.value })}
                    placeholder="e.g., 123.456.789-01"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRule}
                disabled={!formData.name || !formData.template || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 rounded-lg flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Rule Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-lg w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Normalization Rule
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {submitError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
                  {submitError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., CPF Format"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Brazilian CPF document formatting"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Pattern *
                </label>
                <input
                  type="text"
                  value={formData.template}
                  onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                  placeholder="e.g., {d3}.{d3}.{d3}-{d2}"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example Input
                  </label>
                  <input
                    type="text"
                    value={formData.example_input}
                    onChange={(e) => setFormData({ ...formData, example_input: e.target.value })}
                    placeholder="e.g., 12345678901"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Example Output
                  </label>
                  <input
                    type="text"
                    value={formData.example_output}
                    onChange={(e) => setFormData({ ...formData, example_output: e.target.value })}
                    placeholder="e.g., 123.456.789-01"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-zinc-800">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleEditRule}
                disabled={!formData.name || !formData.template || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 rounded-lg flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-purple-500" />
                Template Placeholders
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-zinc-700">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Placeholder
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                      Example
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                  {TEMPLATE_HELP.map((item) => (
                    <tr key={item.placeholder}>
                      <td className="py-2 px-3">
                        <code className="px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
                          {item.placeholder}
                        </code>
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600 dark:text-gray-400">
                        {item.description}
                      </td>
                      <td className="py-2 px-3 text-sm font-mono text-gray-900 dark:text-white">
                        {item.example}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800">
                <h4 className="font-medium text-gray-900 dark:text-white mb-3">Examples</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">
                      {'({d2}) {d5}-{d4}'}
                    </code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">(61) 99999-8888</span>
                    <span className="text-gray-500">Phone BR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">
                      {'{d3}.{d3}.{d3}-{d2}'}
                    </code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">123.456.789-01</span>
                    <span className="text-gray-500">CPF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">
                      {'{d5}-{d3}'}
                    </code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">70000-000</span>
                    <span className="text-gray-500">CEP</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">
                      {'{l3:upper}-{d}{l}{d2}'}
                    </code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">ABC-1D23</span>
                    <span className="text-gray-500">License Plate</span>
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
