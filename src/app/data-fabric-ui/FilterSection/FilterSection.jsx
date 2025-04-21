import { Calendar, ChevronDown, Search } from 'lucide-react';
import styles from './FilterSection.module.css';

export default function FilterSection({ expanded, toggleFilter }) {
  return (
    <div className={styles.filterSection}>
      <div className={styles.filterHeader} onClick={toggleFilter}>
        <h3 className={styles.filterTitle}>Filtros de Dados</h3>
        <ChevronDown className={`${styles.filterChevron} ${!expanded ? styles.filterChevronCollapsed : ''}`} />
      </div>
      
      {expanded && (
        <div className={styles.filterContent}>
          <DateRangeFilter />
          <ProductsFilter />
          <ReferenceCodeFilter />
          <BuyersFilter />
          <LocationFilter />
          
          <div className={styles.formButtonContainer}>
            <button className={styles.secondaryButton}>
              Limpar Filtros
            </button>
            <button className={styles.primaryButton}>
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DateRangeFilter() {
  return (
    <div className={styles.formGroup}>
      <h4 className={styles.formGroupTitle}>Período</h4>
      <div className={styles.dateRangeContainer}>
        <div className={styles.dateFieldContainer}>
          <label className={styles.dateFieldLabel}>Data Inicial</label>
          <div className={styles.dateFieldInputContainer}>
            <input 
              type="text" 
              value="01/01/2022" 
              className={styles.dateInput}
            />
            <button className={styles.calendarButton}>
              <Calendar className={styles.calendarIcon} />
            </button>
          </div>
        </div>
        <div className={styles.dateFieldContainer}>
          <label className={styles.dateFieldLabel}>Data Final</label>
          <div className={styles.dateFieldInputContainer}>
            <input 
              type="text" 
              value="01/01/2025" 
              className={styles.dateInput}
            />
            <button className={styles.calendarButton}>
              <Calendar className={styles.calendarIcon} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductsFilter() {
  return (
    <div className={styles.formGroup}>
      <h4 className={styles.formGroupTitle}>Produtos</h4>
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar produtos..." 
          className={styles.formInput}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {[
          "02226-FLTM SUPER-BREATH",
          "01868-THREADER 1.2 M8-12",
          "01865-THREADER 1.2 OTW",
          "01877-GODZILLA PT",
          "01873-GODZILLA 8F",
          "01876-GODZILLA PT 8F",
          "02085-CHOICE PT EXCHANGE",
          "02009-CHOICE PLUS",
          "02766-ADVANTAGE UP KIT"
        ].map((product, index) => (
          <div key={index} className={styles.checkboxContainer}>
            <input type="checkbox" id={`prod${index+1}`} className={styles.checkbox} />
            <label htmlFor={`prod${index+1}`} className={styles.checkboxLabel}>{product}</label>
          </div>
        ))}
      </div>
      
      <div className={styles.helperText}>
        Nenhum produto selecionado (mostrando todos)
      </div>
    </div>
  );
}

function ReferenceCodeFilter() {
  return (
    <div className={styles.formGroup}>
      <h4 className={styles.formGroupTitle}>Código de Referência</h4>
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar códigos..." 
          className={styles.formInput}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {[
          "H749121160J1",
          "H749121190J1",
          "H749121220J1",
          "H749121330J1",
          "H749121350J1",
          "H749121390J1"
        ].map((code, index) => (
          <div key={index} className={styles.checkboxContainer}>
            <input type="checkbox" id={`ref${index+1}`} className={styles.checkbox} />
            <label htmlFor={`ref${index+1}`} className={styles.checkboxLabel}>{code}</label>
          </div>
        ))}
      </div>
      
      <div className={styles.helperText}>
        Nenhum Código de Referência selecionado (mostrando todos)
      </div>
    </div>
  );
}

function BuyersFilter() {
  return (
    <div className={styles.formGroup}>
      <h4 className={styles.formGroupTitle}>Compradores</h4>
      <div className={styles.searchInputContainer}>
        <input 
          type="text" 
          placeholder="Buscar comprador..." 
          className={styles.formInput}
        />
        <Search className={styles.searchIcon} />
      </div>
      
      <div className={styles.checkboxGrid}>
        {[
          "Ana Silva",
          "Carlos Mendes",
          "Julia Santos",
          "Rafael Gomes",
          "Thiago Almeida"
        ].map((buyer, index) => (
          <div key={index} className={styles.checkboxContainer}>
            <input type="checkbox" id={`buyer${index+1}`} className={styles.checkbox} />
            <label htmlFor={`buyer${index+1}`} className={styles.checkboxLabel}>{buyer}</label>
          </div>
        ))}
      </div>
      
      <div className={styles.helperText}>
        Nenhum comprador selecionado (mostrando todos)
      </div>
    </div>
  );
}

function LocationFilter() {
  return (
    <div className={styles.formGroup}>
      <h4 className={styles.formGroupTitle}>Localização</h4>
      <div className={styles.checkboxGrid}>
        {[
          "São Paulo",
          "Rio de Janeiro",
          "Belo Horizonte"
        ].map((location, index) => (
          <div key={index} className={styles.checkboxContainer}>
            <input type="checkbox" id={`loc${index+1}`} className={styles.checkbox} />
            <label htmlFor={`loc${index+1}`} className={styles.checkboxLabel}>{location}</label>
          </div>
        ))}
      </div>
    </div>
  );
}