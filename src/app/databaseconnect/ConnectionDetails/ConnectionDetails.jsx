import { useState } from 'react';
import { X, Copy, RefreshCw, Trash2, Link2 } from 'lucide-react';
import dbStyles from '../DatabaseConnectUI.module.css';

export default function ConnectionDetails({ connection, onClose, setConnections }) {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);

  if (!connection) return null;

  const getConnectionStatusClass = (status) => {
    switch (status) {
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

  async function handleSync(e) {
    e.stopPropagation();
    await fetch(`http://localhost:8004/api/data-connections/${connection.id}/sync`, {
      method: 'POST',
      headers: { 'accept': 'application/json' }
    });
  }

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Remover esta conexão?")) return;
    const res = await fetch(`http://localhost:8004/api/data-connections/${connection.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConnections(conns => conns.filter(t => t.id !== connection.id));
      onClose();
    } else {
      alert('Falha ao remover conexão!');
    }
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  async function handleTestConnection(e) {
    e.stopPropagation();
    setTesting(true);
    setTestResult(null);
    setTestError(null);
    try {
      const res = await fetch(`http://localhost:8004/api/data-connections/${connection.id}/test`, {
        method: 'POST',
        headers: { 'accept': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult(data);
        setTestError(null);
      } else {
        setTestResult(null);
        setTestError(data.message || "Falha ao testar conexão.");
      }
    } catch (e) {
      setTestResult(null);
      setTestError("Erro inesperado ao testar conexão.");
    }
    setTesting(false);
  }

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
              <span className={dbStyles.detailsLabel}>Descrição</span>
              <span className={dbStyles.detailsValue}>{connection.description}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Tipo</span>
              <span className={dbStyles.detailsValue}>{connection.connection_type_id}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Status</span>
              <span className={dbStyles.detailsValue}>{connection.status}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Cron</span>
              <span className={dbStyles.detailsValue}>{connection.cron_expression}</span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Próxima sincronização</span>
              <span className={dbStyles.detailsValue}>
                {connection.next_sync_time ? new Date(connection.next_sync_time).toLocaleString() : "—"}
              </span>
            </div>
            <div className={dbStyles.detailsItem}>
              <span className={dbStyles.detailsLabel}>Última sincronização</span>
              <span className={dbStyles.detailsValue}>
                {connection.last_sync_time ? new Date(connection.last_sync_time).toLocaleString() : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Parâmetros</h4>
          <pre className={dbStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14, overflow: "auto" }}>
            {JSON.stringify(connection.connection_params, null, 2)}
            <button onClick={() => copyToClipboard(JSON.stringify(connection.connection_params, null, 2))} className={dbStyles.copyButton} style={{ marginLeft: 8 }}>
              <Copy className={dbStyles.copyIcon} />
            </button>
          </pre>
        </div>

        <div className={dbStyles.detailsSection}>
          <h4 className={dbStyles.detailsSectionTitle}>Testar Conexão</h4>
          <button
            className={dbStyles.detailsSecondaryButton}
            onClick={handleTestConnection}
            disabled={testing}
            style={{ marginBottom: 12 }}
          >
            <Link2 className={dbStyles.detailsActionIcon} />
            <span>{testing ? "Testando..." : "Testar Conexão"}</span>
          </button>
          {testResult &&
            <div className={dbStyles.testConnectionResult} style={{ color: "green", marginTop: 8 }}>
              <div>✅ {testResult.message}</div>
              {testResult.details && (
                <pre style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14, overflow: "auto" }}>
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              )}
            </div>
          }
          {testError &&
            <div className={dbStyles.testConnectionResult} style={{ color: "red", marginTop: 8 }}>
              <div>❌ {testError}</div>
            </div>
          }
        </div>

        <div className={dbStyles.detailsActions}>
          <button className={dbStyles.detailsSecondaryButton} onClick={handleSync}>
            <RefreshCw className={dbStyles.detailsActionIcon} />
            <span>Sincronizar</span>
          </button>
          <button className={dbStyles.detailsDestructiveButton} onClick={handleDelete}>
            <Trash2 className={dbStyles.detailsActionIcon} />
            <span>Remover Conexão</span>
          </button>
        </div>
      </div>
    </div>
  );
}