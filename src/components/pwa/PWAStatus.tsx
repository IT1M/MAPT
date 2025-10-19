'use client';

import { useEffect, useState } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { getStorageEstimate, clearAllCaches } from '@/lib/pwa-register';
import { offlineQueue } from '@/lib/offline-queue';

export function PWAStatus() {
  const { isInstalled, isOnline, isUpdateAvailable, updateServiceWorker } = usePWA();
  const [storage, setStorage] = useState<{ usage: number; quota: number; percentage: number } | null>(null);
  const [pendingActions, setPendingActions] = useState(0);
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    // Get storage estimate
    getStorageEstimate().then(setStorage);

    // Get pending actions count
    setPendingActions(offlineQueue.getPendingCount());

    // Subscribe to queue changes
    const unsubscribe = offlineQueue.subscribe((queue) => {
      setPendingActions(queue.filter(a => !a.synced).length);
    });

    return unsubscribe;
  }, []);

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to clear all cached data? This will require re-downloading resources.')) {
      return;
    }

    setIsClearing(true);
    try {
      await clearAllCaches();
      alert('Cache cleared successfully. The page will reload.');
      window.location.reload();
    } catch (error) {
      alert('Failed to clear cache. Please try again.');
    } finally {
      setIsClearing(false);
    }
  };

  const handleSyncQueue = async () => {
    try {
      const result = await offlineQueue.sync();
      alert(`Sync complete: ${result.successful} successful, ${result.failed} failed`);
    } catch (error) {
      alert('Failed to sync offline queue. Please try again.');
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Progressive Web App Status
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Installation Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Installation
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                isInstalled 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
              }`}>
                {isInstalled ? 'Installed' : 'Not Installed'}
              </span>
            </div>
          </div>

          {/* Online Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Connection
              </span>
              <span className={`px-2 py-1 text-xs font-semibold rounded ${
                isOnline 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Update Status */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Updates
              </span>
              {isUpdateAvailable ? (
                <button
                  onClick={updateServiceWorker}
                  className="px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800"
                >
                  Update Available
                </button>
              ) : (
                <span className="px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  Up to Date
                </span>
              )}
            </div>
          </div>

          {/* Pending Actions */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Pending Sync
              </span>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded ${
                  pendingActions > 0 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                    : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                }`}>
                  {pendingActions} {pendingActions === 1 ? 'action' : 'actions'}
                </span>
                {pendingActions > 0 && isOnline && (
                  <button
                    onClick={handleSyncQueue}
                    className="text-xs text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                  >
                    Sync Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Storage Information */}
      {storage && (
        <div>
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
            Storage Usage
          </h4>
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-700 dark:text-slate-300">
                {formatBytes(storage.usage)} of {formatBytes(storage.quota)} used
              </span>
              <span className="text-sm font-medium text-slate-900 dark:text-white">
                {storage.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  storage.percentage > 80 
                    ? 'bg-red-600' 
                    : storage.percentage > 60 
                    ? 'bg-yellow-600' 
                    : 'bg-teal-600'
                }`}
                style={{ width: `${Math.min(storage.percentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Cache Management
        </h4>
        <button
          onClick={handleClearCache}
          disabled={isClearing}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors"
        >
          {isClearing ? 'Clearing...' : 'Clear All Cache'}
        </button>
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
          This will remove all cached data and require re-downloading resources.
        </p>
      </div>

      {/* PWA Features */}
      <div>
        <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
          Available Features
        </h4>
        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Offline access to cached pages
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Automatic background sync
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Queue actions while offline
          </li>
          <li className="flex items-center gap-2">
            <svg className="w-5 h-5 text-teal-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Install as standalone app
          </li>
        </ul>
      </div>
    </div>
  );
}
