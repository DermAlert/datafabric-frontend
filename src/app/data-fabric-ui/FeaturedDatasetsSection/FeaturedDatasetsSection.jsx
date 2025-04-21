import { Folder } from 'lucide-react';
import styles from './FeaturedDatasetsSection.module.css';

export default function FeaturedDatasetsSection({ openDatasetExplorer }) {
  const featuredDatasets = [
    {
      id: "cancer-skin-images-white",
      title: "Imagens - Câncer de Pele (Pele Branca)",
      source: "MinIO",
      meta: "5.3 GB • 1,245 objetos • Atualizado há 2 dias"
    },
    {
      id: "cancer-skin-images-black",
      title: "Imagens - Câncer de Pele (Pele Negra)",
      source: "MinIO",
      meta: "3.7 GB • 892 objetos • Atualizado há 5 dias"
    }
  ];

  return (
    <div className={styles.featuredDatasetsSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Datasets em Destaque</h2>
        <button className={styles.sectionTitleLink}>Ver Todos</button>
      </div>
      
      <div className={styles.datasetCards}>
        {featuredDatasets.map((dataset, index) => (
          <DatasetCard 
            key={index}
            dataset={dataset}
            openDatasetExplorer={openDatasetExplorer}
          />
        ))}
      </div>
    </div>
  );
}

function DatasetCard({ dataset, openDatasetExplorer }) {
  return (
    <div className={styles.datasetCard}>
      <div className={styles.datasetCardHeader}>
        <div className={styles.datasetCardLeft}>
          <div className={styles.datasetCardIcon}>
            <Folder className={styles.datasetCardIconInner} />
          </div>
          <div className={styles.datasetCardInfo}>
            <h3 className={styles.datasetCardTitle}>{dataset.title}</h3>
            <div className={styles.datasetCardSource}>{dataset.source}</div>
          </div>
        </div>
      </div>
      <div className={styles.datasetCardMeta}>{dataset.meta}</div>
      <div className={styles.datasetCardActions}>
        <button className={styles.datasetCardLink}>Ver Detalhes</button>
        <button 
          className={styles.datasetCardLink}
          onClick={() => openDatasetExplorer({
            id: dataset.id,
            name: dataset.title,
            source: dataset.source,
            type: "Image Collection",
            // Additional details can be added here
          })}
        >
          Explorar Dados
        </button>
      </div>
    </div>
  );
}