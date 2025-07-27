import { useState } from 'react';
import { Share, Edit, Trash2, RefreshCw, Users, Database, Table } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function ShareCard({ 
  share, 
  isSelected, 
  onSelect, 
  onEdit, 
  setShares 
}) {
  const [loading, setLoading] = useState(false);

  const getStatusClass = (status) => {
    switch (status) {
      case "active":
        return dsStyles.statusConnected;
      case "inactive":
        return dsStyles.statusDisconnected;
      case "error":
        return dsStyles.statusError;
      default:
        return dsStyles.statusPending;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return dsStyles.statusIconConnected;
      case "inactive":
        return dsStyles.statusIconDisconnected;
      case "error":
        return dsStyles.statusIconError;
      default:
        return dsStyles.statusIconPending;
    }
  };

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
      } else {
        alert('Failed to delete share!');
      }
    } catch (e) {
      alert('Error deleting share!');
    }
    setLoading(false);
  }

  return (
    <div 
      className={`${dsStyles.connectionCard} ${isSelected ? dsStyles.connectionCardSelected : ''}`}
      onClick={onSelect}
    >
      <div className={dsStyles.connectionCardHeader}>
        <div className={dsStyles.connectionType}>
          <Share className={dsStyles.connectionTypeIcon} />
          Share
        </div>
        <div className={`${dsStyles.connectionStatus} ${getStatusClass(share.status)}`}>
          <div className={getStatusIcon(share.status)}></div>
          {share.status}
        </div>
      </div>

      <h3 className={dsStyles.connectionName}>{share.name}</h3>

      <div className={dsStyles.connectionDetails}>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Owner</span>
          <span className={dsStyles.detailValue}>{share.owner_email}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Created</span>
          <span className={dsStyles.detailValue}>
            {new Date(share.data_criacao).toLocaleDateString()}
          </span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Schemas</span>
          <span className={dsStyles.detailValue}>{share.schemas_count}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Tables</span>
          <span className={dsStyles.detailValue}>{share.tables_count}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Recipients</span>
          <span className={dsStyles.detailValue}>{share.recipients_count}</span>
        </div>
      </div>

      <div className={dsStyles.connectionActions}>
        <button 
          className={dsStyles.connectionAction}
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          disabled={loading}
        >
          <Edit className={dsStyles.actionIcon} />
          Edit
        </button>
        <button 
          className={dsStyles.connectionAction}
          onClick={handleDelete}
          disabled={loading}
        >
          <Trash2 className={dsStyles.actionIcon} />
          Delete
        </button>
      </div>
    </div>
  );
}

