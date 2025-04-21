import styles from '../../data-fabric-ui/globalOld.module.css'
import dbStyles from '../../data-fabric-ui/globalOld.module.css';

export default function SettingsView() {
  return (
    <div className={dbStyles.settingsContainer}>
      <div className={dbStyles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Configurações de Conexão</h2>
      </div>
      
      <div className={dbStyles.settingsContent}>
        <div className={dbStyles.settingsCard}>
          <div className={dbStyles.settingsCardHeader}>
            <h3 className={dbStyles.settingsCardTitle}>Timeouts e Limites</h3>
          </div>
          <div className={dbStyles.settingsCardContent}>
            <div className={dbStyles.settingsField}>
              <label className={dbStyles.settingsFieldLabel}>
                Timeout de Conexão (segundos)
              </label>
              <input 
                type="number" 
                defaultValue="30" 
                min="1" 
                max="300" 
                className={dbStyles.settingsInput} 
              />
            </div>
            
            <div className={dbStyles.settingsField}>
              <label className={dbStyles.settingsFieldLabel}>
                Timeout de Consulta (segundos)
              </label>
              <input 
                type="number" 
                defaultValue="60" 
                min="1" 
                max="3600" 
                className={dbStyles.settingsInput} 
              />
            </div>
            
            <div className={dbStyles.settingsField}>
              <label className={dbStyles.settingsFieldLabel}>
                Máximo de Conexões Simultâneas
              </label>
              <input 
                type="number" 
                defaultValue="10" 
                min="1" 
                max="100" 
                className={dbStyles.settingsInput} 
              />
            </div>
          </div>
        </div>
        
        <div className={dbStyles.settingsCard}>
          <div className={dbStyles.settingsCardHeader}>
            <h3 className={dbStyles.settingsCardTitle}>Segurança</h3>
          </div>
          <div className={dbStyles.settingsCardContent}>
            <div className={dbStyles.checkboxOption}>
              <input type="checkbox" id="ssl-required" className={dbStyles.checkbox} defaultChecked />
              <label htmlFor="ssl-required" className={dbStyles.checkboxLabel}>
                Exigir conexões SSL/TLS
              </label>
            </div>
            
            <div className={dbStyles.checkboxOption}>
              <input type="checkbox" id="verify-cert" className={dbStyles.checkbox} defaultChecked />
              <label htmlFor="verify-cert" className={dbStyles.checkboxLabel}>
                Verificar certificado SSL
              </label>
            </div>
            
            <div className={dbStyles.checkboxOption}>
              <input type="checkbox" id="log-queries" className={dbStyles.checkbox} defaultChecked />
              <label htmlFor="log-queries" className={dbStyles.checkboxLabel}>
                Registrar consultas para auditoria
              </label>
            </div>
            
            <div className={dbStyles.checkboxOption}>
              <input type="checkbox" id="readonly-default" className={dbStyles.checkbox} defaultChecked />
              <label htmlFor="readonly-default" className={dbStyles.checkboxLabel}>
                Conexões são somente leitura por padrão
              </label>
            </div>
          </div>
        </div>
        
        <div className={dbStyles.settingsCard}>
          <div className={dbStyles.settingsCardHeader}>
            <h3 className={dbStyles.settingsCardTitle}>Cache e Desempenho</h3>
          </div>
          <div className={dbStyles.settingsCardContent}>
            <div className={dbStyles.settingsField}>
              <label className={dbStyles.settingsFieldLabel}>
                Tempo de Vida do Cache (minutos)
              </label>
              <input 
                type="number" 
                defaultValue="15" 
                min="0" 
                max="1440" 
                className={dbStyles.settingsInput} 
              />
              <div className={dbStyles.settingsFieldHelp}>
                0 = desabilitado
              </div>
            </div>
            
            <div className={dbStyles.settingsField}>
              <label className={dbStyles.settingsFieldLabel}>
                Tamanho Máximo de Pool de Conexões
              </label>
              <input 
                type="number" 
                defaultValue="20" 
                min="1" 
                max="100" 
                className={dbStyles.settingsInput} 
              />
            </div>
            
            <div className={dbStyles.checkboxOption}>
              <input type="checkbox" id="prepared-statements" className={dbStyles.checkbox} defaultChecked />
              <label htmlFor="prepared-statements" className={dbStyles.checkboxLabel}>
                Usar prepared statements quando disponível
              </label>
            </div>
          </div>
        </div>
        
        <div className={dbStyles.settingsSaveContainer}>
          <button className={dbStyles.settingsCancelButton}>
            Cancelar
          </button>
          <button className={dbStyles.settingsSaveButton}>
            Salvar Configurações
          </button>
        </div>
      </div>
    </div>
  );
}