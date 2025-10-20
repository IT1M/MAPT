'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import BackupConfigPanel from './BackupConfigPanel';
import BackupHistoryTable from './BackupHistoryTable';
import BackupHealthMonitor from './BackupHealthMonitor';
import DashboardStatsCards from './DashboardStatsCards';
import CreateBackupDialog from './CreateBackupDialog';
import RestoreBackupDialog from './RestoreBackupDialog';
import BackupValidationPanel from './BackupValidationPanel';
import {
  BackupConfig,
  Backup,
  BackupHealth,
  ValidationResult,
} from '@/types/backup';
import { downloadBlob } from '@/utils/download-helper';

interface BackupManagementPageProps {
  locale: string;
  userRole: string;
}

export default function BackupManagementPage({
  locale,
  userRole,
}: BackupManagementPageProps) {
  const t = useTranslations('backup');
  const [config, setConfig] = useState<BackupConfig | null>(null);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [health, setHealth] = useState<BackupHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<Backup | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load config
      const configRes = await fetch('/api/backup/config');
      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
      }

      // Load backups
      const backupsRes = await fetch(`/api/backup/list?page=${page}&limit=25`);
      if (backupsRes.ok) {
        const backupsData = await backupsRes.json();
        setBackups(backupsData.backups);
        setTotalPages(backupsData.pagination.totalPages);
      }

      // Load health
      const healthRes = await fetch('/api/backup/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }
    } catch (error) {
      console.error('Failed to load backup data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigSave = async (newConfig: BackupConfig) => {
    try {
      const res = await fetch('/api/backup/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (res.ok) {
        setConfig(newConfig);
        await loadData();
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      throw error;
    }
  };

  const handleCreateBackup = () => {
    setCreateDialogOpen(true);
  };

  const handleBackupCreated = async () => {
    setCreateDialogOpen(false);
    await loadData();
  };

  const handleDownload = async (backupId: string) => {
    try {
      const res = await fetch(`/api/backup/download/${backupId}`);
      if (res.ok) {
        const blob = await res.blob();
        downloadBlob(blob, `backup-${backupId}.zip`);
      }
    } catch (error) {
      console.error('Failed to download backup:', error);
    }
  };

  const handleRestore = (backup: Backup) => {
    setSelectedBackup(backup);
    setRestoreDialogOpen(true);
  };

  const handleRestoreComplete = async () => {
    setRestoreDialogOpen(false);
    setSelectedBackup(null);
    await loadData();
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm(t('confirmDelete'))) return;

    try {
      const res = await fetch(`/api/backup/${backupId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Failed to delete backup:', error);
    }
  };

  const handleValidate = async (backupId: string) => {
    try {
      const res = await fetch('/api/backup/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupId }),
      });

      if (res.ok) {
        const result = await res.json();
        setValidationResult(result);
      }
    } catch (error) {
      console.error('Failed to validate backup:', error);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      </div>

      {/* Dashboard Stats */}
      <DashboardStatsCards health={health} backups={backups} />

      {/* Health Monitor */}
      <div className="mb-8">
        <BackupHealthMonitor health={health} onRefresh={loadData} />
      </div>

      {/* Configuration Panel */}
      {config && (
        <div className="mb-8">
          <BackupConfigPanel
            config={config}
            onSave={handleConfigSave}
            isAdmin={isAdmin}
          />
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="mb-8">
          <BackupValidationPanel
            result={validationResult}
            onClose={() => setValidationResult(null)}
          />
        </div>
      )}

      {/* Backup History */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('backupHistory')}
          </h2>
          <button
            onClick={handleCreateBackup}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {t('createBackup')}
          </button>
        </div>

        <BackupHistoryTable
          backups={backups}
          onDownload={handleDownload}
          onRestore={handleRestore}
          onDelete={handleDelete}
          onValidate={handleValidate}
          currentUser={{ role: userRole }}
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      </div>

      {/* Dialogs */}
      {createDialogOpen && (
        <CreateBackupDialog
          isOpen={createDialogOpen}
          onClose={() => setCreateDialogOpen(false)}
          onComplete={handleBackupCreated}
        />
      )}

      {restoreDialogOpen && selectedBackup && (
        <RestoreBackupDialog
          backup={selectedBackup}
          isOpen={restoreDialogOpen}
          onConfirm={handleRestoreComplete}
          onCancel={() => {
            setRestoreDialogOpen(false);
            setSelectedBackup(null);
          }}
        />
      )}
    </div>
  );
}
