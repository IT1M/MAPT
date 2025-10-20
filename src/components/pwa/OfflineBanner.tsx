'use client';

import { useEffect, useState } from 'react';
import { offlineQueue } from '@/lib/offline-queue';

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    // Check initial online status
    setIsOffline(!navigator.onLine);
    setPendingCount(offlineQueue.getPendingCount());

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOffline(false);
      // Trigger sync
      offlineQueue.sync().then(() => {
        setIsSyncing(false);
        setPendingCount(offlineQueue.getPendingCount());
      });
      setIsSyncing(true);
    };

    const handleOffline = () => {
      setIsOffline(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe((queue) => {
      setPendingCount(queue.filter((a) => !a.synced).length);
      setIsSyncing(offlineQueue.isSyncInProgress());
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  if (!isOffline && pendingCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${
        isOffline ? 'bg-red-600' : isSyncing ? 'bg-yellow-600' : 'bg-green-600'
      } text-white px-4 py-2 text-center text-sm font-medium shadow-lg transition-all duration-300`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center justify-center gap-2">
        {isOffline ? (
          <>
            <svg
              className="w-5 h-5"
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
            <span>
              You&apos;re offline.{' '}
              {pendingCount > 0 &&
                `${pendingCount} action${pendingCount > 1 ? 's' : ''} pending sync.`}
            </span>
          </>
        ) : isSyncing ? (
          <>
            <svg
              className="w-5 h-5 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            <span>
              Syncing {pendingCount} pending action{pendingCount > 1 ? 's' : ''}
              ...
            </span>
          </>
        ) : (
          <>
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>All changes synced successfully!</span>
          </>
        )}
      </div>
    </div>
  );
}
