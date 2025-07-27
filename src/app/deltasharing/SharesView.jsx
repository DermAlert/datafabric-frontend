import { useEffect, useState } from 'react';
import dsStyles from './DeltaSharingUI.module.css';
import styles from './delta-sharing.module.css';
import ShareCard from './ShareCard';
import ShareDetails from './ShareDetails';

export default function SharesView({ 
  selectedItem, 
  handleSelectItem,
  openEditShareModal,
  setSelectedShareId
}) {
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch shares from API on mount
  useEffect(() => {
    async function fetchShares() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8004/api/delta-sharing/shares/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            page: 1,
            size: 100
          })
        });
        const data = await res.json();
        setShares(data.items || []);
      } catch (e) {
        console.error('Error fetching shares:', e);
        setShares([]);
      }
      setLoading(false);
    }
    fetchShares();
  }, []);

  return (
    <>
      <div className={dsStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Active Shares</h2>
        <span className={dsStyles.connectionCount}>
          {shares.filter((share) => share.status === "active").length} of {shares.length}
        </span>
      </div>
      
      <div className={dsStyles.connectionsGrid}>
        {loading ? (
          <div>Loading...</div>
        ) : (
          shares.map((share) => (
            <ShareCard 
              key={share.id}
              share={share}
              isSelected={selectedItem === share.id}
              onSelect={() => {
                handleSelectItem(share.id);
                setSelectedShareId(share.id);
              }}
              onEdit={() => openEditShareModal(share)}
              setShares={setShares}
            />
          ))
        )}
      </div>
      
      {selectedItem && (
        <ShareDetails 
          share={shares.find((s) => s.id === selectedItem)}
          onClose={() => handleSelectItem(0)}
          setShares={setShares}
        />
      )}
    </>
  );
}

