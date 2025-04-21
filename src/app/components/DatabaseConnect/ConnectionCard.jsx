import { Database, RefreshCw, Edit } from 'lucide-react';
import dbStyles from './DatabaseConnectUI.module.css';

export default function ConnectionCard({ connection, isSelected, onSelect, onEdit }) {
  
  const getConnectionStatusIcon = (status) => {
    switch(status) {
      case "connected":
        return <span className={dbStyles.statusIconConnected}>✓</span>;
      case "disconnected":
        return <span className={dbStyles.statusIconDisconnected}>!</span>;
      case "error":
        return <span className={dbStyles.statusIconError}>✕</span>;
      default:
        return <span className={dbStyles.statusIconPending}>⏱</span>;
    }
  };

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
    <div 
      className={`${dbStyles.connectionCard} ${isSelected ? dbStyles.connectionCardSelected : ""}`}
      onClick={onSelect}
    >
      <div className={dbStyles.connectionCardHeader}>
        <div className={dbStyles.connectionType}>
          <Database className={dbStyles.connectionTypeIcon} />
          <span>{connection.type}</span>
        </div>
        <div className={`${dbStyles.connectionStatus} ${getConnectionStatusClass(connection.status)}`}>
          {getConnectionStatusIcon(connection.status)}
          <span>
            {connection.status === "connected" ? "Conectado" : 
             connection.status === "disconnected" ? "Desconectado" : 
             connection.status === "error" ? "Erro" : "Pendente"}
          </span>
        </div>
      </div>
      
      <h3 className={dbStyles.connectionName}>{connection.name}</h3>
      
      <div className={dbStyles.connectionDetails}>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Host</span>
          <span className={dbStyles.detailValue}>{connection.host}</span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Banco</span>
          <span className={dbStyles.detailValue}>{connection.database}</span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Tabelas</span>
          <span className={dbStyles.detailValue}>{connection.tables}</span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Última conexão</span>
          <span className={dbStyles.detailValue}>
            {connection.status === "connected" ? `${connection.lastConnected}` : "—"}
          </span>
        </div>
      </div>
      
      <div className={dbStyles.connectionActions}>
        <button 
          className={dbStyles.connectionAction}
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
        >
          <Edit className={dbStyles.actionIcon} />
          <span>Editar</span>
        </button>
        <button className={dbStyles.connectionAction}>
          <RefreshCw className={dbStyles.actionIcon} />
          <span>Reconectar</span>
        </button>
      </div>
    </div>
  );
}