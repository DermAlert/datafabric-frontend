"use client";
import { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Search,
  Database,
  Table,
  FileText,
} from "lucide-react";
import "./FilterSection.css";

// Remove all "styles." usage, and make sure searchTerms includes all filters
// Ensure all filters (ISIC, ClinicalData, UserSource) are included in the searchTerms and follow the same pattern as others
const mockData = {
  "semantic_groups": [
    {
      "name": "Paciente",
      "description": "Dados relacionados ao paciente, como identificação, perfil e histórico.",
      "parent_domain_id": null,
      "domain_rules": {
        "rule_type": "regex",
        "pattern": "^[a-zA-Z_]+$"
      },
      "id": 1
    },
    {
      "name": "Exame",
      "description": "Informações sobre exames clínicos, laboratoriais e de imagem.",
      "parent_domain_id": null,
      "domain_rules": {
        "rule_type": "regex",
        "pattern": "^EXA_[0-9]{3}$"
      },
      "id": 2
    },
    {
      "name": "Diagnóstico",
      "description": "Campos relacionados ao diagnóstico médico e suas categorias.",
      "parent_domain_id": null,
      "domain_rules": {
        "rule_type": "enum",
        "values": ["Oncologia", "Dermatologia", "Cardiologia"]
      },
      "id": 3
    },
    {
      "name": "Histórico Familiar",
      "description": "Informações de doenças e condições recorrentes na família do paciente.",
      "parent_domain_id": 1,
      "domain_rules": {},
      "id": 4
    }
  ],
  "dictionary": [
    {
      "name": "nome_completo",
      "display_name": "Nome Completo",
      "description": "Nome completo do paciente, incluindo sobrenome.",
      "semantic_domain_id": 1,
      "data_type": "string",
      "validation_rules": {
        "min_length": 3,
        "max_length": 100
      },
      "example_values": {
        "exemplo_1": "Maria Silva",
        "exemplo_2": "João dos Santos"
      },
      "synonyms": [
        "nome_paciente",
        "nome_registro"
      ],
      "id": 10
    },
    {
      "name": "idade",
      "display_name": "Idade",
      "description": "Idade do paciente em anos completos.",
      "semantic_domain_id": 1,
      "data_type": "integer",
      "validation_rules": {
        "min_value": 0,
        "max_value": 120
      },
      "example_values": {
        "exemplo_1": 27,
        "exemplo_2": 54
      },
      "synonyms": [
        "anos",
        "tempo_vida"
      ],
      "id": 11
    },
    {
      "name": "data_exame",
      "display_name": "Data do Exame",
      "description": "Data em que o exame foi realizado.",
      "semantic_domain_id": 2,
      "data_type": "date",
      "validation_rules": {
        "format": "YYYY-MM-DD"
      },
      "example_values": {
        "exemplo_1": "2024-05-01",
        "exemplo_2": "2025-01-17"
      },
      "synonyms": [
        "dt_exame",
        "realizacao_exame"
      ],
      "id": 20
    },
    {
      "name": "codigo_diagnostico",
      "display_name": "Código Diagnóstico",
      "description": "Código padronizado para o diagnóstico do paciente.",
      "semantic_domain_id": 3,
      "data_type": "string",
      "validation_rules": {
        "pattern": "^[A-Z]{3}[0-9]{2}$"
      },
      "example_values": {
        "exemplo_1": "C5099",
        "exemplo_2": "D2301"
      },
      "synonyms": [
        "cid",
        "cod_diag"
      ],
      "id": 21
    }
  ],
  "groups": [
    {
      "name": "Grupo Pacientes Jovens",
      "description": "Pacientes com idade entre 0 e 18 anos.",
      "semantic_domain_id": 1,
      "data_dictionary_term_id": 11,
      "properties": {
        "faixa_etaria": "jovem",
        "regiao": "nacional"
      },
      "id": 100
    },
    {
      "name": "Grupo Exames de Imagem",
      "description": "Todos exames do tipo imagem (raio-x, ressonância, tomografia).",
      "semantic_domain_id": 2,
      "data_dictionary_term_id": 20,
      "properties": {
        "tipo_exame": "imagem",
        "modalidade": "diversas"
      },
      "id": 101
    },
    {
      "name": "Grupo Diagnósticos Oncológicos",
      "description": "Pacientes diagnosticados com códigos CID oncológicos.",
      "semantic_domain_id": 3,
      "data_dictionary_term_id": 21,
      "properties": {
        "especialidade": "oncologia"
      },
      "id": 102
    }
  ],
  "standard_value": {
    "name": "Padrão de Consentimento",
    "description": "Valor padrão para consentimento informado do paciente.",
    "semantic_domain_id": 1,
    "data_dictionary_term_id": 10,
    "properties": {
      "tipo_documento": "assinatura_digital",
      "versao": "2.0"
    },
    "id": 200,
    "column_mappings": [
      {
        "group_id": 100,
        "column_id": 3001,
        "transformation_rule": "UPPER(TRIM(nome_completo))",
        "confidence_score": "0.97",
        "notes": "Padronização do nome do paciente em maiúsculas.",
        "id": 301,
        "column_name": "nome_paciente"
      },
      {
        "group_id": 101,
        "column_id": 3002,
        "transformation_rule": "DATE_FORMAT(data_exame, '%d/%m/%Y')",
        "confidence_score": "0.92",
        "notes": "Formatação de data para padrão brasileiro.",
        "id": 302,
        "column_name": "data_exame_formatada"
      }
    ],
    "value_mappings": [
      {
        "original_value": "sim",
        "mapped_value": "true"
      },
      {
        "original_value": "não",
        "mapped_value": "false"
      },
      {
        "original_value": "desconhecido",
        "mapped_value": "unknown"
      }
    ]
  }
}


export default function FilterSection({ expanded, toggleFilter }) {
  const [selectedFields, setSelectedFields] = useState({});
  const [searchTerms, setSearchTerms] = useState({
    SemanticGroups: "",
    Dictionary: "",
    Groups: "",
    ISIC: "",
    ClinicalData: "",
    UserSource: "",
  });

  const handleFieldToggle = (sourceId, fieldName) => {
    setSelectedFields((prev) => {
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
    setSearchTerms((prev) => ({
      ...prev,
      [sourceId]: term,
    }));
  };

  const clearAllFilters = () => {
    setSelectedFields({});
    setSearchTerms({
      SemanticGroups: "",
      Dictionary: "",
      Groups: "",
      ISIC: "",
      ClinicalData: "",
      UserSource: "",
    });
  };

  const applyFilters = () => {
    const selectedFieldsList = Object.keys(selectedFields).map((key) => {
      const [sourceId, fieldName] = key.split(".");
      return { sourceId, fieldName };
    });
    console.log("Filtros aplicados:", selectedFieldsList);
  };

  const getSelectedCountBySource = (sourceId) => {
    return Object.keys(selectedFields).filter((key) =>
      key.startsWith(`${sourceId}.`)
    ).length;
  };

  return (
    <div className="filter-section">
      <div className="filter-header" onClick={toggleFilter}>
        <h3 className="filter-title">Seleção de Metadados</h3>
        <ChevronDown
          className={`filter-chevron ${
            !expanded ? "filter-chevron-collapsed" : ""
          }`}
        />
      </div>

      {expanded && (
        <div className="filter-content">
          <SemanticGroupsFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.SemanticGroups}
            onSearchChange={(term) =>
              handleSearchChange("SemanticGroups", term)
            }
          />

          <DictionaryFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.Dictionary}
            onSearchChange={(term) => handleSearchChange("Dictionary", term)}
          />

          <GroupsFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.Groups}
            onSearchChange={(term) => handleSearchChange("Groups", term)}
          />

          <ISICArchiveFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.ISIC}
            onSearchChange={(term) => handleSearchChange("ISIC", term)}
          />

          <ClinicalDataFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.ClinicalData}
            onSearchChange={(term) => handleSearchChange("ClinicalData", term)}
          />

          <UserSourceFilter
            selectedFields={selectedFields}
            onFieldToggle={handleFieldToggle}
            searchTerm={searchTerms.UserSource}
            onSearchChange={(term) => handleSearchChange("UserSource", term)}
          />

          <div className="selection-summary">
            <div className="selection-stats">
              <div className="selection-stat-item">
                <span className="stat-label">Grupos Semânticos:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("SemanticGroups")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">Dicionário:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("Dictionary")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">Grupos:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("Groups")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">ISIC:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("ISIC")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">Dados Clínicos:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("ClinicalData")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">Fonte Personalizada:</span>
                <span className="stat-value">
                  {getSelectedCountBySource("UserSource")} campos
                </span>
              </div>
              <div className="selection-stat-item">
                <span className="stat-label">Total:</span>
                <span className="stat-value-total">
                  {Object.keys(selectedFields).length} campos
                </span>
              </div>
            </div>
          </div>

          <div className="form-button-container">
            <button className="secondary-button" onClick={clearAllFilters}>
              Limpar Seleção
            </button>
            <button className="primary-button" onClick={applyFilters}>
              Aplicar Seleção
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SemanticGroupsFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = mockData.semantic_groups.map((group) => ({
    name: group.name,
    description: group.description,
    id: group.id,
  }));

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("SemanticGroups.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <FileText className="source-icon" />
          <h4 className="form-group-title">
            Grupos Semânticos
            <span className="source-badge">Estrutural</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.id} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`SemanticGroups-${field.id}`}
                className="checkbox"
                checked={!!selectedFields[`SemanticGroups.${field.name}`]}
                onChange={() => onFieldToggle("SemanticGroups", field.name)}
              />
              <label
                htmlFor={`SemanticGroups-${field.id}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.name}</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

function DictionaryFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = mockData.dictionary.map((item) => ({
    name: item.name,
    description: item.description,
    display_name: item.display_name,
    data_type: item.data_type,
    id: item.id,
  }));

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("Dictionary.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <Database className="source-icon" />
          <h4 className="form-group-title">
            Dicionário de Dados
            <span className="source-badge-clinical">Integrado</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.id} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`Dictionary-${field.id}`}
                className="checkbox"
                checked={!!selectedFields[`Dictionary.${field.name}`]}
                onChange={() => onFieldToggle("Dictionary", field.name)}
              />
              <label
                htmlFor={`Dictionary-${field.id}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.display_name}</span>
                <span className="field-type">({field.data_type})</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

function GroupsFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = mockData.groups.map((group) => ({
    name: group.name,
    description: group.description,
    id: group.id,
  }));

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("Groups.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <Table className="source-icon" />
          <h4 className="form-group-title">
            Grupos de Dados
            <span className="source-badge-user">Usuário</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.id} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`Groups-${field.id}`}
                className="checkbox"
                checked={!!selectedFields[`Groups.${field.name}`]}
                onChange={() => onFieldToggle("Groups", field.name)}
              />
              <label
                htmlFor={`Groups-${field.id}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.name}</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

function ISICArchiveFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = [
    { name: "isic_id", description: "Unique identifier for the image" },
    { name: "attribution", description: "Source of the image" },
    { name: "copyright_license", description: "License terms for usage" },
    { name: "diagnosis_1", description: "Primary diagnosis" },
    { name: "diagnosis_2", description: "Secondary diagnosis" },
    { name: "diagnosis_3", description: "Tertiary diagnosis" },
    { name: "diagnosis_4", description: "Additional diagnosis information" },
    { name: "diagnosis_5", description: "Additional diagnosis information" },
    { name: "image_type", description: "Type of medical imaging used" },
    { name: "melanocytic", description: "Whether the lesion is melanocytic" },
    { name: "patient_id", description: "Anonymous patient identifier" },
  ];

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("ISIC.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <FileText className="source-icon" />
          <h4 className="form-group-title">
            ISIC Archive
            <span className="source-badge">Referência</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.name} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`ISIC-${field.name}`}
                className="checkbox"
                checked={!!selectedFields[`ISIC.${field.name}`]}
                onChange={() => onFieldToggle("ISIC", field.name)}
              />
              <label
                htmlFor={`ISIC-${field.name}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.name}</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

function ClinicalDataFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = [
    { name: "id", description: "" },
    { name: "diagnostico_cancer", description: "" },
    { name: "tipo_cancer", description: "" },
    { name: "cor_pele", description: "" },
    { name: "historico_familiar", description: "" },
    { name: "tipo_cancer_familiar", description: "" },
    { name: "exposicao_solar_prolongada", description: "" },
    { name: "uso_protetor_solar", description: "" },
    { name: "mudanca_pintas_manchas", description: "" },
    { name: "caracteristicas_lesoes", description: "Lesion characteristics" },
    { name: "hipertenso", description: " hypertension" },
    { name: "diabetes", description: " has diabetes" },
    { name: "cardiopatia", description: " has heart disease" },
    { name: "outras_doencas", description: " other diseases" },
    { name: "uso_medicamentos", description: " uses medication" },
  ];

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("ClinicalData.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <Database className="source-icon" />
          <h4 className="form-group-title">
            Dados Clínicos
            <span className="source-badge-clinical">Integrado</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.name} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`ClinicalData-${field.name}`}
                className="checkbox"
                checked={!!selectedFields[`ClinicalData.${field.name}`]}
                onChange={() => onFieldToggle("ClinicalData", field.name)}
              />
              <label
                htmlFor={`ClinicalData-${field.name}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.name}</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}

function UserSourceFilter({
  selectedFields,
  onFieldToggle,
  searchTerm,
  onSearchChange,
}) {
  const fields = [
    { name: "custom_diagnosis", description: "Diagnóstico personalizado" },
    { name: "custom_severity", description: "Grau de severidade" },
    { name: "patient_age", description: "Idade do paciente" },
    { name: "treatment_score", description: "Pontuação de eficácia do tratamento" },
    { name: "follow_up_months", description: "Meses de acompanhamento" },
    { name: "risk_factor", description: "Fator de risco calculado" },
  ];

  const filteredFields = fields.filter(
    (field) =>
      field.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCount = Object.keys(selectedFields).filter((key) =>
    key.startsWith("UserSource.")
  ).length;

  return (
    <div className="form-group">
      <div className="form-group-header">
        <div className="form-group-title-container">
          <Table className="source-icon" />
          <h4 className="form-group-title">
            Fonte Personalizada
            <span className="source-badge-user">Usuário</span>
          </h4>
        </div>
        {selectedCount > 0 && (
          <div className="selected-count">{selectedCount} selecionados</div>
        )}
      </div>

      <div className="search-input-container">
        <input
          type="text"
          placeholder="Buscar campos..."
          className="form-input"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Search className="search-icon" />
      </div>

      <div className="checkbox-grid">
        {filteredFields.map((field) => (
          <div key={field.name} className="metadata-field-container">
            <div className="checkbox-container">
              <input
                type="checkbox"
                id={`UserSource-${field.name}`}
                className="checkbox"
                checked={!!selectedFields[`UserSource.${field.name}`]}
                onChange={() => onFieldToggle("UserSource", field.name)}
              />
              <label
                htmlFor={`UserSource-${field.name}`}
                className="checkbox-label"
              >
                <span className="field-name">{field.name}</span>
              </label>
            </div>
            <div className="field-description" title={field.description}>
              {field.description}
            </div>
          </div>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <div className="no-results-message">
          Nenhum campo encontrado para "{searchTerm}"
        </div>
      )}

      <div className="helper-text">
        {selectedCount === 0
          ? "Nenhum campo selecionado"
          : `${selectedCount} campo${
              selectedCount > 1 ? "s" : ""
            } selecionado${selectedCount > 1 ? "s" : ""}`}
      </div>
    </div>
  );
}