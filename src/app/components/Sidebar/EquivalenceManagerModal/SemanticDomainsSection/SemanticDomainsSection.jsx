import { useState, useEffect, useMemo } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
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
  function closeModal() { setShowModal(false); setModalDomain(null); setError(null); }

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
      <div key={node.id} style={{ marginLeft: level * 18 }}>
        <div className={styles.domainNode}>
          {node.children.length > 0 ? (
            <button className={styles.domainExpandBtn} onClick={() => toggleExpand(node.id)} tabIndex={0}>
              {expanded[node.id] ? <ChevronDownIcon className={styles.iconSm} /> : <ChevronRightIcon className={styles.iconSm} />}
            </button>
          ) : (
            <span style={{ width: 22, display: "inline-block" }} />
          )}
          <span className={styles.domainName}>{node.name}</span>
          <span className={styles.domainDesc}>{node.description}</span>
          <div className={styles.domainActions}>
            <button className={styles.domainActionBtn} title="Editar" onClick={() => openEdit(node)}>
              <PencilSquareIcon className={styles.iconXs} />
            </button>
            <button className={styles.domainActionBtn} title="Adicionar subdomínio" onClick={() => openAdd(node.id)}>
              <PlusIcon className={styles.iconXs} />
            </button>
            <button className={styles.domainActionBtn} title="Remover" onClick={() => setConfirmDelete({ id: node.id, name: node.name })}>
              <TrashIcon className={styles.iconXs} />
            </button>
          </div>
        </div>
        {expanded[node.id] && node.children.map(child => renderNode(child, level + 1))}
      </div>
    );
  }

  const tree = useMemo(() => buildDomainTree(domains), [domains]);

  return (
    <div className={styles.sectionRoot}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}><InformationCircleIcon className={styles.sectionInfoIcon} /> Domínios Semânticos</h3>
        <button className={styles.addBtnFloat} onClick={() => openAdd()}>
          <PlusIcon className={styles.iconSm} /> Novo Domínio
        </button>
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
      <div className={styles.domainListWrapper}>
        {loading ? (
          <div className={styles.sectionPlaceholder}><ArrowPathIcon className={styles.spin} /> Carregando...</div>
        ) : error ? (
          <div className={styles.sectionError}><ExclamationTriangleIcon className={styles.iconSm} /> {error}</div>
        ) : domains.length === 0 ? (
          <div className={styles.sectionPlaceholder}><ExclamationTriangleIcon className={styles.iconSm} /> Nenhum domínio encontrado.</div>
        ) : (
          <div className={styles.domainTree}>
            {tree.map(node => renderNode(node))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainerSmall}>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalHeader}>
                <h4 className={styles.modalTitle}>{modalDomain.id ? "Editar Domínio" : "Novo Domínio"}</h4>
                <button className={styles.modalCloseButton} onClick={closeModal} type="button">
                  <XMarkIcon className={styles.iconSm} />
                </button>
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
                    className={error && error.startsWith("Regras") ? styles.inputError : ""}
                  />
                </div>
                {error && error.startsWith("Regras") && (
                  <div className={styles.formError}><ExclamationTriangleIcon className={styles.iconXs} /> {error}</div>
                )}
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className={styles.cancelButton} onClick={closeModal}>Cancelar</button>
                <button type="submit" className={styles.submitButton}>
                  <CheckCircleIcon className={styles.iconXs} /> Salvar
                </button>
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
              <button className={styles.modalCloseButton} onClick={() => setConfirmDelete(null)}>
                <XMarkIcon className={styles.iconSm} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>
                Tem certeza que deseja remover o domínio <b>{confirmDelete.name}</b>?<br />
                Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelButton} onClick={() => setConfirmDelete(null)}>Cancelar</button>
              <button className={styles.submitButton} onClick={handleDelete}>
                <TrashIcon className={styles.iconXs} /> Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Add Button for mobile */}
      <button className={styles.addBtnMobile} onClick={() => openAdd()} title="Novo Domínio">
        <PlusIcon className={styles.iconSm} />
      </button>
    </div>
  );
}