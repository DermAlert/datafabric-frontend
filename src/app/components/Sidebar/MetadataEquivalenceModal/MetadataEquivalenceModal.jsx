import { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import FilterSection from './FilterSection/FilterSection';
import styles from './MetadataEquivalenceModal.module.css';

export default function MetadataEquivalenceModal({ isOpen, onClose }) {
  const [filterExpanded, setFilterExpanded] = useState(true);

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Camada de Equivalência</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <FilterSection expanded={filterExpanded} toggleFilter={() => setFilterExpanded(!filterExpanded)} />
          <div className={styles.modalFooter}>
            <button className={styles.secondaryButton} onClick={onClose}>
              Cancelar
            </button>
            <button className={styles.primaryButton}>
              Adicionar Dataset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}