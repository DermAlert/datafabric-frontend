import { useState, useEffect } from 'react';
import { PlusCircle, RefreshCw } from 'lucide-react';
import SourceItem from '../SourceItem/SourceItem';
import ConnectionExplorerModal from './ConnectionExplorerModal/ConnectionExplorerModal';
import DataDefineModal from './AddDatasetModal/AddDatasetModal';
import MetadataEquivalenceModal from './MetadataEquivalenceModal/MetadataEquivalenceModal';
import DataSetFilterModal from './DataSetFilterModal/DataSetFilterModal';
import EquivalenceManagerModal from './EquivalenceManagerModal/EquivalenceManagerModal';
import styles from './Sidebar.module.css';

export default function Sidebar({
  expandedSources,
  toggleSource,
  openAddDatasetModal,
  openDatasetExplorer,
  openAirflowView,
  openDataDefineModal
}) {
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [metadataEquivalenceOpen, setMetadataEquivalenceOpen] = useState(false);
  const [dataSetFilterOpen, setDataSetFilterOpen] = useState(false);
  const [dataDefineModalOpen, setDataDefineModalOpen] = useState(false);
  const [equivalenceManagerOpen, setEquivalenceManagerOpen] = useState(false);
  
  // State for connections
  const [connections, setConnections] = useState([]);
  const [connectionTypes, setConnectionTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fix: Use local modal state to control DataDefineModal visibility
  const handleOpenDataDefineModal = () => setDataDefineModalOpen(true);
  const handleCloseDataDefineModal = () => setDataDefineModalOpen(false);

  // Fetch connection types
  const fetchConnectionTypes = async () => {
    try {
      const response = await fetch('http://localhost:8004/api/connection/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pagination: { limit: 100, skip: 0, query_total: false }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connection types');
      }

      const data = await response.json();
      // Convert array to object for easier lookup
      const typesMap = {};
      data.items.forEach(type => {
        typesMap[type.id] = type;
      });
      setConnectionTypes(typesMap);
      
      return typesMap;
    } catch (err) {
      console.error('Error fetching connection types:', err);
      setError('Failed to load connection types');
      return {};
    }
  };

  // Fetch all connections
  const fetchAllConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First fetch connection types
      const typeMap = await fetchConnectionTypes();
      
      // Then fetch connections
      const response = await fetch('http://localhost:8004/api/data-connections/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pagination: { limit: 100, skip: 0, query_total: false }
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch connections');
      }

      const data = await response.json();
      
      // Enhance connections with their type info
      const enhancedConnections = data.items.map(conn => {
        const connType = typeMap[conn.connection_type_id] || {};
        return {
          ...conn,
          type: connType.name || 'Unknown',
          icon: connType.icon || 'default',
          color_hex: connType.color_hex || '#6B7280',
          isPipeline: connType.name?.toLowerCase().includes('delta')
        };
      });
      
      setConnections(enhancedConnections);
    } catch (err) {
      console.error('Error fetching connections:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch connections on component mount
  useEffect(() => {
    fetchAllConnections();
  }, []);

  // Helper function to map connection type to icon color
  const getIconColorForType = (type) => {
    if (!type) return 'Generic';
    
    const typeMap = {
      'postgres': 'Postgres',
      'postgresql': 'Postgres',
      'minio': 'Minio',
      's3': 'Minio',
      'mysql': 'MySQL',
      'delta': 'Airflow',
      'deltalake': 'Airflow',
    };
    
    return typeMap[type.toLowerCase()] || 'Generic';
  };

  return (
    <div className={styles.mainSidebar}>
      <div className={styles.sidebarHeader}>
        <h2 className={styles.sidebarTitle}>DataFabric</h2>
        <p className={styles.sidebarSubtitle}>Gerenciador de Fontes de Dados</p>
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSectionHeader}>
          <h3 className={styles.sidebarSectionTitle}>Fontes de Dados</h3>
          <button className={styles.addButton} onClick={handleOpenDataDefineModal}>
            <PlusCircle className={styles.navIcon} />
          </button>
        </div>
        
        <div className={styles.sourcesList}>
          {loading && (
            <div className={styles.loadingState}>
              <RefreshCw className={styles.spinningIcon} size={16} />
              <span>Carregando...</span>
            </div>
          )}
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
          
          {!loading && connections.length === 0 && !error && (
            <div className={styles.emptyState}>
              Nenhuma conexão encontrada. Adicione uma nova fonte.
            </div>
          )}
          
          {connections.map(connection => (
            <SourceItem
              key={connection.id}
              id={connection.id}
              name={connection.name}
              type={connection.type}
              iconColor={getIconColorForType(connection.type)}
              expanded={expandedSources[connection.id]}
              toggleSource={() => toggleSource(connection.id)}
              openAddDatasetModal={openAddDatasetModal}
              openDatasetExplorer={openDatasetExplorer}
              isPipeline={connection.isPipeline}
              datasets={[]} // Will be fetched by SourceItem when expanded
            />
          ))}
          
          <div
            className={styles.addSourceButton}
            onClick={handleOpenDataDefineModal}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Adicionar Nova Fonte</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setExplorerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Explorar Colunas das Conexões</span>
          </div>
          
          <div
            className={styles.addSourceButton}
            onClick={() => setMetadataEquivalenceOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Camada de Equivalência</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setDataSetFilterOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Filtrar Dataset</span>  
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setEquivalenceManagerOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <PlusCircle className={styles.addSourceIcon} />
            <span>Gerenciar Equivalência</span> 
          </div>
        </div>
        <DataDefineModal 
          isOpen={dataDefineModalOpen} 
          onClose={handleCloseDataDefineModal} 
          onSuccess={fetchAllConnections}
        /> 
        <ConnectionExplorerModal isOpen={explorerOpen} onClose={() => setExplorerOpen(false)} />
        <MetadataEquivalenceModal
          isOpen={metadataEquivalenceOpen}
          onClose={() => setMetadataEquivalenceOpen(false)}
        />
        <EquivalenceManagerModal
          isOpen={equivalenceManagerOpen}
          onClose={() => setEquivalenceManagerOpen(false)}
        />
        
        <DataSetFilterModal
          isOpen={dataSetFilterOpen}
          onClose={() => setDataSetFilterOpen(false)}
        />
      </div>
    </div>
  );
}