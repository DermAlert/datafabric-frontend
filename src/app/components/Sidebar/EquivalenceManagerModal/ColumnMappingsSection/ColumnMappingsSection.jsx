import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, AlertTriangle, Info, Search, Eye, ChevronDown, ChevronRight, Link2, CheckCircle, Database } from "lucide-react";
import styles from './ColumnMappingsSection.module.css';
import {
  api_searchColumnMappings,
  api_postColumnMapping,
  api_putColumnMapping,
  api_deleteColumnMapping,
  api_searchColumnGroups,
  api_getAvailableColumns,
  api_getColumnGroup,
  api_getValueMappingsByGroup,
  api_postValueMapping,
  api_putValueMapping,
  api_deleteValueMapping,
} from '../api'

const PAGE_SIZE = 10;

export default function ColumnMappingsSection() {
  const [groups, setGroups] = useState([]);
  const [mappings, setMappings] = useState([]);
  const [availableColumns, setAvailableColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterGroup, setFilterGroup] = useState("");
  const [filterColumn, setFilterColumn] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [modalMapping, setModalMapping] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const [showValueModal, setShowValueModal] = useState(false);
  const [modalValue, setModalValue] = useState(null);
  const [valueMappings, setValueMappings] = useState([]);
  const [valueGroup, setValueGroup] = useState(null);
  const [valueColumnId, setValueColumnId] = useState(null);
  const [expandedMapping, setExpandedMapping] = useState(null);

  useEffect(() => {
    api_searchColumnGroups({ pagination: { limit: 1000, query_total: false, skip: 0 } })
      .then(g => setGroups(g.items || []))
      .catch(() => setGroups([]));
  }, []);

  const fetchMappings = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = {
        pagination: { limit: PAGE_SIZE, query_total: true, skip: page * PAGE_SIZE }
      };
      if (filterGroup) body.group_id = Number(filterGroup);
      if (filterColumn) body.column_id = Number(filterColumn);
      if (search.trim()) body.notes = search.trim();
      const res = await api_searchColumnMappings(body);
      setMappings(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError("Failed to load mappings: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchMappings(); }, [search, filterGroup, filterColumn, page]);

  const doFetchAvailableColumns = async (group_id) => {
    try {
      const group = await api_getColumnGroup(group_id);
      if (!group.table_id || !group.connection_id || !group.schema_id) {
        setAvailableColumns([]);
        return;
      }
      const resp = await api_getAvailableColumns({
        connection_id: group.connection_id,
        schema_id: group.schema_id,
        table_id: group.table_id,
        exclude_mapped: true,
      });
      setAvailableColumns(resp.columns || []);
    } catch {
      setAvailableColumns([]);
    }
  };

  function openAdd() {
    setModalMapping({
      group_id: "",
      column_id: "",
      transformation_rule: "",
      confidence_score: 1,
      notes: "",
    });
    setShowModal(true);
    setAvailableColumns([]);
  }

  function openEdit(mapping) {
    setModalMapping({ ...mapping });
    setShowModal(true);
    setAvailableColumns([]);
    if (mapping.group_id) doFetchAvailableColumns(mapping.group_id);
  }

  function closeModal() { setShowModal(false); setModalMapping(null); setAvailableColumns([]); }

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalMapping.id) {
        await api_putColumnMapping(modalMapping.id, {
          transformation_rule: modalMapping.transformation_rule,
          confidence_score: Number(modalMapping.confidence_score),
          notes: modalMapping.notes,
        });
      } else {
        await api_postColumnMapping({
          group_id: Number(modalMapping.group_id),
          column_id: Number(modalMapping.column_id),
          transformation_rule: modalMapping.transformation_rule,
          confidence_score: Number(modalMapping.confidence_score),
          notes: modalMapping.notes,
        });
      }
      closeModal();
      fetchMappings();
    } catch (e) {
      setError("Failed to save mapping: " + e.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteColumnMapping(confirmDelete.id);
      setConfirmDelete(null);
      fetchMappings();
    } catch (e) {
      setError("Failed to delete mapping: " + e.message);
      setLoading(false);
    }
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  // Value mappings
  const openValueMappings = async (group_id, column_id) => {
    setValueGroup(group_id);
    setValueColumnId(column_id);
    setShowValueModal(true);
    setModalValue(null);
    setLoading(true);
    try {
      const values = await api_getValueMappingsByGroup(group_id, column_id);
      setValueMappings(values || []);
    } catch {
      setValueMappings([]);
    }
    setLoading(false);
  };

  const closeValueModal = () => {
    setShowValueModal(false);
    setValueMappings([]);
    setValueGroup(null);
    setValueColumnId(null);
    setModalValue(null);
  };

  const handleValueSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (modalValue.id) {
        await api_putValueMapping(modalValue.id, {
          source_value: modalValue.source_value,
          standard_value: modalValue.standard_value,
          description: modalValue.description,
        });
      } else {
        await api_postValueMapping({
          group_id: valueGroup,
          source_column_id: valueColumnId,
          source_value: modalValue.source_value,
          standard_value: modalValue.standard_value,
          description: modalValue.description,
        });
      }
      setModalValue(null);
      const values = await api_getValueMappingsByGroup(valueGroup, valueColumnId);
      setValueMappings(values || []);
    } catch (e) {
      setError("Failed to save value mapping: " + e.message);
      setLoading(false);
    }
  };

  const handleValueDelete = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await api_deleteValueMapping(id);
      const values = await api_getValueMappingsByGroup(valueGroup, valueColumnId);
      setValueMappings(values || []);
    } catch (e) {
      setError("Failed to delete value mapping: " + e.message);
      setLoading(false);
    }
  };

  const toggleMappingExpand = (mappingId) => {
    setExpandedMapping(expandedMapping === mappingId ? null : mappingId);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>
            <Database className={styles.titleIcon} />
            Column Mappings
          </h2>
          <div className={styles.badges}>
            <span className={styles.countBadge}>
              {total} Mappings
            </span>
            <span className={styles.groupBadge}>
              {groups.length} Groups
            </span>
          </div>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            New Mapping
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className={styles.searchRow}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search mappings..."
            className={styles.searchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        
        <select 
          className={styles.filterSelect} 
          value={filterGroup} 
          onChange={e => { setFilterGroup(e.target.value); setPage(0); }}
        >
          <option value="">All Groups</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        
        <input
          className={styles.filterInput}
          type="number"
          value={filterColumn}
          onChange={e => { setFilterColumn(e.target.value); setPage(0); }}
          placeholder="Column ID"
          min={0}
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading mappings...</p>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <AlertTriangle className={styles.errorIcon} />
          <p>{error}</p>
        </div>
      ) : mappings.length === 0 ? (
        <div className={styles.emptyState}>
          <Info className={styles.emptyIcon} />
          <p>No mappings found</p>
          <button 
            className={styles.secondaryButton}
            onClick={openAdd}
          >
            <Plus className={styles.buttonIcon} />
            Create your first mapping
          </button>
        </div>
      ) : (
        <div className={styles.mappingsContainer}>
          {mappings.map(mapping => (
            <div key={mapping.id} className={styles.mappingCard}>
              <div 
                className={styles.mappingHeader}
                onClick={() => toggleMappingExpand(mapping.id)}
              >
                <div className={styles.mappingTitle}>
                  {expandedMapping === mapping.id ? (
                    <ChevronDown className={styles.chevronIcon} />
                  ) : (
                    <ChevronRight className={styles.chevronIcon} />
                  )}
                  <h3 className={styles.mappingName}>
                    {groups.find(g => g.id === mapping.group_id)?.name || `Group ${mapping.group_id}`}
                    <span className={styles.columnId}>Column ID: {mapping.column_id}</span>
                  </h3>
                </div>
                <div className={styles.mappingActions}>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEdit(mapping);
                    }}
                    title="Edit"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete({ id: mapping.id, column_id: mapping.column_id });
                    }}
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                  <button 
                    className={styles.iconButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      openValueMappings(mapping.group_id, mapping.column_id);
                    }}
                    title="Value Mappings"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              </div>

              {expandedMapping === mapping.id && (
                <div className={styles.mappingDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Transformation Rule:</span>
                    <span className={styles.detailValue}>
                      {mapping.transformation_rule || <em>None defined</em>}
                    </span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Confidence:</span>
                    <span className={styles.confidenceBadge}>
                      {mapping.confidence_score}
                    </span>
                  </div>
                  {mapping.notes && (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabel}>Notes:</span>
                      <span className={styles.detailValue}>
                        {mapping.notes}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Pagination */}
          <div className={styles.pagination}>
            <button 
              className={styles.paginationButton}
              disabled={page <= 0}
              onClick={() => setPage(p => Math.max(p - 1, 0))}
            >
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
                {modalMapping.id ? "Edit Mapping" : "Create New Mapping"}
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
                <label className={styles.formLabel}>Group *</label>
                <select
                  className={styles.formInput}
                  required
                  value={modalMapping.group_id || ""}
                  onChange={e => {
                    setModalMapping(mm => ({ ...mm, group_id: e.target.value }));
                    if (e.target.value) doFetchAvailableColumns(Number(e.target.value));
                  }}
                  disabled={!!modalMapping.id}
                >
                  <option value="">Select a group</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Column *</label>
                <select
                  className={styles.formInput}
                  required
                  value={modalMapping.column_id || ""}
                  onChange={e => setModalMapping(mm => ({ ...mm, column_id: e.target.value }))}
                  disabled={!!modalMapping.id}
                >
                  <option value="">Select a column</option>
                  {availableColumns.map(col => (
                    <option key={col.id} value={col.id}>
                      {col.column_name} (ID: {col.id}) [{col.data_type}]
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Transformation Rule</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={modalMapping.transformation_rule}
                  onChange={e => setModalMapping(mm => ({ ...mm, transformation_rule: e.target.value }))}
                  placeholder="e.g. UPPER({column})"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Confidence Score (0-1) *</label>
                <input
                  type="number"
                  className={styles.formInput}
                  required
                  min="0"
                  max="1"
                  step="0.01"
                  value={modalMapping.confidence_score}
                  onChange={e => setModalMapping(mm => ({ ...mm, confidence_score: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notes</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalMapping.notes}
                  onChange={e => setModalMapping(mm => ({ ...mm, notes: e.target.value }))}
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
                  {modalMapping.id ? "Update" : "Create"} Mapping
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
                  Are you sure you want to delete the mapping for column ID <strong>{confirmDelete.column_id}</strong>?
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
                Delete Mapping
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Value Mappings Modal */}
      {showValueModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.largeModal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Value Mappings</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={closeValueModal}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalBody}>
              <div className={styles.valueMappingsHeader}>
                <h4 className={styles.subtitle}>
                  Column ID: {valueColumnId}
                  {valueGroup && (
                    <span className={styles.groupName}>
                      {groups.find(g => g.id === valueGroup)?.name || `Group ${valueGroup}`}
                    </span>
                  )}
                </h4>
                <button
                  className={styles.primaryButton}
                  onClick={() => setModalValue({ source_value: "", standard_value: "", description: "" })}
                >
                  <Plus className={styles.buttonIcon} />
                  New Value Mapping
                </button>
              </div>

              {loading ? (
                <div className={styles.loadingState}>
                  <div className={styles.spinner}></div>
                  <p>Loading value mappings...</p>
                </div>
              ) : valueMappings.length === 0 ? (
                <div className={styles.emptyState}>
                  <Info className={styles.emptyIcon} />
                  <p>No value mappings defined for this column</p>
                </div>
              ) : (
                <div className={styles.valueMappingsTable}>
                  <table>
                    <thead>
                      <tr>
                        <th>Source Value</th>
                        <th>Standard Value</th>
                        <th>Description</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valueMappings.map(vm => (
                        <tr key={vm.id}>
                          <td>{vm.source_value}</td>
                          <td>{vm.standard_value}</td>
                          <td>{vm.description || '-'}</td>
                          <td>
                            <button
                              className={styles.iconButton}
                              onClick={() => setModalValue(vm)}
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              className={styles.iconButton}
                              onClick={() => handleValueDelete(vm.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Value Mapping Edit Modal */}
      {modalValue && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {modalValue.id ? "Edit Value Mapping" : "Create Value Mapping"}
              </h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setModalValue(null)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleValueSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Source Value *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalValue.source_value}
                  onChange={e => setModalValue(mv => ({ ...mv, source_value: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Standard Value *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  required
                  value={modalValue.standard_value}
                  onChange={e => setModalValue(mv => ({ ...mv, standard_value: e.target.value }))}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Description</label>
                <textarea
                  className={styles.formTextarea}
                  value={modalValue.description}
                  onChange={e => setModalValue(mv => ({ ...mv, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={() => setModalValue(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryButton}
                >
                  <Save size={16} className={styles.buttonIcon} />
                  {modalValue.id ? "Update" : "Create"} Mapping
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}