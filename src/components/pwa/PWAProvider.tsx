'use client';

import { useEffect } from 'react';
import { OfflineBanner } from './OfflineBanner';
import { InstallPrompt } from './InstallPrompt';
import { registerServiceWorker } from '@/lib/pwa-register';

export function PWAProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Register service worker
    registerServiceWorker();

    // Request persistent storage
    if (navigator.storage && navigator.storage.persist) {
      navigator.storage.persist().then((granted) => {
        console.log(
          `[PWA] Persistent storage ${granted ? 'granted' : 'denied'}`
        );
      });
    }
  }, []);

  return (
    <>
      <OfflineBanner />
      <InstallPrompt />
      {children}
    </>
  );
}
