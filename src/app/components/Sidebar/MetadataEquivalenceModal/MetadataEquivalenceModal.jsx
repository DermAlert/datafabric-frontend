import { useState } from 'react';
import { X, Database } from 'lucide-react';
import styles from './MetadataEquivalenceModal.module.css';
import DynamicFilterSection from './DynamicFilterSection/DynamicFilterSection';

export default function MetadataEquivalenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} role="dialog" aria-modal="true">
        <header className={styles.modalHeader} tabIndex={-1}>
          <div className={styles.headerLeft}>
            <Database className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Metadata Equivalence Manager</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Close"
          >
            <X className={styles.closeIcon} />
          </button>
        </header>

        <section className={styles.modalContent}>
          <DynamicFilterSection />
        </section>

        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.secondaryButton}>
            <X style={{ marginRight: 8 }} /> Close
          </button>
        </footer>
      </div>
    </div>
  );
}

