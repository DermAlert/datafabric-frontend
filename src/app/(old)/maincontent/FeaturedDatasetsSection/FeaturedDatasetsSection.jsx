import { useState, useEffect } from 'react';
import { Folder, RefreshCw, Database, FileJson } from 'lucide-react';
import styles from './FeaturedDatasetsSection.module.css';
import { useRouter } from 'next/navigation'; // Next.js app router

export default function FeaturedDatasetsSection({ openDatasetExplorer }) {
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch datasets from API
  const fetchDatasets = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8004/api/datasets/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: 1,
          size: 4, // Limit to 4 featured datasets
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch datasets');
      }

      const data = await response.json();
      setDatasets(data.items || []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch datasets on component mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  // Format time since last update
  const formatTimeSince = (dateString) => {
    if (!dateString) return 'Data desconhecida';
    
    const updateDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - updateDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        return 'Atualizado há poucos minutos';
      }
      return `Atualizado há ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
    } else if (diffDays === 1) {
      return 'Atualizado há 1 dia';
    } else {
      return `Atualizado há ${diffDays} dias`;
    }
  };

  // Get storage icon based on type
  const getStorageIcon = (storageType) => {
    switch (storageType) {
      case 'virtual_view':
        return <Database className={styles.datasetCardIconInner} />;
      case 'materialized':
        return <Database className={styles.datasetCardIconInner} />;
      case 'copy_to_minio':
        return <Folder className={styles.datasetCardIconInner} />;
      default:
        return <FileJson className={styles.datasetCardIconInner} />;
    }
  };

  // Get storage type display name
  const getStorageTypeDisplay = (storageType) => {
    switch (storageType) {
      case 'virtual_view':
        return 'Vista Virtual';
      case 'materialized':
        return 'Materializado';
      case 'copy_to_minio':
        return 'MinIO';
      default:
        return storageType;
    }
  };

  return (
    <div className={styles.featuredDatasetsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Datasets em Destaque</h2>
        <div className={styles.headerActions}>
          <button 
            className={`${styles.refreshButton} ${loading ? styles.spinning : ''}`}
            onClick={fetchDatasets}
            disabled={loading}
          >
            <RefreshCw size={16} />
          </button>
          <button className={styles.sectionTitleLink}>Ver Todos</button>
        </div>
      </div>
      
      {loading ? (
        <div className={styles.loadingState}>
          <RefreshCw className={styles.spinningIcon} size={18} />
          <span>Carregando datasets...</span>
        </div>
      ) : error ? (
        <div className={styles.errorState}>
          <p>Erro ao carregar datasets: {error}</p>
          <button className={styles.retryButton} onClick={fetchDatasets}>
            Tentar novamente
          </button>
        </div>
      ) : datasets.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Nenhum dataset encontrado.</p>
        </div>
      ) : (
        <div className={styles.datasetCards}>
          {datasets.map((dataset) => (
            <DatasetCard 
              key={dataset.id}
              dataset={{
                id: dataset.id,
                title: dataset.name,
                description: dataset.description,
                storageType: dataset.storage_type,
                source: getStorageTypeDisplay(dataset.storage_type),
                meta: `${dataset.status.toUpperCase()} • ${formatTimeSince(dataset.data_atualizacao)}`,
                icon: getStorageIcon(dataset.storage_type)
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DatasetCard({ dataset }) {
  const router = useRouter();

  const handleExploreClick = () => {
    // Redirect to /explorer?id=DATASET_ID instead of /explorer/DATASET_ID
    router.push(`/explorer?id=${dataset.id}`);
  };

  return (
    <div className={styles.datasetCard}>
      <div className={styles.datasetCardHeader}>
        <div className={styles.datasetCardLeft}>
          <div className={styles.datasetCardIcon}>
            {dataset.icon || <Folder className={styles.datasetCardIconInner} />}
          </div>
          <div className={styles.datasetCardInfo}>
            <h3 className={styles.datasetCardTitle}>{dataset.title}</h3>
            <div className={styles.datasetCardSource}>{dataset.source}</div>
          </div>
        </div>
      </div>
      <div className={styles.datasetCardDescription}>
        {dataset.description || 'Sem descrição disponível'}
      </div>
      <div className={styles.datasetCardMeta}>{dataset.meta}</div>
      <div className={styles.datasetCardActions}>
        <button className={styles.datasetCardLink}>Ver Detalhes</button>
        <button 
          className={styles.datasetCardLink}
          onClick={handleExploreClick}
        >
          Explorar Dados
        </button>
      </div>
    </div>
  );
}