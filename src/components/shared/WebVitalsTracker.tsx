'use client';

/**
 * Web Vitals Tracker Component
 * 
 * Initializes Core Web Vitals tracking on the client side
 */

import { useEffect } from 'react';
import { performanceMonitor } from '@/utils/performance-monitor';

export function WebVitalsTracker() {
  useEffect(() => {
    // Initialize Web Vitals tracking
    performanceMonitor.initWebVitals();

    // Log performance report after page load
    const timeout = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        const report = performanceMonitor.getPerformanceReport();
        console.log('Performance Report:', report);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
