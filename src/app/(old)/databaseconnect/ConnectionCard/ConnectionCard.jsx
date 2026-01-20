import { useState } from 'react';
import { Database, RefreshCw, Edit } from 'lucide-react';
import dbStyles from '../DatabaseConnectUI.module.css';

export default function ConnectionCard({ connection, isSelected, onSelect, onEdit, setConnections }) {
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const getConnectionStatusIcon = (status) => {
    switch(status) {
      case "connected":
      case "active":
      case "success":
        return <span className={dbStyles.statusIconConnected}>✓</span>;
      case "disconnected":
        return <span className={dbStyles.statusIconDisconnected}>!</span>;
      case "error":
      case "failed":
        return <span className={dbStyles.statusIconError}>✕</span>;
      default:
        return <span className={dbStyles.statusIconPending}>⏱</span>;
    }
  };

  const getConnectionStatusClass = (status) => {
    switch(status) {
      case "connected":
      case "active":
      case "success":
        return dbStyles.statusConnected;
      case "disconnected":
        return dbStyles.statusDisconnected;
      case "error":
      case "failed":
        return dbStyles.statusError;
      default:
        return dbStyles.statusPending;
    }
  };

  async function handleReconnect(e) {
    e.stopPropagation();
    if (!window.confirm("Tentar sincronizar esta conexão?")) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`http://localhost:8004/api/data-connections/${connection.id}/sync`, {
        method: 'POST',
        headers: { 'accept': 'application/json' }
      });
      const data = await res.json();
      setSyncResult(data.message || 'Sincronização enviada');
    } catch {
      setSyncResult('Erro ao sincronizar');
    }
    setSyncing(false);
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Remover esta conexão?")) return;
    const res = await fetch(`http://localhost:8004/api/data-connections/${connection.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConnections(conns => conns.filter(t => t.id !== connection.id));
    } else {
      alert('Falha ao remover conexão!');
    }
  }

  return (
    <div 
      className={`${dbStyles.connectionCard} ${isSelected ? dbStyles.connectionCardSelected : ""}`}
      onClick={onSelect}
    >
      <div className={dbStyles.connectionCardHeader}>
        <div className={dbStyles.connectionType}>
          <Database className={dbStyles.connectionTypeIcon} />
          <span>{connection.name}</span>
        </div>
        <div className={`${dbStyles.connectionStatus} ${getConnectionStatusClass(connection.status)}`}>
          {getConnectionStatusIcon(connection.status)}
          <span>
            {connection.status === "connected" || connection.status === "active" || connection.status === "success"
              ? "Conectado"
              : connection.status === "disconnected" ? "Desconectado"
              : connection.status === "error" || connection.status === "failed" ? "Erro"
              : "Pendente"}
          </span>
        </div>
      </div>
      
      <h3 className={dbStyles.connectionName}>{connection.description}</h3>
      
      <div className={dbStyles.connectionDetails}>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Tipo</span>
          <span className={dbStyles.detailValue}>{connection.connection_type_id}</span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Status</span>
          <span className={dbStyles.detailValue}>{connection.status}</span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Próxima sincronização</span>
          <span className={dbStyles.detailValue}>
            {connection.next_sync_time ? new Date(connection.next_sync_time).toLocaleString() : "—"}
          </span>
        </div>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Última sincronização</span>
          <span className={dbStyles.detailValue}>
            {connection.last_sync_time ? new Date(connection.last_sync_time).toLocaleString() : "—"}
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
        <button className={dbStyles.connectionAction} onClick={handleReconnect} disabled={syncing}>
          <RefreshCw className={dbStyles.actionIcon} />
          <span>{syncing ? 'Sincronizando...' : 'Sincronizar'}</span>
        </button>
        <button className={dbStyles.connectionAction} onClick={handleDelete}>
          <span className={dbStyles.actionIcon} style={{color: "#f87171"}}>✕</span>
          <span>Remover</span>
        </button>
      </div>
      {syncResult && (
        <div style={{ marginTop: 8, color: "#059669", fontSize: 13, fontWeight: 500 }}>
          {syncResult}
        </div>
      )}
    </div>
  );
}