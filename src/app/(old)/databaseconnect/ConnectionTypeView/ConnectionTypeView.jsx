import { useEffect, useState } from 'react';
import dbStyles from '../DatabaseConnectUI.module.css';
import styles from '../database.module.css';
import ConnectionTypeCard from './ConnectionTypeCard';
import ConnectionTypeDetails from './ConnectionTypeDetails';

export default function ConnectionTypeView({
  selectedTypeId,
  setSelectedTypeId,
  openEditTypeModal,
}) {
  const [connectionTypes, setConnectionTypes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTypes() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8004/api/connection/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pagination: { limit: 100, query_total: false, skip: 0 },
            connection_type_id: 0,
            name: "",
            metadata_extraction_method: ""
          })
        });
        const data = await res.json();
        setConnectionTypes(data.items || []);
      } catch {
        setConnectionTypes([]);
      }
      setLoading(false);
    }
    fetchTypes();
  }, []);

  return (
    <>
      <div className={dbStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tipos de Conexão</h2>
        <span className={dbStyles.connectionCount}>
          {connectionTypes.length}
        </span>
      </div>

      <div className={dbStyles.connectionsGrid}>
        {loading ? (
          <div>Carregando...</div>
        ) : (
          connectionTypes.map(type => (
            <ConnectionTypeCard
              key={type.id}
              type={type}
              isSelected={selectedTypeId === type.id}
              onSelect={() => setSelectedTypeId(type.id)}
              onEdit={() => openEditTypeModal(type)}
              setConnectionTypes={setConnectionTypes}
            />
          ))
        )}
      </div>

      {selectedTypeId && (
        <ConnectionTypeDetails
          type={connectionTypes.find(c => c.id === selectedTypeId)}
          onClose={() => setSelectedTypeId(null)}
        />
      )}
    </>
  );
}