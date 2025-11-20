import React, { useState } from 'react';
import PatientQueue from '../PatientQueue/PatientQueue';
import InjuryGallery from '../InjuryGallery/InjuryGallery';
import AnamnesisPanel from '../AnamnesisPanel/AnamnesisPanel';
import styles from './TriageContent.module.css';
import { Patients as mockPatients } from '../../triage/Patients'; 

export default function TriageContent() {
  const [selectedPatientId, setSelectedPatientId] = useState(mockPatients[0].id);
  const [selectedInjuryId, setSelectedInjuryId] = useState(null);

  const activePatient = mockPatients.find(p => p.id === selectedPatientId);

  const handlePatientSelect = (id) => {
    setSelectedPatientId(id);
    setSelectedInjuryId(null);
  };

  return (
    <div className={styles.layout}>
      <PatientQueue 
        patients={mockPatients} 
        selectedId={selectedPatientId} 
        onSelect={handlePatientSelect} 
      />
      
      <div className={styles.workspace}>
        <div className={styles.topBar}>
          <div>
            <h1 className={styles.patientName}>{activePatient.nome}</h1>
            <span className={styles.patientId}>ID: {activePatient.id}</span>
          </div>
          <div className={styles.statusContainer}>
            <span className={styles.statusLabel}>Status do Sistema:</span>
            <span className={styles.statusValue}>Aguardando Validação Humana</span>
          </div>
        </div>

        <div className={styles.mainArea}>
          <InjuryGallery 
            injuries={activePatient.lesoes} 
            selectedInjuryId={selectedInjuryId}
            onSelectInjury={setSelectedInjuryId}
          />
          <AnamnesisPanel patient={activePatient} />
        </div>
      </div>
    </div>
  );
}