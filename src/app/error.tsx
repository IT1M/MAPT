'use client';

import { useEffect } from 'react';
import { PageErrorState } from '@/components/ui/ErrorState';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error boundary caught:', error);
    }

    // Log to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      try {
        const errorLog = {
          timestamp: new Date().toISOString(),
          message: error.message,
          digest: error.digest,
          stack: error.stack,
          userAgent:
            typeof window !== 'undefined'
              ? window.navigator.userAgent
              : 'unknown',
          url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        };

        const existingLogs = JSON.parse(
          localStorage.getItem('error-logs') || '[]'
        );
        existingLogs.push(errorLog);
        localStorage.setItem(
          'error-logs',
          JSON.stringify(existingLogs.slice(-50))
        );
      } catch (loggingError) {
        console.error('Failed to log error:', loggingError);
      }
    }
  }, [error]);

  return (
    <PageErrorState
      error={error}
      title="Something went wrong"
      description="We encountered an unexpected error. Please try again or contact support if the problem persists."
      retry={reset}
      showDetails={process.env.NODE_ENV === 'development'}
      showHomeButton={true}
    />
  );
}
