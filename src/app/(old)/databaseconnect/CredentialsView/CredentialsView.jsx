import { Key, Code, Link2 } from 'lucide-react';
import styles from '../database.module.css'
import dbStyles from '../DatabaseConnectUI.module.css';

export default function CredentialsView() {
  return (
    <div className={dbStyles.credentialsContainer}>
      <div className={dbStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Gerenciar Credenciais</h2>
      </div>
      
      <div className={dbStyles.credentialsContent}>
        <div className={dbStyles.credentialsCard}>
          <div className={dbStyles.credentialsCardHeader}>
            <h3 className={dbStyles.credentialsCardTitle}>Armazenamento de Credenciais</h3>
          </div>
          <div className={dbStyles.credentialsCardContent}>
            <div className={dbStyles.credentialsOption}>
              <input 
                type="radio" 
                id="credentials-vault" 
                name="credentials-storage" 
                className={dbStyles.credentialsRadio} 
                defaultChecked 
              />
              <label htmlFor="credentials-vault" className={dbStyles.credentialsLabel}>
                <div className={dbStyles.credentialsLabelHeader}>
                  <Key className={dbStyles.credentialsIcon} />
                  <span>Vault Seguro (Recomendado)</span>
                </div>
                <p className={dbStyles.credentialsDescription}>
                  Armazena suas credenciais criptografadas no vault de segurança do DataFabric.
                  As credenciais são descriptografadas apenas quando necessário para conexão.
                </p>
              </label>
            </div>
            
            <div className={dbStyles.credentialsOption}>
              <input 
                type="radio" 
                id="credentials-env" 
                name="credentials-storage" 
                className={dbStyles.credentialsRadio} 
              />
              <label htmlFor="credentials-env" className={dbStyles.credentialsLabel}>
                <div className={dbStyles.credentialsLabelHeader}>
                  <Code className={dbStyles.credentialsIcon} />
                  <span>Variáveis de Ambiente</span>
                </div>
                <p className={dbStyles.credentialsDescription}>
                  Utilize variáveis de ambiente para armazenar e utilizar credenciais.
                  Útil para ambientes de desenvolvimento e CI/CD.
                </p>
              </label>
            </div>
            
            <div className={dbStyles.credentialsOption}>
              <input 
                type="radio" 
                id="credentials-external" 
                name="credentials-storage" 
                className={dbStyles.credentialsRadio} 
              />
              <label htmlFor="credentials-external" className={dbStyles.credentialsLabel}>
                <div className={dbStyles.credentialsLabelHeader}>
                  <Link2 className={dbStyles.credentialsIcon} />
                  <span>Serviço Externo de Gerenciamento</span>
                </div>
                <p className={dbStyles.credentialsDescription}>
                  Conecte-se a um serviço externo de gerenciamento de credenciais como AWS Secrets Manager,
                  HashiCorp Vault ou Azure Key Vault.
                </p>
              </label>
            </div>
          </div>
        </div>
        
        <div className={dbStyles.credentialsCard}>
          <div className={dbStyles.credentialsCardHeader}>
            <h3 className={dbStyles.credentialsCardTitle}>Política de Rotação de Senhas</h3>
          </div>
          <div className={dbStyles.credentialsCardContent}>
            <div className={dbStyles.credentialsField}>
              <label className={dbStyles.credentialsFieldLabel}>
                Frequência de Rotação
              </label>
              <select className={dbStyles.credentialsSelect}>
                <option>30 dias (Recomendado)</option>
                <option>60 dias</option>
                <option>90 dias</option>
                <option>Sem rotação automática</option>
              </select>
            </div>
            
            <div className={dbStyles.credentialsField}>
              <label className={dbStyles.credentialsFieldLabel}>
                Notificações
              </label>
              <div className={dbStyles.notificationOptions}>
                <div className={dbStyles.checkboxOption}>
                  <input type="checkbox" id="notify-expiration" className={dbStyles.checkbox} defaultChecked />
                  <label htmlFor="notify-expiration" className={dbStyles.checkboxLabel}>
                    Notificar antes da expiração de credenciais
                  </label>
                </div>
                <div className={dbStyles.checkboxOption}>
                  <input type="checkbox" id="notify-rotation" className={dbStyles.checkbox} defaultChecked />
                  <label htmlFor="notify-rotation" className={dbStyles.checkboxLabel}>
                    Notificar após rotação bem-sucedida
                  </label>
                </div>
              </div>
            </div>
            
            <button className={dbStyles.credentialsSaveButton}>
              Salvar Configurações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}