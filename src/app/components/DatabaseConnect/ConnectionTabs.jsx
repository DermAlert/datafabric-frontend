import { Link2, Key, Settings, PlusCircle } from 'lucide-react';
import dbStyles from './DatabaseConnectUI.module.css';

export default function ConnectionTabs({ activeTab, setActiveTab, openAddConnectionModal }) {
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
      </div>
      
      <button className={dbStyles.addConnectionButton} onClick={openAddConnectionModal}>
        <PlusCircle className={dbStyles.addConnectionIcon} />
        <span>Nova Conexão</span>
      </button>
    </div>
  );
}