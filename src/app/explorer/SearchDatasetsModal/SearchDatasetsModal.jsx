"use client";
import { useState, useEffect } from 'react';
import { X, Search as SearchIcon } from 'lucide-react';
import styles from './SearchDatasetsModal.module.css';

const API_BASE = 'http://localhost:8004/api';

export default function SearchDatasetsModal({ onClose, onSelectDataset }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setIsLoading(true);
    fetch(`${API_BASE}/datasets/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'accept': 'application/json'
      },
      body: JSON.stringify({
        page,
        size: 10,
        query: searchTerm
      })
    })
      .then(res => res.json())
      .then(data => {
        setResults(data.items || []);
        setTotal(data.total || 0);
        setIsLoading(false);
      })
      .catch(() => {
        setResults([]);
        setTotal(0);
        setIsLoading(false);
      });
  }, [searchTerm, page]);

  const handleSearchInput = (e) => {
    setSearchTerm(e.target.value);
    setPage(1);
  };

  const handleSelect = (dataset) => {
    if (onSelectDataset) onSelectDataset(dataset);
    if (onClose) onClose();
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Buscar Datasets</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalSearchBar}>
            <SearchIcon className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Digite o nome do dataset..."
              value={searchTerm}
              onChange={handleSearchInput}
              className={styles.searchInput}
              disabled={isLoading}
            />
          </div>
          <div className={styles.modalResults}>
            {isLoading ? (
              <div className={styles.loadingSpinner}>
                <div className={styles.spinner}></div>
                <span className={styles.loadingText}>Buscando datasets...</span>
              </div>
            ) : results.length === 0 ? (
              <div className={styles.noResults}>
                <SearchIcon className={styles.noResultsIcon} />
                <h3 className={styles.noResultsTitle}>Nenhum dataset encontrado</h3>
                <p className={styles.noResultsText}>Tente um termo diferente.</p>
              </div>
            ) : (
              <ul className={styles.datasetList}>
                {results.map(ds => (
                  <li
                    key={ds.id}
                    className={styles.datasetListItem}
                    onClick={() => handleSelect(ds)}
                  >
                    <div className={styles.datasetListName}>{ds.name}</div>
                    <div className={styles.datasetListDescription}>{ds.description}</div>
                    <div className={styles.datasetListMeta}>
                      <span>Tipo: {ds.storage_type}</span>
                      <span>Status: {ds.status}</span>
                      <span>Versão: {ds.version}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className={styles.paginationControls}>
            <button
              className={styles.pageButton}
              onClick={() => setPage(page - 1)}
              disabled={page === 1 || isLoading}
            >
              Anterior
            </button>
            <span className={styles.pageIndicator}>
              Página {page} de {Math.ceil(total / 10) || 1}
            </span>
            <button
              className={styles.pageButton}
              onClick={() => setPage(page + 1)}
              disabled={isLoading || page * 10 >= total}
            >
              Próxima
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}