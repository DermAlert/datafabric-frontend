import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import styles from './RecentSourcesSection.module.css';

export default function RecentSourcesSection() {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionTypes, setConnectionTypes] = useState({});

  // Fetch connection types
  const fetchConnectionTypes = async () => {
    try {
      const response = await fetch('http://localhost:8004/api/connection/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pagination: { limit: 100, skip: 0, query_total: false }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connection types');
      }

      const data = await response.json();
      // Convert array to object for easier lookup
      const typesMap = {};
      data.items.forEach(type => {
        typesMap[type.id] = type;
      });
      
      return typesMap;
    } catch (err) {
      console.error('Error fetching connection types:', err);
      setError('Failed to load connection types');
      return {};
    }
  };

  // Fetch data connections
  const fetchConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First fetch connection types
      const typeMap = await fetchConnectionTypes();
      setConnectionTypes(typeMap);
      
      // Then fetch connections
      const response = await fetch('http://localhost:8004/api/data-connections/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pagination: { limit: 5, skip: 0, query_total: false } // Limit to 5 most recent
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      
      // Enhance connections with their type info
      const enhancedConnections = data.items.map(conn => {
        const connType = typeMap[conn.connection_type_id] || {};
        return {
          ...conn,
          type: connType.name || 'Unknown',
          server: getServerFromParams(conn.connection_params, connType.name),
          status: conn.status === 'active' ? 'Conectado' : 'Desconectado'
        };
      });
      
      setConnections(enhancedConnections);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extract server information from connection params based on connection type
  const getServerFromParams = (params, type) => {
    if (!params) return 'N/A';
    
    switch (type?.toLowerCase()) {
      case 'postgresql':
        return `${params.host || 'localhost'}:${params.port || '5432'}`;
      case 'mysql':
        return `${params.host || 'localhost'}:${params.port || '3306'}`;
      case 'minio':
        return params.endpoint || 'N/A';
      case 'deltalake':
        return params.s3a_endpoint || 'N/A';
      default:
        // Try to find host/endpoint in the params
        if (params.host) return params.host;
        if (params.endpoint) return params.endpoint;
        if (params.server) return params.server;
        return 'N/A';
    }
  };

  // Fetch connections on component mount
  useEffect(() => {
    fetchConnections();
  }, []);

  const handleRefresh = () => {
    fetchConnections();
  };

  // Get the current date in YYYY-MM-DD format
  const getCurrentDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  };

  return (
    <div className={styles.recentSourcesSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Fontes Recentes</h2>
        <div className={styles.headerActions}>
          <span className={styles.lastUpdated}>
            Atualizado em: {getCurrentDate()}
          </span>
          <button 
            className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} />
          </button>
          <button className={styles.sectionTitleLink}>Ver Todas</button>
        </div>
      </div>
      
      <div className={styles.tableContainer}>
        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw className={styles.spinningIcon} size={18} />
            <span>Carregando fontes de dados...</span>
          </div>
        ) : error ? (
          <div className={styles.errorState}>
            <p>Erro ao carregar fontes de dados: {error}</p>
            <button className={styles.retryButton} onClick={handleRefresh}>
              Tentar novamente
            </button>
          </div>
        ) : connections.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Nenhuma fonte de dados encontrada.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead className={styles.tableHeader}>
              <tr>
                <th className={styles.tableHeaderCell}>Nome</th>
                <th className={styles.tableHeaderCell}>Tipo</th>
                <th className={styles.tableHeaderCell}>Servidor</th>
                <th className={styles.tableHeaderCell}>Status</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {connections.map((source, index) => (
                <tr key={source.id || index} className={styles.tableRow}>
                  <td className={styles.tableCell}>{source.name}</td>
                  <td className={styles.tableCellMuted}>{source.type}</td>
                  <td className={styles.tableCellMuted}>{source.server}</td>
                  <td className={styles.tableCell}>
                    <span className={`${styles.statusBadge} ${source.status === 'Conectado' ? styles.statusConnected : styles.statusDisconnected}`}>
                      {source.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}