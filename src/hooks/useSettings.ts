import { useState, useEffect, useCallback } from 'react'
import type { SystemConfiguration } from '@/types/settings'

interface UseSettingsOptions {
  category?: string
}

interface UseSettingsReturn<T = any> {
  settings: T | null
  updateSettings: (updates: Partial<T>) => Promise<void>
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook for managing system settings
 * Fetches settings from the server and provides methods to update them
 * @param options - Configuration options (e.g., category filter)
 */
export function useSettings<T = SystemConfiguration>(
  options: UseSettingsOptions = {}
): UseSettingsReturn<T> {
  const [settings, setSettings] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (options.category) {
        params.append('category', options.category)
      }

      const url = `/api/settings${params.toString() ? `?${params.toString()}` : ''}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setSettings(data.data)
      }
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }, [options.category])

  // Fetch settings on mount
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(
    async (updates: Partial<T>) => {
      try {
        setError(null)

        // Optimistically update local state
        setSettings((prev) => (prev ? { ...prev, ...updates } : null))

        const response = await fetch('/api/settings', {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settings: Object.entries(updates).map(([key, value]) => ({
              key,
              value,
              category: options.category || 'general',
            })),
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to update settings')
        }

        const data = await response.json()

        if (data.success && data.data) {
          setSettings(data.data)
        }
      } catch (err) {
        console.error('Error updating settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to update settings')
        // Revert optimistic update by refetching
        await fetchSettings()
        throw err
      }
    },
    [options.category, fetchSettings]
  )

  return {
    settings,
    updateSettings,
    isLoading,
    error,
    refetch: fetchSettings,
  }
}
