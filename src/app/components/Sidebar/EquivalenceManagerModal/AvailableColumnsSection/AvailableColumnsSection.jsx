import { useState, useEffect, useCallback } from "react";
import { Search, AlertTriangle, Info, Eye, EyeOff, ChevronDown, ChevronRight, Database, RefreshCw } from "lucide-react";
import styles from "./AvailableColumnsSection.module.css";

// Function to search columns
async function api_searchColumns({ query, pagination }) {
  const response = await fetch('http://localhost:8004/api/equivalence/search/columns', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json'
    },
    body: JSON.stringify({
      pagination,
      ...(query && query.trim() !== '' ? { query } : {})
    })
  });

  if (!response.ok) {
    throw new Error(`Search request failed: ${response.status}`);
  }

  return await response.json();
}

export default function AvailableColumnsSection() {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const pageSize = 15;

  // Function to load columns
  const loadColumns = useCallback(async (resetPage = true) => {
    setLoading(true);
    setError(null);

    try {
      const currentPage = resetPage ? 0 : page;
      const result = await api_searchColumns({
        query: search,
        pagination: {
          limit: pageSize,
          skip: currentPage * pageSize,
          query_total: false
        }
      });
      
      // If we're loading the first page, replace columns
      // Otherwise append to existing columns for infinite scroll
      if (currentPage === 0) {
        setColumns(result.columns || []);
      } else {
        setColumns(prev => [...prev, ...(result.columns || [])]);
      }
      
      // If we got fewer results than the page size, we've reached the end
      setHasMore((result.columns || []).length === pageSize);
      
      if (resetPage) {
        setPage(0);
      } else {
        setPage(currentPage + 1);
      }
    } catch (err) {
      setError("Failed to load columns: " + err.message);
      setColumns([]);
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  // Initial load and on search change
  useEffect(() => {
    const timer = setTimeout(() => {
      loadColumns(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadColumns(false);
    }
  };

  const toggleExpand = id =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  // Determine if a column is nullable based on sample values
  const isColumnNullable = (column) => {
    return column.sample_values && column.sample_values.some(value => value === null);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Database className={styles.titleIcon} />
            Available Columns
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {columns.length} Columns{hasMore ? '+' : ''}
            </span>
            {search && (
              <span className={styles.searchBadge}>
                Search: "{search}"
              </span>
            )}
          </div>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.refreshButton}
            onClick={() => loadColumns(true)}
            disabled={loading}
          >
            <RefreshCw className={loading ? styles.spinning : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search columns..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading && columns.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.loadingIcon} />
          <p>Loading columns...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : columns.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No columns found</p>
          <p className={styles.emptyHint}>
            {search ? 'Try a different search term' : 'Enter a search term to find columns'}
          </p>
        </div>
      ) : (
        <>
          <div className={styles.columnsContainer}>
            {columns.map(col => (
              <div key={col.id} className={styles.columnCard}>
                <div 
                  className={styles.columnHeader}
                  onClick={() => toggleExpand(col.id)}
                >
                  <div className={styles.columnTitle}>
                    {expanded[col.id] ? (
                      <ChevronDown className={styles.chevronIcon} />
                    ) : (
                      <ChevronRight className={styles.chevronIcon} />
                    )}
                    <h3 className={styles.columnName}>
                      {col.column_name}
                      <span className={styles.columnType}>{col.data_type}</span>
                    </h3>
                  </div>
                  <div className={styles.columnMeta}>
                    {isColumnNullable(col) ? (
                      <Eye className={styles.nullableIcon} title="Nullable" />
                    ) : (
                      <EyeOff className={styles.notNullIcon} title="Not Nullable" />
                    )}
                    <span className={styles.tableInfo}>
                      {col.table_name}.{col.schema_name}
                    </span>
                  </div>
                </div>

                {expanded[col.id] && (
                  <div className={styles.columnDetails}>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>ID:</span>
                      <span className={styles.detailValue}>{col.id}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Data Type:</span>
                      <span className={styles.detailValue}>{col.data_type}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Nullable:</span>
                      <span className={styles.detailValue}>
                        {isColumnNullable(col) ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Table:</span>
                      <span className={styles.detailValue}>{col.table_name}</span>
                    </div>
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Schema:</span>
                      <span className={styles.detailValue}>{col.schema_name}</span>
                    </div>
                    {col.description && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Description:</span>
                        <span className={styles.detailValue}>{col.description}</span>
                      </div>
                    )}
                    {col.sample_values && col.sample_values.length > 0 && (
                      <div className={styles.detailRow}>
                        <span className={styles.detailLabel}>Sample Values:</span>
                        <div className={styles.sampleValues}>
                          {col.sample_values.map((value, i) => (
                            <span key={i} className={styles.sampleValue}>
                              {value === null ? 
                                <span className={styles.nullValue}>NULL</span> : 
                                String(value)
                              }
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {hasMore && (
            <div className={styles.loadMoreContainer}>
              <button 
                className={styles.loadMoreButton} 
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}