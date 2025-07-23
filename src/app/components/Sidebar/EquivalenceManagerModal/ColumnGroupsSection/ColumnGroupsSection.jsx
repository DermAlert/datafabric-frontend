import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, AlertTriangle, Info, Search, Eye, ChevronDown, ChevronRight, Database, Users } from "lucide-react";
import styles from './ColumnGroupsSection.module.css';
import {
  api_getColumnGroups,
  api_postColumnGroup,
  api_putColumnGroup,
  api_deleteColumnGroup,
  api_searchColumnGroups,
  api_getSemanticDomains,
  api_searchDataDictionary,
  api_getColumnGroup,
} from '../api'

export default function ColumnGroupsSection() {
  const [groups, setGroups] = useState([]);
  const [domains, setDomains] = useState([]);
  const [dictTerms, setDictTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDomain, setFilterDomain] = useState("");
  const [filterTerm, setFilterTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalGroup, setModalGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [expandedGroup, setExpandedGroup] = useState(null);

  useEffect(() => {
    api_getSemanticDomains().then(setDomains).catch(() => setDomains([]));
    api_searchDataDictionary({ pagination: { limit: 1000, query_total: false, skip: 0 } })
      .then(d => setDictTerms(d.items || []))
      .catch(() => setDictTerms([]));
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      let params = {};
      if (filterDomain) params.semantic_domain_id = Number(filterDomain);
      if (filterTerm) params.data_dictionary_term_id = Number(filterTerm);
      let items = [];
      if (search.trim() || filterDomain || filterTerm) {
        const body = {
          pagination: { limit: 100, query_total: false, skip: 0 },
          ...params,
        };
        if (search.trim()) body.name = search.trim();
        const res = await api_searchColumnGroups(body);
        items = res.items || [];
      } else {
        items = await api_getColumnGroups(params);
      }
      setGroups(items);
    } catch (e) {
      setError("Failed to load groups: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, [search, filterDomain, filterTerm]);

  function openAdd() {
    setModalGroup({
      name: "",
      description: "",
      semantic_domain_id: "",
      data_dictionary_term_id: "",
      properties: {},
    });
    setShowModal(true);
  }

  function openEdit(group) {
    setModalGroup({
      ...group,
      semantic_domain_id: group.semantic_domain_id ?? "",
      data_dictionary_term_id: group.data_dictionary_term_id ?? "",
      properties: group.properties || {},
    });
    setShowModal(true);
  }

  function closeModal() { 
    setShowModal(false); 
    setModalGroup(null); 
  }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalGroup.id) {
        await api_putColumnGroup(modalGroup.id, {
          ...modalGroup,
          semantic_domain_id: modalGroup.semantic_domain_id ? Number(modalGroup.semantic_domain_id) : null,
          data_dictionary_term_id: modalGroup.data_dictionary_term_id ? Number(modalGroup.data_dictionary_term_id) : null,
        });
      } else {
        await api_postColumnGroup({
          ...modalGroup,
          semantic_domain_id: modalGroup.semantic_domain_id ? Number(modalGroup.semantic_domain_id) : null,
          data_dictionary_term_id: modalGroup.data_dictionary_term_id ? Number(modalGroup.data_dictionary_term_id) : null,
        });
      }
      closeModal();
      fetchGroups();
    } catch (e) {
      setError("Failed to save group: " + e.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteColumnGroup(confirmDelete.id);
      setConfirmDelete(null);
      fetchGroups();
    } catch (e) {
      setError("Failed to delete group: " + e.message);
      setLoading(false);
    }
  };

  const toggleGroupExpand = (groupId) => {
    setExpandedGroup(expandedGroup === groupId ? null : groupId);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Users className={styles.titleIcon} />
            Column Groups
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {groups.length} Groups
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
            New Group
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search groups..."
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <select 
          className={styles.filterSelect} 
          value={filterDomain} 
          onChange={e => setFilterDomain(e.target.value)}
        >
          <option value="">All Domains</option>
          {domains.map(d => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
        
        <select 
          className={styles.filterSelect} 
          value={filterTerm} 
          onChange={e => setFilterTerm(e.target.value)}
        >
          <option value="">All Terms</option>
          {dictTerms.map(t => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading groups...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : groups.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No groups found</p>
          <button 
            className={styles.secondaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            Create your first group
          </button>
        </div>
      ) : (
        <div className={styles.groupsContainer}>
          {groups.map(group => (
            <div key={group.id} className={styles.groupCard}>
              <div 
                className={styles.groupHeader}
                onClick={() => toggleGroupExpand(group.id)}
              >
                <div className={styles.groupTitle}>
                  {expandedGroup === group.id ? (
                    <ChevronDown className={styles.chevronIcon} />
                  ) : (
                    <ChevronRight className={styles.chevronIcon} />
                  )}
                  <h3 className={styles.groupName}>
                    {group.name}
                    {group.description && (
                      <span className={styles.groupDescription}>
                        {group.description}
                      </span>
                    )}
                  </h3>
                </div>
                <div className={styles.groupActions}>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(group);
                    }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: group.id, name: group.name });
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {expandedGroup === group.id && (
                <div className={styles.groupDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Domain:</span>
                    <span className={styles.detailValue}>
                      {domains.find(d => d.id === group.semantic_domain_id)?.name || <em>None assigned</em>}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Dictionary Term:</span>
                    <span className={styles.detailValue}>
                      {dictTerms.find(t => t.id === group.data_dictionary_term_id)?.name || <em>None assigned</em>}
                    </span>
                  </div>
                  {group.properties && Object.keys(group.properties).length > 0 && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Properties:</span>
                      <div className={styles.propertiesContainer}>
                        <pre className={styles.propertiesJson}>
                          {JSON.stringify(group.properties, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                  <div className={styles.mappingsPreview}>
                    <GroupMappingsPreview groupId={group.id} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalGroup.id ? "Edit Group" : "Create New Group"}
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
                  value={modalGroup.name}
                  onChange={e => setModalGroup(mg => ({ ...mg, name: e.target.value }))}
                  placeholder="Enter group name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalGroup.description}
                  onChange={e => setModalGroup(mg => ({ ...mg, description: e.target.value }))}
                  placeholder="Enter group description"
                  rows={3}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Semantic Domain</label>
                <select
                  className={styles.formInput}
                  value={modalGroup.semantic_domain_id || ""}
                  onChange={e => setModalGroup(mg => ({ ...mg, semantic_domain_id: e.target.value }))}
                >
                  <option value="">Select a domain</option>
                  {domains.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Dictionary Term</label>
                <select
                  className={styles.formInput}
                  value={modalGroup.data_dictionary_term_id || ""}
                  onChange={e => setModalGroup(mg => ({ ...mg, data_dictionary_term_id: e.target.value }))}
                >
                  <option value="">Select a term</option>
                  {dictTerms.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Properties (JSON)</label>
                <textarea
                  className={styles.formTextarea}
                  value={JSON.stringify(modalGroup.properties ?? {}, null, 2)}
                  onChange={e => {
                    try {
                      const val = JSON.parse(e.target.value);
                      setModalGroup(mg => ({ ...mg, properties: val }));
                      setError(null);
                    } catch (err) {
                      setError("Invalid JSON format in properties");
                    }
                  }}
                  placeholder='{"key": "value"}'
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
                  {modalGroup.id ? "Update" : "Create"} Group
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
                  Are you sure you want to delete the group <strong>{confirmDelete.name}</strong>?
                  This action cannot be undone and may affect related mappings.
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
                Delete Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GroupMappingsPreview({ groupId }) {
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api_getColumnGroup(groupId)
      .then(setGroup)
      .catch(() => setGroup(null))
      .finally(() => setLoading(false));
  }, [groupId]);

  if (loading) {
    return (
      <div className={styles.previewLoading}>
        <div className={styles.spinner}></div>
        <span>Loading mappings...</span>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={styles.previewError}>
        <AlertTriangle className={styles.errorIcon} />
        <span>Failed to load group details</span>
      </div>
    );
  }

  // Group value mappings by source column for better organization
  const valuesByColumn = (group.value_mappings || []).reduce((acc, mapping) => {
    const columnId = mapping.source_column_id;
    if (!acc[columnId]) {
      acc[columnId] = [];
    }
    acc[columnId].push(mapping);
    return acc;
  }, {});

  return (
    <div className={styles.previewContainer}>
      {/* Column Mappings Section */}
      <div className={styles.previewSection}>
        <h4 className={styles.previewTitle}>
          <Database size={16} />
          Column Mappings ({group.column_mappings?.length || 0})
        </h4>
        {(group.column_mappings || []).length === 0 ? (
          <p className={styles.previewEmpty}>No column mappings defined</p>
        ) : (
          <div className={styles.mappingsList}>
            {(group.column_mappings || []).map((mapping) => (
              <div key={mapping.id} className={styles.columnMappingCard}>
                <div className={styles.mappingHeader}>
                  <span className={styles.columnId}>Column ID: {mapping.column_id}</span>
                  {mapping.confidence_score && (
                    <span className={`${styles.confidenceBadge} ${
                      parseFloat(mapping.confidence_score) >= 0.9 ? styles.highConfidence :
                      parseFloat(mapping.confidence_score) >= 0.7 ? styles.mediumConfidence :
                      styles.lowConfidence
                    }`}>
                      {Math.round(parseFloat(mapping.confidence_score) * 100)}% confidence
                    </span>
                  )}
                </div>
                
                {mapping.transformation_rule && (
                  <div className={styles.mappingDetail}>
                    <span className={styles.detailLabel}>Transformation Rule:</span>
                    <code className={styles.ruleCode}>{mapping.transformation_rule}</code>
                  </div>
                )}
                
                {mapping.notes && (
                  <div className={styles.mappingDetail}>
                    <span className={styles.detailLabel}>Notes:</span>
                    <span className={styles.detailValue}>{mapping.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Value Mappings Section */}
      <div className={styles.previewSection}>
        <h4 className={styles.previewTitle}>
          <Eye size={16} />
          Value Mappings ({group.value_mappings?.length || 0})
        </h4>
        {(group.value_mappings || []).length === 0 ? (
          <p className={styles.previewEmpty}>No value mappings defined</p>
        ) : (
          <div className={styles.valueMapsList}>
            {Object.entries(valuesByColumn).map(([columnId, mappings]) => (
              <div key={columnId} className={styles.columnValueGroup}>
                <h5 className={styles.columnHeader}>
                  Column {columnId} ({mappings.length} mapping{mappings.length !== 1 ? 's' : ''})
                </h5>
                <div className={styles.valueMappingsGrid}>
                  {mappings.map((mapping) => (
                    <div key={mapping.id} className={styles.valueMappingCard}>
                      <div className={styles.valueTransformation}>
                        <span className={styles.sourceValue} title="Source Value">
                          "{mapping.source_value}"
                        </span>
                        <span className={styles.transformArrow}>→</span>
                        <span className={styles.standardValue} title="Standard Value">
                          "{mapping.standard_value}"
                        </span>
                      </div>
                      {mapping.description && (
                        <div className={styles.valueDescription}>
                          {mapping.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className={styles.summarySection}>
        <div className={styles.summaryStats}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{group.column_mappings?.length || 0}</span>
            <span className={styles.statLabel}>Columns Mapped</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{group.value_mappings?.length || 0}</span>
            <span className={styles.statLabel}>Value Transformations</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{Object.keys(valuesByColumn).length}</span>
            <span className={styles.statLabel}>Columns with Values</span>
          </div>
          {group.column_mappings?.length > 0 && (
            <div className={styles.statItem}>
              <span className={styles.statNumber}>
                {Math.round(
                  (group.column_mappings.reduce((sum, m) => sum + (parseFloat(m.confidence_score) || 0), 0) / 
                   group.column_mappings.length) * 100
                )}%
              </span>
              <span className={styles.statLabel}>Avg. Confidence</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}