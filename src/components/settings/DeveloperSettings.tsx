'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { developerSettingsSchema } from '@/utils/settings-validation';
import type { DeveloperConfiguration, LogLevel } from '@/types/settings';
import { downloadBlob } from '@/utils/download-helper';

interface DeveloperSettingsProps {
  onSave?: (data: DeveloperConfiguration) => void;
}

export function DeveloperSettings({ onSave }: DeveloperSettingsProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<DeveloperConfiguration>({
    debugMode: false,
    logLevel: 'info',
    apiRateLimits: {
      perMinute: 60,
      perHour: 1000,
    },
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

          // Extract developer settings
          const devSettings: DeveloperConfiguration = {
            debugMode:
              settings.api?.find((s: any) => s.key === 'debug_mode')?.value ||
              false,
            logLevel:
              settings.api?.find((s: any) => s.key === 'log_level')?.value ||
              'info',
            apiRateLimits: {
              perMinute:
                settings.api?.find(
                  (s: any) => s.key === 'api_rate_limit_per_minute'
                )?.value || 60,
              perHour:
                settings.api?.find(
                  (s: any) => s.key === 'api_rate_limit_per_hour'
                )?.value || 1000,
            },
          };

          setFormData(devSettings);
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

  const handleChange = (
    field: keyof DeveloperConfiguration | string,
    value: any
  ) => {
    if (field.startsWith('apiRateLimits.')) {
      const subField = field.split('.')[1] as 'perMinute' | 'perHour';
      setFormData((prev) => ({
        ...prev,
        apiRateLimits: {
          ...prev.apiRateLimits,
          [subField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = developerSettingsSchema.safeParse(formData);

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path.join('.')] = err.message;
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
        { key: 'debug_mode', value: formData.debugMode },
        { key: 'log_level', value: formData.logLevel },
        {
          key: 'api_rate_limit_per_minute',
          value: formData.apiRateLimits.perMinute,
        },
        {
          key: 'api_rate_limit_per_hour',
          value: formData.apiRateLimits.perHour,
        },
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

      setSuccessMessage('Developer settings updated successfully');
      onSave?.(formData);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportLogs = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch('/api/settings/logs/export');

      if (!response.ok) {
        throw new Error('Failed to export logs');
      }

      // Download the file
      const blob = await response.blob();
      downloadBlob(
        blob,
        `system-logs-${new Date().toISOString().split('T')[0]}.txt`
      );

      setSuccessMessage('System logs exported successfully');
    } catch (err) {
      console.error('Error exporting logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to export logs');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading developer settings...</div>
      </div>
    );
  }

  // Only show to ADMIN users
  if (session?.user?.role !== 'ADMIN') {
    return (
      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-400">
          Developer settings are only available to administrators.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Developer Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Advanced settings for debugging and development
        </p>
      </div>

      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              These settings are for advanced users only. Changing these values
              may affect system performance and security.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debug Mode */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="debug-mode"
              type="checkbox"
              checked={formData.debugMode}
              onChange={(e) => handleChange('debugMode', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label
              htmlFor="debug-mode"
              className="font-medium text-gray-700 dark:text-gray-300"
            >
              Enable Debug Mode
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Show detailed error messages and debug information in the console
            </p>
          </div>
        </div>

        {/* Log Level */}
        <div>
          <label
            htmlFor="log-level"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Log Level
          </label>
          <select
            id="log-level"
            value={formData.logLevel}
            onChange={(e) =>
              handleChange('logLevel', e.target.value as LogLevel)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          >
            <option value="error">Error - Only critical errors</option>
            <option value="warning">Warning - Errors and warnings</option>
            <option value="info">
              Info - General information (recommended)
            </option>
            <option value="debug">
              Debug - Detailed debugging information
            </option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Controls the verbosity of system logs
          </p>
        </div>

        {/* API Rate Limits */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            API Rate Limits
          </h4>

          <div>
            <label
              htmlFor="rate-per-minute"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Requests Per Minute
            </label>
            <input
              type="number"
              id="rate-per-minute"
              value={formData.apiRateLimits.perMinute}
              onChange={(e) =>
                handleChange(
                  'apiRateLimits.perMinute',
                  parseInt(e.target.value) || 1
                )
              }
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum API requests per minute per user
            </p>
            {errors['apiRateLimits.perMinute'] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors['apiRateLimits.perMinute']}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="rate-per-hour"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Requests Per Hour
            </label>
            <input
              type="number"
              id="rate-per-hour"
              value={formData.apiRateLimits.perHour}
              onChange={(e) =>
                handleChange(
                  'apiRateLimits.perHour',
                  parseInt(e.target.value) || 1
                )
              }
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Maximum API requests per hour per user
            </p>
            {errors['apiRateLimits.perHour'] && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {errors['apiRateLimits.perHour']}
              </p>
            )}
          </div>
        </div>

        {/* Export System Logs */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            System Logs
          </h4>
          <button
            type="button"
            onClick={handleExportLogs}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {isExporting ? 'Exporting...' : 'Export System Logs'}
          </button>
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Download current system logs for debugging and analysis
          </p>
        </div>

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
