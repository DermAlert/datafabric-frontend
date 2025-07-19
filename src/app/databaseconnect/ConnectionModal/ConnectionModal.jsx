import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, RefreshCw, Link2 } from 'lucide-react';
import styles from './ConnectionModal.module.css';

// Get all connection types from API, for select box
async function fetchConnectionTypes() {
  // Use actual API endpoint in production
  const res = await fetch('http://localhost:8004/api/connection/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pagination: { limit: 100, query_total: false, skip: 0 },
      name: "",
      metadata_extraction_method: ""
    })
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.items || [];
}

export default function ConnectionModal({ editingConnection, onClose, organizationId = 1 }) {
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [selectedTypeId, setSelectedTypeId] = useState(null);
  const [form, setForm] = useState({
    name: editingConnection?.name || "",
    description: editingConnection?.description || "",
    connection_type_id: editingConnection?.connection_type_id || null,
    connection_params: editingConnection?.connection_params || {},
    cron_expression: editingConnection?.cron_expression || "",
    sync_settings: editingConnection?.sync_settings || {},
    organization_id: editingConnection?.organization_id || organizationId,
    content_type: editingConnection?.content_type || "metadata",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [paramErrors, setParamErrors] = useState({});
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    fetchConnectionTypes().then(types => {
      setConnectionTypes(types);
      if (!editingConnection && types.length > 0) {
        setSelectedTypeId(types[0].id);
        setForm(f => ({ ...f, connection_type_id: types[0].id }));
      } else if (editingConnection) {
        setSelectedTypeId(editingConnection.connection_type_id);
      }
    });
  }, []);

  useEffect(() => {
    const type = connectionTypes.find(t => t.id === selectedTypeId);
    if (type) {
      const schema = type.connection_params_schema || {};
      const params = {};
      if (schema && schema.properties) {
        for (let key in schema.properties) {
          if (schema.properties[key].default !== undefined) {
            params[key] = schema.properties[key].default;
          }
        }
      }
      setForm(f => ({
        ...f,
        connection_type_id: type.id,
        connection_params: { ...params }
      }));
    }
  }, [selectedTypeId]);

  const togglePasswordVisibility = (field) => setShowPassword(v => !v);

  const handleParamChange = (key, value) => {
    setForm(f => ({
      ...f,
      connection_params: {
        ...f.connection_params,
        [key]: value
      }
    }));
  };

  const handleBasicChange = (e) => {
    setForm(f => ({
      ...f,
      [e.target.name]: e.target.value
    }));
  };

  const handleTypeChange = (e) => {
    setSelectedTypeId(Number(e.target.value));
  };

  const validateParams = () => {
    const type = connectionTypes.find(t => t.id === selectedTypeId);
    const errors = {};
    if (type && type.connection_params_schema && type.connection_params_schema.required) {
      for (let key of type.connection_params_schema.required) {
        if (!form.connection_params[key]) {
          errors[key] = "Campo obrigatório";
        }
      }
    }
    setParamErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const testConnection = async () => {
    setTestingConnection(true);
    setSaveError(null);
    try {
      await new Promise(r => setTimeout(r, 1000));
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    if (!validateParams()) return;
    try {
      const payload = {
        ...form,
        connection_type_id: selectedTypeId,
        organization_id: form.organization_id,
        content_type: form.content_type,
      };
      const res = await fetch(
        editingConnection
          ? `http://localhost:8004/api/data-connections/${editingConnection.id}`
          : `http://localhost:8004/api/data-connections/`,
        {
          method: editingConnection ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );
      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.detail || "Erro ao salvar conexão.");
        return;
      }
      onClose();
    } catch (e) {
      setSaveError("Erro inesperado ao salvar.");
    }
  };

  const renderParamsFields = () => {
    const type = connectionTypes.find(t => t.id === selectedTypeId);
    if (!type || !type.connection_params_schema) return null;
    const schema = type.connection_params_schema;
    return Object.entries(schema.properties || {}).map(([key, prop]) => {
      const value = form.connection_params[key] ?? "";
      const error = paramErrors[key];
      // Mask password fields
      const isPassword = prop.format === "password" || key.toLowerCase().includes("password") || key.toLowerCase().includes("secret");
      return (
        <div className={styles.formField} key={key}>
          <label className={styles.formLabel}>{prop.title || key}{schema.required && schema.required.includes(key) && <span style={{ color: "red" }}> *</span>}</label>
          {prop.type === "boolean" ? (
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => handleParamChange(key, e.target.checked)}
              className={styles.formInput}
            />
          ) : (
            <input
              type={isPassword && !showPassword ? "password" : "text"}
              value={value}
              onChange={e => handleParamChange(key, e.target.value)}
              className={styles.formInput}
              placeholder={prop.description}
              autoComplete={isPassword ? "new-password" : "off"}
            />
          )}
          {isPassword &&
            <button
              className={styles.togglePasswordButton}
              style={{ position: "absolute", right: 10, top: 30 }}
              onClick={e => { e.preventDefault(); togglePasswordVisibility(key); }}
              type="button"
            >
              {showPassword ? <EyeOff className={styles.passwordIcon} /> : <Eye className={styles.passwordIcon} />}
            </button>
          }
          {error && <div className={styles.formError}>{error}</div>}
        </div>
      );
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <form onSubmit={handleSave}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              {editingConnection ? "Editar Conexão" : "Nova Conexão de Dados"}
            </h2>
            <button className={styles.closeButton} onClick={onClose} type="button">
              <X className={styles.closeIcon} />
            </button>
          </div>
          <div className={styles.modalBody}>
            {/* Basic Info */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Informações Básicas</h3>
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nome da Conexão</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="name"
                    value={form.name}
                    onChange={handleBasicChange}
                    required
                    placeholder="Ex: ISIC Images Storage"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Tipo de Conexão</label>
                  <select
                    className={styles.formInput}
                    name="connection_type_id"
                    value={selectedTypeId || ""}
                    onChange={handleTypeChange}
                    required
                  >
                    <option value="">Selecione...</option>
                    {connectionTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Descrição</label>
                <input
                  type="text"
                  className={styles.formInput}
                  name="description"
                  value={form.description}
                  onChange={handleBasicChange}
                  placeholder="Descrição curta"
                />
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Tipo de Conteúdo</label>
                <select
                  className={styles.formInput}
                  name="content_type"
                  value={form.content_type}
                  onChange={handleBasicChange}
                >
                  <option value="metadata">metadata</option>
                  <option value="image">image</option>
                </select>
              </div>
            </div>
            {/* Connection Params */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Parâmetros da Conexão</h3>
              {renderParamsFields()}
            </div>
            {/* Scheduling */}
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Agendamento</h3>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Expressão CRON</label>
                <input
                  type="text"
                  className={styles.formInput}
                  name="cron_expression"
                  value={form.cron_expression}
                  onChange={handleBasicChange}
                  placeholder="Ex: 0 1 * * *"
                />
              </div>
            </div>
            {/* Sync Settings */}
            {/* Test Connection */}
            <div className={styles.testConnectionContainer}>
              <button
                className={styles.testConnectionButton}
                onClick={e => { e.preventDefault(); testConnection(); }}
                disabled={testingConnection}
                type="button"
              >
                {testingConnection ?
                  <RefreshCw className={`${styles.testConnectionIcon} ${styles.spinIcon}`} /> :
                  <Link2 className={styles.testConnectionIcon} />}
                <span>{testingConnection ? "Testando..." : "Testar Conexão"}</span>
              </button>
            </div>
            {saveError && <div className={styles.formError}>{saveError}</div>}
          </div>
          <div className={styles.modalFooter}>
            <button className={styles.secondaryButton} onClick={onClose} type="button">
              Cancelar
            </button>
            <button className={styles.primaryButton} type="submit">
              {editingConnection ? "Atualizar Conexão" : "Criar Conexão"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}