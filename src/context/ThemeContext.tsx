'use client'

/**
 * Theme Context Provider
 * Provides theme customization functionality throughout the application
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { useThemeCustomization } from '@/hooks/useThemeCustomization'
import { Theme, ThemeDensity, AnimationSpeed } from '@/config/themes'

interface ThemeContextValue {
  currentTheme: Theme
  isLoading: boolean
  updateTheme: (theme: Theme) => void
  selectPreset: (presetId: string) => void
  updateColors: (colors: Partial<Theme['colors']>) => void
  updateFonts: (fonts: Partial<Theme['fonts']>) => void
  updateDensity: (density: ThemeDensity) => void
  updateAnimations: (animations: Partial<Theme['animations']>) => void
  exportTheme: () => void
  importTheme: (themeJson: string) => { success: boolean; error?: string }
  generateShareCode: () => string
  importFromShareCode: (shareCode: string) => { success: boolean; error?: string }
  resetToDefault: () => void
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeCustomization = useThemeCustomization()

  return (
    <ThemeContext.Provider value={themeCustomization}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
