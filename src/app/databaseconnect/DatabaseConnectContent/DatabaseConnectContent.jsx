import { useState } from 'react';
import { Database } from 'lucide-react';
import styles from '../database.module.css';
import dbStyles from '../DatabaseConnectUI.module.css';

import ConnectionHeader from '../ConnectionHeader/ConnectionHeader';
import ConnectionTabs from '../ConnectionTabs/ConnectionTabs';
import ConnectionsView from '../ConnectionsView/ConnectionsView';
import CredentialsView from '../CredentialsView/CredentialsView';
import SettingsView from '../SettingsView/SettingsView';
import ConnectionModal from '../ConnectionModal/ConnectionModal';
import ConnectionTypeModal from '../ConnectionTypeModal/ConnectionTypeModal';
import ConnectionTypeView from '../ConnectionTypeView/ConnectionTypeView';

export default function DatabaseConnectContent({ returnToDashboard, currentUser }) {
  const [activeTab, setActiveTab] = useState("connections");
  const [showAddConnectionModal, setShowAddConnectionModal] = useState(false);
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [selectedDatabase, setSelectedDatabase] = useState(null);
  const [editingConnection, setEditingConnection] = useState(null);
  const [editingType, setEditingType] = useState(null);

  // Add this for ConnectionTypeView selection!
  const [selectedTypeId, setSelectedTypeId] = useState(null);

  const connections = [
    {
      id: "postgres-analytics",
      name: "PostgreSQL Analytics",
      type: "PostgreSQL",
      host: "db-1.example.com",
      port: 5432,
      database: "analytics_db",
      username: "analytics_user",
      status: "connected",
      lastConnected: "2025-04-15 04:15:23",
      tables: 42,
      usedBy: ["ETL - Dados Clinicos", "Exportação de Dados - Hospital"]
    },
    {
      id: "mysql-patients",
      name: "MySQL Pacientes",
      type: "MySQL",
      host: "mysql.example.com",
      port: 3306,
      database: "patients_db",
      username: "medical_user",
      status: "connected",
      lastConnected: "2025-04-15 03:45:12",
      tables: 28,
      usedBy: ["Análise de Métricas de Pacientes"]
    },
    {
      id: "mssql-legacy",
      name: "MSSQL Legado",
      type: "SQL Server",
      host: "legacy-sql.example.com",
      port: 1433,
      database: "legacy_records",
      username: "admin",
      status: "disconnected",
      lastConnected: "2025-04-14 18:30:45",
      tables: 15,
      usedBy: []
    },
    {
      id: "oracle-finance",
      name: "Oracle Financeiro",
      type: "Oracle",
      host: "oracle.example.com",
      port: 1521,
      database: "FINDB",
      username: "finance_read",
      status: "error",
      lastConnected: "2025-04-15 01:12:33",
      tables: 64,
      usedBy: []
    }
  ];

  // Database connection types for ConnectionModal (static)
  const connectionTypes = [
    { value: "postgresql", label: "PostgreSQL", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "mysql", label: "MySQL", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "sqlserver", label: "SQL Server", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "oracle", label: "Oracle", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "mongodb", label: "MongoDB", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "redis", label: "Redis", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "elasticsearch", label: "Elasticsearch", icon: <Database className={dbStyles.dbTypeIcon} /> },
    { value: "bigquery", label: "Google BigQuery", icon: <Database className={dbStyles.dbTypeIcon} /> }
  ];

  // Connections modal handlers
  const openAddConnectionModal = () => {
    setShowAddConnectionModal(true);
    setEditingConnection(null);
  };
  const openEditConnectionModal = (connection) => {
    setEditingConnection(connection);
    setShowAddConnectionModal(true);
  };
  const closeConnectionModal = () => {
    setShowAddConnectionModal(false);
    setEditingConnection(null);
  };

  // Type modal handlers
  const openAddTypeModal = () => {
    setShowAddTypeModal(true);
    setEditingType(null);
  };
  const openEditTypeModal = (type) => {
    setEditingType(type);
    setShowAddTypeModal(true);
  };
  const closeTypeModal = () => {
    setShowAddTypeModal(false);
    setEditingType(null);
  };

  const handleSelectDatabase = (dbId) => {
    if (selectedDatabase === dbId) {
      setSelectedDatabase(null);
    } else {
      setSelectedDatabase(dbId);
    }
  };

  return (
    <div className={styles.mainContent}>
      {/* Header */}
      <ConnectionHeader currentUser={currentUser} />

      {/* Tabs */}
      <ConnectionTabs 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        openAddConnectionModal={openAddConnectionModal}
        openAddTypeModal={openAddTypeModal}
      />

      {/* Content */}
      <div className={styles.content}>
        {activeTab === "connections" && (
          <ConnectionsView 
            connections={connections}
            selectedDatabase={selectedDatabase}
            handleSelectDatabase={handleSelectDatabase}
            openEditConnectionModal={openEditConnectionModal}
            openEditTypeModal={openEditTypeModal}
          />
        )}
        {activeTab === "credentials" && (
          <CredentialsView />
        )}
        {activeTab === "settings" && (
          <SettingsView />
        )}
        {activeTab === "connectionTypes" && (
          <ConnectionTypeView 
            selectedTypeId={selectedTypeId}
            setSelectedTypeId={setSelectedTypeId}
            openEditTypeModal={openEditTypeModal}
          />
        )}
      </div>

      {showAddConnectionModal && (
        <ConnectionModal 
          connectionTypes={connectionTypes}
          editingConnection={editingConnection}
          onClose={closeConnectionModal}
        />
      )}
      {showAddTypeModal && (
        <ConnectionTypeModal
          editingType={editingType}
          onClose={closeTypeModal}
        />
      )}
    </div>
  );
}