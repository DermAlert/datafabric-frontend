import { useState } from 'react';
import { Users, Edit, Trash2, RefreshCw } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function RecipientCard({ recipient, isSelected, onSelect, onEdit, setRecipients }) {
  const [loading, setLoading] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Delete this recipient?")) return;
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8004/api/delta-sharing/recipients/${recipient.id}`, { method: 'DELETE' });
      if (res.ok) setRecipients(recipients => recipients.filter(r => r.id !== recipient.id));
      else alert('Failed to delete recipient!');
    } catch (e) {
      alert('Error deleting recipient!');
    }
    setLoading(false);
  }

  async function handleRegenerateToken(e) {
    e.stopPropagation();
    setLoading(true);
    try {
      await fetch(`http://localhost:8004/api/delta-sharing/recipients/${recipient.id}/regenerate-token`, { method: 'POST' });
      alert('Token regenerated successfully!');
    } catch (e) {
      alert('Error regenerating token!');
    }
    setLoading(false);
  }

  return (
    <div className={`${dsStyles.connectionCard} ${isSelected ? dsStyles.connectionCardSelected : ''}`} onClick={onSelect}>
      <div className={dsStyles.connectionCardHeader}>
        <div className={dsStyles.connectionType}>
          <Users className={dsStyles.connectionTypeIcon} />
          Recipient
        </div>
        <div className={`${dsStyles.connectionStatus} ${recipient.is_active ? dsStyles.statusConnected : dsStyles.statusDisconnected}`}>
          <div className={recipient.is_active ? dsStyles.statusIconConnected : dsStyles.statusIconDisconnected}></div>
          {recipient.is_active ? 'active' : 'inactive'}
        </div>
      </div>

      <h3 className={dsStyles.connectionName}>{recipient.name}</h3>

      <div className={dsStyles.connectionDetails}>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Email</span>
          <span className={dsStyles.detailValue}>{recipient.email}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Organization</span>
          <span className={dsStyles.detailValue}>{recipient.organization_name}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Auth Type</span>
          <span className={dsStyles.detailValue}>{recipient.authentication_type}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Max Requests/Hour</span>
          <span className={dsStyles.detailValue}>{recipient.max_requests_per_hour}</span>
        </div>
      </div>

      <div className={dsStyles.connectionActions}>
        <button className={dsStyles.connectionAction} onClick={(e) => { e.stopPropagation(); onEdit(); }} disabled={loading}>
          <Edit className={dsStyles.actionIcon} />
          Edit
        </button>
        <button className={dsStyles.connectionAction} onClick={handleRegenerateToken} disabled={loading}>
          <RefreshCw className={dsStyles.actionIcon} />
          Token
        </button>
        <button className={dsStyles.connectionAction} onClick={handleDelete} disabled={loading}>
          <Trash2 className={dsStyles.actionIcon} />
          Delete
        </button>
      </div>
    </div>
  );
}

