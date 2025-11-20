import React from 'react';
import { ClipboardList, AlertTriangle, CheckCircle } from 'lucide-react';
import styles from './AnamnesisPanel.module.css';

export default function AnamnesisPanel({ patient }) {
  return (
    <div className={styles.panel}>
      <div className={styles.scrollContent}>
        <h3 className={styles.headerTitle}>
          <ClipboardList size={18} />
          Dados Clínicos
        </h3>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Fototipo e Pele</h4>
          <div className={styles.row}>
            <span className={styles.label}>Cor da Pele:</span>
            <span className={styles.value}>{patient.anamnese.fototipo.cor_pele}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Reação ao Sol:</span>
            <span className={styles.value}>{patient.anamnese.fototipo.reacao_sol}</span>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Histórico</h4>
          <div className={styles.row}>
            <span className={styles.label}>Histórico Familiar:</span>
            <span className={patient.anamnese.historico.familiar ? styles.alertValue : styles.value}>
              {patient.anamnese.historico.familiar ? 'SIM' : 'NÃO'}
            </span>
          </div>
          {patient.anamnese.historico.familiar && (
            <div className={styles.note}>{patient.anamnese.historico.detalhe_familiar}</div>
          )}
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Fatores de Risco</h4>
          <div className={styles.row}>
            <span className={styles.label}>Uso Protetor Solar:</span>
            <span className={styles.value}>{patient.anamnese.risco.protetor_solar ? 'Sim' : 'Não'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Exposição Solar:</span>
            <span className={styles.value}>{patient.anamnese.risco.exposicao}</span>
          </div>
        </div>

        <div className={styles.labelingSection}>
          <h3 className={styles.labelingTitle}>
            <CheckCircle size={18} />
            Triagem e Rotulagem
          </h3>
          
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Prioridade Definida</label>
            <select className={styles.select}>
              <option value="">Selecione a prioridade...</option>
              <option value="alta">🔴 Alta (Imediata)</option>
              <option value="media">🟡 Média (Agendar)</option>
              <option value="baixa">🟢 Baixa (Acompanhar)</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Validação do Algoritmo</label>
            <div className={styles.buttonGroup}>
              <button className={styles.btnOutline}>Correto</button>
              <button className={styles.btnOutline}>Incorreto</button>
            </div>
          </div>

          <button className={styles.btnPrimary}>Confirmar Triagem</button>
        </div>
      </div>
    </div>
  );
}