import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function SchemaDetails({ 
  schema, 
  onClose, 
  setSchemas 
}) {
  const [loading, setLoading] = useState(false);

  if (!schema) return null;

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
        onClose();
      } else {
        alert('Failed to delete schema!');
      }
    } catch (e) {
      alert('Error deleting schema!');
    }
    setLoading(false);
  }

  return (
    <div className={dsStyles.databaseDetails}>
      <div className={dsStyles.detailsHeader}>
        <h3 className={dsStyles.detailsTitle}>Schema Details</h3>
        <button className={dsStyles.closeDetailsButton} onClick={onClose}>
          <X className={dsStyles.closeDetailsIcon} />
        </button>
      </div>

      <div className={dsStyles.detailsContent}>
        <div className={dsStyles.detailsSection}>
          <h4 className={dsStyles.detailsSectionTitle}>Schema Information</h4>
          <div className={dsStyles.detailsGrid}>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Name</span>
              <span className={dsStyles.detailsValue}>{schema.name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Description</span>
              <span className={dsStyles.detailsValue}>{schema.description || 'No description'}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Share ID</span>
              <span className={dsStyles.detailsValue}>{schema.share_id}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Share Name</span>
              <span className={dsStyles.detailsValue}>{schema.share_name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Tables Count</span>
              <span className={dsStyles.detailsValue}>{schema.tables_count}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Created</span>
              <span className={dsStyles.detailsValue}>
                {new Date(schema.data_criacao).toLocaleString()}
              </span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Updated</span>
              <span className={dsStyles.detailsValue}>
                {new Date(schema.data_atualizacao).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className={dsStyles.detailsActions}>
          <button 
            className={dsStyles.detailsDestructiveButton} 
            onClick={handleDelete}
            disabled={loading}
          >
            <Trash2 className={dsStyles.detailsActionIcon} />
            <span>{loading ? "Deleting..." : "Delete Schema"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

