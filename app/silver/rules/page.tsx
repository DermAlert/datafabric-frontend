'use client';

import React, { useState } from 'react';
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
  Sparkles,
  Play,
  HelpCircle,
  Copy,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';
import { clsx } from 'clsx';

// Mock normalization rules
const MOCK_RULES = [
  {
    id: 1,
    name: 'CPF Format',
    description: 'Brazilian CPF document formatting',
    template: '{d3}.{d3}.{d3}-{d2}',
    example: '123.456.789-01',
    isActive: true,
    usageCount: 5,
    createdAt: '2026-01-08T10:00:00Z',
  },
  {
    id: 2,
    name: 'Phone BR',
    description: 'Brazilian phone number with area code',
    template: '({d2}) {d5}-{d4}',
    example: '(61) 99999-8888',
    isActive: true,
    usageCount: 3,
    createdAt: '2026-01-09T14:30:00Z',
  },
  {
    id: 3,
    name: 'CEP Format',
    description: 'Brazilian postal code',
    template: '{d5}-{d3}',
    example: '70000-000',
    isActive: true,
    usageCount: 2,
    createdAt: '2026-01-10T09:00:00Z',
  },
  {
    id: 4,
    name: 'CNPJ Format',
    description: 'Brazilian company document formatting',
    template: '{d2}.{d3}.{d3}/{d4}-{d2}',
    example: '12.345.678/0001-90',
    isActive: true,
    usageCount: 1,
    createdAt: '2026-01-11T11:00:00Z',
  },
  {
    id: 5,
    name: 'Date BR',
    description: 'Brazilian date format',
    template: '{d2}/{d2}/{d4}',
    example: '13/01/2026',
    isActive: false,
    usageCount: 0,
    createdAt: '2026-01-12T16:00:00Z',
  },
  {
    id: 6,
    name: 'Currency BR',
    description: 'Brazilian currency format (requires amount)',
    template: 'R$ {D},{d2}',
    example: 'R$ 1234,56',
    isActive: true,
    usageCount: 4,
    createdAt: '2026-01-07T08:00:00Z',
  },
];

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
];

export default function NormalizationRulesPage() {
  const [rules, setRules] = useState(MOCK_RULES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRule, setSelectedRule] = useState<typeof MOCK_RULES[0] | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  
  // Test panel state
  const [testValue, setTestValue] = useState('');
  const [testResult, setTestResult] = useState<{ success: boolean; output: string } | null>(null);

  // Create modal state
  const [newRule, setNewRule] = useState({
    name: '',
    description: '',
    template: '',
  });

  const filteredRules = rules.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteRule = (id: number) => {
    setRules(rules.filter(r => r.id !== id));
    if (selectedRule?.id === id) setSelectedRule(null);
    setMenuOpenId(null);
  };

  const handleToggleActive = (id: number) => {
    setRules(rules.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));
    if (selectedRule?.id === id) {
      setSelectedRule({ ...selectedRule, isActive: !selectedRule.isActive });
    }
  };

  const handleTestRule = () => {
    if (!selectedRule || !testValue) return;
    
    // Simulate rule testing - in reality this would call the API
    const digitsOnly = testValue.replace(/\D/g, '');
    
    // Simple template simulation
    let output = selectedRule.template;
    let digitIndex = 0;
    
    output = output.replace(/\{d(\d*)\}/g, (match, count) => {
      const len = count ? parseInt(count) : 1;
      const chunk = digitsOnly.slice(digitIndex, digitIndex + len);
      digitIndex += len;
      return chunk.padEnd(len, '_');
    });
    
    output = output.replace(/\{D\}/g, () => {
      const remaining = digitsOnly.slice(digitIndex);
      digitIndex = digitsOnly.length;
      return remaining || '_';
    });

    const success = digitIndex === digitsOnly.length && !output.includes('_');
    setTestResult({ success, output });
  };

  const handleCreateRule = () => {
    if (!newRule.name || !newRule.template) return;
    
    const rule = {
      id: Math.max(...rules.map(r => r.id)) + 1,
      name: newRule.name,
      description: newRule.description,
      template: newRule.template,
      example: '',
      isActive: true,
      usageCount: 0,
      createdAt: new Date().toISOString(),
    };
    
    setRules([...rules, rule]);
    setNewRule({ name: '', description: '', template: '' });
    setShowCreateModal(false);
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
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Normalization Rules</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Template-based data formatting rules
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowHelpModal(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <HelpCircle className="w-4 h-4" />
                Template Help
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Rule
              </button>
            </div>
          </div>
        </div>

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
              {filteredRules.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <FileCode className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No rules found</p>
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
                        "p-4 rounded-lg transition-all cursor-pointer",
                        selectedRule?.id === rule.id
                          ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800"
                          : "hover:bg-gray-50 dark:hover:bg-zinc-800 border border-transparent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 dark:text-white text-sm">
                              {rule.name}
                            </span>
                            {!rule.isActive && (
                              <span className="px-1.5 py-0.5 rounded text-xs bg-gray-200 dark:bg-zinc-700 text-gray-500 dark:text-gray-400">
                                Inactive
                              </span>
                            )}
                          </div>
                          <code className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded">
                            {rule.template}
                          </code>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {rule.example && <>Example: <span className="font-mono">{rule.example}</span></>}
                          </p>
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
                              <button className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200">
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleToggleActive(rule.id);
                                  setMenuOpenId(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-zinc-700 text-gray-700 dark:text-gray-200"
                              >
                                {rule.isActive ? 'Deactivate' : 'Activate'}
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
                        <span className={clsx(
                          "px-2 py-0.5 rounded text-xs font-medium",
                          selectedRule.isActive 
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "bg-gray-100 dark:bg-zinc-700 text-gray-500 dark:text-gray-400"
                        )}>
                          {selectedRule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400">
                        {selectedRule.description}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-lg">
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
                    {selectedRule.example && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-700">
                        <span className="text-xs text-gray-500 dark:text-gray-400">Example Output: </span>
                        <span className="font-mono text-gray-900 dark:text-white">{selectedRule.example}</span>
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
                          placeholder="Enter a value to test (e.g., 12345678901)"
                          className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                        />
                        <button
                          onClick={handleTestRule}
                          disabled={!testValue}
                          className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 rounded-lg transition-colors flex items-center gap-2"
                        >
                          <Play className="w-4 h-4" />
                          Test
                        </button>
                      </div>
                    </div>

                    {testResult && (
                      <div className={clsx(
                        "p-4 rounded-lg border",
                        testResult.success 
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          {testResult.success ? (
                            <>
                              <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                              <span className="font-medium text-green-700 dark:text-green-400">Success</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              <span className="font-medium text-red-700 dark:text-red-400">Incomplete Match</span>
                            </>
                          )}
                        </div>
                        <div className="font-mono text-lg text-gray-900 dark:text-white">
                          {testResult.output}
                        </div>
                      </div>
                    )}

                    {/* Usage Info */}
                    <div className="mt-8 p-4 rounded-lg bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Usage Statistics
                      </h4>
                      <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                        <span>Used in <strong>{selectedRule.usageCount}</strong> transformations</span>
                        <span>Created {new Date(selectedRule.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <FileCode className="w-16 h-16 mb-4 opacity-30" />
                <h3 className="text-lg font-medium mb-2">Select a Rule</h3>
                <p className="text-sm text-center max-w-md">
                  Choose a normalization rule from the list to view details and test with sample values.
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rule Name
                </label>
                <input 
                  type="text"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
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
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  placeholder="e.g., Brazilian CPF document formatting"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Template Pattern
                </label>
                <input 
                  type="text"
                  value={newRule.template}
                  onChange={(e) => setNewRule({ ...newRule, template: e.target.value })}
                  placeholder="e.g., {d3}.{d3}.{d3}-{d2}"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-sm font-mono"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Use placeholders like {'{d3}'} for 3 digits, {'{L}'} for letters
                </p>
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
                disabled={!newRule.name || !newRule.template}
                className="px-4 py-2 text-sm font-medium text-white bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 dark:disabled:bg-zinc-700 rounded-lg"
              >
                Create Rule
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
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Placeholder</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">Example</th>
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
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">{'({d2}) {d5}-{d4}'}</code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">(61) 99999-8888</span>
                    <span className="text-gray-500">Phone BR</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">{'{d3}.{d3}.{d3}-{d2}'}</code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">123.456.789-01</span>
                    <span className="text-gray-500">CPF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="px-2 py-1 rounded bg-gray-200 dark:bg-zinc-700 font-mono">{'{d5}-{d3}'}</code>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                    <span className="font-mono">70000-000</span>
                    <span className="text-gray-500">CEP</span>
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

