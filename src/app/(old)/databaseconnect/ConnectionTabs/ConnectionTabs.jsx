import { Link2, Key, Settings, PlusCircle, Layers } from 'lucide-react';
import dbStyles from '../DatabaseConnectUI.module.css';

export default function ConnectionTabs({ activeTab, setActiveTab, openAddConnectionModal, openAddTypeModal }) {
  return (
    <div className={dbStyles.tabsContainer}>
      <div className={dbStyles.tabs}>
        <button 
          className={`${dbStyles.tab} ${activeTab === "connections" ? dbStyles.tabActive : ""}`}
          onClick={() => setActiveTab("connections")}
        >
          <Link2 className={dbStyles.tabIcon} />
          <span>Conexões</span>
        </button>
        <button 
          className={`${dbStyles.tab} ${activeTab === "credentials" ? dbStyles.tabActive : ""}`}
          onClick={() => setActiveTab("credentials")}
        >
          <Key className={dbStyles.tabIcon} />
          <span>Credenciais</span>
        </button>
        <button 
          className={`${dbStyles.tab} ${activeTab === "settings" ? dbStyles.tabActive : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          <Settings className={dbStyles.tabIcon} />
          <span>Configurações</span>
        </button>
        <button 
          className={`${dbStyles.tab} ${activeTab === "connectionTypes" ? dbStyles.tabActive : ""}`}
          onClick={() => setActiveTab("connectionTypes")}
        >
          <Layers className={dbStyles.tabIcon} />
          <span>Tipos de Conexão</span>
        </button>
      </div>
      
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button className={dbStyles.addConnectionButton} onClick={openAddConnectionModal}>
          <PlusCircle className={dbStyles.addConnectionIcon} />
          <span>Nova Conexão</span>
        </button>
        <button className={dbStyles.addConnectionButton} style={{ background: '#059669' }} onClick={openAddTypeModal}>
          <Layers className={dbStyles.addConnectionIcon} />
          <span>Novo Tipo</span>
        </button>
      </div>
    </div>
  );
}