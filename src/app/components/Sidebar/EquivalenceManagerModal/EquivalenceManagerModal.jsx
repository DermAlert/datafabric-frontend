import { useState } from "react";
import { X, Database, Book, Layers, List, Columns } from "lucide-react";
import styles from "./EquivalenceManagerModal.module.css";

import ColumnGroupsSection from "./ColumnGroupsSection/ColumnGroupsSection";
import SemanticDomainsSection from "./SemanticDomainsSection/SemanticDomainsSection";
import DataDictionarySection from "./DataDictionarySection/DataDictionarySection";
import ColumnMappingsSection from "./ColumnMappingsSection/ColumnMappingsSection";
import AvailableColumnsSection from "./AvailableColumnsSection/AvailableColumnsSection";

const TABS = [
  {
    key: "domains",
    label: "Domínios",
    icon: <Layers size={18} />,
    content: <SemanticDomainsSection />,
  },
  {
    key: "dictionary",
    label: "Dicionário",
    icon: <Book size={18} />,
    content: <DataDictionarySection />,
  },
  {
    key: "groups",
    label: "Grupos",
    icon: <List size={18} />,
    content: <ColumnGroupsSection />,
  },
  {
    key: "mappings",
    label: "Mapeamentos",
    icon: <Database size={18} />,
    content: <ColumnMappingsSection />,
  },
  {
    key: "availableColumns",
    label: "Colunas",
    icon: <Columns size={18} />,
    content: <AvailableColumnsSection />,
  },
];

export default function EquivalenceManagerModal({ isOpen, onClose }) {
  const [section, setSection] = useState("domains");

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer} role="dialog" aria-modal="true">
        <header className={styles.modalHeader} tabIndex={-1}>
          <div className={styles.headerLeft}>
            <Database className={styles.modalIcon} />
            <h2 className={styles.modalTitle}>Equivalência e Mapeamento de Dados</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseButton}
            aria-label="Fechar"
          >
            <X className={styles.closeIcon} />
          </button>
        </header>

        <nav className={styles.modalNavTabs} role="tablist">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={section === tab.key ? styles.activeTab : ""}
              aria-selected={section === tab.key}
              onClick={() => setSection(tab.key)}
              tabIndex={0}
              role="tab"
              type="button"
            >
              {tab.icon}
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <section className={styles.modalContent}>
          {TABS.find(tab => tab.key === section)?.content}
        </section>

        <footer className={styles.modalFooter}>
          <button type="button" onClick={onClose} className={styles.secondaryButton}>
            <X style={{ marginRight: 8 }} /> Fechar
          </button>
        </footer>
      </div>
    </div>
  );
}