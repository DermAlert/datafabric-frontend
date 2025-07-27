import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './TableModal.module.css';

export default function TableModal({ 
  editingTable, 
  selectedShareId,
  selectedSchemaId,
  onClose
}) {
  const [form, setForm] = useState({
    name: editingTable?.name || "",
    description: editingTable?.description || "",
    dataset_id: editingTable?.dataset_id || 6,
    share_mode: editingTable?.share_mode || "full",
    filter_condition: editingTable?.filter_condition || "",
  });
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({
      ...f,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setLoading(true);
    
    if (!selectedShareId || !selectedSchemaId) {
      setSaveError("Please select a share and schema first.");
      setLoading(false);
      return;
    }
    
    try {
      const shareId = editingTable ? editingTable.share_id : selectedShareId;
      const schemaId = editingTable ? editingTable.schema_id : selectedSchemaId;
      const res = await fetch(
        editingTable
          ? `http://localhost:8004/api/delta-sharing/shares/${shareId}/schemas/${schemaId}/tables/${editingTable.id}`
          : `http://localhost:8004/api/delta-sharing/shares/${shareId}/schemas/${schemaId}/tables`,
        {
          method: editingTable ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            dataset_id: parseInt(form.dataset_id)
          })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.detail || "Error saving table.");
        return;
      }
      
      onClose();
    } catch (e) {
      setSaveError("Unexpected error while saving.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <form onSubmit={handleSave}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>
              {editingTable ? "Edit Table" : "New Table"}
            </h2>
            <button className={styles.closeButton} onClick={onClose} type="button">
              <X className={styles.closeIcon} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Table Information</h3>
              
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Table Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., customer_transactions"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Dataset ID</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    name="dataset_id"
                    value={form.dataset_id}
                    onChange={handleChange}
                    required
                    placeholder="6"
                  />
                </div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief description of this table"
                  rows={3}
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Share Mode</label>
                <select
                  className={styles.formInput}
                  name="share_mode"
                  value={form.share_mode}
                  onChange={handleChange}
                  required
                >
                  <option value="full">Full</option>
                  <option value="filtered">Filtered</option>
                  <option value="sample">Sample</option>
                </select>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Filter Condition (Optional)</label>
                <textarea
                  className={styles.formTextarea}
                  name="filter_condition"
                  value={form.filter_condition}
                  onChange={handleChange}
                  placeholder="e.g., WHERE created_date >= '2023-01-01'"
                  rows={3}
                />
              </div>
            </div>
            
            {saveError && <div className={styles.formError}>{saveError}</div>}
          </div>
          
          <div className={styles.modalFooter}>
            <button className={styles.secondaryButton} onClick={onClose} type="button">
              Cancel
            </button>
            <button className={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Saving..." : editingTable ? "Update Table" : "Create Table"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

