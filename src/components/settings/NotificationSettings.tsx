'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import type {
  NotificationPreferences,
  NotificationFrequency,
} from '@/types/settings';
import { toast } from '@/utils/toast';

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: {
    dailyInventorySummary: true,
    weeklyAnalyticsReport: true,
    newUserRegistration: false,
    highRejectRateAlert: true,
    systemUpdates: true,
    backupStatus: false,
  },
  inApp: {
    enabled: true,
    sound: true,
    desktop: false,
  },
  frequency: 'realtime',
};

export function NotificationSettings() {
  const { data: session } = useSession();
  const [preferences, setPreferences] =
    useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  // Fetch notification preferences
  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/notifications');

      if (!response.ok) {
        throw new Error('Failed to fetch notification preferences');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setPreferences(data.data);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      toast.error('Failed to load notification preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = async (
    updates: Partial<NotificationPreferences>
  ) => {
    try {
      setIsSaving(true);

      const response = await fetch('/api/users/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update notification preferences');
      }

      const data = await response.json();
      if (data.success && data.data) {
        setPreferences(data.data);
        toast.success('Notification preferences updated');
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      toast.error('Failed to update notification preferences');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailToggle = (key: keyof typeof preferences.email) => {
    const updatedEmail = {
      ...preferences.email,
      [key]: !preferences.email[key],
    };
    const updatedPreferences = {
      ...preferences,
      email: updatedEmail,
    };
    setPreferences(updatedPreferences);
    updatePreferences({ email: updatedEmail });
  };

  const handleInAppToggle = (key: keyof typeof preferences.inApp) => {
    const updatedInApp = {
      ...preferences.inApp,
      [key]: !preferences.inApp[key],
    };
    const updatedPreferences = {
      ...preferences,
      inApp: updatedInApp,
    };
    setPreferences(updatedPreferences);
    updatePreferences({ inApp: updatedInApp });
  };

  const handleFrequencyChange = (frequency: NotificationFrequency) => {
    const updatedPreferences = {
      ...preferences,
      frequency,
    };
    setPreferences(updatedPreferences);
    updatePreferences({ frequency });
  };

  const handleTestNotification = async () => {
    try {
      setIsTesting(true);

      const response = await fetch('/api/users/notifications/test', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to send test notification');
      }

      const data = await response.json();
      if (data.success) {
        toast.success('Test notification sent! Check your email and browser.');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Notification Settings
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage how and when you receive notifications
        </p>
      </div>

      {/* Email Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Email Notifications
        </h3>
        <div className="space-y-4">
          <NotificationToggle
            label="Daily Inventory Summary"
            description="Receive a daily summary of inventory activities"
            checked={preferences.email.dailyInventorySummary}
            onChange={() => handleEmailToggle('dailyInventorySummary')}
            disabled={isSaving}
          />

          <NotificationToggle
            label="Weekly Analytics Report"
            description="Get weekly insights and analytics reports"
            checked={preferences.email.weeklyAnalyticsReport}
            onChange={() => handleEmailToggle('weeklyAnalyticsReport')}
            disabled={isSaving}
          />

          {isAdmin && (
            <NotificationToggle
              label="New User Registration"
              description="Get notified when new users are registered (Admin only)"
              checked={preferences.email.newUserRegistration}
              onChange={() => handleEmailToggle('newUserRegistration')}
              disabled={isSaving}
            />
          )}

          <NotificationToggle
            label="High Reject Rate Alert"
            description="Receive alerts when reject rates exceed thresholds"
            checked={preferences.email.highRejectRateAlert}
            onChange={() => handleEmailToggle('highRejectRateAlert')}
            disabled={isSaving}
          />

          <NotificationToggle
            label="System Updates"
            description="Stay informed about system updates and maintenance"
            checked={preferences.email.systemUpdates}
            onChange={() => handleEmailToggle('systemUpdates')}
            disabled={isSaving}
          />

          <NotificationToggle
            label="Backup Completion"
            description="Get notified when system backups complete"
            checked={preferences.email.backupStatus}
            onChange={() => handleEmailToggle('backupStatus')}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          In-App Notifications
        </h3>
        <div className="space-y-4">
          <NotificationToggle
            label="Browser Notifications"
            description="Show notifications in your browser"
            checked={preferences.inApp.enabled}
            onChange={() => handleInAppToggle('enabled')}
            disabled={isSaving}
          />

          <NotificationToggle
            label="Sound"
            description="Play a sound when notifications arrive"
            checked={preferences.inApp.sound}
            onChange={() => handleInAppToggle('sound')}
            disabled={isSaving || !preferences.inApp.enabled}
          />

          <NotificationToggle
            label="Desktop Notifications"
            description="Show desktop notifications even when browser is minimized"
            checked={preferences.inApp.desktop}
            onChange={() => handleInAppToggle('desktop')}
            disabled={isSaving || !preferences.inApp.enabled}
          />
        </div>
      </div>

      {/* Notification Frequency */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Notification Frequency
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Choose how often you want to receive notifications
        </p>
        <div className="space-y-3">
          <FrequencyOption
            value="realtime"
            label="Real-time"
            description="Receive notifications immediately as events occur"
            selected={preferences.frequency === 'realtime'}
            onChange={handleFrequencyChange}
            disabled={isSaving}
          />

          <FrequencyOption
            value="hourly"
            label="Batched (Hourly)"
            description="Receive notifications in hourly batches"
            selected={preferences.frequency === 'hourly'}
            onChange={handleFrequencyChange}
            disabled={isSaving}
          />

          <FrequencyOption
            value="daily"
            label="Daily Digest"
            description="Receive a single daily summary of all notifications"
            selected={preferences.frequency === 'daily'}
            onChange={handleFrequencyChange}
            disabled={isSaving}
          />

          <FrequencyOption
            value="custom"
            label="Custom Schedule"
            description="Set a custom notification schedule"
            selected={preferences.frequency === 'custom'}
            onChange={handleFrequencyChange}
            disabled={isSaving}
          />
        </div>
      </div>

      {/* Test Notification */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Test Notifications
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Send a test notification to verify your settings
        </p>
        <button
          onClick={handleTestNotification}
          disabled={isTesting}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isTesting ? 'Sending...' : 'Send Test Notification'}
        </button>
      </div>
    </div>
  );
}

// Helper Components

interface NotificationToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: NotificationToggleProps) {
  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${checked ? 'bg-indigo-600' : 'bg-gray-200 dark:bg-gray-700'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
            transition duration-200 ease-in-out
            ${checked ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </button>
    </div>
  );
}

interface FrequencyOptionProps {
  value: NotificationFrequency;
  label: string;
  description: string;
  selected: boolean;
  onChange: (value: NotificationFrequency) => void;
  disabled?: boolean;
}

function FrequencyOption({
  value,
  label,
  description,
  selected,
  onChange,
  disabled = false,
}: FrequencyOptionProps) {
  return (
    <label
      className={`
        flex items-start p-4 border rounded-lg cursor-pointer transition-colors
        ${
          selected
            ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input
        type="radio"
        name="frequency"
        value={value}
        checked={selected}
        onChange={() => onChange(value)}
        disabled={disabled}
        className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-600 border-gray-300"
      />
      <div className="ml-3">
        <div className="text-sm font-medium text-gray-900 dark:text-white">
          {label}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {description}
        </div>
      </div>
    </label>
  );
}
