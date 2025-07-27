import { useState } from 'react';
import { X, Copy, Trash2, RefreshCw } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function RecipientDetails({ recipient, onClose, setRecipients }) {
  const [loading, setLoading] = useState(false);
  if (!recipient) return null;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Delete this recipient?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8004/api/delta-sharing/recipients/${recipient.id}`, { method: 'DELETE' });
      if (res.ok) {
        setRecipients(recipients => recipients.filter(r => r.id !== recipient.id));
        onClose();
      } else alert('Failed to delete recipient!');
    } catch (e) {
      alert('Error deleting recipient!');
    }
    setLoading(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className={dsStyles.databaseDetails}>
      <div className={dsStyles.detailsHeader}>
        <h3 className={dsStyles.detailsTitle}>Recipient Details</h3>
        <button className={dsStyles.closeDetailsButton} onClick={onClose}>
          <X className={dsStyles.closeDetailsIcon} />
        </button>
      </div>

      <div className={dsStyles.detailsContent}>
        <div className={dsStyles.detailsSection}>
          <h4 className={dsStyles.detailsSectionTitle}>Recipient Information</h4>
          <div className={dsStyles.detailsGrid}>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Name</span>
              <span className={dsStyles.detailsValue}>{recipient.name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Email</span>
              <span className={dsStyles.detailsValue}>{recipient.email}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Organization</span>
              <span className={dsStyles.detailsValue}>{recipient.organization_name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Status</span>
              <span className={dsStyles.detailsValue}>{recipient.is_active ? 'Active' : 'Inactive'}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Auth Type</span>
              <span className={dsStyles.detailsValue}>{recipient.authentication_type}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Bearer Token</span>
              <div className={dsStyles.detailsValueWithCopy}>
                <span className={dsStyles.detailsValue}>{recipient.bearer_token}</span>
                <button onClick={() => copyToClipboard(recipient.bearer_token)} className={dsStyles.copyButton}>
                  <Copy className={dsStyles.copyIcon} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={dsStyles.detailsActions}>
          <button className={dsStyles.detailsDestructiveButton} onClick={handleDelete} disabled={loading}>
            <Trash2 className={dsStyles.detailsActionIcon} />
            <span>{loading ? "Deleting..." : "Delete Recipient"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

