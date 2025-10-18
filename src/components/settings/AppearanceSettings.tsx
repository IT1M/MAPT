'use client'

import React, { useEffect } from 'react'
import { ThemeSelector } from './ThemeSelector'
import { UIDensitySelector } from './UIDensitySelector'
import { ColorSchemeCustomizer } from './ColorSchemeCustomizer'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import type { ThemeMode, UIDensity, ColorScheme } from '@/types/settings'

export function AppearanceSettings() {
  const { preferences, updatePreferences, isLoading, error } = useUserPreferences()

  // Apply CSS variables when preferences change
  useEffect(() => {
    if (!preferences) return

    // Apply font size
    document.documentElement.style.setProperty('--font-size-base', `${preferences.fontSize}px`)

    // Apply UI density
    const spacingMap = {
      compact: '4px',
      comfortable: '8px',
      spacious: '12px',
    }
    document.documentElement.style.setProperty('--spacing-unit', spacingMap[preferences.uiDensity])

    // Apply color scheme if custom colors are set
    if (preferences.colorScheme) {
      document.documentElement.style.setProperty('--color-primary', preferences.colorScheme.primary)
      document.documentElement.style.setProperty('--color-accent', preferences.colorScheme.accent)
    }
  }, [preferences])

  const handleThemeChange = async (theme: ThemeMode) => {
    try {
      await updatePreferences({ theme })
    } catch (err) {
      console.error('Failed to update theme:', err)
    }
  }

  const handleUISettingsChange = async (settings: { density: UIDensity; fontSize: number }) => {
    try {
      await updatePreferences({
        uiDensity: settings.density,
        fontSize: settings.fontSize,
      })
    } catch (err) {
      console.error('Failed to update UI settings:', err)
    }
  }

  const handleColorSchemeChange = async (colors: ColorScheme) => {
    try {
      await updatePreferences({ colorScheme: colors })
    } catch (err) {
      console.error('Failed to update color scheme:', err)
    }
  }

  const handleColorSchemeReset = async () => {
    try {
      await updatePreferences({
        colorScheme: {
          primary: '#3B82F6',
          accent: '#8B5CF6',
        },
      })
    } catch (err) {
      console.error('Failed to reset color scheme:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
        <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <svg
            className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Failed to load appearance settings</h3>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!preferences) {
    return null
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Appearance</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Customize how the interface looks and feels to match your preferences
        </p>
      </div>

      {/* Theme Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <ThemeSelector currentTheme={preferences.theme} onChange={handleThemeChange} />
      </div>

      {/* UI Density and Font Size */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <UIDensitySelector
          density={preferences.uiDensity}
          fontSize={preferences.fontSize}
          onChange={handleUISettingsChange}
        />
      </div>

      {/* Color Scheme Customizer */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <ColorSchemeCustomizer
          primaryColor={preferences.colorScheme?.primary || '#3B82F6'}
          accentColor={preferences.colorScheme?.accent || '#8B5CF6'}
          onChange={handleColorSchemeChange}
          onReset={handleColorSchemeReset}
        />
      </div>

      {/* Auto-save indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <svg
          className="w-4 h-4 text-green-500"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span>All changes are saved automatically</span>
      </div>
    </div>
  )
}
