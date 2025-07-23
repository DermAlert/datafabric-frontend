import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Save, X, Loader2, AlertTriangle, Search, Info } from "lucide-react";
import styles from "./DataDictionarySection.module.css";
import {
  api_getDataDictionary,
  api_postDataDictionary,
  api_putDataDictionary,
  api_deleteDataDictionary,
  api_searchDataDictionary,
  api_getSemanticDomains,
} from '../api'

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
      setError("Erro ao carregar termos: " + e.message);
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
  function closeModal() { setShowModal(false); setModalTerm(null); }

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
      setError("Falha ao salvar termo: " + e.message);
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
      setError("Falha ao remover termo: " + e.message);
      setLoading(false);
    }
  };

  const pageCount = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Info className={styles.sectionInfoIcon} /> Dicionário de Dados</h3>
        <button className={styles.addBtn} onClick={openAdd}><Plus /> Novo Termo</button>
      </div>
      <div className={styles.sectionSearchRow}>
        <div className={styles.sectionSearchBlock}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Buscar termo por nome..."
            className={styles.sectionSearchInput}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <select className={styles.sectionSelect} value={filterDomain} onChange={e => { setFilterDomain(e.target.value); setPage(0); }}>
          <option value="">Todos Domínios</option>
          {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className={styles.sectionSelect} value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0); }}>
          <option value="">Todos Tipos</option>
          <option value="string">Texto</option>
          <option value="integer">Inteiro</option>
          <option value="float">Decimal</option>
          <option value="boolean">Booleano</option>
          <option value="date">Data</option>
          <option value="datetime">Data e Hora</option>
        </select>
      </div>

      {loading ? (
        <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
      ) : error ? (
        <div className={styles.sectionError}><AlertTriangle /> {error}</div>
      ) : terms.length === 0 ? (
        <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhum termo encontrado.</div>
      ) : (
        <div className={styles.dictTableWrapper}>
          <table className={styles.dictTable}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Nome Exibição</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Domínio</th>
                <th>Sinônimos</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {terms.map(term => (
                <tr key={term.id}>
                  <td>{term.name}</td>
                  <td>{term.display_name}</td>
                  <td>
                    <span title={term.description} style={{ maxWidth: 180, display: "inline-block", whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {term.description}
                    </span>
                  </td>
                  <td>{term.data_type}</td>
                  <td>{domains.find(d => d.id === term.semantic_domain_id)?.name || "-"}</td>
                  <td>{(term.synonyms || []).join(", ")}</td>
                  <td>
                    <button className={styles.dictActionBtn} title="Editar" onClick={() => openEdit(term)}><Edit size={16} /></button>
                    <button className={styles.dictActionBtn} title="Remover" onClick={() => setConfirmDelete({ id: term.id, name: term.name })}><Trash2 size={15} /></button>
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

      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{modalTerm.id ? "Editar Termo" : "Novo Termo"}</h4>
                <button className={styles.modalCloseButton} onClick={closeModal} type="button"><X /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Nome *</label>
                  <input required value={modalTerm.name} onChange={e => setModalTerm(mt => ({ ...mt, name: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Nome de Exibição *</label>
                  <input required value={modalTerm.display_name} onChange={e => setModalTerm(mt => ({ ...mt, display_name: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Descrição</label>
                  <textarea value={modalTerm.description} onChange={e => setModalTerm(mt => ({ ...mt, description: e.target.value }))} />
                </div>
                <div className={styles.formField}>
                  <label>Tipo de Dado</label>
                  <select value={modalTerm.data_type} onChange={e => setModalTerm(mt => ({ ...mt, data_type: e.target.value }))}>
                    <option value="string">Texto</option>
                    <option value="integer">Inteiro</option>
                    <option value="float">Decimal</option>
                    <option value="boolean">Booleano</option>
                    <option value="date">Data</option>
                    <option value="datetime">Data e Hora</option>
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Domínio Semântico</label>
                  <select value={modalTerm.semantic_domain_id || ""} onChange={e => setModalTerm(mt => ({ ...mt, semantic_domain_id: e.target.value }))}>
                    <option value="">Nenhum</option>
                    {domains.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Sinônimos (vírgula)</label>
                  <input value={modalTerm.synonyms?.join(", ") || ""} onChange={e => setModalTerm(mt => ({ ...mt, synonyms: e.target.value.split(",").map(s => s.trim()).filter(Boolean) }))} />
                </div>
                <div className={styles.formField}>
                  <label>Validação (JSON)</label>
                  <textarea
                    value={JSON.stringify(modalTerm.validation_rules ?? {}, null, 2)}
                    onChange={e => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setModalTerm(mt => ({ ...mt, validation_rules: val }));
                        setError(null);
                      } catch (err) {
                        setError("Validação: JSON inválido");
                      }
                    }}
                    rows={2}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Exemplos (JSON)</label>
                  <textarea
                    value={JSON.stringify(modalTerm.example_values ?? {}, null, 2)}
                    onChange={e => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setModalTerm(mt => ({ ...mt, example_values: val }));
                        setError(null);
                      } catch (err) {
                        setError("Exemplos: JSON inválido");
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
              <h4 className={styles.modalTitle}>Remover Termo</h4>
              <button className={styles.modalCloseButton} onClick={() => setConfirmDelete(null)}><X /></button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja remover o termo <b>{confirmDelete.name}</b>?<br />
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