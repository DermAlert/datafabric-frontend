import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './ConnectionTypeModal.module.css';

// List of popular connection templates
const CONNECTION_TEMPLATES = [
  {
    label: "MinIO",
    name: "minio",
    color_hex: "#C72E29",
    icon: "minio",
    description: "MinIO S3-compatible object storage for images",
    connection_params_schema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          title: "MinIO Endpoint",
          description: "MinIO server endpoint (e.g., http://minio:9000)",
          default: "http://minio:9000"
        },
        access_key: {
          type: "string",
          title: "Access Key",
          description: "MinIO access key for authentication"
        },
        secret_key: {
          type: "string",
          title: "Secret Key",
          description: "MinIO secret key for authentication",
          format: "password"
        },
        bucket_name: {
          type: "string",
          title: "Bucket Name",
          description: "Default bucket name for image storage",
          default: "images"
        },
        region: {
          type: "string",
          title: "Region",
          description: "MinIO region (usually us-east-1 for local MinIO)",
          default: "us-east-1"
        },
        secure: {
          type: "boolean",
          title: "Use HTTPS",
          description: "Whether to use HTTPS for connections",
          default: false
        }
      },
      required: ["endpoint", "access_key", "secret_key", "bucket_name"],
      additionalProperties: false
    },
    metadata_extraction_method: "none"
  },
  {
    label: "DeltaLake",
    name: "deltalake",
    color_hex: "#FF6B35",
    icon: "delta",
    description: "Delta Lake connection for reading/writing Delta tables on S3-compatible storage",
    connection_params_schema: {
      type: "object",
      properties: {
        s3a_endpoint: {
          type: "string",
          title: "S3A Endpoint",
          description: "S3-compatible storage endpoint (e.g., http://minio:9000)",
          default: "http://minio:9000"
        },
        s3a_access_key: {
          type: "string",
          title: "Access Key",
          description: "S3 access key for authentication"
        },
        s3a_secret_key: {
          type: "string",
          title: "Secret Key",
          description: "S3 secret key for authentication",
          format: "password"
        },
        app_name: {
          type: "string",
          title: "Application Name",
          description: "Spark application name",
          default: "DeltaLakeConnector"
        },
        bucket_name: {
          type: "string",
          title: "Delta Path",
          description: "Base path for Delta tables (e.g., bucket-name)",
          default: "isic-delta"
        }
      },
      required: ["s3a_endpoint", "s3a_access_key", "s3a_secret_key"],
      additionalProperties: false
    },
    metadata_extraction_method: "direct_spark"
  },
  {
    label: "PostgreSQL",
    name: "postgresql",
    color_hex: "#123123",
    icon: "postgres",
    description: "PostgreSQL database",
    connection_params_schema: {
      type: "object",
      properties: {
        host: {
          type: "string",
          description: "Endereço do servidor PostgreSQL"
        },
        port: {
          type: "integer",
          description: "Porta do servidor PostgreSQL",
          default: 5432
        },
        database: {
          type: "string",
          description: "Nome do banco de dados"
        },
        username: {
          type: "string",
          description: "Usuário para autenticação"
        },
        password: {
          type: "string",
          description: "Senha para autenticação"
        },
        sslmode: {
          type: "string",
          description: "Modo SSL (disable, require, verify-ca, verify-full)",
          default: "prefer"
        }
      },
      required: ["host", "port", "database", "username", "password"],
      additionalProperties: false
    },
    metadata_extraction_method: "direct_query"
  },
  {
    label: "MySQL",
    name: "mysql",
    color_hex: "#00618A",
    icon: "mysql",
    description: "MySQL database",
    connection_params_schema: {
      type: "object",
      properties: {
        host: { type: "string", description: "Host do MySQL" },
        port: { type: "integer", description: "Porta do MySQL", default: 3306 },
        database: { type: "string", description: "Nome do banco de dados" },
        username: { type: "string", description: "Usuário para autenticação" },
        password: { type: "string", description: "Senha para autenticação" }
      },
      required: ["host", "port", "database", "username", "password"],
      additionalProperties: false
    },
    metadata_extraction_method: "direct_query"
  },
];

const EXTRACTION_METHODS = [
  { value: "none", label: "Nenhum" },
  { value: "direct_query", label: "Consulta Direta" },
  { value: "direct_spark", label: "Spark Direto" }
];

export default function ConnectionTypeModal({ editingType, onClose }) {
  const [selectedIdx, setSelectedIdx] = useState(
    editingType
      ? CONNECTION_TEMPLATES.findIndex(t => t.name === editingType.name)
      : 0
  );
  const [custom, setCustom] = useState(editingType ? false : false);
  const [name, setName] = useState(editingType?.name || CONNECTION_TEMPLATES[0].name);
  const [colorHex, setColorHex] = useState(editingType?.color_hex || CONNECTION_TEMPLATES[0].color_hex);
  const [icon, setIcon] = useState(editingType?.icon || CONNECTION_TEMPLATES[0].icon);
  const [description, setDescription] = useState(editingType?.description || CONNECTION_TEMPLATES[0].description);
  const [schema, setSchema] = useState(
    editingType
      ? JSON.stringify(editingType.connection_params_schema, null, 2)
      : JSON.stringify(CONNECTION_TEMPLATES[0].connection_params_schema, null, 2)
  );
  const [extractionMethod, setExtractionMethod] = useState(
    editingType?.metadata_extraction_method ||
    CONNECTION_TEMPLATES[0].metadata_extraction_method ||
    "none"
  );
  const [saving, setSaving] = useState(false);

  const handleSliderChange = idx => {
    setSelectedIdx(idx);
    setCustom(false);
    const template = CONNECTION_TEMPLATES[idx];
    setName(template.name);
    setColorHex(template.color_hex);
    setIcon(template.icon);
    setDescription(template.description);
    setSchema(JSON.stringify(template.connection_params_schema, null, 2));
    setExtractionMethod(template.metadata_extraction_method || "none");
  };

  const handleCustom = () => {
    setCustom(true);
    setName('');
    setColorHex('#C72E29');
    setIcon('');
    setDescription('');
    setSchema(`{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}`);
    setExtractionMethod("none");
  };

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        icon,
        color_hex: colorHex,
        connection_params_schema: JSON.parse(schema),
        metadata_extraction_method: extractionMethod
      };
      const res = await fetch('http://localhost:8004/api/connection/', {
        method: editingType ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Erro ao salvar tipo de conexão!");
      onClose();
    } catch (e) {
      alert("Falha ao salvar. Verifique os dados do schema.");
    }
    setSaving(false);
  }

  return (
    <div className={styles.typeModalOverlay}>
      <div className={styles.typeModalContainer}>
        <div className={styles.typeModalHeader}>
          <h2 className={styles.typeModalTitle}>
            {editingType ? "Editar Tipo de Conexão" : "Novo Tipo de Conexão"}
          </h2>
          <button className={styles.typeCloseButton} onClick={onClose}>
            <X className={styles.typeCloseIcon} />
          </button>
        </div>
        <div className={styles.typeModalBody}>
          {/* SLIDER SELECTOR */}
          <div className={styles.sliderRow}>
            {CONNECTION_TEMPLATES.map((t, idx) => (
              <button
                key={t.name}
                className={`${styles.sliderBtn} ${selectedIdx === idx && !custom ? styles.sliderBtnActive : ""}`}
                onClick={() => handleSliderChange(idx)}
                type="button"
              >
                <span className={styles.sliderIcon} style={{ background: t.color_hex }}>{t.icon[0].toUpperCase()}</span>
                <span>{t.label}</span>
              </button>
            ))}
            <button
              className={`${styles.sliderBtn} ${custom ? styles.sliderBtnActive : ""}`}
              onClick={handleCustom}
              type="button"
            >
              <span className={styles.sliderIcon} style={{ background: '#6B7280' }}>+</span>
              <span>Personalizado</span>
            </button>
          </div>
          {/* FORM */}
          <div className={styles.typeForm}>
            <div className={styles.typeFormSection}>
              <h3 className={styles.typeFormSectionTitle}>Informações Básicas</h3>
              <div className={styles.typeTwoColGrid}>
                <div className={styles.typeFormField}>
                  <label className={styles.typeFormLabel}>Nome</label>
                  <input
                    type="text"
                    className={styles.typeFormInput}
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
                <div className={styles.typeFormField} >
                  <label className={styles.typeFormLabel}>Cor (HEX)</label>
                  <input
                    type="color"
                    className={styles.typeFormInput}
                    value={colorHex}
                    onChange={e => setColorHex(e.target.value)}
                    style={{ width: '30px', maxWidth: '25px', height: '25px', marginLeft: '0.5rem' }}
                  />
                </div>
              </div>
              <div className={styles.typeFormField}>
                <label className={styles.typeFormLabel}>Descrição</label>
                <textarea
                  className={styles.typeFormTextarea}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className={styles.typeFormField}>
                <label className={styles.typeFormLabel}>Ícone</label>
                <input
                  type="text"
                  className={styles.typeFormInput}
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  placeholder="Nome do ícone, ex: minio"
                />
              </div>
              <div className={styles.typeFormField}>
                <label className={styles.typeFormLabel}>Método de Extração</label>
                <select
                  className={styles.typeFormInput}
                  value={extractionMethod}
                  onChange={e => setExtractionMethod(e.target.value)}
                >
                  {EXTRACTION_METHODS.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles.typeFormSection}>
              <h3 className={styles.typeFormSectionTitle}>Schema dos Parâmetros de Conexão</h3>
              <textarea
                className={styles.schemaEditor}
                rows={10}
                value={schema}
                onChange={e => setSchema(e.target.value)}
                spellCheck={false}
              />
              <div className={styles.typeFormHint}>
                Edite em formato JSON Schema.
              </div>
            </div>
          </div>
        </div>
        <div className={styles.typeModalFooter}>
          <button className={styles.typeSecondaryButton} onClick={onClose}>
            Cancelar
          </button>
          <button className={styles.typePrimaryButton} disabled={saving} onClick={handleSave}>
            {editingType ? "Atualizar Tipo" : (saving ? "Salvando..." : "Criar Tipo")}
          </button>
        </div>
      </div>
    </div>
  );
}