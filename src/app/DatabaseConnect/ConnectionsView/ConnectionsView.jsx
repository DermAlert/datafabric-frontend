import styles from '../database.module.css'
import dbStyles from '../DatabaseConnectUI.module.css';
import ConnectionCard from '../ConnectionCard/ConnectionCard';
import ConnectionDetails from '../ConnectionDetails/ConnectionDetails';

export default function ConnectionsView({ 
  connections, 
  selectedDatabase, 
  handleSelectDatabase,
  openEditConnectionModal 
}) {
  return (
    <>
      <div className={dbStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Conexões Ativas</h2>
        <span className={dbStyles.connectionCount}>
          {connections.filter(conn => conn.status === "connected").length} de {connections.length}
        </span>
      </div>
      
      <div className={dbStyles.connectionsGrid}>
        {connections.map(connection => (
          <ConnectionCard 
            key={connection.id}
            connection={connection}
            isSelected={selectedDatabase === connection.id}
            onSelect={() => handleSelectDatabase(connection.id)}
            onEdit={() => openEditConnectionModal(connection)}
          />
        ))}
      </div>
      
      {selectedDatabase && (
        <ConnectionDetails 
          connection={connections.find(c => c.id === selectedDatabase)}
          onClose={() => handleSelectDatabase(null)}
        />
      )}
    </>
  );
}