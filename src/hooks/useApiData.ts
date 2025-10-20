'use client';

import useSWR, { SWRConfiguration, mutate } from 'swr';
import { useCallback } from 'react';

/**
 * Default SWR configuration for API data fetching
 * - 5 minute cache (300000ms)
 * - Revalidate on reconnect
 * - Don't revalidate on focus (to avoid excessive requests)
 * - Retry failed requests up to 3 times
 */
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 5000,
  shouldRetryOnError: true,
  revalidateIfStale: true,
  revalidateOnMount: true,
  refreshInterval: 0, // No auto-refresh by default
};

/**
 * Fetcher function for SWR
 * Handles API responses and errors
 */
async function fetcher<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = new Error('API request failed');
    (error as any).status = response.status;
    (error as any).info = await response.json().catch(() => ({}));
    throw error;
  }

  const data = await response.json();

  // Handle API response format { success: boolean, data: T }
  if (data.success === false) {
    throw new Error(data.error || 'API request failed');
  }

  return data.data || data;
}

/**
 * Hook for fetching API data with SWR caching
 *
 * @param url - API endpoint URL (null to skip fetching)
 * @param config - Optional SWR configuration overrides
 * @returns SWR response with data, error, loading state, and mutate function
 *
 * @example
 * ```typescript
 * const { data, error, isLoading, mutate } = useApiData<User[]>('/api/users')
 *
 * if (isLoading) return <Loading />
 * if (error) return <Error error={error} />
 * return <UserList users={data} />
 * ```
 */
export function useApiData<T>(url: string | null, config?: SWRConfiguration) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    fetcher,
    {
      ...defaultConfig,
      ...config,
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}

/**
 * Hook for fetching API data with custom cache time
 *
 * @param url - API endpoint URL
 * @param cacheTimeMs - Cache time in milliseconds (default: 5 minutes)
 * @returns SWR response
 *
 * @example
 * ```typescript
 * // Cache for 10 minutes
 * const { data } = useApiDataWithCache('/api/analytics', 600000)
 * ```
 */
export function useApiDataWithCache<T>(
  url: string | null,
  cacheTimeMs: number = 300000 // 5 minutes default
) {
  return useApiData<T>(url, {
    dedupingInterval: cacheTimeMs,
  });
}

/**
 * Hook for fetching API data with auto-refresh
 *
 * @param url - API endpoint URL
 * @param refreshIntervalMs - Refresh interval in milliseconds
 * @returns SWR response
 *
 * @example
 * ```typescript
 * // Refresh every 30 seconds
 * const { data } = useApiDataWithRefresh('/api/dashboard', 30000)
 * ```
 */
export function useApiDataWithRefresh<T>(
  url: string | null,
  refreshIntervalMs: number
) {
  return useApiData<T>(url, {
    refreshInterval: refreshIntervalMs,
  });
}

/**
 * Hook for paginated API data
 *
 * @param baseUrl - Base API endpoint URL
 * @param page - Current page number
 * @param pageSize - Items per page
 * @returns SWR response with pagination helpers
 *
 * @example
 * ```typescript
 * const { data, goToPage, nextPage, prevPage } = usePaginatedApiData(
 *   '/api/inventory',
 *   1,
 *   20
 * )
 * ```
 */
export function usePaginatedApiData<T>(
  baseUrl: string,
  page: number,
  pageSize: number
) {
  const url = `${baseUrl}?page=${page}&pageSize=${pageSize}`;
  const result = useApiData<T>(url);

  const goToPage = useCallback(
    (newPage: number) => {
      const newUrl = `${baseUrl}?page=${newPage}&pageSize=${pageSize}`;
      mutate(newUrl);
    },
    [baseUrl, pageSize]
  );

  const nextPage = useCallback(() => {
    goToPage(page + 1);
  }, [page, goToPage]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      goToPage(page - 1);
    }
  }, [page, goToPage]);

  return {
    ...result,
    page,
    pageSize,
    goToPage,
    nextPage,
    prevPage,
  };
}

/**
 * Manually revalidate cached data for a specific URL
 *
 * @param url - API endpoint URL to revalidate
 *
 * @example
 * ```typescript
 * // After creating a new item, revalidate the list
 * await createItem(data)
 * revalidateApiData('/api/inventory')
 * ```
 */
export function revalidateApiData(url: string) {
  return mutate(url);
}

/**
 * Clear all cached data
 * Useful for logout or when switching users
 *
 * @example
 * ```typescript
 * // On logout
 * clearAllCache()
 * router.push('/login')
 * ```
 */
export function clearAllCache() {
  return mutate(() => true, undefined, { revalidate: false });
}

/**
 * Preload data into cache
 * Useful for prefetching data before navigation
 *
 * @param url - API endpoint URL to preload
 *
 * @example
 * ```typescript
 * // Preload analytics data on hover
 * <Link
 *   href="/analytics"
 *   onMouseEnter={() => preloadApiData('/api/analytics/summary')}
 * >
 *   Analytics
 * </Link>
 * ```
 */
export async function preloadApiData(url: string) {
  return mutate(url, fetcher(url), { revalidate: false });
}
