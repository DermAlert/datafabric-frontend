import { useState } from 'react';
import { Database, Edit, Trash2, Table } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function SchemaCard({ 
  schema, 
  isSelected, 
  onSelect, 
  onEdit, 
  setSchemas 
}) {
  const [loading, setLoading] = useState(false);

  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Delete this schema?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8004/api/delta-sharing/shares/${schema.share_id}/schemas/${schema.id}`, { 
        method: 'DELETE' 
      });
      if (res.ok) {
        setSchemas(schemas => schemas.filter((s) => s.id !== schema.id));
      } else {
        alert('Failed to delete schema!');
      }
    } catch (e) {
      alert('Error deleting schema!');
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
          <Database className={dsStyles.connectionTypeIcon} />
          Schema
        </div>
        <div className={`${dsStyles.connectionStatus} ${dsStyles.statusConnected}`}>
          <div className={dsStyles.statusIconConnected}></div>
          active
        </div>
      </div>

      <h3 className={dsStyles.connectionName}>{schema.name}</h3>

      <div className={dsStyles.connectionDetails}>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Share</span>
          <span className={dsStyles.detailValue}>{schema.share_name}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Created</span>
          <span className={dsStyles.detailValue}>
            {new Date(schema.data_criacao).toLocaleDateString()}
          </span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Tables</span>
          <span className={dsStyles.detailValue}>{schema.tables_count}</span>
        </div>
        <div className={dsStyles.connectionDetail}>
          <span className={dsStyles.detailLabel}>Description</span>
          <span className={dsStyles.detailValue}>{schema.description || 'No description'}</span>
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

