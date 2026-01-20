import { useEffect, useState } from 'react';
import dsStyles from './DeltaSharingUI.module.css';
import styles from './delta-sharing.module.css';
import RecipientCard from './RecipientCard';
import RecipientDetails from './RecipientDetails';

export default function RecipientsView({ selectedItem, handleSelectItem, openEditRecipientModal }) {
  const [recipients, setRecipients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecipients() {
      setLoading(true);
      try {
        const res = await fetch('http://localhost:8004/api/delta-sharing/recipients/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page: 1, size: 100 })
        });
        const data = await res.json();
        setRecipients(data.items || []);
      } catch (e) {
        setRecipients([]);
      }
      setLoading(false);
    }
    fetchRecipients();
  }, []);

  return (
    <>
      <div className={dsStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recipients</h2>
        <span className={dsStyles.connectionCount}>
          {recipients.filter(r => r.is_active).length} of {recipients.length}
        </span>
      </div>
      
      <div className={dsStyles.connectionsGrid}>
        {loading ? <div>Loading...</div> : recipients.map((recipient) => (
          <RecipientCard 
            key={recipient.id}
            recipient={recipient}
            isSelected={selectedItem === recipient.id}
            onSelect={() => handleSelectItem(recipient.id)}
            onEdit={() => openEditRecipientModal(recipient)}
            setRecipients={setRecipients}
          />
        ))}
      </div>
      
      {selectedItem && (
        <RecipientDetails 
          recipient={recipients.find(r => r.id === selectedItem)}
          onClose={() => handleSelectItem(0)}
          setRecipients={setRecipients}
        />
      )}
    </>
  );
}

