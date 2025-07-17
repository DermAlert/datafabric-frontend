import { X, Copy, RefreshCw, Code, Table, Folder, Trash2 } from 'lucide-react';
import dbStyles from '../DatabaseConnectUI.module.css';

export default function ConnectionDetails({ connection, onClose }) {
  
  const getConnectionStatusClass = (status) => {
    switch(status) {
      case "connected":
        return dbStyles.statusConnected;
      case "disconnected":
        return dbStyles.statusDisconnected;
      case "error":
        return dbStyles.statusError;
      default:
        return dbStyles.statusPending;
    }
  };

  return (
    <div className={dbStyles.databaseDetails}>
      <div className={dbStyles.detailsHeader}>
        <h3 className={dbStyles.detailsTitle}>Detalhes da Conexão</h3>
        <button className={dbStyles.closeDetailsButton} onClick={onClose}>
          <X className={dbStyles.closeDetailsIcon} />
        </button>
      </div>
      
      <div className={dbStyles.detailsContent}>
        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Informações da Conexão</h4>
          <div className={dbStyles.detailsGrid}>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Nome</span>
              <span className={dbStyles.detailsValue}>{connection.name}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Tipo</span>
              <span className={dbStyles.detailsValue}>{connection.type}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Host</span>
              <div className={dbStyles.detailsValueWithCopy}>
                <span>{connection.host}</span>
                <button className={dbStyles.copyButton}>
                  <Copy className={dbStyles.copyIcon} />
                </button>
              </div>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Porta</span>
              <span className={dbStyles.detailsValue}>{connection.port}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Banco de Dados</span>
              <span className={dbStyles.detailsValue}>{connection.database}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Usuário</span>
              <span className={dbStyles.detailsValue}>{connection.username}</span>
            </div>
          </div>
        </div>
        
        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Status da Conexão</h4>
          <div className={dbStyles.statusInfo}>
            <div className={`${dbStyles.statusIndicator} ${getConnectionStatusClass(connection.status)}`} />
            <div className={dbStyles.statusDetails}>
              <div className={dbStyles.statusText}>
                {connection.status === "connected" ? "Conectado" : 
                 connection.status === "disconnected" ? "Desconectado" : 
                 connection.status === "error" ? "Erro de Conexão" : "Pendente"}
              </div>
              {connection.status === "connected" && (
                <div className={dbStyles.statusSubtext}>
                  Conectado desde {connection.lastConnected}
                </div>
              )}
              {connection.status === "error" && (
                <div className={dbStyles.statusSubtext}>
                  Erro ao conectar: Timeout após 30 segundos
                </div>
              )}
            </div>
            <button className={dbStyles.reconnectButton}>
              <RefreshCw className={dbStyles.reconnectIcon} />
              <span>Reconectar</span>
            </button>
          </div>
        </div>
        
        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Utilização</h4>
          {connection.usedBy.length > 0 ? (
            <div className={dbStyles.usageList}>
              {connection.usedBy.map((item, index) => (
                <div key={index} className={dbStyles.usageItem}>
                  <Folder className={dbStyles.usageIcon} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className={dbStyles.noUsage}>
              Esta conexão não está sendo utilizada por nenhum pipeline ou dataset.
            </div>
          )}
        </div>
        
        <div className={dbStyles.detailsActions}>
          <button className={dbStyles.detailsSecondaryButton}>
            <Code className={dbStyles.detailsActionIcon} />
            <span>Consulta SQL</span>
          </button>
          <button className={dbStyles.detailsSecondaryButton}>
            <Table className={dbStyles.detailsActionIcon} />
            <span>Explorar Dados</span>
          </button>
          <button className={dbStyles.detailsDestructiveButton}>
            <Trash2 className={dbStyles.detailsActionIcon} />
            <span>Remover Conexão</span>
          </button>
        </div>
      </div>
    </div>
  );
}