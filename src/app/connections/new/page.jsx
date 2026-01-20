'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/DashboardLayout/DashboardLayout';
import { 
  ArrowLeft, Database, Cloud, HardDrive, Check, ChevronRight, 
  Loader2, CheckCircle2, AlertTriangle, Search, X, Info
} from 'lucide-react';
import { clsx } from 'clsx';
import styles from './page.module.css';

// Default organization ID (you might want to pull this from auth context later)
const ORGANIZATION_ID = 1;

export default function NewConnectionPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data State
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [selectedType, setSelectedType] = useState(null);
  
  // Form State
  const [basicData, setBasicData] = useState({
    name: '',
    description: '',
    cron_expression: '', // Optional
  });
  
  // Dynamic params based on schema
  const [connectionParams, setConnectionParams] = useState({});

  // UI State
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [saveError, setSaveError] = useState(null);

  // Fetch Connection Types on Mount
  useEffect(() => {
    async function fetchTypes() {
      try {
        const res = await fetch('http://localhost:8004/api/connection/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagination: { limit: 100, query_total: false, skip: 0 }
          })
        });
        const data = await res.json();
        setConnectionTypes(data.items || []);
      } catch (e) {
        console.error("Failed to load connection types", e);
      } finally {
        setLoadingTypes(false);
      }
    }
    fetchTypes();
  }, []);

  // Categorize types for display
  const metadataTypes = connectionTypes.filter(t => t.metadata_extraction_method !== 'none');
  const storageTypes = connectionTypes.filter(t => t.metadata_extraction_method === 'none');

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    
    // Initialize params with defaults from schema
    const initialParams = {};
    if (type.connection_params_schema?.properties) {
      Object.entries(type.connection_params_schema.properties).forEach(([key, prop]) => {
        if (prop.default !== undefined) {
          initialParams[key] = prop.default;
        } else {
          initialParams[key] = prop.type === 'boolean' ? false : '';
        }
      });
    }
    setConnectionParams(initialParams);
    setStep(2);
  };

  const handleBasicChange = (e) => {
    setBasicData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleParamChange = (key, value) => {
    setConnectionParams(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const payload = {
        name: basicData.name,
        description: basicData.description,
        connection_type_id: selectedType.id,
        connection_params: connectionParams,
        content_type: selectedType.metadata_extraction_method === 'none' ? 'image' : 'metadata',
        cron_expression: basicData.cron_expression || null,
        sync_settings: {}, // Default empty settings
        organization_id: ORGANIZATION_ID
      };

      const res = await fetch('http://localhost:8004/api/data-connections/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to create connection");
      }

      // Success
      router.push('/connections');
    } catch (err) {
      setSaveError(err.message);
      setIsSaving(false);
    }
  };

  // Helper to determine input type from schema property
  const renderField = (key, prop, required) => {
    const isSecret = key.toLowerCase().includes('password') || key.toLowerCase().includes('secret') || key.toLowerCase().includes('key');
    
    if (prop.type === 'boolean') {
      return (
        <div key={key} className={styles.fieldGroup} style={{flexDirection: 'row', alignItems: 'center', gap: '0.5rem'}}>
          <input
            type="checkbox"
            checked={!!connectionParams[key]}
            onChange={(e) => handleParamChange(key, e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className={styles.label} style={{marginBottom: 0}}>
            {prop.title || key} {required && <span className={styles.required}>*</span>}
          </label>
        </div>
      );
    }

    return (
      <div key={key} className={styles.fieldGroup}>
        <label className={styles.label}>
          {prop.title || key} {required && <span className={styles.required}>*</span>}
        </label>
        <input
          type={isSecret ? "password" : "text"}
          value={connectionParams[key] || ''}
          onChange={(e) => handleParamChange(key, e.target.value)}
          placeholder={prop.description || ''}
          className={styles.input}
        />
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <Link href="/connections" className={styles.backLink}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Connections
          </Link>
          <h1 className={styles.pageTitle}>New Data Connection</h1>
          <p className={styles.pageSubtitle}>
            Step {step} of 2: {step === 1 ? 'Select Data Source' : 'Configure Connection'}
          </p>
        </div>

        {step === 1 && (
          <div className={styles.stepContent}>
            {loadingTypes ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className={styles.searchContainer}>
                  <Search className={styles.searchIcon} />
                  <input
                    type="text"
                    placeholder="Search data sources (e.g., Postgres, S3)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                  />
                </div>

                {/* Metadata Sources */}
                {metadataTypes.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <h2 className={styles.categoryTitle}>
                        <Database className={clsx("w-5 h-5", styles.iconBlue)} />
                        Relational & Metadata
                      </h2>
                      <p className={styles.categoryDesc}>Databases for structured data</p>
                    </div>
                    <div className={styles.sourceGrid}>
                      {metadataTypes
                        .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          className={styles.sourceCard}
                        >
                          <div className={styles.sourceIconWrapper}>
                             {/* You can map type.icon string to an actual icon component or image here */}
                             <Database className="w-6 h-6 text-gray-400" /> 
                          </div>
                          <div className={styles.sourceInfo}>
                            <h3 className={styles.sourceName}>{type.name}</h3>
                            <p className={styles.sourceDesc}>{type.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Storage Sources */}
                {storageTypes.length > 0 && (
                  <div className={styles.categorySection}>
                    <div className={styles.categoryHeader}>
                      <h2 className={styles.categoryTitle}>
                        <HardDrive className={clsx("w-5 h-5", styles.iconPurple)} />
                        Object Storage
                      </h2>
                      <p className={styles.categoryDesc}>Storage for unstructured data</p>
                    </div>
                    <div className={styles.sourceGrid}>
                      {storageTypes
                        .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map((type) => (
                        <button
                          key={type.id}
                          onClick={() => handleTypeSelect(type)}
                          className={styles.sourceCard}
                        >
                          <div className={styles.sourceIconWrapper}>
                             <Cloud className="w-6 h-6 text-gray-400" />
                          </div>
                          <div className={styles.sourceInfo}>
                            <h3 className={styles.sourceName}>{type.name}</h3>
                            <p className={styles.sourceDesc}>{type.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {step === 2 && selectedType && (
          <div className={styles.formContainer}>
            <div className={styles.formHeader}>
              <div className={styles.selectedIconBox}>
                <Database className={clsx("w-6 h-6", styles.iconBlue)} />
              </div>
              <div>
                <h2 className={styles.formTitle}>Configure {selectedType.name}</h2>
                <p className={styles.formSubtitle}>{selectedType.description}</p>
              </div>
            </div>

            <div className={styles.formFields}>
              {/* Basic Info */}
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Connection Name <span className={styles.required}>*</span></label>
                <input
                  name="name"
                  value={basicData.name}
                  onChange={handleBasicChange}
                  placeholder="My Connection"
                  className={styles.input}
                  autoFocus
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.label}>Description</label>
                <input
                  name="description"
                  value={basicData.description}
                  onChange={handleBasicChange}
                  placeholder="Optional description"
                  className={styles.input}
                />
              </div>

              {/* Dynamic Schema Fields */}
              <div className="border-t border-gray-100 dark:border-zinc-800 my-4 pt-4">
                 <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Connection Parameters</h3>
                 <div className={styles.rowGrid}>
                    {Object.entries(selectedType.connection_params_schema?.properties || {}).map(([key, prop]) => {
                      const required = selectedType.connection_params_schema?.required?.includes(key);
                      return renderField(key, prop, required);
                    })}
                 </div>
              </div>
            </div>

            {saveError && (
              <div className={clsx(styles.feedbackBox, styles.feedbackError)}>
                <AlertTriangle className="w-5 h-5" />
                <span className={styles.feedbackText}>{saveError}</span>
              </div>
            )}

            <div className={styles.formActions}>
              <button
                onClick={() => setStep(1)}
                className={styles.buttonBack}
                disabled={isSaving}
              >
                Back
              </button>
              {/* You can implement a Test Connection endpoint here if available */}
              <button
                onClick={handleSave}
                disabled={isSaving || !basicData.name}
                className={styles.buttonCreate}
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
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