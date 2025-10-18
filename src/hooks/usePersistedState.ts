'use client'

import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react'

/**
 * Hook for persisting state to localStorage
 * Automatically syncs state across tabs/windows
 * 
 * @param key - localStorage key
 * @param initialValue - Initial value if no stored value exists
 * @returns [state, setState] tuple like useState
 * 
 * @example
 * ```typescript
 * const [sidebarCollapsed, setSidebarCollapsed] = usePersistedState('sidebar-collapsed', false)
 * ```
 */
export function usePersistedState<T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] {
  // Initialize state from localStorage or use initial value
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error)
      return initialValue
    }
  })

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    try {
      window.localStorage.setItem(key, JSON.stringify(state))
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error)
    }
  }, [key, state])

  // Sync state across tabs/windows
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setState(JSON.parse(e.newValue))
        } catch (error) {
          console.error(`Error parsing storage event for key "${key}":`, error)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key])

  return [state, setState]
}

/**
 * Hook for persisting sidebar collapsed state
 * 
 * @returns [collapsed, setCollapsed, toggle]
 * 
 * @example
 * ```typescript
 * const [collapsed, setCollapsed, toggleSidebar] = useSidebarState()
 * ```
 */
export function useSidebarState() {
  const [collapsed, setCollapsed] = usePersistedState('sidebar-collapsed', false)

  const toggle = useCallback(() => {
    setCollapsed((prev) => !prev)
  }, [setCollapsed])

  return [collapsed, setCollapsed, toggle] as const
}

/**
 * Hook for persisting filter state
 * 
 * @param filterKey - Unique key for this filter set
 * @param initialFilters - Initial filter values
 * @returns [filters, setFilters, resetFilters]
 * 
 * @example
 * ```typescript
 * const [filters, setFilters, resetFilters] = useFilterState('inventory-filters', {
 *   search: '',
 *   category: '',
 *   destination: null,
 * })
 * ```
 */
export function useFilterState<T extends Record<string, any>>(
  filterKey: string,
  initialFilters: T
) {
  const [filters, setFilters] = usePersistedState<T>(
    `filters-${filterKey}`,
    initialFilters
  )

  const resetFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [initialFilters, setFilters])

  return [filters, setFilters, resetFilters] as const
}

/**
 * Hook for persisting scroll position
 * Restores scroll position when navigating back
 * 
 * @param key - Unique key for this scroll position
 * 
 * @example
 * ```typescript
 * useScrollRestoration('data-log-scroll')
 * ```
 */
export function useScrollRestoration(key: string) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    // Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll-${key}`)
    if (savedPosition) {
      const position = parseInt(savedPosition, 10)
      window.scrollTo(0, position)
    }

    // Save scroll position on unmount
    return () => {
      sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString())
    }
  }, [key])
}

/**
 * Hook for persisting table preferences
 * 
 * @param tableKey - Unique key for this table
 * @returns [preferences, setPreferences]
 * 
 * @example
 * ```typescript
 * const [prefs, setPrefs] = useTablePreferences('inventory-table')
 * 
 * // prefs = { pageSize: 20, sortBy: 'createdAt', sortOrder: 'desc' }
 * ```
 */
export interface TablePreferences {
  pageSize: number
  sortBy: string
  sortOrder: 'asc' | 'desc'
  visibleColumns?: string[]
}

export function useTablePreferences(tableKey: string) {
  const defaultPreferences: TablePreferences = {
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  }

  return usePersistedState<TablePreferences>(
    `table-prefs-${tableKey}`,
    defaultPreferences
  )
}

/**
 * Hook for persisting user preferences
 * 
 * @returns [preferences, updatePreference]
 * 
 * @example
 * ```typescript
 * const [prefs, updatePref] = useUserPreferences()
 * 
 * updatePref('density', 'compact')
 * updatePref('notifications.sound', true)
 * ```
 */
export interface UserPreferences {
  density: 'comfortable' | 'compact' | 'spacious'
  notifications: {
    enabled: boolean
    sound: boolean
    desktop: boolean
  }
  autoRefresh: boolean
  defaultPageSize: number
}

export function useUserPreferences() {
  const defaultPreferences: UserPreferences = {
    density: 'comfortable',
    notifications: {
      enabled: true,
      sound: false,
      desktop: false,
    },
    autoRefresh: false,
    defaultPageSize: 20,
  }

  const [preferences, setPreferences] = usePersistedState<UserPreferences>(
    'user-preferences',
    defaultPreferences
  )

  const updatePreference = useCallback(
    (key: string, value: any) => {
      setPreferences((prev) => {
        const keys = key.split('.')
        const newPrefs = { ...prev }
        let current: any = newPrefs

        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] }
          current = current[keys[i]]
        }

        current[keys[keys.length - 1]] = value
        return newPrefs
      })
    },
    [setPreferences]
  )

  return [preferences, updatePreference] as const
}

/**
 * Clear all persisted state
 * Useful for logout or reset functionality
 * 
 * @example
 * ```typescript
 * clearPersistedState()
 * ```
 */
export function clearPersistedState() {
  if (typeof window === 'undefined') {
    return
  }

  const keysToKeep = ['theme', 'locale'] // Keep theme and language preferences
  const keys = Object.keys(localStorage)

  keys.forEach((key) => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key)
    }
  })

  // Clear session storage
  sessionStorage.clear()
}
