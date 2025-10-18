import { useState, useEffect, useCallback } from 'react'
import type { UserPreferences } from '@/types/settings'

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  uiDensity: 'comfortable',
  fontSize: 16,
  notifications: {
    email: {
      dailyInventorySummary: true,
      weeklyAnalyticsReport: true,
      newUserRegistration: false,
      highRejectRateAlert: true,
      systemUpdates: true,
      backupStatus: false,
    },
    inApp: {
      enabled: true,
      sound: true,
      desktop: false,
    },
    frequency: 'realtime',
  },
  sidebarCollapsed: false,
  sidebarPosition: 'left',
  showBreadcrumbs: true,
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  resetPreferences: () => Promise<void>
  isLoading: boolean
  error: string | null
}

/**
 * Custom hook for managing user preferences
 * Fetches preferences from the server and provides methods to update them
 */
export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch preferences on mount
  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/users/preferences')
      
      if (!response.ok) {
        throw new Error('Failed to fetch preferences')
      }

      const data = await response.json()
      
      if (data.success && data.data) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.data })
      }
    } catch (err) {
      console.error('Error fetching preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to load preferences')
      // Use default preferences on error
      setPreferences(DEFAULT_PREFERENCES)
    } finally {
      setIsLoading(false)
    }
  }

  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    try {
      setError(null)

      // Optimistically update local state
      setPreferences((prev) => ({ ...prev, ...updates }))

      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error('Failed to update preferences')
      }

      const data = await response.json()

      if (data.success && data.data) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...data.data })
      }
    } catch (err) {
      console.error('Error updating preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to update preferences')
      // Revert optimistic update by refetching
      await fetchPreferences()
      throw err
    }
  }, [])

  const resetPreferences = useCallback(async () => {
    try {
      setError(null)

      const response = await fetch('/api/users/preferences', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(DEFAULT_PREFERENCES),
      })

      if (!response.ok) {
        throw new Error('Failed to reset preferences')
      }

      setPreferences(DEFAULT_PREFERENCES)
    } catch (err) {
      console.error('Error resetting preferences:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset preferences')
      throw err
    }
  }, [])

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    isLoading,
    error,
  }
}
