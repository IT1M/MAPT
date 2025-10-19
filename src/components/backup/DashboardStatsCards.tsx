'use client';

import { useTranslations } from '@/hooks/useTranslations';
import { Backup, BackupHealth } from '@/types/backup';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface DashboardStatsCardsProps {
  health: BackupHealth | null;
  backups: Backup[];
}

export default function DashboardStatsCards({ health, backups }: DashboardStatsCardsProps) {
  const t = useTranslations('backup');
  const locale = typeof window !== 'undefined' ? document.documentElement.lang : 'en';
  const dateLocale = locale === 'ar' ? ar : enUS;

  const completedBackups = backups.filter(b => b.status === 'COMPLETED');
  const reportsThisMonth = completedBackups.filter(b => {
    const date = new Date(b.createdAt);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).length;

  const mostRecentBackup = completedBackups[0];
  const storagePercentage = health ? (health.storageUsed / health.storageTotal) * 100 : 0;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Last Backup Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('lastBackup')}
          </h3>
          <div className={`w-3 h-3 rounded-full ${
            health?.lastBackup ? 'bg-green-500' : 'bg-red-500'
          }`} />
        </div>
        
        {health?.lastBackup ? (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {formatDistanceToNow(new Date(health.lastBackup), {
                addSuffix: true,
                locale: dateLocale,
              })}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(health.lastBackup).toLocaleString(locale)}
            </p>
            {mostRecentBackup && (
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {mostRecentBackup.filename}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatBytes(mostRecentBackup.fileSize)}
                </p>
              </div>
            )}
          </>
        ) : (
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {t('noBackups')}
          </p>
        )}
      </div>

      {/* Backups This Month Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('backupsThisMonth')}
          </h3>
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        
        <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {reportsThisMonth}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {t('totalBackups')}: {completedBackups.length}
        </p>
        
        {health && health.backupStreak > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-green-600 dark:text-green-400">
              🔥 {t('streak')}: {health.backupStreak} {t('days')}
            </p>
          </div>
        )}
      </div>

      {/* Storage Usage Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {t('storageUsage')}
          </h3>
          <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
          </svg>
        </div>
        
        {health ? (
          <>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {storagePercentage.toFixed(1)}%
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storagePercentage > 80
                    ? 'bg-red-500'
                    : storagePercentage > 60
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(storagePercentage, 100)}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {formatBytes(health.storageUsed)} / {formatBytes(health.storageTotal)}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('freeSpace')}: {formatBytes(health.storageTotal - health.storageUsed)}
            </p>
          </>
        ) : (
          <p className="text-lg text-gray-500 dark:text-gray-400">
            {t('noData')}
          </p>
        )}
      </div>
    </div>
  );
}
