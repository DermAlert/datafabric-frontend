import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import dsStyles from './DeltaSharingUI.module.css';

export default function TableDetails({ 
  table, 
  onClose, 
  setTables 
}) {
  const [loading, setLoading] = useState(false);

  if (!table) return null;

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
        onClose();
      } else {
        alert('Failed to delete table!');
      }
    } catch (e) {
      alert('Error deleting table!');
    }
    setLoading(false);
  }

  return (
    <div className={dsStyles.databaseDetails}>
      <div className={dsStyles.detailsHeader}>
        <h3 className={dsStyles.detailsTitle}>Table Details</h3>
        <button className={dsStyles.closeDetailsButton} onClick={onClose}>
          <X className={dsStyles.closeDetailsIcon} />
        </button>
      </div>

      <div className={dsStyles.detailsContent}>
        <div className={dsStyles.detailsSection}>
          <h4 className={dsStyles.detailsSectionTitle}>Table Information</h4>
          <div className={dsStyles.detailsGrid}>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Name</span>
              <span className={dsStyles.detailsValue}>{table.name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Description</span>
              <span className={dsStyles.detailsValue}>{table.description || 'No description'}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Status</span>
              <span className={dsStyles.detailsValue}>{table.status}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Share Mode</span>
              <span className={dsStyles.detailsValue}>{table.share_mode}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Table Format</span>
              <span className={dsStyles.detailsValue}>{table.table_format}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Current Version</span>
              <span className={dsStyles.detailsValue}>{table.current_version}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Dataset ID</span>
              <span className={dsStyles.detailsValue}>{table.dataset_id}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Dataset Name</span>
              <span className={dsStyles.detailsValue}>{table.dataset_name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Schema ID</span>
              <span className={dsStyles.detailsValue}>{table.schema_id}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Schema Name</span>
              <span className={dsStyles.detailsValue}>{table.schema_name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Share ID</span>
              <span className={dsStyles.detailsValue}>{table.share_id}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Share Name</span>
              <span className={dsStyles.detailsValue}>{table.share_name}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Storage Location</span>
              <span className={dsStyles.detailsValue}>{table.storage_location}</span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Created</span>
              <span className={dsStyles.detailsValue}>
                {new Date(table.data_criacao).toLocaleString()}
              </span>
            </div>
            <div className={dsStyles.detailsItem}>
              <span className={dsStyles.detailsLabel}>Updated</span>
              <span className={dsStyles.detailsValue}>
                {new Date(table.data_atualizacao).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {table.filter_condition && (
          <div className={dsStyles.detailsSection}>
            <h4 className={dsStyles.detailsSectionTitle}>Filter Condition</h4>
            <div className={dsStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14 }}>
              {table.filter_condition}
            </div>
          </div>
        )}

        {table.partition_columns && (
          <div className={dsStyles.detailsSection}>
            <h4 className={dsStyles.detailsSectionTitle}>Partition Columns</h4>
            <div className={dsStyles.detailsValue} style={{ background: "#f3f4f6", borderRadius: 6, padding: 8, fontSize: 14 }}>
              {JSON.stringify(table.partition_columns, null, 2)}
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
            <span>{loading ? "Deleting..." : "Delete Table"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

