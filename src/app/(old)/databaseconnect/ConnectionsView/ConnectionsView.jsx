import { useEffect, useState } from 'react';
import dbStyles from '../DatabaseConnectUI.module.css';
import styles from '../database.module.css';
import ConnectionCard from '../ConnectionCard/ConnectionCard';
import ConnectionDetails from '../ConnectionDetails/ConnectionDetails';

export default function ConnectionsView({ 
  selectedDatabase, 
  handleSelectDatabase,
  openEditConnectionModal
}) {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data connections from API on mount
  useEffect(() => {
    async function fetchConnections() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8004/api/data-connections/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagination: { limit: 100, query_total: false, skip: 0 }
          })
        });
        const data = await res.json();
        setConnections(data.items || []);
      } catch (e) {
        setConnections([]);
      }
      setLoading(false);
    }
    fetchConnections();
  }, []);

  return (
    <>
      <div className={dbStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Conexões Ativas</h2>
        <span className={dbStyles.connectionCount}>
          {connections.filter(conn => conn.status === "connected" || conn.status === "active" || conn.status === "success").length} de {connections.length}
        </span>
      </div>
      
      <div className={dbStyles.connectionsGrid}>
        {loading ? (
          <div>Carregando...</div>
        ) : (
          connections.map(connection => (
            <ConnectionCard 
              key={connection.id}
              connection={connection}
              isSelected={selectedDatabase === connection.id}
              onSelect={() => handleSelectDatabase(connection.id)}
              onEdit={() => openEditConnectionModal(connection)}
              setConnections={setConnections}
            />
          ))
        )}
      </div>
      
      {selectedDatabase && (
        <ConnectionDetails 
          connection={connections.find(c => c.id === selectedDatabase)}
          onClose={() => handleSelectDatabase(null)}
          setConnections={setConnections}
        />
      )}
    </>
  );
}