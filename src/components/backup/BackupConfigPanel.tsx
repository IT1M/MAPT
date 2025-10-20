'use client';

import { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { BackupConfig, BackupFormat } from '@/types/backup';

interface BackupConfigPanelProps {
  config: BackupConfig;
  onSave: (config: BackupConfig) => Promise<void>;
  isAdmin: boolean;
}

export default function BackupConfigPanel({
  config,
  onSave,
  isAdmin,
}: BackupConfigPanelProps) {
  const t = useTranslations('backup');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<BackupConfig>(config);

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(formData);
      setEditing(false);
    } catch (error) {
      console.error('Failed to save config:', error);
      alert(t('saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(config);
    setEditing(false);
  };

  const toggleFormat = (format: BackupFormat) => {
    const formats = formData.formats.includes(format)
      ? formData.formats.filter((f) => f !== format)
      : [...formData.formats, format];
    setFormData({ ...formData, formats });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t('automaticBackupConfig')}
          </h2>
          {isAdmin && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {t('edit')}
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                {t('enableAutomaticBackups')}
              </label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {t('enableAutomaticBackupsDesc')}
              </p>
            </div>
            <button
              onClick={() =>
                editing &&
                setFormData({ ...formData, enabled: !formData.enabled })
              }
              disabled={!editing}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${!editing && 'opacity-50 cursor-not-allowed'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Schedule Time */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('scheduleTime')}
            </label>
            <input
              type="time"
              value={formData.scheduleTime}
              onChange={(e) =>
                setFormData({ ...formData, scheduleTime: e.target.value })
              }
              disabled={!editing}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t('scheduleTimeDesc')}
            </p>
          </div>

          {/* Backup Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('backupFormats')}
            </label>
            <div className="space-y-2">
              {(['CSV', 'JSON', 'SQL'] as BackupFormat[]).map((format) => (
                <label key={format} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.formats.includes(format)}
                    onChange={() => editing && toggleFormat(format)}
                    disabled={!editing}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="ml-2 text-sm text-gray-900 dark:text-white">
                    {format}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Include Options */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('includeInBackup')}
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeAuditLogs}
                  onChange={(e) =>
                    editing &&
                    setFormData({
                      ...formData,
                      includeAuditLogs: e.target.checked,
                    })
                  }
                  disabled={!editing}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-white">
                  {t('includeAuditLogs')}
                </span>
              </label>
            </div>
          </div>

          {/* Retention Policies */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t('retentionPolicies')}
            </label>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {t('dailyBackups')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={formData.retentionDailyDays}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retentionDailyDays: parseInt(e.target.value),
                      })
                    }
                    disabled={!editing}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('days')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {t('weeklyBackups')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="52"
                    value={formData.retentionWeeklyWeeks}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retentionWeeklyWeeks: parseInt(e.target.value),
                      })
                    }
                    disabled={!editing}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('weeks')}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {t('monthlyBackups')}
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={formData.retentionMonthlyMonths}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        retentionMonthlyMonths: parseInt(e.target.value),
                      })
                    }
                    disabled={!editing}
                    className="w-20 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t('months')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Storage Path (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
              {t('storagePath')}
            </label>
            <input
              type="text"
              value={formData.storagePath}
              disabled
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {t('storagePathDesc')}
            </p>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || formData.formats.length === 0}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? t('saving') : t('saveChanges')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
