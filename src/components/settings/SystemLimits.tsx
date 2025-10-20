'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { systemLimitsSchema } from '@/utils/settings-validation';
import type { SystemLimitsConfiguration } from '@/types/settings';

interface SystemLimitsProps {
  onSave?: (data: SystemLimitsConfiguration) => void;
}

export function SystemLimits({ onSave }: SystemLimitsProps) {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState<SystemLimitsConfiguration>({
    maxItemsPerUserPerDay: 1000,
    maxFileUploadSizeMB: 10,
    sessionTimeoutMinutes: 60,
    maxLoginAttempts: 5,
    rateLimitPerMinute: 100,
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

          // Extract system limits settings
          const limitsSettings: SystemLimitsConfiguration = {
            maxItemsPerUserPerDay:
              settings.security?.find(
                (s: any) => s.key === 'max_items_per_user_per_day'
              )?.value || 1000,
            maxFileUploadSizeMB:
              settings.security?.find(
                (s: any) => s.key === 'max_file_upload_size_mb'
              )?.value || 10,
            sessionTimeoutMinutes:
              settings.security?.find(
                (s: any) => s.key === 'session_timeout_minutes'
              )?.value || 60,
            maxLoginAttempts:
              settings.security?.find(
                (s: any) => s.key === 'max_login_attempts'
              )?.value || 5,
            rateLimitPerMinute:
              settings.api?.find((s: any) => s.key === 'rate_limit_per_minute')
                ?.value || 100,
          };

          setFormData(limitsSettings);
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
    field: keyof SystemLimitsConfiguration,
    value: number
  ) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = systemLimitsSchema.safeParse(formData);

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
        {
          key: 'max_items_per_user_per_day',
          value: formData.maxItemsPerUserPerDay,
        },
        { key: 'max_file_upload_size_mb', value: formData.maxFileUploadSizeMB },
        {
          key: 'session_timeout_minutes',
          value: formData.sessionTimeoutMinutes,
        },
        { key: 'max_login_attempts', value: formData.maxLoginAttempts },
        { key: 'rate_limit_per_minute', value: formData.rateLimitPerMinute },
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

      setSuccessMessage('System limits updated successfully');
      onSave?.(formData);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading system limits...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          System Limits
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure system-wide limits and thresholds
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Max Items Per User Per Day */}
        <div>
          <label
            htmlFor="max-items"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Max Items Per User Per Day
          </label>
          <input
            type="number"
            id="max-items"
            value={formData.maxItemsPerUserPerDay}
            onChange={(e) =>
              handleChange(
                'maxItemsPerUserPerDay',
                parseInt(e.target.value) || 1
              )
            }
            min="1"
            max="10000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum number of inventory items a user can create per day
            (1-10,000)
          </p>
          {errors.maxItemsPerUserPerDay && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.maxItemsPerUserPerDay}
            </p>
          )}
        </div>

        {/* Max File Upload Size */}
        <div>
          <label
            htmlFor="max-upload"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Max File Upload Size (MB)
          </label>
          <input
            type="number"
            id="max-upload"
            value={formData.maxFileUploadSizeMB}
            onChange={(e) =>
              handleChange('maxFileUploadSizeMB', parseInt(e.target.value) || 1)
            }
            min="1"
            max="100"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum file size for uploads in megabytes (1-100)
          </p>
          {errors.maxFileUploadSizeMB && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.maxFileUploadSizeMB}
            </p>
          )}
        </div>

        {/* Session Timeout */}
        <div>
          <label
            htmlFor="session-timeout"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Session Timeout (Minutes)
          </label>
          <input
            type="number"
            id="session-timeout"
            value={formData.sessionTimeoutMinutes}
            onChange={(e) =>
              handleChange(
                'sessionTimeoutMinutes',
                parseInt(e.target.value) || 5
              )
            }
            min="5"
            max="1440"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Inactive session timeout in minutes (5-1440, 24 hours max)
          </p>
          {errors.sessionTimeoutMinutes && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.sessionTimeoutMinutes}
            </p>
          )}
        </div>

        {/* Max Login Attempts */}
        <div>
          <label
            htmlFor="max-login"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Max Login Attempts
          </label>
          <input
            type="number"
            id="max-login"
            value={formData.maxLoginAttempts}
            onChange={(e) =>
              handleChange('maxLoginAttempts', parseInt(e.target.value) || 1)
            }
            min="1"
            max="10"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum failed login attempts before account lockout (1-10)
          </p>
          {errors.maxLoginAttempts && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.maxLoginAttempts}
            </p>
          )}
        </div>

        {/* Rate Limit Per Minute */}
        <div>
          <label
            htmlFor="rate-limit"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            API Rate Limit (Per Minute)
          </label>
          <input
            type="number"
            id="rate-limit"
            value={formData.rateLimitPerMinute}
            onChange={(e) =>
              handleChange('rateLimitPerMinute', parseInt(e.target.value) || 10)
            }
            min="10"
            max="1000"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Maximum API requests per minute per user (10-1000)
          </p>
          {errors.rateLimitPerMinute && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.rateLimitPerMinute}
            </p>
          )}
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
