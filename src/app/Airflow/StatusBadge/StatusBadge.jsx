import { CheckCircle, RefreshCw, AlertCircle, Pause } from 'lucide-react';
import styles from './StatusBadge.module.css';

export default function StatusBadge({ status }) {
  const getStatusClass = (status) => {
    switch(status) {
      case "success":
        return styles.statusSuccess;
      case "running":
        return styles.statusRunning;
      case "failed":
        return styles.statusFailed;
      default:
        return styles.statusPaused;
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "success":
        return <CheckCircle className={styles.statusIconSuccess} />;
      case "running":
        return <RefreshCw className={styles.statusIconRunning} />;
      case "failed":
        return <AlertCircle className={styles.statusIconFailed} />;
      default:
        return <Pause className={styles.statusIconPaused} />;
    }
  };
  
  const getStatusText = (status) => {
    switch(status) {
      case "success":
        return "Sucesso";
      case "running":
        return "Em Execução";
      case "failed":
        return "Falha";
      default:
        return "Pausado";
    }
  };

  return (
    <span className={`${styles.statusBadge} ${getStatusClass(status)}`}>
      {getStatusIcon(status)}
      <span>{getStatusText(status)}</span>
    </span>
  );
}