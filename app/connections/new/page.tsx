'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, Database, Cloud, HardDrive, Check, ChevronRight, 
  Loader2, CheckCircle2, AlertTriangle, Layers, Server, Search, X
} from 'lucide-react';
import { clsx } from 'clsx';

const SOURCE_CATEGORIES = [
  {
    id: 'metadata',
    title: 'Relational & Metadata',
    description: 'Databases for structured data and metadata storage',
    sources: [
      { id: 'postgres', name: 'PostgreSQL', icon: '/icons/postgres.svg', fallbackIcon: Database, description: 'Advanced open source database' },
      { id: 'mysql', name: 'MySQL', icon: '/icons/mysql.svg', fallbackIcon: Database, description: 'Popular relational database' },
      { id: 'mongo', name: 'MongoDB', icon: '/icons/mongodb.svg', fallbackIcon: Database, description: 'NoSQL document database' },
    ]
  },
  {
    id: 'storage',
    title: 'Object Storage & Data Lake',
    description: 'Storage for unstructured data, images, and documents',
    sources: [
      { id: 's3', name: 'Amazon S3', icon: '/icons/s3.svg', fallbackIcon: Cloud, description: 'AWS Object Storage' },
      { id: 'minio', name: 'MinIO', icon: '/icons/minio.svg', fallbackIcon: HardDrive, description: 'High Performance Object Storage' },
      { id: 'gcs', name: 'Google Storage', icon: '/icons/gcs.svg', fallbackIcon: Cloud, description: 'GCP Object Storage' },
    ]
  }
];

export default function NewConnectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    bucket: '', 
    region: '', 
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  // Helper to determine if selected source is storage
  const isStorageType = (sourceId: string | null) => {
    return SOURCE_CATEGORIES.find(c => c.id === 'storage')?.sources.some(s => s.id === sourceId);
  };

  const filteredCategories = SOURCE_CATEGORIES.map(category => ({
    ...category,
    sources: category.sources.filter(source => 
      source.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      source.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.sources.length > 0);

  const handleSourceSelect = (id: string) => {
    setSelectedSource(id);
    setStep(2);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsTesting(false);
    setTestResult('success');
  };

  const handleSave = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    router.push('/connections');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/connections" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Connections
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">New Data Connection</h1>
          <p className="text-gray-500 mt-1">
            Step {step} of 2: {step === 1 ? 'Select Data Source' : 'Configure Connection'}
          </p>
        </div>

        {/* Step 1: Selection Grouped by Category */}
        {step === 1 && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="relative mb-8">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search data sources (e.g., Postgres, S3)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-3 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-blue-500 outline-none text-base shadow-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <div key={category.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="mb-4 mt-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      {category.id === 'metadata' ? <Database className="w-5 h-5 text-blue-500" /> : <HardDrive className="w-5 h-5 text-purple-500" />}
                      {category.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.sources.map((source) => {
                      return (
                        <button
                          key={source.id}
                          onClick={() => handleSourceSelect(source.id)}
                          className="flex items-start p-4 text-left border border-gray-200 dark:border-zinc-800 rounded-xl hover:border-blue-500 hover:ring-1 hover:ring-blue-500 transition-all bg-white dark:bg-zinc-900 group relative overflow-hidden"
                        >
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform bg-white dark:bg-zinc-800 p-2 border border-gray-100 dark:border-zinc-700`}>
                            <Image 
                              src={source.icon} 
                              alt={source.name} 
                              width={24} 
                              height={24} 
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="ml-3 z-10">
                            <h3 className="font-medium text-gray-900 dark:text-white text-sm">{source.name}</h3>
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{source.description}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No sources found</h3>
                <p className="text-gray-500 mt-1">Try adjusting your search term.</p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Configuration */}
        {step === 2 && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center border border-gray-100 dark:border-zinc-700 p-2">
                 {/* Show selected icon */}
                 {(() => {
                   const source = SOURCE_CATEGORIES.flatMap(c => c.sources).find(s => s.id === selectedSource);
                   return source ? (
                     <Image 
                       src={source.icon} 
                       alt={source.name} 
                       width={32} 
                       height={32} 
                       className="w-full h-full object-contain" 
                     />
                   ) : <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
                 })()}
              </div>
              <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Configure {SOURCE_CATEGORIES.flatMap(c => c.sources).find(s => s.id === selectedSource)?.name}
                </h2>
                <p className="text-sm text-gray-500">Enter your connection details below.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Connection Name</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="My Data Source"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Conditional Fields based on Type */}
              {!isStorageType(selectedSource) ? (
                // Database Fields
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Host</label>
                      <input
                        name="host"
                        value={formData.host}
                        onChange={handleInputChange}
                        placeholder="db.example.com"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Port</label>
                      <input
                        name="port"
                        value={formData.port}
                        onChange={handleInputChange}
                        placeholder="5432"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Database Name</label>
                    <input
                      name="database"
                      value={formData.database}
                      onChange={handleInputChange}
                      placeholder="analytics_db"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
                      <input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              ) : (
                // Storage Fields
                <>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Endpoint URL</label>
                      <input
                        name="host"
                        value={formData.host}
                        onChange={handleInputChange}
                        placeholder="https://s3.amazonaws.com"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Region</label>
                      <input
                        name="region"
                        value={formData.region}
                        onChange={handleInputChange}
                        placeholder="us-east-1"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bucket Name</label>
                    <input
                      name="bucket"
                      value={formData.bucket}
                      onChange={handleInputChange}
                      placeholder="my-data-lake"
                      className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Access Key</label>
                      <input
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Secret Key</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Test Connection Feedback */}
            {testResult && (
              <div className={clsx(
                "mt-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                testResult === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700"
              )}>
                {testResult === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="text-sm font-medium">
                  {testResult === 'success' ? "Connection established successfully!" : "Failed to connect. Check credentials."}
                </span>
              </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={() => setStep(1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Test Connection
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Create Connection
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
