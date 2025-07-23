import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronRight, Plus, Edit, Trash2, Save, X, Loader2, AlertTriangle, Info } from "lucide-react";
import styles from "./SemanticDomainsSection.module.css";
import {
  api_getSemanticDomains,
  api_postSemanticDomain,
  api_putSemanticDomain,
  api_deleteSemanticDomain,
  api_searchSemanticDomains,
} from '../api'

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
      setError("Erro ao carregar domínios: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { fetchDomains(); }, [search]);

  const toggleExpand = id => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));

  function openAdd(parent_domain_id = null) {
    setModalDomain({ name: "", description: "", parent_domain_id, domain_rules: {} });
    setShowModal(true);
  }
  function openEdit(domain) {
    setModalDomain(domain);
    setShowModal(true);
  }
  function closeModal() { setShowModal(false); setModalDomain(null); }

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
      setError("Falha ao salvar domínio: " + e.message);
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
      setError("Falha ao remover domínio: " + e.message);
      setLoading(false);
    }
  };

  function renderNode(node, level = 0) {
    return (
      <div key={node.id} style={{ marginLeft: level * 24 }}>
        <div className={styles.domainNode}>
          {node.children.length > 0 ? (
            <button className={styles.domainExpandBtn} onClick={() => toggleExpand(node.id)}>
              {expanded[node.id] ? <ChevronDown /> : <ChevronRight />}
            </button>
          ) : (
            <span style={{ width: 24, display: "inline-block" }} />
          )}
          <span className={styles.domainName}>{node.name}</span>
          <span className={styles.domainDesc}>{node.description}</span>
          <button className={styles.domainActionBtn} title="Editar" onClick={() => openEdit(node)}>
            <Edit size={16} />
          </button>
          <button className={styles.domainActionBtn} title="Adicionar subdomínio" onClick={() => openAdd(node.id)}>
            <Plus size={15} />
          </button>
          <button className={styles.domainActionBtn} title="Remover" onClick={() => setConfirmDelete({ id: node.id, name: node.name })}>
            <Trash2 size={15} />
          </button>
        </div>
        {expanded[node.id] && node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  }

  const tree = useMemo(() => buildDomainTree(domains), [domains]);

  return (
    <div>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><Info className={styles.sectionInfoIcon} /> Domínios Semânticos</h3>
        <button className={styles.addBtn} onClick={() => openAdd()}><Plus /> Novo Domínio</button>
      </div>
      <div className={styles.sectionSearchBlock}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar domínios por nome..."
          className={styles.sectionSearchInput}
        />
      </div>
      {loading ? (
        <div className={styles.sectionPlaceholder}><Loader2 className={styles.spin} /> Carregando...</div>
      ) : error ? (
        <div className={styles.sectionError}><AlertTriangle /> {error}</div>
      ) : domains.length === 0 ? (
        <div className={styles.sectionPlaceholder}><AlertTriangle /> Nenhum domínio encontrado.</div>
      ) : (
        <div className={styles.domainTree}>
          {tree.map(node => renderNode(node))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{modalDomain.id ? "Editar Domínio" : "Novo Domínio"}</h4>
                <button className={styles.modalCloseButton} onClick={closeModal} type="button"><X /></button>
              </div>
              <div className={styles.modalBody}>
                <div className={styles.formField}>
                  <label>Nome *</label>
                  <input
                    required
                    value={modalDomain.name}
                    onChange={e => setModalDomain(md => ({ ...md, name: e.target.value }))}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Descrição</label>
                  <textarea
                    value={modalDomain.description}
                    onChange={e => setModalDomain(md => ({ ...md, description: e.target.value }))}
                  />
                </div>
                <div className={styles.formField}>
                  <label>Domínio Pai</label>
                  <select
                    value={modalDomain.parent_domain_id ?? ""}
                    onChange={e => setModalDomain(md => ({ ...md, parent_domain_id: e.target.value ? Number(e.target.value) : null }))}
                  >
                    <option value="">Nenhum</option>
                    {domains.filter(d => d.id !== modalDomain.id).map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.formField}>
                  <label>Regras (JSON)</label>
                  <textarea
                    value={JSON.stringify(modalDomain.domain_rules ?? {}, null, 2)}
                    onChange={e => {
                      try {
                        const val = JSON.parse(e.target.value);
                        setModalDomain(md => ({ ...md, domain_rules: val }));
                        setError(null);
                      } catch (err) {
                        setError("Regras: JSON inválido");
                      }
                    }}
                    rows={3}
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

      {/* Delete Confirm */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <div className={styles.modalHeader}>
              <h4 className={styles.modalTitle}>Remover Domínio</h4>
              <button className={styles.modalCloseButton} onClick={() => setConfirmDelete(null)}><X /></button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja remover o domínio <b>{confirmDelete.name}</b>?<br />
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