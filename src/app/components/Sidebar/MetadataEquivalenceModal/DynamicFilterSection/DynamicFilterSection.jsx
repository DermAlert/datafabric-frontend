import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Plus, 
  Trash2, Save, Info, Edit, PlusCircle, X, 
  ArrowRight, AlertTriangle, CheckCircle, Database,
  Loader
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
  const [loadingItems, setLoadingItems] = useState({});
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const setItemLoading = (itemKey, isLoading) => {
    setLoadingItems(prev => ({
      ...prev,
      [itemKey]: isLoading
    }));
  };

  const isItemLoading = (itemKey) => {
    return !!loadingItems[itemKey];
  };

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Load semantic domains and dictionary terms
      const domainsPromise = api_getSemanticDomains().catch(err => {
        console.error('Failed to load domains:', err);
        return [];
      });
      
      const dictPromise = api_searchDataDictionary({ 
        pagination: { limit: 1000, query_total: false, skip: 0 } 
      }).catch(err => {
        console.error('Failed to load dictionary terms:', err);
        return { items: [] };
      });

      const [domainsData, dictData] = await Promise.all([domainsPromise, dictPromise]);
      
      setDomains(domainsData);
      setDictTerms(dictData.items || []);

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
      await loadFieldDefinitions(sources, domainsData, dictData.items || []);
      
      // Load column groups and existing mappings
      await loadColumnGroups();
      await loadExistingMappings();

    } catch (e) {
      console.error('Failed to load initial data:', e);
      setError('Failed to load initial data: ' + e.message);
    }
    setLoading(false);
  };

  const loadFieldDefinitions = async (sources, domainsData, dictTermsData) => {
    const definitions = {};

    // Semantic domains fields
    definitions['semantic_domains'] = domainsData.map(domain => ({
      name: domain.name || `domain_${domain.id}`,
      description: domain.description || 'Semantic domain',
      type: 'domain',
      id: domain.id
    }));

    // Dictionary terms fields
    definitions['dictionary_terms'] = dictTermsData.map(term => ({
      name: term.name || `term_${term.id}`,
      description: term.description || 'Dictionary term',
      type: term.data_type || 'string',
      id: term.id
    }));

    try {
      // Column groups fields
      const groups = await api_getColumnGroups().catch(() => []);
      definitions['column_groups'] = groups.map(group => ({
        name: group.name || `group_${group.id}`,
        description: group.description || 'Column group',
        type: group.properties?.type || 'group',
        id: group.id,
        userDefined: true
      }));
    } catch (e) {
      console.error('Failed to load column groups for field definitions:', e);
    }

    // Available columns fields (initially empty)
    definitions['available_columns'] = [];

    setFieldDefinitions(definitions);
  };

  const loadColumnGroups = async () => {
    setItemLoading('columnGroups', true);
    try {
      const groups = await api_getColumnGroups();
      setColumnGroups(groups);
      
      // Update field definitions for column groups
      setFieldDefinitions(prev => ({
        ...prev,
        'column_groups': groups.map(group => ({
          name: group.name || `group_${group.id}`,
          description: group.description || 'Column group',
          type: group.properties?.type || 'group',
          id: group.id,
          userDefined: true
        }))
      }));
      
    } catch (e) {
      console.error('Failed to load column groups:', e);
    }
    setItemLoading('columnGroups', false);
  };

  const loadExistingMappings = async () => {
    setItemLoading('mappings', true);
    try {
      // Get all column mappings
      const response = await api_searchColumnMappings({
        pagination: { limit: 1000, query_total: false, skip: 0 }
      });
      
      const mappings = response.items || [];
      
      const newEquivalences = {};
      
      for (const mapping of mappings) {
        try {
          // Get column group details
          const groupId = mapping.group_id;
          if (!groupId) continue;
          
          const group = columnGroups.find(g => g.id === groupId) || 
                        await api_getColumnGroup(groupId).catch(() => null);
                        
          if (!group) continue;
          
          const sourceKey = `column_groups.${group.name || `group_${group.id}`}`;
          
          // Handle column mapping
          if (mapping.column_id) {
            // Find column details in available columns
            const columnId = mapping.column_id;
            let column = availableColumns.find(c => c.id === columnId);
            
            if (!column && selectedTable) {
              // Try to get column details from the API
              try {
                const columnsResponse = await fetch(`http://localhost:8004/api/metadata/columns/${columnId}`);
                if (columnsResponse.ok) {
                  column = await columnsResponse.json();
                }
              } catch (err) {
                console.warn(`Could not fetch column ${columnId} details:`, err);
              }
            }
            
            if (column) {
              // Add column <-> group equivalence
              const columnKey = `available_columns.${column.column_name || `column_${column.id}`}`;
              
              // Group -> Column mapping
              if (!newEquivalences[sourceKey]) {
                newEquivalences[sourceKey] = [];
              }
              newEquivalences[sourceKey].push({
                sourceId: 'available_columns',
                fieldName: column.column_name || `column_${column.id}`,
                id: column.id
              });
              
              // Column -> Group mapping
              if (!newEquivalences[columnKey]) {
                newEquivalences[columnKey] = [];
              }
              newEquivalences[columnKey].push({
                sourceId: 'column_groups',
                fieldName: group.name || `group_${group.id}`,
                id: group.id
              });
            }
          }
          
          // Handle semantic domain mapping
          if (mapping.semantic_domain_id) {
            const domainId = mapping.semantic_domain_id;
            const domain = domains.find(d => d.id === domainId);
            
            if (domain) {
              const domainKey = `semantic_domains.${domain.name || `domain_${domain.id}`}`;
              
              // Group -> Domain mapping
              if (!newEquivalences[sourceKey]) {
                newEquivalences[sourceKey] = [];
              }
              newEquivalences[sourceKey].push({
                sourceId: 'semantic_domains',
                fieldName: domain.name || `domain_${domain.id}`,
                id: domain.id
              });
              
              // Domain -> Group mapping
              if (!newEquivalences[domainKey]) {
                newEquivalences[domainKey] = [];
              }
              newEquivalences[domainKey].push({
                sourceId: 'column_groups',
                fieldName: group.name || `group_${group.id}`,
                id: group.id
              });
            }
          }
          
          // Handle data dictionary term mapping
          if (mapping.data_dictionary_term_id) {
            const termId = mapping.data_dictionary_term_id;
            const term = dictTerms.find(t => t.id === termId);
            
            if (term) {
              const termKey = `dictionary_terms.${term.name || `term_${term.id}`}`;
              
              // Group -> Term mapping
              if (!newEquivalences[sourceKey]) {
                newEquivalences[sourceKey] = [];
              }
              newEquivalences[sourceKey].push({
                sourceId: 'dictionary_terms',
                fieldName: term.name || `term_${term.id}`,
                id: term.id
              });
              
              // Term -> Group mapping
              if (!newEquivalences[termKey]) {
                newEquivalences[termKey] = [];
              }
              newEquivalences[termKey].push({
                sourceId: 'column_groups',
                fieldName: group.name || `group_${group.id}`,
                id: group.id
              });
            }
          }
        } catch (err) {
          console.error('Error processing mapping:', err);
        }
      }
      
      setEquivalences(newEquivalences);
      
    } catch (e) {
      console.error('Failed to load existing mappings:', e);
    }
    setItemLoading('mappings', false);
  };

  const loadAvailableColumns = async () => {
    if (!selectedConnection || !selectedSchema || !selectedTable) {
      return;
    }

    setItemLoading('availableColumns', true);
    try {
      const response = await api_getAvailableColumns({
        connection_id: selectedConnection.id,
        schema_id: selectedSchema.id,
        table_id: selectedTable.id,
        exclude_mapped: false, // We want to see all columns now
        fl_ativo: true // Add active flag to match API pattern
      });
      
      const columns = response.columns || [];
      const columnFields = columns.map(column => ({
        name: column.column_name,
        description: column.description || `Column from ${selectedTable.table_name}`,
        type: column.data_type,
        id: column.id,
        nullable: column.is_nullable,
        connection_id: selectedConnection.id,
        schema_id: selectedSchema.id,
        table_id: selectedTable.id
      }));

      setFieldDefinitions(prev => ({
        ...prev,
        'available_columns': columnFields
      }));

      setAvailableColumns(columns);

      // Reload mappings to update with the newly loaded columns
      await loadExistingMappings();
      
    } catch (e) {
      console.error('Failed to load available columns:', e);
    }
    setItemLoading('availableColumns', false);
  };

  // Effect to load columns when connection changes
  useEffect(() => {
    if (selectedConnection && selectedSchema && selectedTable) {
      loadAvailableColumns();
    }
  }, [selectedConnection, selectedSchema, selectedTable]);

  // Compute all equivalences (transitive closure)
  const allEquivalences = useMemo(() => {
    let result = { ...equivalences };
    let changed = true;
    let iterations = 0;
    const MAX_ITERATIONS = 10; // Safety limit to prevent infinite loops
    
    while (changed && iterations < MAX_ITERATIONS) {
      iterations++;
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
            result[targetKey] = [{ sourceId, fieldName, id: sourceId === 'column_groups' ? fieldDefinitions[sourceId]?.find(f => f.name === fieldName)?.id : undefined }];
            changed = true;
          } else {
            const exists = result[targetKey].some(
              existing => existing.sourceId === sourceId && existing.fieldName === fieldName
            );
            
            if (!exists) {
              result[targetKey] = [
                ...result[targetKey],
                { sourceId, fieldName, id: sourceId === 'column_groups' ? fieldDefinitions[sourceId]?.find(f => f.name === fieldName)?.id : undefined }
              ];
              changed = true;
            }
          }
        });
      });
    }
    
    return result;
  }, [equivalences, fieldDefinitions]);

  // UI interaction handlers
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
      (field.description || '').toLowerCase().includes(term) ||
      (field.type || '').toLowerCase().includes(term)
    );
  };

  /**
   * Creates a new equivalence between two fields
   * Fixed to properly handle API request parameters
   */
  const addEquivalence = async (sourceId, fieldName, targetSourceId, targetFieldName) => {
    // Find the field objects
    const sourceField = fieldDefinitions[sourceId]?.find(f => f.name === fieldName);
    const targetField = fieldDefinitions[targetSourceId]?.find(f => f.name === targetFieldName);
    
    if (!sourceField || !targetField) {
      console.error('Could not find fields to create equivalence');
      return;
    }
    
    try {
      setItemLoading('addEquivalence', true);
      
      // Determine which side is the column group
      let groupId = null;
      let columnId = null;
      let semanticDomainId = null;
      let dataDictionaryTermId = null;
      
      if (sourceId === 'column_groups') {
        groupId = sourceField.id;
        
        if (targetSourceId === 'available_columns') {
          columnId = targetField.id;
        } else if (targetSourceId === 'semantic_domains') {
          semanticDomainId = targetField.id;
        } else if (targetSourceId === 'dictionary_terms') {
          dataDictionaryTermId = targetField.id;
        }
      } else if (targetSourceId === 'column_groups') {
        groupId = targetField.id;
        
        if (sourceId === 'available_columns') {
          columnId = sourceField.id;
        } else if (sourceId === 'semantic_domains') {
          semanticDomainId = sourceField.id;
        } else if (sourceId === 'dictionary_terms') {
          dataDictionaryTermId = sourceField.id;
        }
      } else {
        // For now, we're only supporting equivalences that involve column groups
        console.error('Equivalences must involve a column group');
        return;
      }
      
      // Only proceed if we have a column group involved
      if (!groupId) {
        console.error('No column group found for equivalence');
        return;
      }
      
      // Create API request body with proper parameter names
      const requestBody = {
        group_id: groupId  // Using group_id as expected by the API
      };
      
      if (columnId) requestBody.column_id = columnId;
      if (semanticDomainId) requestBody.semantic_domain_id = semanticDomainId;
      if (dataDictionaryTermId) requestBody.data_dictionary_term_id = dataDictionaryTermId;
      
      // Call the API with the proper request body
      await api_postColumnMapping(requestBody);
      
      // Update the UI state
      const sourceKey = `${sourceId}.${fieldName}`;
      
      setEquivalences(prev => {
        const newEquivalences = { ...prev };
        
        if (!newEquivalences[sourceKey]) {
          newEquivalences[sourceKey] = [{ 
            sourceId: targetSourceId, 
            fieldName: targetFieldName,
            id: targetField.id 
          }];
        } else {
          const exists = newEquivalences[sourceKey].some(
            existing => existing.sourceId === targetSourceId && existing.fieldName === targetFieldName
          );
          
          if (!exists) {
            newEquivalences[sourceKey] = [
              ...newEquivalences[sourceKey],
              { 
                sourceId: targetSourceId, 
                fieldName: targetFieldName,
                id: targetField.id 
              }
            ];
          }
        }
        
        // Add the reverse direction
        const targetKey = `${targetSourceId}.${targetFieldName}`;
        
        if (!newEquivalences[targetKey]) {
          newEquivalences[targetKey] = [{ 
            sourceId, 
            fieldName,
            id: sourceField.id 
          }];
        } else {
          const exists = newEquivalences[targetKey].some(
            existing => existing.sourceId === sourceId && existing.fieldName === fieldName
          );
          
          if (!exists) {
            newEquivalences[targetKey] = [
              ...newEquivalences[targetKey],
              { 
                sourceId, 
                fieldName,
                id: sourceField.id 
              }
            ];
          }
        }
        
        return newEquivalences;
      });
      
    } catch (e) {
      console.error('Failed to create mapping:', e);
      alert('Failed to create mapping: ' + e.message);
    } finally {
      setItemLoading('addEquivalence', false);
    }
  };
  
  /**
   * Removes an equivalence between two fields
   * Fixed to properly handle API request parameters
   */
  const removeEquivalence = async (sourceId, fieldName, targetSourceId, targetFieldName) => {
    // Find the field objects
    const sourceField = fieldDefinitions[sourceId]?.find(f => f.name === fieldName);
    const targetField = fieldDefinitions[targetSourceId]?.find(f => f.name === targetFieldName);
    
    if (!sourceField || !targetField) {
      console.error('Could not find fields to remove equivalence');
      return;
    }
    
    try {
      setItemLoading('removeEquivalence', true);
      
      // Determine which side is the column group
      let groupId = null;
      let columnId = null;
      let semanticDomainId = null;
      let dataDictionaryTermId = null;
      
      if (sourceId === 'column_groups') {
        groupId = sourceField.id;
        
        if (targetSourceId === 'available_columns') {
          columnId = targetField.id;
        } else if (targetSourceId === 'semantic_domains') {
          semanticDomainId = targetField.id;
        } else if (targetSourceId === 'dictionary_terms') {
          dataDictionaryTermId = targetField.id;
        }
      } else if (targetSourceId === 'column_groups') {
        groupId = targetField.id;
        
        if (sourceId === 'available_columns') {
          columnId = sourceField.id;
        } else if (sourceId === 'semantic_domains') {
          semanticDomainId = sourceField.id;
        } else if (sourceId === 'dictionary_terms') {
          dataDictionaryTermId = sourceField.id;
        }
      } else {
        // We only support equivalences involving column groups
        console.error('Equivalences must involve a column group');
        return;
      }
      
      // Create search parameters for finding the mapping
      const searchParams = {
        pagination: { limit: 1000, query_total: false, skip: 0 }
      };
      
      // Add the correct parameters for the search
      if (groupId) searchParams.group_id = groupId;
      if (columnId) searchParams.column_id = columnId;
      if (semanticDomainId) searchParams.semantic_domain_id = semanticDomainId;
      if (dataDictionaryTermId) searchParams.data_dictionary_term_id = dataDictionaryTermId;
      
      // Get mappings to find the one to delete
      const response = await api_searchColumnMappings(searchParams);
      const mappings = response.items || [];
      
      // Find the exact mapping to delete
      const mappingToDelete = mappings.find(mapping => 
        (mapping.group_id === groupId) && 
        (
          (columnId && mapping.column_id === columnId) ||
          (semanticDomainId && mapping.semantic_domain_id === semanticDomainId) ||
          (dataDictionaryTermId && mapping.data_dictionary_term_id === dataDictionaryTermId)
        )
      );
      
      if (mappingToDelete) {
        await api_deleteColumnMapping(mappingToDelete.id);
      } else {
        console.error('No mapping found to delete');
        return;
      }
      
      // Update the UI state
      const sourceKey = `${sourceId}.${fieldName}`;
      
      setEquivalences(prev => {
        const newEquivalences = { ...prev };
        
        // Remove target from source equivalences
        if (newEquivalences[sourceKey]) {
          newEquivalences[sourceKey] = newEquivalences[sourceKey].filter(
            item => !(item.sourceId === targetSourceId && item.fieldName === targetFieldName)
          );
          
          if (newEquivalences[sourceKey].length === 0) {
            delete newEquivalences[sourceKey];
          }
        }
        
        // Remove source from target equivalences
        const targetKey = `${targetSourceId}.${targetFieldName}`;
        if (newEquivalences[targetKey]) {
          newEquivalences[targetKey] = newEquivalences[targetKey].filter(
            item => !(item.sourceId === sourceId && item.fieldName === fieldName)
          );
          
          if (newEquivalences[targetKey].length === 0) {
            delete newEquivalences[targetKey];
          }
        }
        
        return newEquivalences;
      });
      
    } catch (e) {
      console.error('Failed to delete mapping:', e);
      alert('Failed to delete mapping: ' + e.message);
    } finally {
      setItemLoading('removeEquivalence', false);
    }
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

    setItemLoading('addField', true);
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
              type: type || 'group', 
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

      setNewFieldForm({
        name: '',
        description: '',
        type: 'string',
        isModalOpen: false
      });
    } catch (e) {
      console.error('Failed to create field:', e);
      alert('Failed to create field: ' + e.message);
    }
    setItemLoading('addField', false);
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
      setSaveStatus('saving');
      
      // We don't need to do anything here since we're saving individual equivalences
      // as they're created or removed, but we could implement a batch save here
      
      // For now, just reload all mappings to ensure UI is in sync with backend
      await loadExistingMappings();
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (e) {
      console.error('Failed to save equivalences:', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  // Remove user field
  const removeUserField = async (sourceId, fieldName) => {
    try {
      setItemLoading(`removeField-${fieldName}`, true);
      
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
      console.error('Failed to remove field:', e);
      alert('Failed to remove field: ' + e.message);
    } finally {
      setItemLoading(`removeField-${fieldName}`, false);
    }
  };

  // Connection selection handler
  const handleConnectionSelect = (selectionData) => {
    setSelectedConnection(selectionData.connection);
    setSelectedSchema(selectionData.schema);
    setSelectedTable(selectionData.table);
    setShowConnectionExplorer(false);
    
    // Ensure that the available_columns source is expanded
    setExpandedSources(prev => ({
      ...prev,
      available_columns: true
    }));
  };

  if (loading) {
    return (
      <div className={styles.metadataEquivalenceContainer}>
        <div className={styles.loadingState}>
          <Loader className={styles.loadingIcon} />
          <div className={styles.loadingText}>Loading metadata and equivalences...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.metadataEquivalenceContainer}>
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <div className={styles.errorText}>{error}</div>
          <button 
            onClick={loadInitialData} 
            className={styles.retryButton}
          >
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
            disabled={isItemLoading('any')}
          >
            <Database className={styles.actionIcon} />
            <span>Explore Connections</span>
          </button>
          <button 
            className={styles.addSourceButton}
            onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: true }))}
            disabled={isItemLoading('any')}
          >
            <PlusCircle className={styles.actionIcon} />
            <span>New Source</span>
          </button>
          <button 
            className={`${styles.saveButton} ${saveStatus ? styles[saveStatus] : ''}`}
            onClick={saveEquivalences}
            disabled={saveStatus === 'saving' || isItemLoading('any')}
          >
            {saveStatus === 'saving' ? (
              <Loader className={`${styles.actionIcon} ${styles.spinningIcon}`} />
            ) : saveStatus === 'success' ? (
              <CheckCircle className={styles.actionIcon} />
            ) : (
              <Save className={styles.actionIcon} />
            )}
            <span>
              {saveStatus === 'saving' ? 'Saving...' : 
               saveStatus === 'success' ? 'Saved!' : 
               saveStatus === 'error' ? 'Failed to Save' : 'Save Equivalences'}
            </span>
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
                      disabled={isItemLoading('addField')}
                    >
                      {isItemLoading('addField') ? (
                        <Loader className={`${styles.addFieldIcon} ${styles.spinningIcon}`} />
                      ) : (
                        <Plus className={styles.addFieldIcon} />
                      )}
                      <span>Add Field</span>
                    </button>
                  )}
                </div>
                
                <div className={styles.fieldsList}>
                  {source.id === 'available_columns' && !selectedConnection && (
                    <div className={styles.noFieldsMessage}>
                      <Database className={styles.noFieldsIcon} />
                      <p>Select a connection to view available columns</p>
                      <button 
                        className={styles.selectConnectionButton}
                        onClick={() => setShowConnectionExplorer(true)}
                      >
                        Select Connection
                      </button>
                    </div>
                  )}
                  
                  {isItemLoading('availableColumns') && source.id === 'available_columns' && (
                    <div className={styles.loadingFields}>
                      <Loader className={`${styles.loadingFieldsIcon} ${styles.spinningIcon}`} />
                      <p>Loading columns...</p>
                    </div>
                  )}
                  
                  {getFilteredFields(source.id).length > 0 ? (
                    getFilteredFields(source.id).map(field => {
                      const isSelected = selectedSource === source.id && selectedField === field.name;
                      const equivalentFields = getEquivalentFields(source.id, field.name);
                      const hasEquivalences = equivalentFields.length > 0;
                      const isFieldLoading = isItemLoading(`removeField-${field.name}`);
                      
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
                                disabled={isFieldLoading}
                              >
                                {isFieldLoading ? (
                                  <Loader className={`${styles.removeIcon} ${styles.spinningIcon}`} size={14} />
                                ) : (
                                  <Trash2 className={styles.removeIcon} />
                                )}
                              </button>
                            )}
                          </div>
                          
                          <div className={styles.fieldDescription}>{field.description}</div>
                          
                          {hasEquivalences && (
                            <div className={styles.equivalencesList}>
                              {equivalentFields.map((equiv, index) => (
                                <div key={`${equiv.sourceId}-${equiv.fieldName}-${index}`} className={styles.equivalenceItem}>
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
                                    disabled={isItemLoading('removeEquivalence')}
                                  >
                                    {isItemLoading('removeEquivalence') ? (
                                      <Loader className={`${styles.removeEquivalenceIcon} ${styles.spinningIcon}`} size={12} />
                                    ) : (
                                      <X className={styles.removeEquivalenceIcon} />
                                    )}
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : !isItemLoading('availableColumns') && (
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
                        {getFilteredFields(source.id).length === 0 ? (
                          <div className={styles.noEquivalenceFields}>
                            {searchTerms[source.id] ? (
                              <p>No fields found for "{searchTerms[source.id]}"</p>
                            ) : (
                              <p>No fields available in this source</p>
                            )}
                          </div>
                        ) : (
                          getFilteredFields(source.id).map(field => {
                            const isEquiv = isEquivalent(selectedSource, selectedField, source.id, field.name);
                            const isEquivLoading = isItemLoading('addEquivalence') || isItemLoading('removeEquivalence');
                            
                            return (
                              <div 
                                key={field.name}
                                className={`${styles.equivalenceFieldItem} ${isEquiv ? styles.equivalenceFieldItemSelected : ''}`}
                                onClick={() => {
                                  if (isEquivLoading) return;
                                  
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
                                  
                                  {isEquivLoading ? (
                                    <Loader className={`${styles.equivalenceIcon} ${styles.spinningIcon}`} size={16} />
                                  ) : isEquiv ? (
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
                          })
                        )}
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
                disabled={isItemLoading('addField')}
              >
                Cancel
              </button>
              <button 
                className={styles.submitButton}
                onClick={() => addNewField('column_groups')}
                disabled={isItemLoading('addField')}
              >
                {isItemLoading('addField') ? (
                  <><Loader className={styles.spinningIcon} size={14} /> Adding...</>
                ) : (
                  <>Add Field</>
                )}
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