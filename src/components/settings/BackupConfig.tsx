'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { backupConfigSchema } from '@/utils/settings-validation';
import type { BackupConfiguration, BackupFormat } from '@/types/settings';

interface BackupConfigProps {
  onSave?: (data: BackupConfiguration) => void;
}

export function BackupConfig({ onSave }: BackupConfigProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<{
    timestamp: string;
    status: string;
  } | null>(null);

  const [formData, setFormData] = useState<BackupConfiguration>({
    enabled: false,
    time: '02:00',
    retentionDays: 30,
    format: ['CSV'],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/settings');

        if (!response.ok) {
          throw new Error('Failed to fetch settings');
        }

        const data = await response.json();

        if (data.success && data.data.settings) {
          const settings = data.data.settings;

          // Extract backup settings
          const backupSettings: BackupConfiguration = {
            enabled:
              settings.backup?.find((s: any) => s.key === 'backup_enabled')
                ?.value || false,
            time:
              settings.backup?.find((s: any) => s.key === 'backup_time')
                ?.value || '02:00',
            retentionDays:
              settings.backup?.find(
                (s: any) => s.key === 'backup_retention_days'
              )?.value || 30,
            format: settings.backup?.find((s: any) => s.key === 'backup_format')
              ?.value || ['CSV'],
          };

          setFormData(backupSettings);

          // Get last backup info if available
          const lastBackupTimestamp = settings.backup?.find(
            (s: any) => s.key === 'last_backup_timestamp'
          )?.value;
          const lastBackupStatus = settings.backup?.find(
            (s: any) => s.key === 'last_backup_status'
          )?.value;

          if (lastBackupTimestamp) {
            setLastBackup({
              timestamp: lastBackupTimestamp,
              status: lastBackupStatus || 'unknown',
            });
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to load settings'
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (field: keyof BackupConfiguration, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    setSuccessMessage(null);
  };

  const handleFormatToggle = (format: BackupFormat) => {
    const currentFormats = formData.format;
    const newFormats = currentFormats.includes(format)
      ? currentFormats.filter((f) => f !== format)
      : [...currentFormats, format];

    handleChange('format', newFormats);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = backupConfigSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      // Convert to settings format
      const settingsToUpdate = [
        { key: 'backup_enabled', value: formData.enabled },
        { key: 'backup_time', value: formData.time },
        { key: 'backup_retention_days', value: formData.retentionDays },
        { key: 'backup_format', value: formData.format },
      ];

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error?.message || 'Failed to update settings'
        );
      }

      setSuccessMessage('Backup configuration updated successfully');
      onSave?.(formData);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading backup configuration...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Backup Configuration
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure automatic backup settings
        </p>
      </div>

      {/* Last Backup Status */}
      {lastBackup && (
        <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Last Backup
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {formatDate(lastBackup.timestamp)}
              </p>
            </div>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                lastBackup.status === 'success'
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : lastBackup.status === 'failed'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
              }`}
            >
              {lastBackup.status}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Enable Daily Backups */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="backup-enabled"
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleChange('enabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor="backup-enabled"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              Enable Daily Automatic Backups
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Automatically backup data every day at the specified time
            </p>
          </div>
        </div>

        {/* Backup Time */}
        {formData.enabled && (
          <>
            <div>
              <label
                htmlFor="backup-time"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Backup Time
              </label>
              <input
                type="time"
                id="backup-time"
                value={formData.time}
                onChange={(e) => handleChange('time', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Time when daily backup should run (24-hour format)
              </p>
              {errors.time && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.time}
                </p>
              )}
            </div>

            {/* Retention Period */}
            <div>
              <label
                htmlFor="retention-days"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Retention Period (Days)
              </label>
              <input
                type="number"
                id="retention-days"
                value={formData.retentionDays}
                onChange={(e) =>
                  handleChange('retentionDays', parseInt(e.target.value) || 1)
                }
                min="1"
                max="365"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Number of days to keep backup files (1-365)
              </p>
              {errors.retentionDays && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.retentionDays}
                </p>
              )}
            </div>

            {/* Backup Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Backup Format
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    id="format-csv"
                    type="checkbox"
                    checked={formData.format.includes('CSV')}
                    onChange={() => handleFormatToggle('CSV')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="format-csv"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    CSV (Comma-Separated Values)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="format-json"
                    type="checkbox"
                    checked={formData.format.includes('JSON')}
                    onChange={() => handleFormatToggle('JSON')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="format-json"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    JSON (JavaScript Object Notation)
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    id="format-sql"
                    type="checkbox"
                    checked={formData.format.includes('SQL')}
                    onChange={() => handleFormatToggle('SQL')}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="format-sql"
                    className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    SQL (Database Dump)
                  </label>
                </div>
              </div>
              {errors.format && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {errors.format}
                </p>
              )}
            </div>
          </>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-400">
              {successMessage}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
