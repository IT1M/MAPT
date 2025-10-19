'use client';

import { useTranslations } from '@/hooks/useTranslations';
import { BackupHealth } from '@/types/backup';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

interface BackupHealthMonitorProps {
  health: BackupHealth | null;
  onRefresh: () => void;
}

export default function BackupHealthMonitor({ health, onRefresh }: BackupHealthMonitorProps) {
  const t = useTranslations('backup');
  const locale = typeof window !== 'undefined' ? document.documentElement.lang : 'en';
  const dateLocale = locale === 'ar' ? ar : enUS;

  if (!health) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const hasWarnings = health.alerts.some(a => a.type === 'warning');
  const hasErrors = health.alerts.some(a => a.type === 'error');

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('healthMonitor')}
          </h2>
          <button
            onClick={onRefresh}
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>

        {/* Alerts */}
        {health.alerts.length > 0 && (
          <div className="mb-6 space-y-2">
            {health.alerts.map((alert, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  alert.type === 'error'
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {alert.type === 'error' && (
                      <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                    {alert.type === 'warning' && (
                      <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                    {alert.type === 'info' && (
                      <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <p className={`text-sm font-medium ${
                      alert.type === 'error'
                        ? 'text-red-800 dark:text-red-200'
                        : alert.type === 'warning'
                        ? 'text-yellow-800 dark:text-yellow-200'
                        : 'text-blue-800 dark:text-blue-200'
                    }`}>
                      {alert.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Health Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Last Backup */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('lastBackup')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {health.lastBackup
                ? formatDistanceToNow(new Date(health.lastBackup), {
                    addSuffix: true,
                    locale: dateLocale,
                  })
                : t('never')}
            </p>
          </div>

          {/* Next Backup */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('nextBackup')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {health.nextBackup
                ? formatDistanceToNow(new Date(health.nextBackup), {
                    addSuffix: true,
                    locale: dateLocale,
                  })
                : t('notScheduled')}
            </p>
          </div>

          {/* Backup Streak */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('backupStreak')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {health.backupStreak} {t('days')}
            </p>
          </div>

          {/* Failed Backups */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('failedLast30Days')}
            </p>
            <p className={`text-sm font-semibold ${
              health.failedBackupsLast30Days > 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-green-600 dark:text-green-400'
            }`}>
              {health.failedBackupsLast30Days}
            </p>
          </div>

          {/* Average Duration */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('avgDuration')}
            </p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatDuration(health.avgDuration)}
            </p>
          </div>

          {/* Storage Used */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg col-span-2 md:col-span-3">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
              {t('storageUsed')}
            </p>
            <div className="flex items-center space-x-3">
              <div className="flex-1">
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      (health.storageUsed / health.storageTotal) * 100 > 80
                        ? 'bg-red-500'
                        : (health.storageUsed / health.storageTotal) * 100 > 60
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{
                      width: `${Math.min((health.storageUsed / health.storageTotal) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                {((health.storageUsed / health.storageTotal) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>

        {/* Overall Status */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-3 h-3 rounded-full ${
                hasErrors
                  ? 'bg-red-500'
                  : hasWarnings
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`} />
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {hasErrors
                  ? t('statusError')
                  : hasWarnings
                  ? t('statusWarning')
                  : t('statusHealthy')}
              </span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('lastChecked')}: {new Date().toLocaleTimeString(locale)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
