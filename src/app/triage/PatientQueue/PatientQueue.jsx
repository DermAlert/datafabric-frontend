import React from 'react';
import { User, Calendar, Clock } from 'lucide-react';
import styles from './PatientQueue.module.css';

export default function PatientQueue({ patients, selectedId, onSelect }) {
  const getBadgeStyle = (score) => {
    switch (score) {
      case 'ALTO': return styles.badgeHigh;
      case 'MEDIO': return styles.badgeMed;
      default: return styles.badgeLow;
    }
  };

  return (
    <div className={styles.queueContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Fila de Triagem</h2>
        <span className={styles.subtitle}>{patients.length} aguardando análise</span>
        <input type="text" placeholder="Buscar paciente..." className={styles.searchInput} />
      </div>
      
      <div className={styles.list}>
        {patients.map((patient) => (
          <div
            key={patient.id}
            className={`${styles.card} ${selectedId === patient.id ? styles.active : ''}`}
            onClick={() => onSelect(patient.id)}
          >
            <div className={styles.cardHeader}>
              <span className={styles.name}>{patient.nome}</span>
              <span className={`${styles.badge} ${getBadgeStyle(patient.scoreRiscoML)}`}>
                {patient.scoreRiscoML}
              </span>
            </div>
            
            <div className={styles.cardMeta}>
              <div className={styles.metaItem}>
                <User size={14} />
                <span>{patient.idade} anos • {patient.genero}</span>
              </div>
              <div className={styles.metaItem}>
                <Clock size={14} />
                <span>{new Date(patient.dataSubmissao).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}