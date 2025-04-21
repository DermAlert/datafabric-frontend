import { useState } from 'react';
import { X, PlusCircle } from 'lucide-react';
import styles from './CreateDagModal.module.css';

export default function CreateDagModal({ onClose }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Criar Novo DAG</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.formField}>
            <label className={styles.formLabel}>Nome do DAG</label>
            <input 
              type="text" 
              placeholder="Digite o nome do DAG" 
              className={styles.formInput}
            />
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>ID do DAG</label>
            <input 
              type="text" 
              placeholder="Digite o ID do DAG (sem espaços)" 
              className={styles.formInput}
            />
            <div className={styles.formHint}>
              Exemplo: processamento_dados_clinicos
            </div>
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Descrição</label>
            <textarea 
              placeholder="Digite uma descrição para o DAG" 
              className={styles.formTextarea}
            ></textarea>
          </div>
          
          <div className={styles.twoColGrid}>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Agendamento (Cron)</label>
              <input 
                type="text" 
                placeholder="0 0 * * *" 
                className={styles.formInput}
              />
              <div className={styles.formHint}>
                Exemplo: 0 0 * * * (diariamente à meia-noite)
              </div>
            </div>
            <div className={styles.formField}>
              <label className={styles.formLabel}>Proprietário</label>
              <select className={styles.formSelect}>
                <option>Ana Silva</option>
                <option>Carlos Mendes</option>
                <option>Julia Santos</option>
                <option>Rafael Gomes</option>
              </select>
            </div>
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Tags</label>
            <input 
              type="text" 
              placeholder="Digite tags separadas por vírgula" 
              className={styles.formInput}
            />
            <div className={styles.formHint}>
              Exemplo: etl, dados_clinicos, hospital
            </div>
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Código Python</label>
            <div className={styles.codeEditor}>
              <pre className={styles.codeContent}>
{`from airflow import DAG
from airflow.operators.python_operator import PythonOperator
from datetime import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'start_date': datetime(2025, 4, 15),
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
    'retry_delay': timedelta(minutes=5),
}

dag = DAG(
    'meu_novo_dag',
    default_args=default_args,
    description='Meu novo DAG criado via interface',
    schedule_interval='0 0 * * *',
    catchup=False
)

def task_function():
    print("Executando tarefa")
    
t1 = PythonOperator(
    task_id='executar_tarefa',
    python_callable=task_function,
    dag=dag,
)
`}
              </pre>
            </div>
          </div>
          
          <div className={styles.formField}>
            <label className={styles.formLabel}>Dependências de Tarefas</label>
            <div className={styles.dependenciesBuilder}>
              <div className={styles.taskItem}>
                <input type="text" placeholder="Nome da tarefa" className={styles.taskNameInput} />
                <select className={styles.taskTypeSelect}>
                  <option>PythonOperator</option>
                  <option>BashOperator</option>
                  <option>PostgresOperator</option>
                  <option>S3KeySensor</option>
                </select>
                <button className={styles.addTaskButton}>
                  <PlusCircle className={styles.addTaskIcon} />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.secondaryButton}
            onClick={onClose}
          >
            Cancelar
          </button>
          <button className={styles.primaryButton}>
            Criar DAG
          </button>
        </div>
      </div>
    </div>
  );
}