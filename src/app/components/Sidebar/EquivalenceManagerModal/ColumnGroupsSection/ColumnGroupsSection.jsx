import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, AlertTriangle, Info, Link2, ChevronRight, ChevronDown } from "lucide-react";
import styles from "./ColumnGroupsSection.module.css";
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
  const [expanded, setExpanded] = useState({});

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
      setError("Erro ao carregar grupos: " + e.message);
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
  function closeModal() { setShowModal(false); setModalGroup(null); }

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
      setError("Falha ao salvar grupo: " + e.message);
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
      setError("Falha ao remover grupo: " + e.message);
      setLoading(false);
    }
  };

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Info className={styles.sectionInfoIcon} /> Grupos de Colunas</h3>
        <button className={styles.addBtn} onClick={openAdd}><Plus /> Novo Grupo</button>
      </div>
      <div className={styles.sectionSearchRow}>
        <div className={styles.sectionSearchBlock}>
          <input
            type="text"
            placeholder="Buscar grupo por nome..."
            className={styles.sectionSearchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className={styles.sectionSelect} value={filterDomain} onChange={e => setFilterDomain(e.target.value)}>
          <option value="">Todos Domínios</option>
          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={styles.sectionSelect} value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
          <option value="">Todos Termos</option>
          {dictTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
      ) : error ? (
        <div className={styles.sectionError}><AlertTriangle /> {error}</div>
      ) : groups.length === 0 ? (
        <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhum grupo encontrado.</div>
      ) : (
        <div className={styles.groupsTableWrapper}>
          <table className={styles.groupsTable}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Domínio</th>
                <th>Termo Dicionário</th>
                <th>Propriedades</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(group => (
                <>
                  <tr key={group.id}>
                    <td>
                      <button
                        className={styles.expandBtn}
                        onClick={() => toggleExpand(group.id)}
                        title="Ver colunas/valores mapeados"
                      >
                        {expanded[group.id] ? <ChevronDown /> : <ChevronRight />}
                      </button>
                      {group.name}
                    </td>
                    <td>
                      <span title={group.description} style={{ maxWidth: 170, display: "inline-block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                        {group.description}
                      </span>
                    </td>
                    <td>{domains.find(d => d.id === group.semantic_domain_id)?.name || "-"}</td>
                    <td>{dictTerms.find(t => t.id === group.data_dictionary_term_id)?.name || "-"}</td>
                    <td>
                      <pre style={{ fontSize: 11, maxWidth: 140, whiteSpace: "pre-wrap", overflowX: "auto" }}>
                        {JSON.stringify(group.properties || {}, null, 1)}
                      </pre>
                    </td>
                    <td>
                      <button className={styles.groupActionBtn} title="Editar" onClick={() => openEdit(group)}><Edit size={16} /></button>
                      <button className={styles.groupActionBtn} title="Remover" onClick={() => setConfirmDelete({ id: group.id, name: group.name })}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                  {expanded[group.id] && (
                    <tr>
                      <td colSpan={6} style={{ background: "#f7fafc" }}>
                        <GroupMappingsPreview groupId={group.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{modalGroup.id ? "Editar Grupo" : "Novo Grupo"}</h4>
                <button className={styles.modalCloseButton} onClick={closeModal} type="button"><X /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Nome *</label>
                  <input required value={modalGroup.name} onChange={e => setModalGroup(mg => ({ ...mg, name: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Descrição</label>
                  <textarea value={modalGroup.description} onChange={e => setModalGroup(mg => ({ ...mg, description: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Domínio Semântico</label>
                  <select value={modalGroup.semantic_domain_id || ""} onChange={e => setModalGroup(mg => ({ ...mg, semantic_domain_id: e.target.value }))}>
                    <option value="">Nenhum</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Termo Dicionário</label>
                  <select value={modalGroup.data_dictionary_term_id || ""} onChange={e => setModalGroup(mg => ({ ...mg, data_dictionary_term_id: e.target.value }))}>
                    <option value="">Nenhum</option>
                    {dictTerms.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Propriedades (JSON)</label>
                  <textarea
                    value={JSON.stringify(modalGroup.properties ?? {}, null, 2)}
                    onChange={e => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setModalGroup(mg => ({ ...mg, properties: val }));
                        setError(null);
                      } catch (err) {
                        setError("Propriedades: JSON inválido");
                      }
                    }}
                    rows={2}
                  />
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

      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Remover Grupo</h4>
              <button className={styles.modalCloseButton} onClick={() => setConfirmDelete(null)}><X /></button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja remover o grupo <b>{confirmDelete.name}</b>?<br />
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
  if (loading) return <div style={{ color: "#64748b" }}><Loader2 className={styles.spin} /> Carregando mapeamentos...</div>;
  if (!group) return <div style={{ color: "#dc2626" }}><AlertTriangle /> Falha ao carregar detalhes do grupo.</div>;
  return (
    <div>
      <div><b>Colunas mapeadas:</b> {group.column_mappings?.length || 0}</div>
      <div style={{ fontSize: 13, marginLeft: 6 }}>
        {(group.column_mappings || []).map((m, i) =>
          <div key={m.id || i}>
            <span style={{ color: "#3730a3" }}>{m.column_id}</span>
            {m.transformation_rule && <span style={{ color: "#64748b" }}> | Regra: {m.transformation_rule}</span>}
            {m.confidence_score && <span style={{ color: "#059669" }}> | Confiança: {m.confidence_score}</span>}
            {m.notes && <span style={{ color: "#334155" }}> | {m.notes}</span>}
          </div>
        )}
      </div>
      <div style={{ marginTop: 7 }}><b>Valores mapeados:</b> {group.value_mappings?.length || 0}</div>
      <div style={{ fontSize: 13, marginLeft: 6 }}>
        {(group.value_mappings || []).map((v, i) =>
          <div key={v.id || i}>
            <span style={{ color: "#be185d" }}>{v.source_value}</span> → <span style={{ color: "#0ea5e9" }}>{v.standard_value}</span>
            {v.description && <span style={{ color: "#64748b" }}> | {v.description}</span>}
          </div>
        )}
      </div>
    </div>
  );
}