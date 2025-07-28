import { useEffect, useState } from 'react';
import { X, Search, Users, Share } from 'lucide-react';
import styles from './RecipientModal.module.css'; 

export default function ShareRecipientModal({ onClose, initialRecipientId = null, initialShareId = null, isOpen = true }) {
  // Don't render the modal if not open
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('recipients-to-shares'); // 'recipients-to-shares' or 'shares-to-recipients'
  const [recipients, setRecipients] = useState([]);
  const [shares, setShares] = useState([]);
  const [selectedRecipient, setSelectedRecipient] = useState(initialRecipientId);
  const [selectedShare, setSelectedShare] = useState(initialShareId);
  const [selectedItems, setSelectedItems] = useState([]);
  
  const [recipientSearch, setRecipientSearch] = useState('');
  const [shareSearch, setShareSearch] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);

  // Fetch recipients
  const fetchRecipients = async (search = '') => {
    try {
      const body = {
        page: 1,
        size: 100
      };
      
      if (search.trim()) {
        body.search = search.trim();
      }

      const res = await fetch('http://localhost:8004/api/delta-sharing/recipients/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setRecipients(data.items || []);
    } catch (e) {
      console.error('Error fetching recipients:', e);
      setRecipients([]);
    }
  };

  // Fetch shares
  const fetchShares = async (search = '') => {
    try {
      const body = {
        page: 1,
        size: 100
      };
      
      if (search.trim()) {
        body.search = search.trim();
      }

      const res = await fetch('http://localhost:8004/api/delta-sharing/shares/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setShares(data.items || []);
    } catch (e) {
      console.error('Error fetching shares:', e);
      setShares([]);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (isOpen) {
      fetchRecipients();
      fetchShares();
    }
  }, [isOpen]);

  // Handle recipient search
  const handleRecipientSearch = (e) => {
    const value = e.target.value;
    setRecipientSearch(value);
    fetchRecipients(value);
  };

  // Handle share search
  const handleShareSearch = (e) => {
    const value = e.target.value;
    setShareSearch(value);
    fetchShares(value);
  };

  // Handle item selection (checkboxes)
  const handleItemSelection = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  // Handle save
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(null);
    
    if (!selectedRecipient && !selectedShare) {
      setSaveError('Please select a recipient or share first.');
      return;
    }
    
    if (selectedItems.length === 0) {
      setSaveError('Please select at least one item to associate.');
      return;
    }

    setLoading(true);

    try {
      let url, body;
      
      if (activeTab === 'recipients-to-shares' && selectedRecipient) {
        // Add shares to recipient
        url = `http://localhost:8004/api/delta-sharing/recipients/${selectedRecipient}/shares`;
        body = { share_ids: selectedItems };
      } else if (activeTab === 'shares-to-recipients' && selectedShare) {
        // Add recipients to share
        url = `http://localhost:8004/api/delta-sharing/shares/${selectedShare}/recipients`;
        body = { recipient_ids: selectedItems };
      } else {
        setSaveError('Invalid configuration.');
        return;
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.detail || 'Error creating associations.');
        return;
      }

      setSaveSuccess(`Successfully associated ${selectedItems.length} item(s)!`);
      setSelectedItems([]);
      
      // Close modal after success
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (e) {
      setSaveError('Unexpected error while saving.');
      console.error('Save error:', e);
    } finally {
      setLoading(false);
    }
  };

  const currentRecipient = recipients.find(r => r.id === selectedRecipient);
  const currentShare = shares.find(s => s.id === selectedShare);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} style={{ maxWidth: '800px' }}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Associate Recipients & Shares</h2>
          <button className={styles.closeButton} onClick={onClose} type="button">
            <X className={styles.closeIcon} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {/* Tab Navigation */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <button 
              type="button"
              onClick={() => setActiveTab('recipients-to-shares')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: activeTab === 'recipients-to-shares' ? '#3b82f6' : 'transparent',
                color: activeTab === 'recipients-to-shares' ? 'white' : '#6b7280',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer'
              }}
            >
              <Users size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Add Shares to Recipient
            </button>
            <button 
              type="button"
              onClick={() => setActiveTab('shares-to-recipients')}
              style={{
                padding: '8px 16px',
                border: 'none',
                background: activeTab === 'shares-to-recipients' ? '#3b82f6' : 'transparent',
                color: activeTab === 'shares-to-recipients' ? 'white' : '#6b7280',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer'
              }}
            >
              <Share size={16} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              Add Recipients to Share
            </button>
          </div>

          {activeTab === 'recipients-to-shares' && (
            <div>
              {/* Select Recipient */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>1. Select Recipient</h3>
                <div className={styles.formField}>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                      type="text"
                      placeholder="Search recipients..."
                      value={recipientSearch}
                      onChange={handleRecipientSearch}
                      className={styles.formInput}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    {recipients.map(recipient => (
                      <div 
                        key={recipient.id} 
                        onClick={() => setSelectedRecipient(recipient.id)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          backgroundColor: selectedRecipient === recipient.id ? '#dbeafe' : 'transparent',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <div style={{ fontWeight: '500' }}>{recipient.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{recipient.email} • {recipient.organization_name}</div>
                      </div>
                    ))}
                  </div>
                  {currentRecipient && (
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '14px' }}>
                      Selected: <strong>{currentRecipient.name}</strong> ({currentRecipient.email})
                    </div>
                  )}
                </div>
              </div>

              {/* Select Shares */}
              {selectedRecipient && (
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>2. Select Shares to Add</h3>
                  <div className={styles.formField}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                      <input
                        type="text"
                        placeholder="Search shares..."
                        value={shareSearch}
                        onChange={handleShareSearch}
                        className={styles.formInput}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      {shares.map(share => (
                        <div 
                          key={share.id}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(share.id)}
                            onChange={() => handleItemSelection(share.id)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{share.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{share.description}</div>
                          </div>
                          <span style={{ 
                            fontSize: '12px', 
                            padding: '2px 6px', 
                            borderRadius: '12px', 
                            backgroundColor: share.status === 'active' ? '#dcfce7' : '#fef3c7',
                            color: share.status === 'active' ? '#166534' : '#92400e'
                          }}>
                            {share.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'shares-to-recipients' && (
            <div>
              {/* Select Share */}
              <div className={styles.formSection}>
                <h3 className={styles.formSectionTitle}>1. Select Share</h3>
                <div className={styles.formField}>
                  <div style={{ position: 'relative', marginBottom: '8px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                    <input
                      type="text"
                      placeholder="Search shares..."
                      value={shareSearch}
                      onChange={handleShareSearch}
                      className={styles.formInput}
                      style={{ paddingLeft: '32px' }}
                    />
                  </div>
                  <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                    {shares.map(share => (
                      <div 
                        key={share.id} 
                        onClick={() => setSelectedShare(share.id)}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          backgroundColor: selectedShare === share.id ? '#dbeafe' : 'transparent',
                          borderBottom: '1px solid #f3f4f6'
                        }}
                      >
                        <div style={{ fontWeight: '500' }}>{share.name}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>{share.description}</div>
                      </div>
                    ))}
                  </div>
                  {currentShare && (
                    <div style={{ marginTop: '8px', padding: '8px', backgroundColor: '#f0f9ff', borderRadius: '4px', fontSize: '14px' }}>
                      Selected: <strong>{currentShare.name}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Select Recipients */}
              {selectedShare && (
                <div className={styles.formSection}>
                  <h3 className={styles.formSectionTitle}>2. Select Recipients to Add</h3>
                  <div className={styles.formField}>
                    <div style={{ position: 'relative', marginBottom: '8px' }}>
                      <Search size={16} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
                      <input
                        type="text"
                        placeholder="Search recipients..."
                        value={recipientSearch}
                        onChange={handleRecipientSearch}
                        className={styles.formInput}
                        style={{ paddingLeft: '32px' }}
                      />
                    </div>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #d1d5db', borderRadius: '4px' }}>
                      {recipients.map(recipient => (
                        <div 
                          key={recipient.id}
                          style={{
                            padding: '8px 12px',
                            borderBottom: '1px solid #f3f4f6',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(recipient.id)}
                            onChange={() => handleItemSelection(recipient.id)}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: '500' }}>{recipient.name}</div>
                            <div style={{ fontSize: '12px', color: '#6b7280' }}>{recipient.email} • {recipient.organization_name}</div>
                          </div>
                          <span style={{ 
                            fontSize: '12px', 
                            padding: '2px 6px', 
                            borderRadius: '12px', 
                            backgroundColor: recipient.is_active ? '#dcfce7' : '#fef3c7',
                            color: recipient.is_active ? '#166534' : '#92400e'
                          }}>
                            {recipient.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status Messages */}
          {saveError && <div className={styles.formError}>{saveError}</div>}
          {saveSuccess && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#dcfce7', 
              color: '#166534', 
              borderRadius: '4px', 
              marginTop: '16px' 
            }}>
              {saveSuccess}
            </div>
          )}

          {/* Selected Items Summary */}
          {selectedItems.length > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '4px', 
              fontSize: '14px' 
            }}>
              <strong>Selected for association:</strong> {selectedItems.length} item(s)
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button className={styles.secondaryButton} onClick={onClose} type="button">
            Cancel
          </button>
          <button 
            className={styles.primaryButton} 
            onClick={handleSave}
            disabled={loading || selectedItems.length === 0 || (!selectedRecipient && !selectedShare)}
          >
            {loading ? "Saving..." : `Associate ${selectedItems.length} Item(s)`}
          </button>
        </div>
      </div>
    </div>
  );
}