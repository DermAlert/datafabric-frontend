import dbStyles from '../DatabaseConnectUI.module.css';
import { Database, Edit, Trash2 } from 'lucide-react';

export default function ConnectionTypeCard({ type, isSelected, onSelect, onEdit, setConnectionTypes }) {
  async function handleDelete(e) {
    e.stopPropagation();
    if (!window.confirm("Remover este tipo de conexão?")) return;
    const res = await fetch(`http://localhost:8004/api/connection/${type.id}`, { method: 'DELETE' });
    if (res.ok) {
      setConnectionTypes(types => types.filter(t => t.id !== type.id));
    } else {
      alert('Falha ao remover tipo!');
    }
  }

  return (
    <div
      className={`${dbStyles.connectionCard} ${isSelected ? dbStyles.connectionCardSelected : ""}`}
      onClick={onSelect}
    >
      <div className={dbStyles.connectionCardHeader}>
        <div className={dbStyles.connectionType}>
          <Database className={dbStyles.connectionTypeIcon} />
          <span>{type.name}</span>
        </div>
        <span
          className={dbStyles.connectionType}
          style={{ background: type.color_hex, color: "#fff", fontWeight: 700, padding: "0.25em 0.75em", borderRadius: "1em" }}
        >
          {type.icon}
        </span>
      </div>

      <h3 className={dbStyles.connectionName}>{type.description}</h3>

      <div className={dbStyles.connectionDetails}>
        <div className={dbStyles.connectionDetail}>
          <span className={dbStyles.detailLabel}>Extração</span>
          <span className={dbStyles.detailValue}>{type.metadata_extraction_method}</span>
        </div>
      </div>

      <div className={dbStyles.connectionActions}>
        <button
          className={dbStyles.connectionAction}
          onClick={e => { e.stopPropagation(); onEdit(); }}
        >
          <Edit className={dbStyles.actionIcon} />
          <span>Editar</span>
        </button>
        <button className={dbStyles.connectionAction} onClick={handleDelete}>
          <Trash2 className={dbStyles.actionIcon} />
          <span>Remover</span>
        </button>
      </div>
    </div>
  );
}