import { useState, useEffect, useCallback, useRef } from 'react'

interface UseSettingsDataOptions<T> {
  initialData?: T
  revalidateOnFocus?: boolean
  revalidateInterval?: number
  onSuccess?: (data: T) => void
  onError?: (error: Error) => void
}

interface UseSettingsDataReturn<T> {
  data: T | undefined
  error: Error | null
  isLoading: boolean
  isValidating: boolean
  mutate: (data?: T | ((current: T | undefined) => T), shouldRevalidate?: boolean) => Promise<void>
  revalidate: () => Promise<void>
}

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Custom hook for fetching and caching settings data with optimistic updates
 * Provides SWR-like functionality without external dependencies
 */
export function useSettingsData<T>(
  key: string | null,
  fetcher: (() => Promise<T>) | null,
  options: UseSettingsDataOptions<T> = {}
): UseSettingsDataReturn<T> {
  const {
    initialData,
    revalidateOnFocus = true,
    revalidateInterval,
    onSuccess,
    onError,
  } = options

  const [data, setData] = useState<T | undefined>(initialData)
  const [error, setError] = useState<Error | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(!initialData)
  const [isValidating, setIsValidating] = useState<boolean>(false)

  const fetcherRef = useRef(fetcher)
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)

  // Update refs
  useEffect(() => {
    fetcherRef.current = fetcher
    onSuccessRef.current = onSuccess
    onErrorRef.current = onError
  }, [fetcher, onSuccess, onError])

  // Fetch data function
  const fetchData = useCallback(
    async (isRevalidation = false) => {
      if (!key || !fetcherRef.current) return

      // Check cache first
      const cached = cache.get(key)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL && !isRevalidation) {
        setData(cached.data)
        setIsLoading(false)
        return
      }

      try {
        if (isRevalidation) {
          setIsValidating(true)
        } else {
          setIsLoading(true)
        }

        const result = await fetcherRef.current()
        
        // Update cache
        cache.set(key, { data: result, timestamp: Date.now() })
        
        setData(result)
        setError(null)
        onSuccessRef.current?.(result)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred')
        setError(error)
        onErrorRef.current?.(error)
      } finally {
        setIsLoading(false)
        setIsValidating(false)
      }
    },
    [key]
  )

  // Initial fetch
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Revalidate on focus
  useEffect(() => {
    if (!revalidateOnFocus || !key) return

    const handleFocus = () => {
      fetchData(true)
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [revalidateOnFocus, key, fetchData])

  // Revalidate on interval
  useEffect(() => {
    if (!revalidateInterval || !key) return

    const interval = setInterval(() => {
      fetchData(true)
    }, revalidateInterval)

    return () => clearInterval(interval)
  }, [revalidateInterval, key, fetchData])

  // Mutate function for optimistic updates
  const mutate = useCallback(
    async (newData?: T | ((current: T | undefined) => T), shouldRevalidate = true) => {
      if (!key) return

      // Optimistic update
      if (newData !== undefined) {
        let updatedData: T
        if (typeof newData === 'function') {
          const fn = newData as (current: T | undefined) => T
          updatedData = fn(data)
        } else {
          updatedData = newData
        }
        setData(updatedData)
        
        // Update cache
        cache.set(key, { data: updatedData, timestamp: Date.now() })
      }

      // Revalidate if requested
      if (shouldRevalidate) {
        await fetchData(true)
      }
    },
    [key, data, fetchData]
  )

  // Revalidate function
  const revalidate = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
    revalidate,
  }
}

/**
 * Clear cache for a specific key or all keys
 */
export function clearSettingsCache(key?: string) {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

/**
 * Preload data into cache
 */
export function preloadSettingsData<T>(key: string, data: T) {
  cache.set(key, { data, timestamp: Date.now() })
}
