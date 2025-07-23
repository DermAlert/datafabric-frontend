import { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Edit,
  Trash2,
  X,
  AlertTriangle,
  Info,
  Save,
  Search,
  Layers
} from "lucide-react";
import styles from "./SemanticDomainsSection.module.css";
import {
  api_getSemanticDomains,
  api_postSemanticDomain,
  api_putSemanticDomain,
  api_deleteSemanticDomain,
  api_searchSemanticDomains,
} from "../api";

function buildDomainTree(domains) {
  const byId = {};
  domains.forEach(d => (byId[d.id] = { ...d, children: [] }));
  const roots = [];
  domains.forEach(d => {
    if (d.parent_domain_id && byId[d.parent_domain_id]) {
      byId[d.parent_domain_id].children.push(byId[d.id]);
    } else {
      roots.push(byId[d.id]);
    }
  });
  return roots;
}

export default function SemanticDomainsSection() {
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalDomain, setModalDomain] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchDomains = async () => {
    setLoading(true);
    setError(null);
    try {
      let data;
      if (search.trim()) {
        data = await api_searchSemanticDomains({
          pagination: { limit: 1000, query_total: false, skip: 0 },
          name: search.trim(),
        });
        setDomains(data.items || []);
      } else {
        data = await api_getSemanticDomains();
        setDomains(data);
      }
    } catch (e) {
      setError("Failed to load domains: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDomains(); }, [search]);

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  function openAdd(parent_domain_id = null) {
    setModalDomain({ 
      name: "", 
      description: "", 
      parent_domain_id, 
      domain_rules: {} 
    });
    setShowModal(true);
  }
  
  function openEdit(domain) {
    setModalDomain(domain);
    setShowModal(true);
  }
  
  function closeModal() { 
    setShowModal(false); 
    setModalDomain(null); 
    setError(null); 
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalDomain.id) {
        await api_putSemanticDomain(modalDomain.id, {
          name: modalDomain.name,
          description: modalDomain.description,
          parent_domain_id: modalDomain.parent_domain_id,
          domain_rules: modalDomain.domain_rules || {},
        });
      } else {
        await api_postSemanticDomain({
          name: modalDomain.name,
          description: modalDomain.description,
          parent_domain_id: modalDomain.parent_domain_id,
          domain_rules: modalDomain.domain_rules || {},
        });
      }
      closeModal();
      fetchDomains();
    } catch (e) {
      setError("Failed to save domain: " + e.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteSemanticDomain(confirmDelete.id);
      setConfirmDelete(null);
      fetchDomains();
    } catch (e) {
      setError("Failed to delete domain: " + e.message);
      setLoading(false);
    }
  };

  function renderNode(node, level = 0) {
    return (
      <div key={node.id} style={{ marginLeft: level * 18 }}>
        <div className={styles.domainCard}>
          <div className={styles.domainHeader}>
            <div className={styles.domainTitle}>
              {node.children.length > 0 ? (
                <button 
                  className={styles.expandButton} 
                  onClick={() => toggleExpand(node.id)}
                >
                  {expanded[node.id] ? (
                    <ChevronDown className={styles.chevronIcon} />
                  ) : (
                    <ChevronRight className={styles.chevronIcon} />
                  )}
                </button>
              ) : (
                <span className={styles.spacer} />
              )}
              <div className={styles.domainInfo}>
                <h3 className={styles.domainName}>{node.name}</h3>
                {node.description && (
                  <span className={styles.domainDescription}>
                    {node.description}
                  </span>
                )}
              </div>
            </div>
            <div className={styles.domainActions}>
              <button 
                className={styles.iconButton}
                onClick={() => openEdit(node)}
                title="Edit"
              >
                <Edit size={16} />
              </button>
              <button 
                className={styles.iconButton}
                onClick={() => openAdd(node.id)}
                title="Add subdomain"
              >
                <Plus size={16} />
              </button>
              <button 
                className={styles.iconButton}
                onClick={() => setConfirmDelete({ id: node.id, name: node.name })}
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        {expanded[node.id] && node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  }

  const tree = useMemo(() => buildDomainTree(domains), [domains]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Layers className={styles.titleIcon} />
            Semantic Domains
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {domains.length} Domains
            </span>
            <span className={styles.treeBadge}>
              {tree.length} Root Domains
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={() => openAdd()}
          >
            <Plus className={styles.buttonIcon} />
            New Domain
          </button>
        </div>
      </div>

      {/* Search */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search domains..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>Loading domains...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : domains.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No domains found</p>
          <button 
            className={styles.secondaryButton}
            onClick={() => openAdd()}
          >
            <Plus className={styles.buttonIcon} />
            Create your first domain
          </button>
        </div>
      ) : (
        <div className={styles.domainsContainer}>
          {tree.map(node => renderNode(node))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalDomain.id ? "Edit Domain" : "Create New Domain"}
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
                  value={modalDomain.name}
                  onChange={e => setModalDomain(md => ({ ...md, name: e.target.value }))}
                  placeholder="Enter domain name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalDomain.description}
                  onChange={e => setModalDomain(md => ({ ...md, description: e.target.value }))}
                  placeholder="Enter domain description"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Parent Domain</label>
                <select
                  className={styles.formInput}
                  value={modalDomain.parent_domain_id ?? ""}
                  onChange={e => setModalDomain(md => ({ 
                    ...md, 
                    parent_domain_id: e.target.value ? Number(e.target.value) : null 
                  }))}
                >
                  <option value="">None (Root Domain)</option>
                  {domains.filter(d => d.id !== modalDomain.id).map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Domain Rules (JSON)</label>
                <textarea
                  className={styles.formTextarea}
                  value={JSON.stringify(modalDomain.domain_rules ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      const val = JSON.parse(e.target.value);
                      setModalDomain(md => ({ ...md, domain_rules: val }));
                      setError(null);
                    } catch (err) {
                      setError("Invalid JSON format in domain rules");
                    }
                  }}
                  placeholder='{"validation": "rules", "constraints": []}'
                  rows={4}
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
                  {modalDomain.id ? "Update" : "Create"} Domain
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
                  Are you sure you want to delete the domain <strong>{confirmDelete.name}</strong>?
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
                Delete Domain
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

