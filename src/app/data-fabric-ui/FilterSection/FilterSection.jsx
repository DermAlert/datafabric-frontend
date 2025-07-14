"use client"
import { useState } from 'react';
import { Calendar, ChevronDown, Search, Database, Table, FileText } from 'lucide-react';
import styles from './FilterSection.module.css';

export default function FilterSection({ expanded, toggleFilter })  {
    const [selectedFields, setSelectedFields] = useState({});
  const [searchTerms, setSearchTerms] = useState({
    ISIC: '',
    ClinicalData: '',
    UserSource: ''
  });

  const handleFieldToggle = (sourceId, fieldName) => {
    setSelectedFields(prev => {
      const key = `${sourceId}.${fieldName}`;
      const newSelected = { ...prev };
      
      if (newSelected[key]) {
        delete newSelected[key];
      } else {
        newSelected[key] = true;
      }
      
      return newSelected;
    });
  };

  const handleSearchChange = (sourceId, term) => {
    setSearchTerms(prev => ({
      ...prev,
      [sourceId]: term
    }));
  };

  const clearAllFilters = () => {
    setSelectedFields({});
    setSearchTerms({
      ISIC: '',
      ClinicalData: '',
      UserSource: ''
    });
  };

  const applyFilters = () => {
    const selectedFieldsList = Object.keys(selectedFields).map(key => {
      const [sourceId, fieldName] = key.split('.');
      return { sourceId, fieldName };
    });
    
    if (onApplyFilters) {
      onApplyFilters(selectedFieldsList);
    }
  };

  const getSelectedCountBySource = (sourceId) => {
    return Object.keys(selectedFields).filter(key => key.startsWith(`${sourceId}.`)).length;
  };

  return (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader} onClick={toggleFilter}>
        <h3 className={styles.filterTitle}>Seleção de Metadados</h3>
        <ChevronDown className={`${styles.filterChevron} ${!expanded ? styles.filterChevronCollapsed : ''}`} />
      </div>
      
      {expanded && (
        <div className={styles.filterContent}>

          <UserSourceFilter 
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.UserSource}
            onSearchChange={(term) => handleSearchChange('UserSource', term)}
          />
          <ISICArchiveFilter 
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.ISIC}
            onSearchChange={(term) => handleSearchChange('ISIC', term)}
          />
          
          <ClinicalDataFilter 
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.ClinicalData}
            onSearchChange={(term) => handleSearchChange('ClinicalData', term)}
          />
          

          
          <div className={styles.selectionSummary}>
            <div className={styles.selectionStats}>
              <div className={styles.selectionStatItem}>
                <span className={styles.statLabel}>ISIC Archive:</span>
                <span className={styles.statValue}>{getSelectedCountBySource('ISIC')} campos</span>
              </div>
              <div className={styles.selectionStatItem}>
                <span className={styles.statLabel}>Dados Clínicos:</span>
                <span className={styles.statValue}>{getSelectedCountBySource('ClinicalData')} campos</span>
              </div>
              <div className={styles.selectionStatItem}>
                <span className={styles.statLabel}>Fonte Personalizada:</span>
                <span className={styles.statValue}>{getSelectedCountBySource('UserSource')} campos</span>
              </div>
              <div className={styles.selectionStatItem}>
                <span className={styles.statLabel}>Total:</span>
                <span className={styles.statValueTotal}>{Object.keys(selectedFields).length} campos</span>
              </div>
            </div>
          </div>
          
          <div className={styles.formButtonContainer}>
            <button 
              className={styles.secondaryButton} 
              onClick={clearAllFilters}
            >
              Limpar Seleção
            </button>
            <button 
              className={styles.primaryButton}
              onClick={applyFilters}
            >
              Aplicar Seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ISICArchiveFilter({ selectedFields, onFieldToggle, searchTerm, onSearchChange }) {
  const fields = [
    { name: 'isic_id', description: 'Unique identifier for the image' },
    { name: 'attribution', description: 'Source of the image' },
    { name: 'copyright_license', description: 'License terms for usage' },
    { name: 'diagnosis_1', description: 'Primary diagnosis' },
    { name: 'diagnosis_2', description: 'Secondary diagnosis' },
    { name: 'diagnosis_3', description: 'Tertiary diagnosis' },
    { name: 'diagnosis_4', description: 'Additional diagnosis information' },
    { name: 'diagnosis_5', description: 'Additional diagnosis information' },
    { name: 'image_type', description: 'Type of medical imaging used' },
    { name: 'melanocytic', description: 'Whether the lesion is melanocytic' },
    { name: 'patient_id', description: 'Anonymous patient identifier' }
  ];
  
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedCount = Object.keys(selectedFields).filter(key => 
    key.startsWith('ISIC.')
  ).length;
  
  return (
    <div className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <div className={styles.formGroupTitleContainer}>
          <FileText className={styles.sourceIcon} />
          <h4 className={styles.formGroupTitle}>
            ISIC Archive
            <span className={styles.sourceBadge}>Referência</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className={styles.selectedCount}>{selectedCount} selecionados</div>
        )}
      </div>
      
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar campos..." 
          className={styles.formInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {filteredFields.map((field) => (
          <div key={field.name} className={styles.metadataFieldContainer}>
            <div className={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                id={`ISIC-${field.name}`} 
                className={styles.checkbox}
                checked={!!selectedFields[`ISIC.${field.name}`]}
                onChange={() => onFieldToggle('ISIC', field.name)}
              />
              <label htmlFor={`ISIC-${field.name}`} className={styles.checkboxLabel}>
                <span className={styles.fieldName}>{field.name}</span>
              </label>
            </div>
            <div className={styles.fieldDescription} title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>
      
      {filteredFields.length === 0 && (
        <div className={styles.noResultsMessage}>
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}
      
      <div className={styles.helperText}>
        {selectedCount === 0 
          ? "Nenhum campo selecionado" 
          : `${selectedCount} campo${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`
        }
      </div>
    </div>
  );
}

function ClinicalDataFilter({ selectedFields, onFieldToggle, searchTerm, onSearchChange }) {
  const fields = [
    { name: 'id', description: '' },
    { name: 'diagnostico_cancer', description: '' },
    { name: 'tipo_cancer', description: '' },
    { name: 'cor_pele', description: '' },
    { name: 'historico_familiar', description: '' },
    { name: 'tipo_cancer_familiar', description: '' },
    { name: 'exposicao_solar_prolongada', description: '' },
    { name: 'uso_protetor_solar', description: '' },
    { name: 'mudanca_pintas_manchas', description: '' },
    { name: 'caracteristicas_lesoes', description: 'Lesion characteristics' },
    { name: 'hipertenso', description: ' hypertension' },
    { name: 'diabetes', description: ' has diabetes' },
    { name: 'cardiopatia', description: ' has heart disease' },
    { name: 'outras_doencas', description: ' other diseases' },
    { name: 'uso_medicamentos', description: ' uses medication' }
  ];
  
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedCount = Object.keys(selectedFields).filter(key => 
    key.startsWith('ClinicalData.')
  ).length;
  
  return (
    <div className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <div className={styles.formGroupTitleContainer}>
          <Database className={styles.sourceIcon} />
          <h4 className={styles.formGroupTitle}>
            Dados Clínicos
            <span className={styles.sourceBadgeClinical}>Integrado</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className={styles.selectedCount}>{selectedCount} selecionados</div>
        )}
      </div>
      
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar campos..." 
          className={styles.formInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {filteredFields.map((field) => (
          <div key={field.name} className={styles.metadataFieldContainer}>
            <div className={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                id={`ClinicalData-${field.name}`} 
                className={styles.checkbox}
                checked={!!selectedFields[`ClinicalData.${field.name}`]}
                onChange={() => onFieldToggle('ClinicalData', field.name)}
              />
              <label htmlFor={`ClinicalData-${field.name}`} className={styles.checkboxLabel}>
                <span className={styles.fieldName}>{field.name}</span>
              </label>
            </div>
            <div className={styles.fieldDescription} title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>
      
      {filteredFields.length === 0 && (
        <div className={styles.noResultsMessage}>
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}
      
      <div className={styles.helperText}>
        {selectedCount === 0 
          ? "Nenhum campo selecionado" 
          : `${selectedCount} campo${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`
        }
      </div>
    </div>
  );
}

function UserSourceFilter({ selectedFields, onFieldToggle, searchTerm, onSearchChange }) {
  const fields = [
    { name: 'custom_diagnosis', description: 'Diagnóstico personalizado' },
    { name: 'custom_severity', description: 'Grau de severidade' },
    { name: 'patient_age', description: 'Idade do paciente' },
    { name: 'treatment_score', description: 'Pontuação de eficácia do tratamento' },
    { name: 'follow_up_months', description: 'Meses de acompanhamento' },
    { name: 'risk_factor', description: 'Fator de risco calculado' }
  ];
  
  const filteredFields = fields.filter(field =>
    field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const selectedCount = Object.keys(selectedFields).filter(key => 
    key.startsWith('UserSource.')
  ).length;
  
  return (
    <div className={styles.formGroup}>
      <div className={styles.formGroupHeader}>
        <div className={styles.formGroupTitleContainer}>
          <Table className={styles.sourceIcon} />
          <h4 className={styles.formGroupTitle}>
            Fonte Personalizada
            <span className={styles.sourceBadgeUser}>Usuário</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className={styles.selectedCount}>{selectedCount} selecionados</div>
        )}
      </div>
      
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar campos..." 
          className={styles.formInput}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {filteredFields.map((field) => (
          <div key={field.name} className={styles.metadataFieldContainer}>
            <div className={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                id={`UserSource-${field.name}`} 
                className={styles.checkbox}
                checked={!!selectedFields[`UserSource.${field.name}`]}
                onChange={() => onFieldToggle('UserSource', field.name)}
              />
              <label htmlFor={`UserSource-${field.name}`} className={styles.checkboxLabel}>
                <span className={styles.fieldName}>{field.name}</span>
              </label>
            </div>
            <div className={styles.fieldDescription} title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>
      
      {filteredFields.length === 0 && (
        <div className={styles.noResultsMessage}>
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}
      
      <div className={styles.helperText}>
        {selectedCount === 0 
          ? "Nenhum campo selecionado" 
          : `${selectedCount} campo${selectedCount > 1 ? 's' : ''} selecionado${selectedCount > 1 ? 's' : ''}`
        }
      </div>
    </div>
  );
}