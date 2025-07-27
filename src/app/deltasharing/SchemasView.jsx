import { useEffect, useState } from 'react';
import dsStyles from './DeltaSharingUI.module.css';
import styles from './delta-sharing.module.css';
import SchemaCard from './SchemaCard';
import SchemaDetails from './SchemaDetails';

export default function SchemasView({ 
  selectedItem, 
  handleSelectItem,
  openEditSchemaModal,
  selectedShareId,
  setSelectedSchemaId
}) {
  const [schemas, setSchemas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch schemas from API on mount
  useEffect(() => {
    async function fetchSchemas() {
      setLoading(true);
      try {
        if (!selectedShareId) {
          setSchemas([]);
          setLoading(false);
          return;
        }
        
        const res = await fetch(`http://localhost:8004/api/delta-sharing/shares/${selectedShareId}/schemas/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1,
            size: 100
          })
        });
        const data = await res.json();
        setSchemas(data.items || []);
      } catch (e) {
        console.error('Error fetching schemas:', e);
        setSchemas([]);
      }
      setLoading(false);
    }
    fetchSchemas();
  }, [selectedShareId]);

  if (!selectedShareId) {
    return (
      <div className={styles.content}>
        <div className={dsStyles.noUsage}>
          Please select a share first to view its schemas.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={dsStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Schemas in Share {selectedShareId}</h2>
        <span className={dsStyles.connectionCount}>
          {schemas.length} schemas
        </span>
      </div>
      
      <div className={dsStyles.connectionsGrid}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          schemas.map((schema) => (
            <SchemaCard 
              key={schema.id}
              schema={schema}
              isSelected={selectedItem === schema.id}
              onSelect={() => {
                handleSelectItem(schema.id);
                setSelectedSchemaId(schema.id);
              }}
              onEdit={() => openEditSchemaModal(schema)}
              setSchemas={setSchemas}
            />
          ))
        )}
      </div>
      
      {selectedItem && (
        <SchemaDetails 
          schema={schemas.find((s) => s.id === selectedItem)}
          onClose={() => handleSelectItem(0)}
          setSchemas={setSchemas}
        />
      )}
    </>
  );
}

