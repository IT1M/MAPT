'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import type { ThemeMode } from '@/types/settings'

interface ThemeSelectorProps {
  currentTheme: ThemeMode
  onChange: (theme: ThemeMode) => void
}

export function ThemeSelector({ currentTheme, onChange }: ThemeSelectorProps) {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, systemTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleThemeChange = (newTheme: ThemeMode) => {
    setTheme(newTheme)
    onChange(newTheme)
  }

  // Avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const resolvedTheme = theme === 'system' ? systemTheme : theme
  const effectiveTheme = currentTheme === 'system' ? systemTheme : currentTheme

  const themes: Array<{ value: ThemeMode; label: string; description: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: 'Light',
      description: 'Clean and bright interface',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
    {
      value: 'dark',
      label: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ),
    },
    {
      value: 'system',
      label: 'System',
      description: 'Follows your device settings',
      icon: (
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
          <path
            fillRule="evenodd"
            d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z"
            clipRule="evenodd"
          />
        </svg>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Theme</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Choose how the interface looks to you
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themes.map((themeOption) => {
          const isSelected = currentTheme === themeOption.value
          const previewTheme = themeOption.value === 'system' ? systemTheme : themeOption.value

          return (
            <button
              key={themeOption.value}
              type="button"
              onClick={() => handleThemeChange(themeOption.value)}
              className={`
                relative flex flex-col items-center p-6 rounded-lg border-2 transition-all duration-200
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              aria-pressed={isSelected}
              aria-label={`${themeOption.label} theme: ${themeOption.description}`}
            >
              {/* Selected indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <svg
                    className="w-5 h-5 text-blue-500"
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
                </div>
              )}

              {/* Icon with preview styling */}
              <div
                className={`
                  mb-3 transition-colors duration-200
                  ${previewTheme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
                `}
              >
                {themeOption.icon}
              </div>

              {/* Label */}
              <div className="text-center">
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {themeOption.label}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {themeOption.description}
                </div>
              </div>

              {/* Preview indicator for system theme */}
              {themeOption.value === 'system' && (
                <div className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Currently: {systemTheme}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* Live preview info */}
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
        <svg
          className="w-4 h-4 flex-shrink-0"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <span>Theme changes apply immediately across the entire interface</span>
      </div>
    </div>
  )
}
