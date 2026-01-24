// ===========================================
// API Types (from backend)
// ===========================================

export * from './api';

// ===========================================
// Common Types
// ===========================================

export type Status = 'active' | 'inactive' | 'pending' | 'completed' | 'running' | 'failed' | 'error';

export type DatasetType = 'persistent' | 'virtualized';

export type DataType = 'structured' | 'images' | 'mixed';

export type FilterLogic = 'AND' | 'OR';

// ===========================================
// Connection Types
// ===========================================

export interface Connection {
  id: number | string;
  name: string;
  type: string;
  category: 'metadata' | 'storage';
  status: 'active' | 'error';
  lastSync: string;
  host: string;
  color?: string;
}

export interface ConnectionTable {
  id: number;
  name: string;
  columns: ConnectionColumn[];
}

export interface ConnectionColumn {
  id: number;
  name: string;
  type: string;
  isPK: boolean;
}

// ===========================================
// Dataset Types  
// ===========================================

export interface FilterCondition {
  column: string;
  operator: string;
  value: string;
}

export interface Transformation {
  column: string;
  type: string;
  rule?: string;
}

export interface TableReference {
  id: number;
  name: string;
  connection: string;
  connectionColor?: string;
  columnCount: number;
}

export interface VersionConfig {
  version: number;
  timestamp: string;
  operation: 'WRITE' | 'MERGE' | 'DELETE';
  rowsAffected: number;
  error?: string;
  trigger?: string;
  config: {
    tables?: TableReference[];
    sourceBronzeDataset?: string;
    relationshipCount?: number;
    outputFormat?: string | null;
    outputBucket?: string | null;
    federatedJoins?: boolean;
    rowCount: number;
    sizeBytes: number;
    columnGroups?: string[];
    filterConditions?: FilterCondition[];
    filterLogic?: FilterLogic;
    transformations?: Transformation[];
  };
}

export interface BaseDataset {
  id: string;
  name: string;
  description: string;
  type: DatasetType;
  status: Status;
  createdAt: string;
}

export interface BronzeDataset extends BaseDataset {
  dataType: DataType;
  tables: TableReference[];
  relationshipCount: number;
  outputFormat: string | null;
  outputBucket: string | null;
  federatedJoins: boolean;
  lastIngestion: string | null;
  rowCount: number;
  sizeBytes: number;
  error?: string;
  version?: number;
  versionHistory?: VersionConfig[];
}

export interface SilverDataset extends BaseDataset {
  sourceBronzeDataset?: string;
  tables?: TableReference[];
  columnGroups: string[];
  filterConditions: FilterCondition[];
  filterLogic: FilterLogic;
  transformations: Transformation[];
  lastExecution: string | null;
  rowCount: number;
  sizeBytes: number;
  error?: string;
  version?: number;
  versionHistory?: VersionConfig[];
}

// ===========================================
// Equivalence Types
// ===========================================

export interface DictionaryTerm {
  id: string;
  name: string;
  domain: string;
  dataType?: string;
  standardValues?: string[];
  values?: string[];
}

export interface ColumnMapping {
  id: string;
  connection: string;
  connectionColor: string;
  table: string;
  column: string;
  sampleValues: string[];
}

export interface ValueMapping {
  source: string;
  target: string;
  count: number;
}

export interface ColumnGroup {
  id: string;
  name: string;
  description: string;
  dictionaryTerm: DictionaryTerm | null;
  useTermStandardValues: boolean;
  customStandardValues: string[];
  columnMappings: ColumnMapping[];
  valueMappings: ValueMapping[];
  updatedAt: string;
}

// ===========================================
// Sharing Types
// ===========================================

export interface ShareRecipient {
  id: string;
  name: string;
  email: string;
  tokenPrefix?: string;
  tokenCreatedAt?: string;
  lastAccess?: string | null;
  shares?: string[];
}

export interface SharedDataset {
  id: string;
  name: string;
  layer: 'bronze' | 'silver';
  rowCount: number;
  description: string;
}

export interface Share {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  datasets: SharedDataset[];
  recipients: Pick<ShareRecipient, 'id' | 'name' | 'email'>[];
}

// ===========================================
// Federation Types
// ===========================================

export interface FederationConnection {
  id: string;
  name: string;
  color: string;
}

export interface FederationWorkspace {
  id: string;
  name: string;
  description: string;
  connections: FederationConnection[];
  tableCount: number;
  relationshipCount: number;
  updatedAt: string;
}

// ===========================================
// UI Component Props Types
// ===========================================

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export interface BadgeVariant {
  color: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
}
