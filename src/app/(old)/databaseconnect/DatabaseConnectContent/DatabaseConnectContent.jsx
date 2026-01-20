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
    id: "pg-local",
    name: "PostgreSQL Local",
    type: "PostgreSQL",
    host: "localhost",
    port: 5432,
    database: "demo_analytics",
    username: "postgres",
    status: "connected",
    lastConnected: "2025-07-23 22:17:01",
    tables: 18,
    usedBy: ["Local ETL", "Data Science Sandbox"]
  },
  {
    id: "mysql-local",
    name: "MySQL Local",
    type: "MySQL",
    host: "127.0.0.1",
    port: 3306,
    database: "patients_demo",
    username: "root",
    status: "connected",
    lastConnected: "2025-07-23 21:43:25",
    tables: 12,
    usedBy: ["Dev Patient App"]
  },
  {
    id: "sqlite-main",
    name: "SQLite Main File",
    type: "SQLite",
    host: "localhost",
    port: null,
    database: "/home/user/code/app/db/main.sqlite",
    username: null,
    status: "connected",
    lastConnected: "2025-07-23 20:15:10",
    tables: 5,
    usedBy: ["Local App"]
  },
  {
    id: "mssql-local",
    name: "SQL Server Local",
    type: "SQL Server",
    host: "localhost",
    port: 1433,
    database: "legacy_demo",
    username: "sa",
    status: "disconnected",
    lastConnected: "2025-07-21 17:30:45",
    tables: 9,
    usedBy: []
  },
  {
    id: "oracle-local",
    name: "Oracle XE Local",
    type: "Oracle",
    host: "localhost",
    port: 1521,
    database: "XE",
    username: "system",
    status: "connected",
    lastConnected: "2025-07-22 09:12:33",
    tables: 21,
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