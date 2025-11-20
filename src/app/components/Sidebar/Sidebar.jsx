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
  
  const [connections, setConnections] = useState([]);
  const [connectionTypes, setConnectionTypes] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenDataDefineModal = () => setDataDefineModalOpen(true);
  const handleCloseDataDefineModal = () => setDataDefineModalOpen(false);

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

  const fetchAllConnections = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const typeMap = await fetchConnectionTypes();
      
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

  useEffect(() => {
    fetchAllConnections();
  }, []);

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
      </div>
      <div className={styles.sidebarContent}>
        <div className={styles.sidebarSectionHeader}>
          <h3 className={styles.sidebarSectionTitle}>Fontes de Dados</h3>
          <button className={styles.addButton} onClick={handleOpenDataDefineModal}>
            <PlusCircle size={14} />
          </button>
        </div>
        
        <div className={styles.sourcesList}>
          {loading && (
            <div className={styles.loadingState}>
              <RefreshCw className={styles.spinningIcon} size={14} />
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
              Nenhuma conexão encontrada.
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
              datasets={[]} 
            />
          ))}
          
          <div
            className={styles.addSourceButton}
            onClick={handleOpenDataDefineModal}
          >
            <PlusCircle className={styles.addSourceIcon} size={14} />
            <span>Nova Fonte</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setExplorerOpen(true)}
          >
            <PlusCircle className={styles.addSourceIcon} size={14} />
            <span>Explorar Colunas</span>
          </div>
          
          <div
            className={styles.addSourceButton}
            onClick={() => setMetadataEquivalenceOpen(true)}
          >
            <PlusCircle className={styles.addSourceIcon} size={14} />
            <span>Camada de Equivalência</span>
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setDataSetFilterOpen(true)}
          >
            <PlusCircle className={styles.addSourceIcon} size={14} />
            <span>Filtrar Dataset</span>  
          </div>
          <div
            className={styles.addSourceButton}
            onClick={() => setEquivalenceManagerOpen(true)}
          >
            <PlusCircle className={styles.addSourceIcon} size={14} />
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