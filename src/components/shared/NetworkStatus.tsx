'use client';

import { useNetworkStatus } from '@/hooks/useApiErrorHandler';
import { useTranslations } from '@/hooks/useTranslations';
import { useEffect, useState } from 'react';

/**
 * NetworkStatus Component
 *
 * Displays a banner when the user is offline
 */
export function NetworkStatus() {
  const { isOnline } = useNetworkStatus();
  const t = useTranslations('errors');
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner after a short delay to avoid flash on page load
    if (!isOnline) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [isOnline]);

  if (!show || isOnline) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 dark:bg-yellow-600 text-white px-4 py-2 shadow-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-center">
        <svg
          className="w-5 h-5 mr-2 rtl:mr-0 rtl:ml-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
          />
        </svg>
        <span className="text-sm font-medium">{t('networkError')}</span>
      </div>
    </div>
  );
}

/**
 * NetworkStatusIndicator Component
 *
 * Small indicator that can be placed in the header or footer
 */
export function NetworkStatusIndicator() {
  const { isOnline } = useNetworkStatus();
  const t = useTranslations('errors');

  return (
    <div className="flex items-center">
      <div
        className={`w-2 h-2 rounded-full mr-2 rtl:mr-0 rtl:ml-2 ${
          isOnline
            ? 'bg-green-500 dark:bg-green-400'
            : 'bg-red-500 dark:bg-red-400 animate-pulse'
        }`}
        title={isOnline ? 'Online' : 'Offline'}
      />
      <span className="text-xs text-gray-600 dark:text-gray-400">
        {isOnline ? 'Online' : 'Offline'}
      </span>
    </div>
  );
}

export default NetworkStatus;
