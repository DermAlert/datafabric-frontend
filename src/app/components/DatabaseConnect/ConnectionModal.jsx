"use client"
import { useState } from 'react';
import { X, Eye, EyeOff, RefreshCw, Link2 } from 'lucide-react';
import styles from '../../data-fabric-ui/globalOld.module.css'
import dbStyles from './DatabaseConnectUI.module.css';

export default function ConnectionModal({ connectionTypes, editingConnection, onClose }) {
  const [showPassword, setShowPassword] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const testConnection = () => {
    setTestingConnection(true);
    
    // Simulate connection test
    setTimeout(() => {
      setTestingConnection(false);
    }, 2000);
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContainer}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>
            {editingConnection ? "Editar Conexão" : "Nova Conexão de Banco de Dados"}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X className={styles.closeIcon} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={dbStyles.connectionForm}>
            <div className={dbStyles.formSection}>
              <h3 className={dbStyles.formSectionTitle}>Informações Básicas</h3>
              
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Nome da Conexão</label>
                  <input 
                    type="text" 
                    placeholder="Ex: PostgreSQL Analytics" 
                    className={styles.formInput}
                    defaultValue={editingConnection ? editingConnection.name : ""}
                  />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Tipo de Banco de Dados</label>
                  <div className={dbStyles.dbTypeSelector}>
                    <select 
                      className={dbStyles.dbTypeSelect}
                      defaultValue={editingConnection ? 
                        connectionTypes.find(type => 
                          type.label === editingConnection.type
                        )?.value || "postgresql" : "postgresql"}
                    >
                      {connectionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={dbStyles.formSection}>
              <h3 className={dbStyles.formSectionTitle}>Detalhes da Conexão</h3>
              
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Host / Endereço</label>
                  <input 
                    type="text" 
                    placeholder="Ex: db.example.com" 
                    className={styles.formInput}
                    defaultValue={editingConnection ? editingConnection.host : ""}
                  />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Porta</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 5432" 
                    className={styles.formInput}
                    defaultValue={editingConnection ? editingConnection.port : "5432"}
                  />
                </div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>Nome do Banco de Dados</label>
                <input 
                  type="text" 
                  placeholder="Ex: analytics_db" 
                  className={styles.formInput}
                  defaultValue={editingConnection ? editingConnection.database : ""}
                />
              </div>
            </div>
            
            <div className={dbStyles.formSection}>
              <h3 className={dbStyles.formSectionTitle}>Autenticação</h3>
              
              <div className={dbStyles.authSelector}>
                <div className={dbStyles.authOption}>
                  <input 
                    type="radio" 
                    id="auth-user-pass" 
                    name="auth-method" 
                    className={dbStyles.authRadio} 
                    defaultChecked 
                  />
                  <label htmlFor="auth-user-pass" className={dbStyles.authLabel}>
                    Usuário e Senha
                  </label>
                </div>
                
                <div className={dbStyles.authOption}>
                  <input 
                    type="radio" 
                    id="auth-key" 
                    name="auth-method" 
                    className={dbStyles.authRadio} 
                  />
                  <label htmlFor="auth-key" className={dbStyles.authLabel}>
                    Chave de API
                  </label>
                </div>
                
                <div className={dbStyles.authOption}>
                  <input 
                    type="radio" 
                    id="auth-iam" 
                    name="auth-method" 
                    className={dbStyles.authRadio} 
                  />
                  <label htmlFor="auth-iam" className={dbStyles.authLabel}>
                    IAM / Gerenciada
                  </label>
                </div>
              </div>
              
              <div className={styles.twoColGrid}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Usuário</label>
                  <input 
                    type="text" 
                    placeholder="Ex: db_user" 
                    className={styles.formInput}
                    defaultValue={editingConnection ? editingConnection.username : ""}
                  />
                </div>
                
                <div className={styles.formField}>
                  <label className={styles.formLabel}>Senha</label>
                  <div className={dbStyles.passwordInputContainer}>
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="Digite a senha" 
                      className={dbStyles.passwordInput} 
                    />
                    <button 
                      className={dbStyles.togglePasswordButton}
                      onClick={togglePasswordVisibility}
                      type="button"
                    >
                      {showPassword ? 
                        <EyeOff className={dbStyles.passwordIcon} /> : 
                        <Eye className={dbStyles.passwordIcon} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={dbStyles.formSection}>
              <h3 className={dbStyles.formSectionTitle}>Opções Avançadas</h3>
              
              <div className={dbStyles.advancedOptions}>
                <div className={dbStyles.checkboxOption}>
                  <input type="checkbox" id="use-ssl" className={dbStyles.checkbox} defaultChecked />
                  <label htmlFor="use-ssl" className={dbStyles.checkboxLabel}>
                    Usar SSL/TLS
                  </label>
                </div>
                
                <div className={dbStyles.checkboxOption}>
                  <input type="checkbox" id="readonly" className={dbStyles.checkbox} defaultChecked />
                  <label htmlFor="readonly" className={dbStyles.checkboxLabel}>
                    Conexão somente leitura
                  </label>
                </div>
              </div>
              
              <div className={styles.formField}>
                <label className={styles.formLabel}>String de Conexão Personalizada (Opcional)</label>
                <textarea 
                  className={styles.formTextarea}
                  placeholder="Parâmetros adicionais de conexão específicos para este banco de dados"
                />
                <div className={styles.formHint}>
                  Ex: sslmode=require&connect_timeout=10
                </div>
              </div>
            </div>
            
            <div className={dbStyles.testConnectionContainer}>
              <button 
                className={dbStyles.testConnectionButton}
                onClick={testConnection}
                disabled={testingConnection}
              >
                {testingConnection ? 
                  <RefreshCw className={`${dbStyles.testConnectionIcon} ${dbStyles.spinIcon}`} /> : 
                  <Link2 className={dbStyles.testConnectionIcon} />
                }
                <span>{testingConnection ? "Testando..." : "Testar Conexão"}</span>
              </button>
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
            {editingConnection ? "Atualizar Conexão" : "Criar Conexão"}
          </button>
        </div>
      </div>
    </div>
  );
}