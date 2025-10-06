export type ExportFormat = 'csv' | 'pdf' | 'json' | 'xlsx' | 'xml';

export type CloudProvider = 'google-drive' | 'dropbox' | 'onedrive';

export type BackupFrequency = 'daily' | 'weekly' | 'monthly' | 'manual';

export interface ExportSettings {
  defaultFormat: ExportFormat;
  defaultCloudProvider?: CloudProvider;
  autoBackup: boolean;
  backupFrequency: BackupFrequency;
  backupRetention: number; // Anzahl der zu behaltenden Backups
  includeImages: boolean;
  encryptBackups: boolean;
  compressionEnabled: boolean;
}

export interface CloudIntegrationConfig {
  provider: CloudProvider;
  enabled: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  folderPath?: string;
}

export interface BackupMetadata {
  id: string;
  createdAt: string;
  format: ExportFormat;
  size: number;
  checksum: string;
  cloudProvider?: CloudProvider;
  cloudPath?: string;
  encryptionKey?: string;
  compressed: boolean;
  contents: {
    shoppingLists: boolean;
    categories: boolean;
    budgets: boolean;
    nutrition: boolean;
    settings: boolean;
  };
}

export interface ExportResult {
  success: boolean;
  format: ExportFormat;
  fileUri: string;
  fileName: string;
  size: number;
  cloudUploadStatus?: {
    uploaded: boolean;
    provider?: CloudProvider;
    path?: string;
    error?: string;
  };
}