/**
 * useApiErrorHandler Hook
 * 
 * React hook for handling API errors with toast notifications and navigation
 */

'use client';

import { useRouter } from 'next/navigation';
import { useLocale } from '@/hooks/useLocale';
import { useCallback } from 'react';
import { handleApiError, ApiErrorHandlerOptions } from '@/utils/api-error-handler-client';

// Simple toast function (can be replaced with your toast library)
function showToast(message: string, type: 'error' | 'success' | 'warning' | 'info' = 'error') {
  // This is a simple implementation - replace with your toast library
  if (typeof window !== 'undefined') {
    console.log(`[${type.toUpperCase()}]:`, message);
    
    // You can integrate with react-hot-toast, sonner, or any other toast library here
    // Example with react-hot-toast:
    // import toast from 'react-hot-toast';
    // toast[type](message);
  }
}

export function useApiErrorHandler() {
  const router = useRouter();
  const locale = useLocale();

  const handleError = useCallback(
    async (error: unknown, options: Partial<ApiErrorHandlerOptions> = {}) => {
      await handleApiError(error, {
        router,
        locale,
        showToast,
        ...options,
      });
    },
    [router, locale]
  );

  return { handleError };
}

/**
 * useNetworkStatus Hook
 * 
 * Monitor network connectivity status
 */

import { useState, useEffect } from 'react';
import { getNetworkMonitor } from '@/utils/api-error-handler-client';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const monitor = getNetworkMonitor();
    setIsOnline(monitor.getStatus());

    const unsubscribe = monitor.subscribe((status) => {
      setIsOnline(status);
      
      // Show toast when status changes
      if (status) {
        showToast('You are back online', 'success');
      } else {
        showToast('You are offline. Some features may not work.', 'warning');
      }
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}

/**
 * useApiRequest Hook
 * 
 * Hook for making API requests with automatic error handling
 */

import { useState as useStateReact } from 'react';

interface UseApiRequestOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: unknown) => void;
  showSuccessToast?: boolean;
  successMessage?: string;
}

export function useApiRequest<T = any>() {
  const [loading, setLoading] = useStateReact(false);
  const [error, setError] = useStateReact<unknown>(null);
  const [data, setData] = useStateReact<T | null>(null);
  const { handleError } = useApiErrorHandler();

  const execute = useCallback(
    async (
      requestFn: () => Promise<T>,
      options: UseApiRequestOptions<T> = {}
    ) => {
      const {
        onSuccess,
        onError,
        showSuccessToast = false,
        successMessage = 'Operation completed successfully',
      } = options;

      setLoading(true);
      setError(null);

      try {
        const result = await requestFn();
        setData(result);

        if (showSuccessToast) {
          showToast(successMessage, 'success');
        }

        if (onSuccess) {
          onSuccess(result);
        }

        return result;
      } catch (err) {
        setError(err);
        await handleError(err);

        if (onError) {
          onError(err);
        }

        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleError]
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset,
  };
}
