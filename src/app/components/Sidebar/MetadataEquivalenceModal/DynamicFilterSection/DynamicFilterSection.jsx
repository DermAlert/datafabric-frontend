import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Plus, 
  Trash2, Save, Info, Edit, PlusCircle, X, 
  ArrowRight, AlertTriangle, CheckCircle, Database 
} from 'lucide-react';
import styles from './DynamicFilterSection.module.css';
import ConnectionExplorer from '../ConnectionExplorer/ConnectionExplorer';
import {
  api_getSemanticDomains,
  api_searchDataDictionary,
  api_getColumnGroups,
  api_postColumnGroup,
  api_putColumnGroup,
  api_deleteColumnGroup,
  api_searchColumnGroups,
  api_getColumnGroup,
  api_getAvailableColumns,
  api_postColumnMapping,
  api_putColumnMapping,
  api_deleteColumnMapping,
  api_searchColumnMappings,
  api_postValueMapping,
  api_putValueMapping,
  api_deleteValueMapping,
  api_getValueMappingsByGroup
} from '../../EquivalenceManagerModal/api';

export default function DynamicFilterSection() {
  // Data sources - now dynamic from APIs
  const [dataSources, setDataSources] = useState([]);
  const [domains, setDomains] = useState([]);
  const [dictTerms, setDictTerms] = useState([]);
  const [columnGroups, setColumnGroups] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  
  // UI state matching original FilterSection
  const [expandedSources, setExpandedSources] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [selectedField, setSelectedField] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  
  // Field definitions - now dynamic from column groups and available columns
  const [fieldDefinitions, setFieldDefinitions] = useState({});
  
  // Equivalences - now based on column mappings
  const [equivalences, setEquivalences] = useState({});
  
  // Modal states matching original
  const [newFieldForm, setNewFieldForm] = useState({
    name: '',
    description: '',
    type: 'string',
    isModalOpen: false
  });
  
  const [newSourceForm, setNewSourceForm] = useState({
    id: '',
    name: '',
    description: '',
    isModalOpen: false
  });

  // Connection explorer state
  const [showConnectionExplorer, setShowConnectionExplorer] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [selectedTable, setSelectedTable] = useState(null);

  // Loading and error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load semantic domains and dictionary terms
      const [domainsData, dictData] = await Promise.all([
        api_getSemanticDomains().catch(() => []),
        api_searchDataDictionary({ 
          pagination: { limit: 1000, query_total: false, skip: 0 } 
        }).then(d => d.items || []).catch(() => [])
      ]);
      
      setDomains(domainsData);
      setDictTerms(dictData);

      // Create data sources from domains and dictionary terms
      const sources = [
        {
          id: 'semantic_domains',
          name: 'Semantic Domains',
          type: 'reference',
          description: 'Semantic domain definitions for data classification'
        },
        {
          id: 'dictionary_terms',
          name: 'Dictionary Terms',
          type: 'reference',
          description: 'Data dictionary terms and definitions'
        },
        {
          id: 'column_groups',
          name: 'Column Groups',
          type: 'integrated',
          description: 'Personalized column groups for data mapping'
        },
        {
          id: 'available_columns',
          name: 'Available Columns',
          type: 'user',
          description: 'Columns from selected database connections'
        }
      ];

      setDataSources(sources);

      // Initialize expanded sources
      const initialExpanded = {};
      sources.forEach(source => {
        initialExpanded[source.id] = source.id === 'column_groups';
      });
      setExpandedSources(initialExpanded);

      // Initialize search terms
      const initialSearchTerms = {};
      sources.forEach(source => {
        initialSearchTerms[source.id] = '';
      });
      setSearchTerms(initialSearchTerms);

      // Load field definitions
      await loadFieldDefinitions(sources);
      
      // Load column groups
      await loadColumnGroups();

    } catch (e) {
      setError('Failed to load initial data: ' + e.message);
    }
    setLoading(false);
  };

  const loadFieldDefinitions = async (sources) => {
    const definitions = {};

    // Semantic domains fields
    definitions['semantic_domains'] = domains.map(domain => ({
      name: domain.name || `domain_${domain.id}`,
      description: domain.description || 'Semantic domain',
      type: 'string',
      id: domain.id
    }));

    // Dictionary terms fields
    definitions['dictionary_terms'] = dictTerms.map(term => ({
      name: term.name || `term_${term.id}`,
      description: term.description || 'Dictionary term',
      type: 'string',
      id: term.id
    }));

    // Column groups fields
    const groups = await api_getColumnGroups().catch(() => []);
    definitions['column_groups'] = groups.map(group => ({
      name: group.name || `group_${group.id}`,
      description: group.description || 'Column group',
      type: 'group',
      id: group.id,
      userDefined: true
    }));

    // Available columns fields (initially empty)
    definitions['available_columns'] = [];

    setFieldDefinitions(definitions);
  };

  const loadColumnGroups = async () => {
    try {
      const groups = await api_getColumnGroups();
      setColumnGroups(groups);
    } catch (e) {
      console.error('Failed to load column groups:', e);
    }
  };

  const loadAvailableColumns = async () => {
    if (!selectedConnection || !selectedSchema || !selectedTable) {
      return;
    }

    try {
      const response = await api_getAvailableColumns({
        connection_id: selectedConnection.id,
        schema_id: selectedSchema.id,
        table_id: selectedTable.id,
        exclude_mapped: true
      });
      
      const columns = response.columns || [];
      const columnFields = columns.map(column => ({
        name: column.column_name,
        description: column.description || `Column from ${selectedTable.table_name}`,
        type: column.data_type,
        id: column.id,
        nullable: column.is_nullable
      }));

      setFieldDefinitions(prev => ({
        ...prev,
        'available_columns': columnFields
      }));

      setAvailableColumns(columns);
    } catch (e) {
      console.error('Failed to load available columns:', e);
    }
  };

  // Effect to load columns when connection changes
  useEffect(() => {
    loadAvailableColumns();
  }, [selectedConnection, selectedSchema, selectedTable]);

  // Compute all equivalences (transitive closure)
  const allEquivalences = useMemo(() => {
    let result = { ...equivalences };
    let changed = true;
    
    while (changed) {
      changed = false;
      
      Object.entries(result).forEach(([sourceFieldKey, targetFields]) => {
        const [sourceId, fieldName] = sourceFieldKey.split('.');
        
        targetFields.forEach(target => {
          const targetKey = `${target.sourceId}.${target.fieldName}`;
          
          if (result[targetKey]) {
            result[targetKey].forEach(transitiveTarget => {
              const exists = result[sourceFieldKey].some(
                existing => 
                  existing.sourceId === transitiveTarget.sourceId && 
                  existing.fieldName === transitiveTarget.fieldName
              );
              
              if (!exists && !(sourceId === transitiveTarget.sourceId && fieldName === transitiveTarget.fieldName)) {
                result[sourceFieldKey] = [
                  ...result[sourceFieldKey],
                  transitiveTarget
                ];
                changed = true;
              }
            });
          }
          
          if (!result[targetKey]) {
            result[targetKey] = [{ sourceId, fieldName }];
            changed = true;
          } else {
            const exists = result[targetKey].some(
              existing => existing.sourceId === sourceId && existing.fieldName === fieldName
            );
            
            if (!exists) {
              result[targetKey] = [
                ...result[targetKey],
                { sourceId, fieldName }
              ];
              changed = true;
            }
          }
        });
      });
    }
    
    return result;
  }, [equivalences]);

  // UI interaction handlers (matching original FilterSection)
  const toggleSourceExpanded = (sourceId) => {
    setExpandedSources(prev => ({
      ...prev,
      [sourceId]: !prev[sourceId]
    }));
  };
  
  const handleSearchChange = (sourceId, term) => {
    setSearchTerms(prev => ({
      ...prev,
      [sourceId]: term
    }));
  };
  
  const handleSelectField = (sourceId, fieldName) => {
    setSelectedField(fieldName);
    setSelectedSource(sourceId);
  };
  
  const getFilteredFields = (sourceId) => {
    const term = searchTerms[sourceId]?.toLowerCase() || '';
    return (fieldDefinitions[sourceId] || []).filter(field => 
      field.name.toLowerCase().includes(term) || 
      field.description.toLowerCase().includes(term)
    );
  };
  
  const addEquivalence = (sourceId, fieldName, targetSourceId, targetFieldName) => {
    const sourceKey = `${sourceId}.${fieldName}`;
    
    setEquivalences(prev => {
      const newEquivalences = { ...prev };
      
      if (!newEquivalences[sourceKey]) {
        newEquivalences[sourceKey] = [{ sourceId: targetSourceId, fieldName: targetFieldName }];
      } else {
        const exists = newEquivalences[sourceKey].some(
          existing => existing.sourceId === targetSourceId && existing.fieldName === targetFieldName
        );
        
        if (!exists) {
          newEquivalences[sourceKey] = [
            ...newEquivalences[sourceKey],
            { sourceId: targetSourceId, fieldName: targetFieldName }
          ];
        }
      }
      
      return newEquivalences;
    });
  };
  
  const removeEquivalence = (sourceId, fieldName, targetSourceId, targetFieldName) => {
    const sourceKey = `${sourceId}.${fieldName}`;
    
    setEquivalences(prev => {
      if (!prev[sourceKey]) return prev;
      
      const updatedEquivalences = prev[sourceKey].filter(
        item => !(item.sourceId === targetSourceId && item.fieldName === targetFieldName)
      );
      
      if (updatedEquivalences.length === 0) {
        const newEquivalences = { ...prev };
        delete newEquivalences[sourceKey];
        return newEquivalences;
      } else {
        return {
          ...prev,
          [sourceKey]: updatedEquivalences
        };
      }
    });
  };
  
  const isEquivalent = (sourceId, fieldName, targetSourceId, targetFieldName) => {
    const sourceKey = `${sourceId}.${fieldName}`;
    return allEquivalences[sourceKey]?.some(
      item => item.sourceId === targetSourceId && item.fieldName === targetFieldName
    ) || false;
  };
  
  const getEquivalentFields = (sourceId, fieldName) => {
    const sourceKey = `${sourceId}.${fieldName}`;
    return allEquivalences[sourceKey] || [];
  };

  // Add new field (for column groups)
  const addNewField = async (sourceId) => {
    const { name, description, type } = newFieldForm;
    
    if (!name.trim()) {
      alert('Field name is required');
      return;
    }
    
    // Check for duplicate field names
    if (fieldDefinitions[sourceId]?.some(field => field.name === name)) {
      alert('A field with this name already exists');
      return;
    }

    try {
      if (sourceId === 'column_groups') {
        // Create a new column group
        const newGroup = await api_postColumnGroup({
          name,
          description,
          properties: { type }
        });

        // Update field definitions
        setFieldDefinitions(prev => ({
          ...prev,
          [sourceId]: [
            ...prev[sourceId],
            { 
              name, 
              description, 
              type: 'group', 
              id: newGroup.id,
              userDefined: true 
            }
          ]
        }));

        // Reload column groups
        await loadColumnGroups();
      } else {
        // For other sources, just add to field definitions
        setFieldDefinitions(prev => ({
          ...prev,
          [sourceId]: [
            ...prev[sourceId],
            { name, description, type, userDefined: true }
          ]
        }));
      }
    } catch (e) {
      alert('Failed to create field: ' + e.message);
      return;
    }
    
    setNewFieldForm({
      name: '',
      description: '',
      type: 'string',
      isModalOpen: false
    });
  };

  // Add new source
  const addNewSource = () => {
    const { id, name, description } = newSourceForm;
    
    if (!id.trim() || !name.trim()) {
      alert('Source ID and name are required');
      return;
    }
    
    if (dataSources.some(source => source.id === id)) {
      alert('A source with this ID already exists');
      return;
    }
    
    setDataSources(prev => [
      ...prev,
      {
        id,
        name,
        type: 'user',
        description: description || 'User-defined data source'
      }
    ]);
    
    setFieldDefinitions(prev => ({
      ...prev,
      [id]: []
    }));
    
    setExpandedSources(prev => ({
      ...prev,
      [id]: true
    }));
    
    setSearchTerms(prev => ({
      ...prev,
      [id]: ''
    }));
    
    // Reset the form
    setNewSourceForm({
      id: '',
      name: '',
      description: '',
      isModalOpen: false
    });
  };

  // Save equivalences
  const saveEquivalences = async () => {
    try {
      // Here you would save the equivalences using your APIs
      // For now, just log them
      console.log('Saving equivalences:', allEquivalences);
      alert('Equivalences saved successfully!');
    } catch (e) {
      alert('Failed to save equivalences: ' + e.message);
    }
  };

  // Remove user field
  const removeUserField = async (sourceId, fieldName) => {
    try {
      // Find the field to get its ID
      const field = fieldDefinitions[sourceId]?.find(f => f.name === fieldName);
      
      if (sourceId === 'column_groups' && field?.id) {
        // Delete the column group via API
        await api_deleteColumnGroup(field.id);
        await loadColumnGroups();
      }

      // Remove from field definitions
      setFieldDefinitions(prev => ({
        ...prev,
        [sourceId]: prev[sourceId].filter(field => field.name !== fieldName)
      }));
      
      // Remove from equivalences
      const sourceKey = `${sourceId}.${fieldName}`;
      setEquivalences(prev => {
        const newEquivalences = { ...prev };
        
        if (newEquivalences[sourceKey]) {
          delete newEquivalences[sourceKey];
        }
        
        Object.keys(newEquivalences).forEach(key => {
          newEquivalences[key] = newEquivalences[key].filter(
            item => !(item.sourceId === sourceId && item.fieldName === fieldName)
          );
          
          if (newEquivalences[key].length === 0) {
            delete newEquivalences[key];
          }
        });
        
        return newEquivalences;
      });
    } catch (e) {
      alert('Failed to remove field: ' + e.message);
    }
  };

  // Connection selection handler
  const handleConnectionSelect = (selectionData) => {
    setSelectedConnection(selectionData.connection);
    setSelectedSchema(selectionData.schema);
    setSelectedTable(selectionData.table);
    setShowConnectionExplorer(false);
  };

  if (loading) {
    return (
      <div className={styles.metadataEquivalenceContainer}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.metadataEquivalenceContainer}>
        <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>
          <AlertTriangle size={24} />
          <div>{error}</div>
          <button onClick={loadInitialData} style={{ marginTop: '1rem' }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.metadataEquivalenceContainer}>
      {/* Header */}
      <div className={styles.metadataHeader}>
        <div className={styles.metadataHeaderLeft}>
          <h2 className={styles.metadataTitle}>Metadata Equivalence</h2>
          <div className={styles.metadataBadges}>
            <span className={styles.sourceCount}>
              {dataSources.length} Sources
            </span>
            <span className={styles.equivalenceCount}>
              {Object.keys(allEquivalences).length} Equivalences
            </span>
          </div>
        </div>
        <div className={styles.metadataActions}>
          <button 
            className={styles.addSourceButton}
            onClick={() => setShowConnectionExplorer(true)}
          >
            <Database className={styles.actionIcon} />
            <span>Explore Connections</span>
          </button>
          <button 
            className={styles.addSourceButton}
            onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: true }))}
          >
            <Database className={styles.actionIcon} />
            <span>New Source</span>
          </button>
          <button 
            className={styles.saveButton}
            onClick={saveEquivalences}
          >
            <Save className={styles.actionIcon} />
            <span>Save Equivalences</span>
          </button>
        </div>
      </div>
      
      {/* Description */}
      <div className={styles.metadataDescription}>
        <Info className={styles.infoIcon} />
        <div>
          <p className={styles.descriptionText}>
            Select fields in any data source to define equivalences with fields in other sources.
            Equivalences are transitive: if A≡B and B≡C, then A≡C.
          </p>
          <p className={styles.descriptionTip}>
            <strong>Tip:</strong> Create custom fields in "Column Groups" and define their equivalences.
          </p>
        </div>
      </div>

      {/* Connection Info */}
      {selectedConnection && (
        <div className={styles.metadataDescription}>
          <Database className={styles.infoIcon} />
          <div>
            <p className={styles.descriptionText}>
              <strong>Selected Connection:</strong> {selectedConnection.name} → {selectedSchema?.schema_name} → {selectedTable?.table_name}
            </p>
          </div>
        </div>
      )}
      
      {/* Sources and Fields Grid */}
      <div className={styles.sourcesGrid}>
        {dataSources.map(source => (
          <div key={source.id} className={styles.sourceBlock}>
            <div 
              className={`${styles.sourceHeader} ${source.type === 'user' ? styles.sourceHeaderUser : ''}`}
              onClick={() => toggleSourceExpanded(source.id)}
            >
              <div className={styles.sourceTitle}>
                {expandedSources[source.id] ? 
                  <ChevronDown className={styles.chevronIcon} /> : 
                  <ChevronRight className={styles.chevronIcon} />
                }
                <h3 className={styles.sourceName}>{source.name}</h3>
                {source.type === 'user' && (
                  <span className={styles.userSourceBadge}>Custom</span>
                )}
              </div>
            </div>
            
            {expandedSources[source.id] && (
              <div className={styles.sourceContent}>
                <div className={styles.sourceDescription}>
                  {source.description}
                </div>
                
                <div className={styles.searchAndActionsContainer}>
                  <div className={styles.searchContainer}>
                    <Search className={styles.searchIcon} />
                    <input
                      type="text"
                      className={styles.searchInput}
                      placeholder="Search fields..."
                      value={searchTerms[source.id] || ''}
                      onChange={(e) => handleSearchChange(source.id, e.target.value)}
                    />
                  </div>
                  
                  {(source.type === 'user' || source.id === 'column_groups') && (
                    <button 
                      className={styles.addFieldButton}
                      onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: true }))}
                    >
                      <Plus className={styles.addFieldIcon} />
                      <span>Add Field</span>
                    </button>
                  )}
                </div>
                
                <div className={styles.fieldsList}>
                  {getFilteredFields(source.id).length > 0 ? (
                    getFilteredFields(source.id).map(field => {
                      const isSelected = selectedSource === source.id && selectedField === field.name;
                      const equivalentFields = getEquivalentFields(source.id, field.name);
                      const hasEquivalences = equivalentFields.length > 0;
                      
                      return (
                        <div 
                          key={field.name}
                          className={`${styles.fieldItem} ${isSelected ? styles.fieldItemSelected : ''} ${hasEquivalences ? styles.fieldItemHasEquivalences : ''} ${field.userDefined ? styles.fieldItemUserDefined : ''}`}
                          onClick={() => handleSelectField(source.id, field.name)}
                        >
                          <div className={styles.fieldHeader}>
                            <div className={styles.fieldNameAndType}>
                              <span className={styles.fieldName}>{field.name}</span>
                              <span className={styles.fieldType}>{field.type}</span>
                            </div>
                            
                            {field.userDefined && (
                              <button 
                                className={styles.removeFieldButton}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeUserField(source.id, field.name);
                                }}
                                title="Remove field"
                              >
                                <Trash2 className={styles.removeIcon} />
                              </button>
                            )}
                          </div>
                          
                          <div className={styles.fieldDescription}>{field.description}</div>
                          
                          {hasEquivalences && (
                            <div className={styles.equivalencesList}>
                              {equivalentFields.map((equiv, index) => (
                                <div key={`${equiv.sourceId}-${equiv.fieldName}`} className={styles.equivalenceItem}>
                                  <span className={styles.equivalenceSourceName}>
                                    {dataSources.find(s => s.id === equiv.sourceId)?.name || equiv.sourceId}
                                  </span>
                                  <ArrowRight className={styles.equivalenceArrow} />
                                  <span className={styles.equivalenceFieldName}>{equiv.fieldName}</span>
                                  
                                  <button 
                                    className={styles.removeEquivalenceButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeEquivalence(source.id, field.name, equiv.sourceId, equiv.fieldName);
                                    }}
                                    title="Remove equivalence"
                                  >
                                    <X className={styles.removeEquivalenceIcon} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className={styles.noFieldsMessage}>
                      {searchTerms[source.id] ? (
                        <div>
                          <AlertTriangle className={styles.noFieldsIcon} />
                          <p>No fields found for "{searchTerms[source.id]}"</p>
                        </div>
                      ) : source.type === 'user' || source.id === 'column_groups' ? (
                        <div>
                          <PlusCircle className={styles.noFieldsIcon} />
                          <p>Add custom fields using the button above</p>
                        </div>
                      ) : source.id === 'available_columns' && !selectedConnection ? (
                        <div>
                          <Database className={styles.noFieldsIcon} />
                          <p>Select a connection to view available columns</p>
                        </div>
                      ) : (
                        <div>
                          <AlertTriangle className={styles.noFieldsIcon} />
                          <p>No fields defined in this source</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Selected Field Equivalence UI */}
      {selectedSource && selectedField && (
        <div className={styles.equivalenceBuilder}>
          <div className={styles.equivalenceBuilderHeader}>
            <div className={styles.selectedFieldInfo}>
              <h4 className={styles.selectedFieldTitle}>
                Selected Field: 
                <span className={styles.selectedFieldName}>
                  {dataSources.find(s => s.id === selectedSource)?.name} → {selectedField}
                </span>
              </h4>
              <p className={styles.selectedFieldDescription}>
                {fieldDefinitions[selectedSource]?.find(f => f.name === selectedField)?.description || 'No description available'}
              </p>
            </div>
            
            <button 
              className={styles.closeSelectionButton}
              onClick={() => {
                setSelectedSource(null);
                setSelectedField(null);
              }}
            >
              <X className={styles.closeSelectionIcon} />
            </button>
          </div>
          
          <div className={styles.equivalenceBuilderContent}>
            <div className={styles.equivalenceInstructions}>
              <p>Select fields in other sources to establish equivalence with the current field.</p>
            </div>
            
            <div className={styles.sourceEquivalenceCards}>
              {dataSources
                .filter(source => source.id !== selectedSource)
                .map(source => (
                  <div key={source.id} className={styles.sourceEquivalenceCard}>
                    <div className={styles.sourceEquivalenceCardHeader}>
                      <h5 className={styles.sourceEquivalenceCardTitle}>{source.name}</h5>
                      <span className={styles.sourceEquivalenceCount}>
                        {getEquivalentFields(selectedSource, selectedField)
                          .filter(equiv => equiv.sourceId === source.id)
                          .length} equivalent fields
                      </span>
                    </div>
                    
                    <div className={styles.sourceEquivalenceCardContent}>
                      <div className={styles.equivalenceSearchContainer}>
                        <Search className={styles.equivalenceSearchIcon} />
                        <input
                          type="text"
                          className={styles.equivalenceSearchInput}
                          placeholder="Search fields for equivalence..."
                          value={searchTerms[source.id] || ''}
                          onChange={(e) => handleSearchChange(source.id, e.target.value)}
                        />
                      </div>
                      
                      <div className={styles.equivalenceFieldsList}>
                        {getFilteredFields(source.id).map(field => {
                          const isEquiv = isEquivalent(selectedSource, selectedField, source.id, field.name);
                          
                          return (
                            <div 
                              key={field.name}
                              className={`${styles.equivalenceFieldItem} ${isEquiv ? styles.equivalenceFieldItemSelected : ''}`}
                              onClick={() => {
                                if (isEquiv) {
                                  removeEquivalence(selectedSource, selectedField, source.id, field.name);
                                } else {
                                  addEquivalence(selectedSource, selectedField, source.id, field.name);
                                }
                              }}
                            >
                              <div className={styles.equivalenceFieldItemContent}>
                                <div className={styles.equivalenceFieldNameAndType}>
                                  <span className={styles.equivalenceFieldName}>{field.name}</span>
                                  <span className={styles.equivalenceFieldType}>{field.type}</span>
                                </div>
                                
                                {isEquiv ? (
                                  <CheckCircle className={styles.equivalenceSelectedIcon} />
                                ) : (
                                  <PlusCircle className={styles.equivalenceAddIcon} />
                                )}
                              </div>
                              
                              <div className={styles.equivalenceFieldDescription}>
                                {field.description}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for adding new fields */}
      {newFieldForm.isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Add New Field</h4>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Field Name *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., custom_score"
                  value={newFieldForm.name}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className={styles.formHint}>Use descriptive names without spaces (snake_case)</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., Custom severity score"
                  value={newFieldForm.description}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className={styles.formHint}>Brief description of the field and its purpose</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Data Type</label>
                <select
                  className={styles.formSelect}
                  value={newFieldForm.type}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="string">Text (string)</option>
                  <option value="integer">Integer Number (integer)</option>
                  <option value="float">Decimal Number (float)</option>
                  <option value="boolean">Boolean (boolean)</option>
                  <option value="date">Date (date)</option>
                  <option value="datetime">Date and Time (datetime)</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                Cancel
              </button>
              <button 
                className={styles.submitButton}
                onClick={() => addNewField('column_groups')}
              >
                Add Field
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Modal for adding new data source */}
      {newSourceForm.isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Add New Data Source</h4>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Source ID *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., CustomSource1"
                  value={newSourceForm.id}
                  onChange={(e) => setNewSourceForm(prev => ({ ...prev, id: e.target.value }))}
                />
                <div className={styles.formHint}>Unique ID used internally (no spaces)</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Source Name *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="e.g., Custom Data Source"
                  value={newSourceForm.name}
                  onChange={(e) => setNewSourceForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className={styles.formHint}>Display name of the data source</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <textarea 
                  className={styles.formTextarea}
                  placeholder="e.g., Custom data source for specific analyses"
                  value={newSourceForm.description}
                  onChange={(e) => setNewSourceForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                Cancel
              </button>
              <button 
                className={styles.submitButton}
                onClick={addNewSource}
              >
                Create Data Source
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Explorer Modal */}
      <ConnectionExplorer
        isOpen={showConnectionExplorer}
        onClose={() => setShowConnectionExplorer(false)}
        onColumnSelect={handleConnectionSelect}
      />
    </div>
  );
}

