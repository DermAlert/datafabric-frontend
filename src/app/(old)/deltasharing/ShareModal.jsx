import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './ShareModal.module.css';

export default function ShareModal({ 
  editingShare, 
  onClose, 
  organizationId = 1 
}) {
  const [form, setForm] = useState({
    name: editingShare?.name || "",
    description: editingShare?.description || "",
    owner_email: editingShare?.owner_email || "",
    contact_info: editingShare?.contact_info || {},
    terms_of_use: editingShare?.terms_of_use || "",
  });
  const [saveError, setSaveError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({
      ...f,
      [e.target.name]: e.target.value
    }));
  };

  const handleContactInfoChange = (e) => {
    try {
      const contactInfo = JSON.parse(e.target.value);
      setForm(f => ({ ...f, contact_info: contactInfo }));
    } catch (err) {
      // Invalid JSON, keep as string for now
      setForm(f => ({ ...f, contact_info: e.target.value }));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveError(null);
    setLoading(true);
    
    try {
      const payload = {
        ...form,
        contact_info: typeof form.contact_info === 'string' ? {} : form.contact_info,
      };
      
      const res = await fetch(
        editingShare
          ? `http://localhost:8004/api/delta-sharing/shares/${editingShare.id}`
          : `http://localhost:8004/api/delta-sharing/shares`,
        {
          method: editingShare ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
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
              {editingShare ? "Edit Share" : "New Share"}
            </h2>
            <button className={styles.closeButton} onClick={onClose} type="button">
              <X className={styles.closeIcon} />
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.formSection}>
              <h3 className={styles.formSectionTitle}>Basic Information</h3>
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Share Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="e.g., Customer Analytics Share"
                  />
                </div>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Owner Email</label>
                  <input
                    type="email"
                    className={styles.formInput}
                    name="owner_email"
                    value={form.owner_email}
                    onChange={handleChange}
                    required
                    placeholder="owner@company.com"
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
                  placeholder="Brief description of this share"
                  rows={3}
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Contact Information (JSON)</label>
                <textarea
                  className={styles.formTextarea}
                  value={typeof form.contact_info === 'string' ? form.contact_info : JSON.stringify(form.contact_info, null, 2)}
                  onChange={handleContactInfoChange}
                  placeholder='{"phone": "+1-555-0123", "department": "Data Team"}'
                  rows={4}
                />
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Terms of Use</label>
                <textarea
                  className={styles.formTextarea}
                  name="terms_of_use"
                  value={form.terms_of_use}
                  onChange={handleChange}
                  placeholder="Terms and conditions for using this share"
                  rows={4}
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
              {loading ? "Saving..." : editingShare ? "Update Share" : "Create Share"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

