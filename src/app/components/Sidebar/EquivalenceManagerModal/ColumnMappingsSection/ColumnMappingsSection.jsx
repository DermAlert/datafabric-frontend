import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, AlertTriangle, Info, Search, Eye } from "lucide-react";
import styles from "./ColumnMappingsSection.module.css";
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

const PAGE_SIZE = 15;

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
      setError("Erro ao carregar mapeamentos: " + e.message);
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
      setError("Falha ao salvar mapeamento: " + e.message);
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
      setError("Falha ao remover mapeamento: " + e.message);
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
      setError("Falha ao salvar mapeamento de valor: " + e.message);
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
      setError("Falha ao remover mapeamento de valor: " + e.message);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Info className={styles.sectionInfoIcon} /> Mapeamentos de Colunas</h3>
        <button className={styles.addBtn} onClick={openAdd}><Plus /> Novo Mapeamento</button>
      </div>
      <div className={styles.sectionSearchRow}>
        <div className={styles.sectionSearchBlock}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar mapeamento (notas)..."
            className={styles.sectionSearchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select className={styles.sectionSelect} value={filterGroup} onChange={e => { setFilterGroup(e.target.value); setPage(0); }}>
          <option value="">Todos Grupos</option>
          {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <input
          className={styles.sectionSelect}
          type="number"
          value={filterColumn}
          onChange={e => { setFilterColumn(e.target.value); setPage(0); }}
          placeholder="ID Coluna"
          min={0}
          style={{ width: 100 }}
        />
      </div>

      {loading ? (
        <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
      ) : error ? (
        <div className={styles.sectionError}><AlertTriangle /> {error}</div>
      ) : mappings.length === 0 ? (
        <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhum mapeamento encontrado.</div>
      ) : (
        <div className={styles.mappingsTableWrapper}>
          <table className={styles.mappingsTable}>
            <thead>
              <tr>
                <th>Grupo</th>
                <th>ID Coluna</th>
                <th>Regra de Transformação</th>
                <th>Confiança</th>
                <th>Notas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {mappings.map(mapping => (
                <tr key={mapping.id}>
                  <td>{groups.find(g => g.id === mapping.group_id)?.name || mapping.group_id}</td>
                  <td>{mapping.column_id}</td>
                  <td>{mapping.transformation_rule}</td>
                  <td>{mapping.confidence_score}</td>
                  <td>
                    <span title={mapping.notes} style={{ maxWidth: 150, display: "inline-block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {mapping.notes}
                    </span>
                  </td>
                  <td>
                    <button className={styles.mappingActionBtn} title="Editar" onClick={() => openEdit(mapping)}><Edit size={16} /></button>
                    <button className={styles.mappingActionBtn} title="Remover" onClick={() => setConfirmDelete({ id: mapping.id, column_id: mapping.column_id })}><Trash2 size={15} /></button>
                    <button className={styles.mappingActionBtn} title="Valores Mapeados" onClick={() => openValueMappings(mapping.group_id, mapping.column_id)}><Eye size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={styles.sectionPagination}>
            <button disabled={page <= 0} onClick={() => setPage(p => Math.max(p - 1, 0))}>&lt;</button>
            <span>Página {page + 1} de {pageCount || 1}</span>
            <button disabled={page >= pageCount - 1} onClick={() => setPage(p => p + 1)}>&gt;</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal for mapping */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{modalMapping.id ? "Editar Mapeamento" : "Novo Mapeamento"}</h4>
                <button className={styles.modalCloseButton} onClick={closeModal} type="button"><X /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Grupo *</label>
                  <select
                    required
                    value={modalMapping.group_id || ""}
                    onChange={e => {
                      setModalMapping(mm => ({ ...mm, group_id: e.target.value }));
                      if (e.target.value) doFetchAvailableColumns(Number(e.target.value));
                    }}
                    disabled={!!modalMapping.id}
                  >
                    <option value="">Selecione</option>
                    {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Coluna *</label>
                  <select
                    required
                    value={modalMapping.column_id || ""}
                    onChange={e => setModalMapping(mm => ({ ...mm, column_id: e.target.value }))}
                    disabled={!!modalMapping.id}
                  >
                    <option value="">Selecione</option>
                    {(availableColumns || []).map(col =>
                      <option key={col.id} value={col.id}>
                        {col.column_name} (ID: {col.id}) [{col.data_type}]
                      </option>
                    )}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Regra de Transformação</label>
                  <input value={modalMapping.transformation_rule} onChange={e => setModalMapping(mm => ({ ...mm, transformation_rule: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Confiança (0-1)</label>
                  <input required type="number" min="0" max="1" step="0.01" value={modalMapping.confidence_score} onChange={e => setModalMapping(mm => ({ ...mm, confidence_score: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Notas</label>
                  <textarea value={modalMapping.notes} onChange={e => setModalMapping(mm => ({ ...mm, notes: e.target.value }))} />
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelButton} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.submitButton}><Save /> Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Remover Mapeamento</h4>
              <button className={styles.modalCloseButton} onClick={() => setConfirmDelete(null)}><X /></button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja remover o mapeamento de coluna <b>{confirmDelete.column_id}</b>?<br />
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.submitButton} onClick={handleDelete}><Trash2 /> Remover</button>
            </div>
          </div>
        </div>
      )}

      {/* Value Mappings Modal */}
      {showValueModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerLarge}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Mapeamentos de Valores</h4>
              <button className={styles.modalCloseButton} onClick={closeValueModal}><X /></button>
            </div>
            <div className={styles.modalBody}>
              <button className={styles.addBtn} onClick={() => setModalValue({ source_value: "", standard_value: "", description: "" })}><Plus /> Novo Mapeamento de Valor</button>
              {loading ? (
                <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
              ) : valueMappings.length === 0 ? (
                <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhum valor mapeado.</div>
              ) : (
                <table className={styles.valueMappingsTable}>
                  <thead>
                    <tr>
                      <th>Valor de Origem</th>
                      <th>Valor Padrão</th>
                      <th>Descrição</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {valueMappings.map(vm => (
                      <tr key={vm.id}>
                        <td>{vm.source_value}</td>
                        <td>{vm.standard_value}</td>
                        <td>{vm.description}</td>
                        <td>
                          <button className={styles.mappingActionBtn} title="Editar" onClick={() => setModalValue(vm)}><Edit size={16} /></button>
                          <button className={styles.mappingActionBtn} title="Remover" onClick={() => handleValueDelete(vm.id)}><Trash2 size={15} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {modalValue && (
            <div className={styles.modalOverlay} style={{ zIndex: 100 }}>
              <div className={styles.modalContainerSmall}>
                <form onSubmit={handleValueSubmit}>
                  <div className={styles.modalHeader}>
                    <h4 className={styles.modalTitle}>{modalValue.id ? "Editar" : "Novo"} Mapeamento de Valor</h4>
                    <button className={styles.modalCloseButton} onClick={() => setModalValue(null)} type="button"><X /></button>
                  </div>
                  <div className={styles.modalBody}>
                    <div className={styles.formField}>
                      <label>Valor de Origem *</label>
                      <input required value={modalValue.source_value} onChange={e => setModalValue(mv => ({ ...mv, source_value: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Valor Padrão *</label>
                      <input required value={modalValue.standard_value} onChange={e => setModalValue(mv => ({ ...mv, standard_value: e.target.value }))} />
                    </div>
                    <div className={styles.formField}>
                      <label>Descrição</label>
                      <input value={modalValue.description} onChange={e => setModalValue(mv => ({ ...mv, description: e.target.value }))} />
                    </div>
                  </div>
                  <div className={styles.modalFooter}>
                    <button type="button" className={styles.cancelButton} onClick={() => setModalValue(null)}>Cancelar</button>
                    <button type="submit" className={styles.submitButton}><Save /> Salvar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}