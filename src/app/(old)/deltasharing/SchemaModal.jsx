import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './SchemaModal.module.css';

export default function SchemaModal({ 
  editingSchema, 
  selectedShareId,
  onClose
}) {
  const [form, setForm] = useState({
    name: editingSchema?.name || "",
    description: editingSchema?.description || "",
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
    
    if (!selectedShareId && !editingSchema) {
      setSaveError("Please select a share first.");
      setLoading(false);
      return;
    }
    
    try {
      const shareId = editingSchema ? editingSchema.share_id : selectedShareId;
      const res = await fetch(
        editingSchema
          ? `http://localhost:8004/api/delta-sharing/shares/${shareId}/schemas/${editingSchema.id}`
          : `http://localhost:8004/api/delta-sharing/shares/${shareId}/schemas`,
        {
          method: editingSchema ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }
      );
      
      if (!res.ok) {
          const err = await res.json();
          setSaveError(
            err.detail || err.msg || JSON.stringify(err) || "Error saving share."
          );
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
              {editingSchema ? "Edit Schema" : "New Schema"}
            </h2>
            <button className={styles.closeButton} onClick={onClose} type="button">
              <X className={styles.closeIcon} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Schema Information</h3>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Schema Name</label>
                <input
                  type="text"
                  className={styles.formInput}
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., customer_data"
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Brief description of this schema"
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
              {loading ? "Saving..." : editingSchema ? "Update Schema" : "Create Schema"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

