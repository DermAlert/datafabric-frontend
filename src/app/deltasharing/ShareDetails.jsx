import { useState } from 'react';
import { X, Copy, RefreshCw, Trash2, Users } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function ShareDetails({ 
  share, 
  onClose, 
  setShares 
}) {
  const [loading, setLoading] = useState(false);

  if (!share) return null;

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Delete this share?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8004/api/delta-sharing/shares/${share.id}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        setShares(shares => shares.filter((s) => s.id !== share.id));
        onClose();
      } else {
        alert('Failed to delete share!');
      }
    } catch (e) {
      alert('Error deleting share!');
    }
    setLoading(false);
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className={dsStyles.databaseDetails}>
      <div className={dsStyles.detailsHeader}>
        <h3 className={dsStyles.detailsTitle}>Share Details</h3>
        <button className={dsStyles.closeDetailsButton} onClick={onClose}>
          <X className={dsStyles.closeDetailsIcon} />
        </button>
      </div>

      <div className={dsStyles.detailsContent}>
        <div className={dsStyles.detailsSection}>
          <h4 className={dsStyles.detailsSectionTitle}>Share Information</h4>
          <div className={dsStyles.detailsGrid}>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Name</span>
              <span className={dsStyles.detailsValue}>{share.name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Description</span>
              <span className={dsStyles.detailsValue}>{share.description}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Status</span>
              <span className={dsStyles.detailsValue}>{share.status}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Owner Email</span>
              <span className={dsStyles.detailsValue}>{share.owner_email}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Organization ID</span>
              <span className={dsStyles.detailsValue}>{share.organization_id}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Created</span>
              <span className={dsStyles.detailsValue}>
                {new Date(share.data_criacao).toLocaleString()}
              </span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Updated</span>
              <span className={dsStyles.detailsValue}>
                {new Date(share.data_atualizacao).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className={dsStyles.detailsSection}>
          <h4 className={dsStyles.detailsSectionTitle}>Statistics</h4>
          <div className={dsStyles.detailsGrid}>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Schemas Count</span>
              <span className={dsStyles.detailsValue}>{share.schemas_count}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Tables Count</span>
              <span className={dsStyles.detailsValue}>{share.tables_count}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Recipients Count</span>
              <span className={dsStyles.detailsValue}>{share.recipients_count}</span>
            </div>
          </div>
        </div>

        {share.contact_info && Object.keys(share.contact_info).length > 0 && (
          <div className={dsStyles.detailsSection}>
            <h4 className={dsStyles.detailsSectionTitle}>Contact Information</h4>
            <pre className={dsStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14, overflow: "auto" }}>
              {JSON.stringify(share.contact_info, null, 2)}
              <button onClick={() => copyToClipboard(JSON.stringify(share.contact_info, null, 2))} className={dsStyles.copyButton} style={{ marginLeft: 8 }}>
                <Copy className={dsStyles.copyIcon} />
              </button>
            </pre>
          </div>
        )}

        {share.terms_of_use && (
          <div className={dsStyles.detailsSection}>
            <h4 className={dsStyles.detailsSectionTitle}>Terms of Use</h4>
            <div className={dsStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14 }}>
              {share.terms_of_use}
            </div>
          </div>
        )}

        <div className={dsStyles.detailsActions}>
          <button 
            className={dsStyles.detailsDestructiveButton} 
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className={dsStyles.detailsActionIcon} />
            <span>{loading ? "Deleting..." : "Delete Share"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

