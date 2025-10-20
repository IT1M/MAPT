'use client';

import { useNotifications } from '@/context/NotificationContext';
import { useTranslations } from '@/hooks/useTranslations';

/**
 * Demo component to test the notification system
 * This can be temporarily added to any page to test notifications
 */
export function NotificationDemo() {
  const { addNotification } = useNotifications();
  const t = useTranslations();

  const addInfoNotification = () => {
    addNotification({
      type: 'info',
      title: 'Information',
      message: 'This is an informational notification',
    });
  };

  const addSuccessNotification = () => {
    addNotification({
      type: 'success',
      title: 'Success!',
      message: 'Your item has been saved successfully',
      actionUrl: '/en/data-log',
      actionLabel: 'View in Data Log',
    });
  };

  const addWarningNotification = () => {
    addNotification({
      type: 'warning',
      title: 'Warning',
      message: 'High reject rate detected for batch #12345',
      actionUrl: '/en/analytics',
      actionLabel: 'View Analytics',
    });
  };

  const addErrorNotification = () => {
    addNotification({
      type: 'error',
      title: 'Error',
      message: 'Failed to generate report. Please try again.',
    });
  };

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
        Notification System Demo
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Click the buttons below to test different notification types. Check the
        bell icon in the header.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={addInfoNotification}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Info Notification
        </button>
        <button
          onClick={addSuccessNotification}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          Add Success Notification
        </button>
        <button
          onClick={addWarningNotification}
          className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
        >
          Add Warning Notification
        </button>
        <button
          onClick={addErrorNotification}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Add Error Notification
        </button>
      </div>
    </div>
  );
}
