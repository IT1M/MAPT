export type BackupType = 'MANUAL' | 'AUTOMATIC' | 'PRE_RESTORE';
export type BackupFormat = 'CSV' | 'JSON' | 'SQL';
export type BackupStatus = 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CORRUPTED';

export interface Backup {
  id: string;
  filename: string;
  type: BackupType;
  format: BackupFormat;
  fileSize: number;
  recordCount: number;
  status: BackupStatus;
  createdAt: Date | string;
  createdBy: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  includeAuditLogs: boolean;
  includeUserData: boolean;
  includeSettings: boolean;
  dateRangeFrom?: Date | string;
  dateRangeTo?: Date | string;
  notes?: string;
  encrypted: boolean;
  checksum: string;
  validated: boolean;
  validatedAt?: Date | string;
}

export interface BackupConfig {
  id?: string;
  enabled: boolean;
  scheduleTime: string;
  formats: BackupFormat[];
  includeAuditLogs: boolean;
  retentionDailyDays: number;
  retentionWeeklyWeeks: number;
  retentionMonthlyMonths: number;
  storagePath: string;
  updatedAt?: Date | string;
  updatedBy?: string;
}

export interface BackupHealth {
  lastBackup: Date | string | null;
  nextBackup: Date | string | null;
  backupStreak: number;
  failedBackupsLast30Days: number;
  avgDuration: number;
  storageUsed: number;
  storageTotal: number;
  alerts: Alert[];
}

export interface Alert {
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: Date | string;
}

export interface RestoreOptions {
  mode: 'full' | 'merge' | 'preview';
  password?: string;
  adminPassword: string;
}

export interface RestoreSummary {
  itemsAdded: number;
  itemsUpdated: number;
  itemsSkipped: number;
  errors: string[];
  duration: number;
}

export interface ValidationResult {
  valid: boolean;
  checks: {
    checksum: boolean;
    completeness: boolean;
    formatValid: boolean;
    restoreTest: boolean;
  };
  errors?: string[];
}

export interface BackupCreateConfig {
  name: string;
  includeAuditLogs: boolean;
  includeUserData: boolean;
  includeSettings: boolean;
  format: 'csv' | 'json' | 'sql' | 'all';
  dateRange?: { from: Date; to: Date };
  notes?: string;
  encrypted?: boolean;
  password?: string;
}
