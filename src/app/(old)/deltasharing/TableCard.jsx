import { useState } from 'react';
import { Table, Edit, Trash2 } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function TableCard({ 
  table, 
  isSelected, 
  onSelect, 
  onEdit, 
  setTables 
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
    if (!window.confirm("Delete this table?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8004/api/delta-sharing/shares/${table.share_id}/schemas/${table.schema_id}/tables/${table.id}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        setTables(tables => tables.filter((t) => t.id !== table.id));
      } else {
        alert('Failed to delete table!');
      }
    } catch (e) {
      alert('Error deleting table!');
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
          <Table className={dsStyles.connectionTypeIcon} />
          Table
        </div>
        <div className={`${dsStyles.connectionStatus} ${getStatusClass(table.status)}`}>
          <div className={getStatusIcon(table.status)}></div>
          {table.status}
        </div>
      </div>

      <h3 className={dsStyles.connectionName}>{table.name}</h3>

      <div className={dsStyles.connectionDetails}>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Schema</span>
          <span className={dsStyles.detailValue}>{table.schema_name}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Share</span>
          <span className={dsStyles.detailValue}>{table.share_name}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Dataset</span>
          <span className={dsStyles.detailValue}>{table.dataset_name}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Share Mode</span>
          <span className={dsStyles.detailValue}>{table.share_mode}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Format</span>
          <span className={dsStyles.detailValue}>{table.table_format}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Version</span>
          <span className={dsStyles.detailValue}>{table.current_version}</span>
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

