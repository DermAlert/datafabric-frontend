import { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import FilterSection from '../FilterSection/FilterSection';
import styles from './AddDatasetModal.module.css';

export default function AddDatasetModal({ onClose }) {
  const [filterExpanded, setFilterExpanded] = useState(true);
  
  const toggleFilter = () => {
    setFilterExpanded(!filterExpanded);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Adicionar Dataset</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <FilterSection expanded={filterExpanded} toggleFilter={toggleFilter} />
          
          <DatasetForm />
          
          <div className={styles.modalFooter}>
            <button 
              className={styles.secondaryButton}
              onClick={onClose}
            >
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

function DatasetForm() {
  return (
    <div>
      <div className={styles.twoColGrid}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Nome do Dataset</label>
          <input 
            type="text" 
            placeholder="Digite o nome do dataset" 
            className={styles.formInput}
          />
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Fonte de Dados</label>
          <select className={styles.formSelect}>
            <option>MinIO Principal</option>
            <option>PostgreSQL Analytics</option>
            <option>Airflow Pipeline</option>
          </select>
        </div>
      </div>
      
      <div className={styles.formField}>
        <label className={styles.formLabel}>Descrição</label>
        <textarea 
          placeholder="Digite uma descrição para o dataset" 
          className={styles.formTextarea}
        ></textarea>
      </div>
      
      <div className={styles.threeColGrid}>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Tipo de Dados</label>
          <select className={styles.formSelect}>
            <option>Imagens</option>
            <option>Tabular</option>
            <option>Documentos</option>
            <option>Series Temporais</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Categoria</label>
          <select className={styles.formSelect}>
            <option>Saúde</option>
            <option>Financeiro</option>
            <option>Marketing</option>
            <option>Operações</option>
          </select>
        </div>
        <div className={styles.formField}>
          <label className={styles.formLabel}>Classificação</label>
          <select className={styles.formSelect}>
            <option>Público</option>
            <option>Restrito</option>
            <option>Confidencial</option>
          </select>
        </div>
      </div>
      
      <div className={styles.formField}>
        <label className={styles.formLabel}>Tags</label>
        <input 
          type="text" 
          placeholder="Digite tags separadas por vírgula" 
          className={styles.formInput}
        />
        <div className={styles.formHint}>
          Exemplo: cancer, dermatologia, pesquisa
        </div>
      </div>
      
      <div className={styles.formField}>
        <label className={styles.formLabel}>Upload de Arquivos</label>
        <div className={styles.uploadContainer}>
          <PlusCircle className={styles.uploadIcon} />
          <p className={styles.uploadText}>
            Arraste e solte arquivos aqui ou clique para selecionar
          </p>
          <p className={styles.uploadHint}>
            Formatos suportados: CSV, XLSX, JPG, PNG, DICOM
          </p>
          <button className={styles.uploadButton}>
            Selecionar Arquivos
          </button>
        </div>
      </div>
    </div>
  );
}