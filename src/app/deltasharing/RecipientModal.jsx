import { useState } from 'react';
import { X } from 'lucide-react';
import styles from './RecipientModal.module.css';

export default function RecipientModal({ editingRecipient, onClose }) {
  const [form, setForm] = useState({
    identifier: editingRecipient?.identifier || "",
    name: editingRecipient?.name || "",
    email: editingRecipient?.email || "",
    organization_name: editingRecipient?.organization_name || "",
    authentication_type: editingRecipient?.authentication_type || "bearer_token",
    max_requests_per_hour: editingRecipient?.max_requests_per_hour || 100,
    max_downloads_per_day: editingRecipient?.max_downloads_per_day || 10,
    contact_info: editingRecipient?.contact_info || {},
    notes: editingRecipient?.notes || "",
  });
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setLoading(true);
    
    try {
      const res = await fetch(
        editingRecipient
          ? `http://localhost:8004/api/delta-sharing/recipients/${editingRecipient.id}`
          : `http://localhost:8004/api/delta-sharing/recipients`,
        {
          method: editingRecipient ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...form,
            max_requests_per_hour: parseInt(form.max_requests_per_hour),
            max_downloads_per_day: parseInt(form.max_downloads_per_day)
          })
        }
      );
      
      if (!res.ok) {
        const err = await res.json();
        setSaveError(err.detail || "Error saving recipient.");
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
            <h2 className={styles.modalTitle}>{editingRecipient ? "Edit Recipient" : "New Recipient"}</h2>
            <button className={styles.closeButton} onClick={onClose} type="button">
              <X className={styles.closeIcon} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Basic Information</h3>
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Identifier</label>
                  <input type="text" className={styles.formInput} name="identifier" value={form.identifier} onChange={handleChange} required placeholder="unique-id" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Name</label>
                  <input type="text" className={styles.formInput} name="name" value={form.name} onChange={handleChange} required placeholder="John Doe" />
                </div>
              </div>
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Email</label>
                  <input type="email" className={styles.formInput} name="email" value={form.email} onChange={handleChange} required placeholder="john@company.com" />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Organization</label>
                  <input type="text" className={styles.formInput} name="organization_name" value={form.organization_name} onChange={handleChange} placeholder="Company Inc." />
                </div>
              </div>
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Max Requests/Hour</label>
                  <input type="number" className={styles.formInput} name="max_requests_per_hour" value={form.max_requests_per_hour} onChange={handleChange} />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Max Downloads/Day</label>
                  <input type="number" className={styles.formInput} name="max_downloads_per_day" value={form.max_downloads_per_day} onChange={handleChange} />
                </div>
              </div>
              <div className={styles.formField}>
                <label className={styles.formLabel}>Notes</label>
                <textarea className={styles.formTextarea} name="notes" value={form.notes} onChange={handleChange} placeholder="Additional notes" rows={3} />
              </div>
            </div>
            {saveError && <div className={styles.formError}>{saveError}</div>}
          </div>
          
          <div className={styles.modalFooter}>
            <button className={styles.secondaryButton} onClick={onClose} type="button">Cancel</button>
            <button className={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? "Saving..." : editingRecipient ? "Update Recipient" : "Create Recipient"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

