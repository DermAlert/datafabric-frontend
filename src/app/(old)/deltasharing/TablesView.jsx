import { useEffect, useState } from 'react';
import dsStyles from './DeltaSharingUI.module.css';
import styles from './delta-sharing.module.css';
import TableCard from './TableCard';
import TableDetails from './TableDetails';

export default function TablesView({ 
  selectedItem, 
  handleSelectItem,
  openEditTableModal,
  selectedShareId,
  selectedSchemaId
}) {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch tables from API on mount
  useEffect(() => {
    async function fetchTables() {
      setLoading(true);
      try {
        if (!selectedShareId || !selectedSchemaId) {
          setTables([]);
          setLoading(false);
          return;
        }
        
        const res = await fetch(`http://localhost:8004/api/delta-sharing/shares/${selectedShareId}/schemas/${selectedSchemaId}/tables/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1,
            size: 100
          })
        });
        const data = await res.json();
        setTables(data.items || []);
      } catch (e) {
        console.error('Error fetching tables:', e);
        setTables([]);
      }
      setLoading(false);
    }
    fetchTables();
  }, [selectedShareId, selectedSchemaId]);

  if (!selectedShareId || !selectedSchemaId) {
    return (
      <div className={styles.content}>
        <div className={dsStyles.noUsage}>
          Please select a share and schema first to view tables.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={dsStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Tables in Schema {selectedSchemaId}</h2>
        <span className={dsStyles.connectionCount}>
          {tables.length} tables
        </span>
      </div>
      
      <div className={dsStyles.connectionsGrid}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          tables.map((table) => (
            <TableCard 
              key={table.id}
              table={table}
              isSelected={selectedItem === table.id}
              onSelect={() => handleSelectItem(table.id)}
              onEdit={() => openEditTableModal(table)}
              setTables={setTables}
            />
          ))
        )}
      </div>
      
      {selectedItem && (
        <TableDetails 
          table={tables.find((t) => t.id === selectedItem)}
          onClose={() => handleSelectItem(0)}
          setTables={setTables}
        />
      )}
    </>
  );
}

