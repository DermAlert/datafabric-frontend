'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/DashboardLayout';
import { 
  ArrowLeft, Database, Cloud, HardDrive, Check, ChevronRight, 
  Loader2, CheckCircle2, AlertTriangle, Search, X, RefreshCw
} from 'lucide-react';
import { clsx } from 'clsx';
import { connectionService } from '@/lib/api';

// Icon mapping from API icon names to local SVG files
const ICON_MAP = {
  'azure': '/icons/azure.svg',
  'delta': '/icons/delta.svg',
  'google-cloud': '/icons/gcs.svg',
  'mysql': '/icons/mysql.svg',
  'postgres': '/icons/postgres.svg',
  'postgresql': '/icons/postgres.svg',
  'string': '/icons/postgres.svg', // fallback for postgresql with wrong icon
  'aws': '/icons/aws-s3.svg',
  's3': '/icons/aws-s3.svg',
  'minio': '/icons/minio.svg',
  'mongodb': '/icons/mongodb.svg',
};

// Category mapping based on metadata_extraction_method or connection name
// Delta Lake goes to 'metadata' because it's a tabular data format (not pure object storage)
function getCategoryForConnection(conn) {
  const storageTypes = ['s3', 'azure_storage', 'gcs', 'minio'];
  if (storageTypes.includes(conn.name)) return 'storage';
  if (conn.metadata_extraction_method === 'trino' && conn.name.includes('storage')) return 'storage';
  return 'metadata';
}

// Get display name from connection name
function getDisplayName(name) {
  const nameMap = {
    'azure_storage': 'Azure Storage',
    'deltalake': 'Delta Lake',
    'gcs': 'Google Cloud Storage',
    'mysql': 'MySQL',
    'postgresql': 'PostgreSQL',
    's3': 'Amazon S3',
  };
  return nameMap[name] || name.charAt(0).toUpperCase() + name.slice(1).replace(/_/g, ' ');
}

export default function NewConnectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSource, setSelectedSource] = useState(null);
  const [formData, setFormData] = useState({});
  const [connectionName, setConnectionName] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [formError, setFormError] = useState(null);

  // API state
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch connection types from API
  useEffect(() => {
    async function fetchConnectionTypes() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await connectionService.search({ limit: 50, skip: 0 });
        setConnectionTypes(response.items);
      } catch (err) {
        console.error('Failed to fetch connection types:', err);
        setError('Failed to load connection types. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
    fetchConnectionTypes();
  }, []);

  // Group connections by category
  const categories = useMemo(() => {
    const metadata = connectionTypes.filter(c => getCategoryForConnection(c) === 'metadata');
    const storage = connectionTypes.filter(c => getCategoryForConnection(c) === 'storage');
    
    return [
      {
        id: 'metadata',
        title: 'Relational & Metadata',
        description: 'Databases for structured data and metadata storage',
        icon: Database,
        sources: metadata,
      },
      {
        id: 'storage', 
        title: 'Object Storage & Data Lake',
        description: 'Storage for unstructured data, images, and documents',
        icon: HardDrive,
        sources: storage,
      }
    ].filter(cat => cat.sources.length > 0);
  }, [connectionTypes]);

  // Filter by search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return categories;
    
    return categories.map(category => ({
      ...category,
      sources: category.sources.filter(source => 
        source.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        source.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        getDisplayName(source.name).toLowerCase().includes(searchTerm.toLowerCase())
      )
    })).filter(category => category.sources.length > 0);
  }, [categories, searchTerm]);

  // Initialize form data with defaults when source is selected
  useEffect(() => {
    if (!selectedSource) return;
    
    const schema = selectedSource.connection_params_schema;
    const properties = schema.properties || schema;
    const initialData = {};
    
    Object.entries(properties).forEach(([key, prop]) => {
      const property = prop;
      if (property.default !== undefined) {
        initialData[key] = property.default;
      } else if (property.type === 'boolean') {
        initialData[key] = false;
      } else if (property.type === 'integer' || property.type === 'number') {
        initialData[key] = '';
      } else {
        initialData[key] = '';
      }
    });
    
    setFormData(initialData);
  }, [selectedSource]);

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    setConnectionName(`My ${getDisplayName(source.name)}`);
    setStep(2);
    setTestResult(null);
  };

  const handleInputChange = (key, value) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (formError) setFormError(null);
  };

  const handleTestConnection = async () => {
    if (!selectedSource) return;
    
    setIsTesting(true);
    setTestResult(null);
    
    try {
      // Build connection params, converting empty strings to undefined for optional fields
      const connectionParams = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
          connectionParams[key] = value;
        }
      });

      const response = await connectionService.test(selectedSource.id, connectionParams);
      setTestResult(response.success ? 'success' : 'error');
    } catch (err) {
      console.error('Test connection failed:', err);
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  // Validate required fields
  const validateForm = () => {
    if (!connectionName.trim()) {
      return 'Connection name is required';
    }

    if (!selectedSource) {
      return 'Please select a connection type';
    }

    const schema = selectedSource.connection_params_schema;
    const required = schema.required || [];

    for (const fieldName of required) {
      const value = formData[fieldName];
      if (value === undefined || value === '' || value === null) {
        const properties = schema.properties || schema;
        const property = properties[fieldName];
        const label = property?.title || fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/_/g, ' ');
        return `${label} is required`;
      }
    }

    return null;
  };

  const handleSave = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    if (!selectedSource) return;
    
    setIsSaving(true);
    setFormError(null);
    
    try {
      // Build connection params
      const connectionParams = {};
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== '' && value !== undefined) {
          connectionParams[key] = value;
        }
      });

      // Determine content type based on category
      // Backend expects 'metadata' or 'image' (not 'storage')
      const contentType = getCategoryForConnection(selectedSource) === 'storage' ? 'image' : 'metadata';

      await connectionService.create({
        name: connectionName,
        description: connectionName,
        connection_type_id: selectedSource.id,
        content_type: contentType,
        connection_params: connectionParams,
        organization_id: 1, // Default organization
      });

      router.push('/connections');
    } catch (err) {
      // Log full error for debugging
      console.error('Failed to create connection:', JSON.stringify(err, null, 2), err);
      
      // Extract error message from various possible formats
      let errorMessage = 'Failed to create connection. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const apiError = err;
        
        // Handle FastAPI validation error format (array of errors)
        const detail = apiError.data?.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          // Format: [{ msg: "...", loc: ["body", "field"] }]
          const firstError = detail[0];
          const field = firstError.loc?.slice(1).join('.') || 'field';
          errorMessage = `${field}: ${firstError.msg}`;
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (typeof apiError.message === 'string') {
          errorMessage = apiError.message;
        } else if (Array.isArray(apiError.message) && apiError.message.length > 0) {
          const firstError = apiError.message[0];
          const field = firstError.loc?.slice(1).join('.') || 'field';
          errorMessage = `${field}: ${firstError.msg}`;
        } else if (apiError.status) {
          errorMessage = `Error ${apiError.status}: Request failed`;
        }
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const getIconSrc = (iconName) => {
    return ICON_MAP[iconName] || ICON_MAP['postgres'];
  };

  // Known field options for fields that should be selects but don't have enum in schema
  const KNOWN_FIELD_OPTIONS = {
    sslmode: ['disable', 'allow', 'prefer', 'require', 'verify-ca', 'verify-full'],
  };

  // Render form field based on schema property
  const renderFormField = (key, property, isRequired) => {
    const value = formData[key] ?? '';
    const label = property.title || key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
    
    // Get enum options from property or known fields
    const enumOptions = property.enum || KNOWN_FIELD_OPTIONS[key.toLowerCase()];
    
    // Handle enum (select)
    if (enumOptions && enumOptions.length > 0) {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <select
            value={String(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          >
            {enumOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          {property.description && (
            <p className="text-xs text-gray-500 mt-1">{property.description}</p>
          )}
        </div>
      );
    }

    // Handle boolean (checkbox)
    if (property.type === 'boolean') {
      return (
        <div key={key} className="flex items-center gap-3">
          <input
            type="checkbox"
            id={key}
            checked={Boolean(value)}
            onChange={(e) => handleInputChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor={key} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
            {property.description && (
              <span className="block text-xs text-gray-500 font-normal">{property.description}</span>
            )}
          </label>
        </div>
      );
    }

    // Handle textarea
    if (property.format === 'textarea') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <textarea
            value={String(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={property.description}
            rows={4}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
          />
        </div>
      );
    }

    // Handle password
    if (property.format === 'password') {
      return (
        <div key={key}>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
            {isRequired && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input
            type="password"
            value={String(value)}
            onChange={(e) => handleInputChange(key, e.target.value)}
            placeholder={property.description}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
            onChange={(e) => handleInputChange(key, e.target.value === '' ? '' : Number(e.target.value))}
            placeholder={property.default?.toString() || property.description}
            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
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
          onChange={(e) => handleInputChange(key, e.target.value)}
          placeholder={property.default?.toString() || property.description}
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
        />
      </div>
    );
  };

  // Render dynamic form based on schema
  const renderDynamicForm = () => {
    if (!selectedSource) return null;

    const schema = selectedSource.connection_params_schema;
    const properties = schema.properties || schema;
    const required = schema.required || [];

    // Preserve original order from backend schema
    const keys = Object.keys(properties);

    return (
      <div className="space-y-6">
        {keys.map(key => {
          const property = properties[key];
          const isRequired = required.includes(key);
          return renderFormField(key, property, isRequired);
        })}
      </div>
    );
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

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-500">Loading connection types...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Failed to load</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}

        {/* Step 1: Selection */}
        {!isLoading && !error && step === 1 && (
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
                      <category.icon className={clsx(
                        "w-5 h-5",
                        category.id === 'metadata' ? 'text-blue-500' : 'text-purple-500'
                      )} />
                      {category.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{category.description}</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.sources.map((source) => (
                      <button
                        key={source.id}
                        onClick={() => handleSourceSelect(source)}
                        className="flex items-start p-4 text-left rounded-xl transition-all bg-white dark:bg-zinc-900 group relative overflow-hidden border-2 hover:shadow-lg"
                        style={{ 
                          borderColor: `${source.color_hex}40`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = source.color_hex;
                          e.currentTarget.style.boxShadow = `0 0 0 1px ${source.color_hex}`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = `${source.color_hex}40`;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center mb-3 group-hover:scale-110 transition-transform p-2 border-2"
                          style={{ 
                            borderColor: source.color_hex,
                            backgroundColor: `${source.color_hex}10`
                          }}
                        >
                          <Image 
                            src={getIconSrc(source.icon)} 
                            alt={source.name} 
                            width={24} 
                            height={24} 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              // Fallback to a default icon on error
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                        <div className="ml-3 z-10">
                          <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                            {getDisplayName(source.name)}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2">{source.description}</p>
                        </div>
                      </button>
                    ))}
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
        {!isLoading && !error && step === 2 && selectedSource && (
          <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl p-8 shadow-sm animate-in fade-in zoom-in-95 duration-300">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100 dark:border-zinc-800">
              <div 
                className="w-12 h-12 rounded-lg flex items-center justify-center border-2 p-2"
                style={{ 
                  borderColor: selectedSource.color_hex,
                  backgroundColor: `${selectedSource.color_hex}10`
                }}
              >
                <Image 
                  src={getIconSrc(selectedSource.icon)} 
                  alt={selectedSource.name} 
                  width={32} 
                  height={32} 
                  className="w-full h-full object-contain" 
                />
              </div>
              <div>
                <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                  Configure {getDisplayName(selectedSource.name)}
                </h2>
                <p className="text-sm text-gray-500">{selectedSource.description}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Connection Name (always first) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Connection Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  value={connectionName}
                  onChange={(e) => {
                    setConnectionName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="My Data Source"
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>

              {/* Dynamic Form Fields */}
              {renderDynamicForm()}
            </div>

            {/* Form Error */}
            {formError && (
              <div className="mt-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{formError}</span>
              </div>
            )}

            {/* Test Connection Feedback */}
            {testResult && !formError && (
              <div className={clsx(
                "mt-6 p-4 rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2",
                testResult === 'success' ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400" : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
              )}>
                {testResult === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                <span className="text-sm font-medium">
                  {testResult === 'success' ? "Connection established successfully!" : "Failed to connect. Check credentials."}
                </span>
              </div>
            )}

            <div className="mt-8 flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-zinc-800">
              <button
                onClick={() => {
                  setStep(1);
                  setSelectedSource(null);
                  setTestResult(null);
                  setFormError(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleTestConnection}
                disabled={isTesting}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Test Connection
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
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
