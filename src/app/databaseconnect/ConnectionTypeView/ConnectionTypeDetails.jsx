import { X, Copy } from 'lucide-react';
import dbStyles from '../DatabaseConnectUI.module.css';

export default function ConnectionTypeDetails({ type, onClose }) {
  if (!type) return null;

  function copySchema() {
    navigator.clipboard.writeText(JSON.stringify(type.connection_params_schema, null, 2));
  }

  return (
    <div className={dbStyles.databaseDetails}>
      <div className={dbStyles.detailsHeader}>
        <h3 className={dbStyles.detailsTitle}>Detalhes do Tipo de Conexão</h3>
        <button className={dbStyles.closeDetailsButton} onClick={onClose}>
          <X className={dbStyles.closeDetailsIcon} />
        </button>
      </div>

      <div className={dbStyles.detailsContent}>
        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Informações Básicas</h4>
          <div className={dbStyles.detailsGrid}>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Nome</span>
              <span className={dbStyles.detailsValue}>{type.name}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Descrição</span>
              <span className={dbStyles.detailsValue}>{type.description}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Cor</span>
              <span className={dbStyles.detailsValue}>{type.color_hex}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Ícone</span>
              <span className={dbStyles.detailsValue}>{type.icon}</span>
            </div>
          </div>
        </div>

        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Método de Extração</h4>
          <div className={dbStyles.detailsValue}>{type.metadata_extraction_method}</div>
        </div>

        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Schema dos Parâmetros</h4>
          <pre className={dbStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14, overflow: "auto" }}>
            {JSON.stringify(type.connection_params_schema, null, 2)}
            <button onClick={copySchema} className={dbStyles.copyButton} style={{ marginLeft: 8 }}>
              <Copy className={dbStyles.copyIcon} />
            </button>
          </pre>
        </div>
      </div>
    </div>
  );
}