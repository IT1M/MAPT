/**
 * Performance optimization utilities for analytics dashboard
 * Provides lazy loading, memoization, and caching utilities
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// Intersection Observer Hook for Lazy Loading
// ============================================================================

export interface UseIntersectionObserverOptions {
  threshold?: number;
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
): [React.RefObject<HTMLDivElement>, boolean] {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '50px',
    freezeOnceVisible = true,
  } = options;

  const elementRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // If already visible and frozen, don't observe
    if (freezeOnceVisible && isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setIsVisible(isIntersecting);

        // Unobserve if frozen once visible
        if (freezeOnceVisible && isIntersecting) {
          observer.unobserve(element);
        }
      },
      { threshold, root, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, root, rootMargin, freezeOnceVisible, isVisible]);

  return [elementRef, isVisible];
}

// ============================================================================
// Debounce Hook
// ============================================================================

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// ============================================================================
// Throttle Hook
// ============================================================================

export function useThrottle<T>(value: T, interval: number = 300): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const lastExecuted = useRef<number>(Date.now());

  useEffect(() => {
    if (Date.now() >= lastExecuted.current + interval) {
      lastExecuted.current = Date.now();
      setThrottledValue(value);
    } else {
      const timerId = setTimeout(() => {
        lastExecuted.current = Date.now();
        setThrottledValue(value);
      }, interval);

      return () => clearTimeout(timerId);
    }
  }, [value, interval]);

  return throttledValue;
}

// ============================================================================
// Cache Utility
// ============================================================================

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class Cache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private defaultTTL: number;

  constructor(defaultTTL: number = 5 * 60 * 1000) {
    this.defaultTTL = defaultTTL;
  }

  set(key: string, data: T, ttl?: number): void {
    const timestamp = Date.now();
    const expiresAt = timestamp + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp,
      expiresAt,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getAge(key: string): number | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return Date.now() - entry.timestamp;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// ============================================================================
// Data Fetching Hook with Cache
// ============================================================================

export interface UseCachedDataOptions<T> {
  cacheKey: string;
  fetcher: () => Promise<T>;
  ttl?: number;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

const globalCache = new Cache<any>();

export function useCachedData<T>(
  options: UseCachedDataOptions<T>
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { cacheKey, fetcher, ttl, enabled = true, onSuccess, onError } = options;

  const [data, setData] = useState<T | null>(() => globalCache.get(cacheKey));
  const [loading, setLoading] = useState<boolean>(!data && enabled);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    // Check cache first
    const cachedData = globalCache.get(cacheKey);
    if (cachedData) {
      setData(cachedData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      globalCache.set(cacheKey, result, ttl);
      setData(result);
      onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [cacheKey, fetcher, ttl, enabled, onSuccess, onError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// Memoization Utilities
// ============================================================================

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  getCacheKey?: (...args: Parameters<T>) => string
): T {
  const cache = new Map<string, ReturnType<T>>();

  return ((...args: Parameters<T>) => {
    const key = getCacheKey
      ? getCacheKey(...args)
      : JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

// ============================================================================
// Batch Processing
// ============================================================================

export function batchProcess<T, R>(
  items: T[],
  processor: (item: T) => R,
  batchSize: number = 100
): R[] {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = batch.map(processor);
    results.push(...batchResults);
  }

  return results;
}

// ============================================================================
// Request Deduplication
// ============================================================================

const pendingRequests = new Map<string, Promise<any>>();

export async function deduplicateRequest<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Check if request is already pending
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }

  // Create new request
  const promise = fetcher().finally(() => {
    pendingRequests.delete(key);
  });

  pendingRequests.set(key, promise);
  return promise;
}

// ============================================================================
// Performance Monitoring
// ============================================================================

export function measurePerformance(
  name: string,
  fn: () => void | Promise<void>
): void | Promise<void> {
  if (typeof window === 'undefined' || !window.performance) {
    return fn();
  }

  const startMark = `${name}-start`;
  const endMark = `${name}-end`;
  const measureName = `${name}-measure`;

  performance.mark(startMark);

  const result = fn();

  if (result instanceof Promise) {
    return result.finally(() => {
      performance.mark(endMark);
      performance.measure(measureName, startMark, endMark);
    });
  } else {
    performance.mark(endMark);
    performance.measure(measureName, startMark, endMark);
    return result;
  }
}

// ============================================================================
// Idle Callback Hook
// ============================================================================

export function useIdleCallback(
  callback: () => void,
  dependencies: any[] = []
): void {
  useEffect(() => {
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      // Fallback to setTimeout
      const timeoutId = setTimeout(callback, 1);
      return () => clearTimeout(timeoutId);
    }

    const idleCallbackId = requestIdleCallback(callback);
    return () => cancelIdleCallback(idleCallbackId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
}
