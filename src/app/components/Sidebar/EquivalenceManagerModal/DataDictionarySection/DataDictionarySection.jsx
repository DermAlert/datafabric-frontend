import { useState, useEffect } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  AlertTriangle,
  Info,
  Search,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from "lucide-react";
import styles from "./DataDictionarySection.module.css";
import {
  api_getDataDictionary,
  api_postDataDictionary,
  api_putDataDictionary,
  api_deleteDataDictionary,
  api_searchDataDictionary,
  api_getSemanticDomains,
} from "../api";

const PAGE_SIZE = 15;

export default function DataDictionarySection() {
  const [terms, setTerms] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterType, setFilterType] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalTerm, setModalTerm] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    api_getSemanticDomains().then(setDomains).catch(() => setDomains([]));
  }, []);

  const fetchTerms = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        pagination: { limit: PAGE_SIZE, query_total: true, skip: page * PAGE_SIZE }
      };
      if (search.trim()) body.name = search.trim();
      if (filterDomain) body.semantic_domain_id = Number(filterDomain);
      if (filterType) body.data_type = filterType;
      const res = await api_searchDataDictionary(body);
      setTerms(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError("Failed to load terms: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTerms(); }, [search, filterDomain, filterType, page]);

  function openAdd() {
    setModalTerm({
      name: "",
      display_name: "",
      description: "",
      data_type: "string",
      validation_rules: {},
      example_values: {},
      synonyms: [],
      semantic_domain_id: "",
    });
    setShowModal(true);
  }
  
  function openEdit(term) {
    setModalTerm({
      ...term,
      synonyms: term.synonyms || [],
      validation_rules: term.validation_rules || {},
      example_values: term.example_values || {},
      semantic_domain_id: term.semantic_domain_id ?? "",
    });
    setShowModal(true);
  }
  
  function closeModal() { 
    setShowModal(false); 
    setModalTerm(null); 
    setError(null); 
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalTerm.id) {
        await api_putDataDictionary(modalTerm.id, {
          ...modalTerm,
          semantic_domain_id: modalTerm.semantic_domain_id ? Number(modalTerm.semantic_domain_id) : null,
        });
      } else {
        await api_postDataDictionary({
          ...modalTerm,
          semantic_domain_id: modalTerm.semantic_domain_id ? Number(modalTerm.semantic_domain_id) : null,
        });
      }
      closeModal();
      fetchTerms();
    } catch (e) {
      setError("Failed to save term: " + e.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteDataDictionary(confirmDelete.id);
      setConfirmDelete(null);
      fetchTerms();
    } catch (e) {
      setError("Failed to delete term: " + e.message);
      setLoading(false);
    }
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <BookOpen className={styles.titleIcon} />
            Data Dictionary
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {total} Terms
            </span>
            <span className={styles.domainBadge}>
              {domains.length} Domains
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            New Term
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search terms..."
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        
        <select 
          className={styles.filterSelect} 
          value={filterDomain} 
          onChange={e => { setFilterDomain(e.target.value); setPage(0); }}
        >
          <option value="">All Domains</option>
          {domains.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        
        <select 
          className={styles.filterSelect} 
          value={filterType} 
          onChange={e => { setFilterType(e.target.value); setPage(0); }}
        >
          <option value="">All Types</option>
          <option value="string">String</option>
          <option value="integer">Integer</option>
          <option value="float">Float</option>
          <option value="boolean">Boolean</option>
          <option value="date">Date</option>
          <option value="datetime">DateTime</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>Loading terms...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : terms.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No terms found</p>
          <button 
            className={styles.secondaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            Create your first term
          </button>
        </div>
      ) : (
        <div className={styles.termsContainer}>
          <div className={styles.tableContainer}>
            <table className={styles.termsTable}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Display Name</th>
                  <th>Description</th>
                  <th>Type</th>
                  <th>Domain</th>
                  <th>Synonyms</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {terms.map(term => (
                  <tr key={term.id}>
                    <td>
                      <span className={styles.termName}>{term.name}</span>
                    </td>
                    <td>{term.display_name}</td>
                    <td>
                      <span className={styles.description} title={term.description}>
                        {term.description}
                      </span>
                    </td>
                    <td>
                      <span className={styles.dataType}>{term.data_type}</span>
                    </td>
                    <td>
                      {domains.find(d => d.id === term.semantic_domain_id)?.name || "-"}
                    </td>
                    <td>
                      <div className={styles.synonyms}>
                        {(term.synonyms || []).slice(0, 2).map((synonym, i) => (
                          <span key={i} className={styles.synonym}>{synonym}</span>
                        ))}
                        {(term.synonyms || []).length > 2 && (
                          <span className={styles.synonymMore}>
                            +{(term.synonyms || []).length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button 
                          className={styles.iconButton}
                          onClick={() => openEdit(term)}
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          className={styles.iconButton}
                          onClick={() => setConfirmDelete({ id: term.id, name: term.name })}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton}
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(p - 1, 0))}
            >
              <ChevronLeft size={16} />
              Previous
            </button>
            <span className={styles.pageInfo}>
              Page {page + 1} of {pageCount || 1}
            </span>
            <button 
              className={styles.paginationButton}
              disabled={page >= pageCount - 1}
              onClick={() => setPage(p => p + 1)}
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalTerm.id ? "Edit Term" : "Create New Term"}
              </h3>
              <button 
                className={styles.modalCloseButton}
                onClick={closeModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Name *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalTerm.name}
                  onChange={e => setModalTerm(mt => ({ ...mt, name: e.target.value }))}
                  placeholder="Enter term name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Display Name *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalTerm.display_name}
                  onChange={e => setModalTerm(mt => ({ ...mt, display_name: e.target.value }))}
                  placeholder="Enter display name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalTerm.description}
                  onChange={e => setModalTerm(mt => ({ ...mt, description: e.target.value }))}
                  placeholder="Enter description"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Type</label>
                <select
                  className={styles.formInput}
                  value={modalTerm.data_type}
                  onChange={e => setModalTerm(mt => ({ ...mt, data_type: e.target.value }))}
                >
                  <option value="string">String</option>
                  <option value="integer">Integer</option>
                  <option value="float">Float</option>
                  <option value="boolean">Boolean</option>
                  <option value="date">Date</option>
                  <option value="datetime">DateTime</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Semantic Domain</label>
                <select
                  className={styles.formInput}
                  value={modalTerm.semantic_domain_id || ""}
                  onChange={e => setModalTerm(mt => ({ ...mt, semantic_domain_id: e.target.value }))}
                >
                  <option value="">Select a domain</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Synonyms (comma separated)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={modalTerm.synonyms?.join(", ") || ""}
                  onChange={e => setModalTerm(mt => ({ 
                    ...mt, 
                    synonyms: e.target.value.split(",").map(s => s.trim()).filter(Boolean) 
                  }))}
                  placeholder="synonym1, synonym2, synonym3"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Validation Rules (JSON)</label>
                <textarea
                  className={styles.formTextarea}
                  value={JSON.stringify(modalTerm.validation_rules ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      const val = JSON.parse(e.target.value);
                      setModalTerm(mt => ({ ...mt, validation_rules: val }));
                      setError(null);
                    } catch (err) {
                      setError("Invalid JSON format in validation rules");
                    }
                  }}
                  placeholder='{"min_length": 1, "max_length": 100}'
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Example Values (JSON)</label>
                <textarea
                  className={styles.formTextarea}
                  value={JSON.stringify(modalTerm.example_values ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      const val = JSON.parse(e.target.value);
                      setModalTerm(mt => ({ ...mt, example_values: val }));
                      setError(null);
                    } catch (err) {
                      setError("Invalid JSON format in example values");
                    }
                  }}
                  placeholder='{"examples": ["value1", "value2"]}'
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  <Save size={16} className={styles.buttonIcon} />
                  {modalTerm.id ? "Update" : "Create"} Term
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Deletion</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmDelete(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.alertBox}>
                <AlertTriangle className={styles.alertIcon} />
                <p>
                  Are you sure you want to delete the term <strong>{confirmDelete.name}</strong>?
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.secondaryButton}
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className={styles.dangerButton}
                onClick={handleDelete}
              >
                <Trash2 size={16} className={styles.buttonIcon} />
                Delete Term
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

