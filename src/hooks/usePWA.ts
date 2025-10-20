'use client';

import { useEffect, useState } from 'react';

export interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
}

export function usePWA() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isOnline: true,
    isUpdateAvailable: false,
    canInstall: false,
  });

  useEffect(() => {
    // Check if running as installed PWA
    const checkInstalled = () => {
      const isStandalone = window.matchMedia(
        '(display-mode: standalone)'
      ).matches;
      const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const isIOSStandalone = (window.navigator as any).standalone === true;

      return isStandalone || (isIOS && isIOSStandalone);
    };

    // Check online status
    const checkOnline = () => navigator.onLine;

    // Update status
    const updateStatus = () => {
      setStatus((prev) => ({
        ...prev,
        isInstalled: checkInstalled(),
        isOnline: checkOnline(),
      }));
    };

    // Initial check
    updateStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = () => {
      setStatus((prev) => ({ ...prev, canInstall: true }));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Listen for app installed
    const handleAppInstalled = () => {
      setStatus((prev) => ({ ...prev, isInstalled: true, canInstall: false }));
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (
                newWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setStatus((prev) => ({ ...prev, isUpdateAvailable: true }));
              }
            });
          }
        });
      });
    }

    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const updateServiceWorker = () => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.waiting?.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      });
    }
  };

  return {
    ...status,
    updateServiceWorker,
  };
}
