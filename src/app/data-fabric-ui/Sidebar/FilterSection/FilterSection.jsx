import { useState, useEffect, useMemo } from 'react';
import { 
  Search, ChevronDown, ChevronRight, Link2, Plus, 
  Trash2, Save, Info, Edit, PlusCircle, X, Settings, 
  ArrowRight, AlertTriangle, CheckCircle, Database 
} from 'lucide-react';
import styles from './FilterSection.module.css';

export default function FilterSection({ expanded, toggleFilter })  {  // State for all data sources
  const [dataSources, setDataSources] = useState([
    {
      id: 'ISIC',
      name: 'ISIC Archive',
      type: 'reference',
      description: 'International Skin Imaging Collaboration dataset'
    },
    {
      id: 'ClinicalData',
      name: 'Dados Clínicos(Applicativo)',
      type: 'integrated',
      description: 'Sistema integrado de dados clínicos dos pacientes'
    },
    {
      id: 'UserSource',
      name: 'Fonte Personalizada',
      type: 'user',
      description: 'Fonte de dados definida pelo usuário'
    }
  ]);
  
  const [expandedSources, setExpandedSources] = useState({
    'ISIC': true,
    'ClinicalData': true,
    'UserSource': false,
  });
  
  const [searchTerms, setSearchTerms] = useState({
    'ISIC': '',
    'ClinicalData': '',
    'UserSource': '',
  });
  
  const [selectedField, setSelectedField] = useState(null);
  const [selectedSource, setSelectedSource] = useState(null);
  
  const [equivalences, setEquivalences] = useState({
    'ISIC.diagnosis_1': [
      { sourceId: 'ClinicalData', fieldName: 'diagnostico_cancer' },
      { sourceId: 'ClinicalData', fieldName: 'tipo_cancer' }
    ],
    'ISIC.melanocytic': [
      { sourceId: 'ClinicalData', fieldName: 'tipo_cancer' }
    ],
  });
  
  const [fieldDefinitions, setFieldDefinitions] = useState({
    'ISIC': [
      { name: 'isic_id', description: 'Unique identifier for the image', type: 'string' },
      { name: 'attribution', description: 'Source of the image', type: 'string' },
      { name: 'copyright_license', description: 'License terms for usage', type: 'string' },
      { name: 'diagnosis_1', description: 'Primary diagnosis', type: 'string' },
      { name: 'diagnosis_2', description: 'Secondary diagnosis', type: 'string' },
      { name: 'diagnosis_3', description: 'Tertiary diagnosis', type: 'string' },
      { name: 'diagnosis_4', description: 'Additional diagnosis information', type: 'string' },
      { name: 'diagnosis_5', description: 'Additional diagnosis information', type: 'string' },
      { name: 'image_type', description: 'Type of medical imaging used', type: 'string' },
      { name: 'melanocytic', description: 'Whether the lesion is melanocytic', type: 'boolean' },
      { name: 'patient_id', description: 'Anonymous patient identifier', type: 'string' }
    ],
    'ClinicalData': [
      { name: 'id', description: 'Primary key', type: 'integer' },
      { name: 'diagnostico_cancer', description: 'Whether patient has cancer diagnosis', type: 'boolean' },
      { name: 'tipo_cancer', description: 'Type of cancer', type: 'string' },
      { name: 'cor_pele', description: 'Skin color score', type: 'integer' },
      { name: 'historico_familiar', description: 'Family history of skin cancer', type: 'boolean' },
      { name: 'tipo_cancer_familiar', description: 'Type of cancer in family', type: 'string' },
      { name: 'exposicao_solar_prolongada', description: 'Extended sun exposure', type: 'boolean' },
      { name: 'uso_protetor_solar', description: 'Sunscreen usage', type: 'boolean' },
      { name: 'mudanca_pintas_manchas', description: 'Changes in moles or spots', type: 'boolean' },
      { name: 'caracteristicas_lesoes', description: 'Lesion characteristics', type: 'boolean' },
    ],
    'UserSource': [
      { name: 'custom_diagnosis', description: 'Diagnóstico personalizado', type: 'string', userDefined: true },
      { name: 'custom_severity', description: 'Grau de severidade', type: 'integer', userDefined: true }
    ]
  });
  
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
  
  const addNewField = (sourceId) => {
    const { name, description, type } = newFieldForm;
    
    if (!name.trim()) {
      alert('Nome do campo é obrigatório');
      return;
    }
    
    // Check for duplicate field names
    if (fieldDefinitions[sourceId].some(field => field.name === name)) {
      alert('Um campo com este nome já existe');
      return;
    }
    
    setFieldDefinitions(prev => ({
      ...prev,
      [sourceId]: [
        ...prev[sourceId],
        { name, description, type, userDefined: true }
      ]
    }));
    
    setNewFieldForm({
      name: '',
      description: '',
      type: 'string',
      isModalOpen: false
    });
  };
  
  const addNewSource = () => {
    const { id, name, description } = newSourceForm;
    
    if (!id.trim() || !name.trim()) {
      alert('ID e nome da fonte são obrigatórios');
      return;
    }
    
    if (dataSources.some(source => source.id === id)) {
      alert('Uma fonte com este ID já existe');
      return;
    }
    
    setDataSources(prev => [
      ...prev,
      {
        id,
        name,
        type: 'user',
        description: description || 'Fonte de dados definida pelo usuário'
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
  
  const saveEquivalences = () => {
    console.log('Saving equivalences:', allEquivalences);
    alert('Equivalências salvas com sucesso!');
  };
  
  const removeUserField = (sourceId, fieldName) => {
    setFieldDefinitions(prev => ({
      ...prev,
      [sourceId]: prev[sourceId].filter(field => field.name !== fieldName)
    }));
    
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
  };
  
  return (
    <div className={styles.metadataEquivalenceContainer}>
      {/* Header */}
      <div className={styles.metadataHeader}>
        <div className={styles.metadataHeaderLeft}>
          <h2 className={styles.metadataTitle}>Equivalência de Metadados</h2>
          <div className={styles.metadataBadges}>
            <span className={styles.sourceCount}>
              {dataSources.length} Fontes
            </span>
            <span className={styles.equivalenceCount}>
              {Object.keys(allEquivalences).length} Equivalências
            </span>
          </div>
        </div>
        <div className={styles.metadataActions}>
          <button 
            className={styles.addSourceButton}
            onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: true }))}
          >
            <Database className={styles.actionIcon} />
            <span>Nova Fonte</span>
          </button>
          <button 
            className={styles.saveButton}
            onClick={saveEquivalences}
          >
            <Save className={styles.actionIcon} />
            <span>Salvar Equivalências</span>
          </button>
        </div>
      </div>
      
      {/* Description */}
      <div className={styles.metadataDescription}>
        <Info className={styles.infoIcon} />
        <div>
          <p className={styles.descriptionText}>
            Selecione campos em qualquer fonte de dados para definir equivalências com campos em outras fontes.
            As equivalências são transitivas: se A≡B e B≡C, então A≡C.
          </p>
          <p className={styles.descriptionTip}>
            <strong>Dica:</strong> Crie campos personalizados na "Fonte Personalizada" e defina suas equivalências.
          </p>
        </div>
      </div>
      
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
                  <span className={styles.userSourceBadge}>Personalizada</span>
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
                      placeholder="Buscar campos..."
                      value={searchTerms[source.id] || ''}
                      onChange={(e) => handleSearchChange(source.id, e.target.value)}
                    />
                  </div>
                  
                  {source.type === 'user' && (
                    <button 
                      className={styles.addFieldButton}
                      onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: true }))}
                    >
                      <Plus className={styles.addFieldIcon} />
                      <span>Adicionar Campo</span>
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
                                title="Remover campo"
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
                                    title="Remover equivalência"
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
                          <p>Nenhum campo encontrado para "{searchTerms[source.id]}"</p>
                        </div>
                      ) : source.type === 'user' ? (
                        <div>
                          <PlusCircle className={styles.noFieldsIcon} />
                          <p>Adicione campos personalizados usando o botão acima</p>
                        </div>
                      ) : (
                        <div>
                          <AlertTriangle className={styles.noFieldsIcon} />
                          <p>Nenhum campo definido nesta fonte</p>
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
                Campo Selecionado: 
                <span className={styles.selectedFieldName}>
                  {dataSources.find(s => s.id === selectedSource)?.name} → {selectedField}
                </span>
              </h4>
              <p className={styles.selectedFieldDescription}>
                {fieldDefinitions[selectedSource]?.find(f => f.name === selectedField)?.description || 'Sem descrição disponível'}
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
              <p>Selecione campos em outras fontes para estabelecer equivalência com o campo atual.</p>
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
                          .length} campos equivalentes
                      </span>
                    </div>
                    
                    <div className={styles.sourceEquivalenceCardContent}>
                      <div className={styles.equivalenceSearchContainer}>
                        <Search className={styles.equivalenceSearchIcon} />
                        <input
                          type="text"
                          className={styles.equivalenceSearchInput}
                          placeholder="Buscar campos para equivalência..."
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
      
      {/* Modal for adding new fields to user-defined source */}
      {newFieldForm.isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Adicionar Novo Campo</h4>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nome do Campo *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: custom_score"
                  value={newFieldForm.name}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className={styles.formHint}>Use nomes descritivos sem espaços (snake_case)</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Descrição</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: Pontuação personalizada para gravidade"
                  value={newFieldForm.description}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, description: e.target.value }))}
                />
                <div className={styles.formHint}>Breve descrição do campo e seu propósito</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Tipo de Dado</label>
                <select
                  className={styles.formSelect}
                  value={newFieldForm.type}
                  onChange={(e) => setNewFieldForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="string">Texto (string)</option>
                  <option value="integer">Número Inteiro (integer)</option>
                  <option value="float">Número Decimal (float)</option>
                  <option value="boolean">Booleano (boolean)</option>
                  <option value="date">Data (date)</option>
                  <option value="datetime">Data e Hora (datetime)</option>
                </select>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setNewFieldForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                Cancelar
              </button>
              <button 
                className={styles.submitButton}
                onClick={() => addNewField('UserSource')}
              >
                Adicionar Campo
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
              <h4 className={styles.modalTitle}>Adicionar Nova Fonte de Dados</h4>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setNewSourceForm(prev => ({ ...prev, isModalOpen: false }))}
              >
                <X className={styles.modalCloseIcon} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.formField}>
                <label className={styles.formLabel}>ID da Fonte *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: CustomSource1"
                  value={newSourceForm.id}
                  onChange={(e) => setNewSourceForm(prev => ({ ...prev, id: e.target.value }))}
                />
                <div className={styles.formHint}>ID único usado internamente (sem espaços)</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nome da Fonte *</label>
                <input 
                  type="text"
                  className={styles.formInput}
                  placeholder="Ex: Fonte de Dados Personalizados"
                  value={newSourceForm.name}
                  onChange={(e) => setNewSourceForm(prev => ({ ...prev, name: e.target.value }))}
                />
                <div className={styles.formHint}>Nome de exibição da fonte de dados</div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Descrição</label>
                <textarea 
                  className={styles.formTextarea}
                  placeholder="Ex: Fonte de dados personalizados para análises específicas"
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
                Cancelar
              </button>
              <button 
                className={styles.submitButton}
                onClick={addNewSource}
              >
                Criar Fonte de Dados
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}