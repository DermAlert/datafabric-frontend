import { useState } from "react";
import { X, Database } from "lucide-react";
import styles from "./EquivalenceManagerModal.module.css";

import ColumnGroupsSection from "./ColumnGroupsSection/ColumnGroupsSection";
import SemanticDomainsSection from "./SemanticDomainsSection/SemanticDomainsSection";
import DataDictionarySection from "./DataDictionarySection/DataDictionarySection";
import ColumnMappingsSection from "./ColumnMappingsSection/ColumnMappingsSection";
import AvailableColumnsSection from "./AvailableColumnsSection/AvailableColumnsSection";

export default function EquivalenceManagerModal({ isOpen, onClose }) {
  const [section, setSection] = useState("domains");

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <div className={styles.headerLeft}>
            <Database className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Equivalência e Mapeamento de Dados</h2>
          </div>
          <nav className={styles.modalNavTabs} role="tablist">
            <button
              className={section === "domains" ? styles.activeTab : ""}
              aria-selected={section === "domains"}
              onClick={() => setSection("domains")}
              tabIndex={0}
              role="tab"
            >
              Domínios
            </button>
            <button
              className={section === "dictionary" ? styles.activeTab : ""}
              aria-selected={section === "dictionary"}
              onClick={() => setSection("dictionary")}
              tabIndex={0}
              role="tab"
            >
              Dicionário
            </button>
            <button
              className={section === "groups" ? styles.activeTab : ""}
              aria-selected={section === "groups"}
              onClick={() => setSection("groups")}
              tabIndex={0}
              role="tab"
            >
              Grupos
            </button>
            <button
              className={section === "mappings" ? styles.activeTab : ""}
              aria-selected={section === "mappings"}
              onClick={() => setSection("mappings")}
              tabIndex={0}
              role="tab"
            >
              Mapeamentos
            </button>
            <button
              className={section === "availableColumns" ? styles.activeTab : ""}
              aria-selected={section === "availableColumns"}
              onClick={() => setSection("availableColumns")}
              tabIndex={0}
              role="tab"
            >
              Colunas Disponíveis
            </button>
          </nav>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Fechar"
          >
            <X className={styles.closeIcon} />
          </button>
        </div>
        <div className={styles.modalContent}>
          {section === "domains" && <SemanticDomainsSection />}
          {section === "dictionary" && <DataDictionarySection />}
          {section === "groups" && <ColumnGroupsSection />}
          {section === "mappings" && <ColumnMappingsSection />}
          {section === "availableColumns" && <AvailableColumnsSection />}
        </div>
        <div className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.secondaryButton}>
            <X style={{ marginRight: 8 }} /> Fechar
          </button>
        </div>
      </div>
    </div>
  );
}