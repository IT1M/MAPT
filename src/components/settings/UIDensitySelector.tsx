'use client'

import React, { useEffect, useState } from 'react'
import type { UIDensity } from '@/types/settings'

interface UISettings {
  density: UIDensity
  fontSize: number
}

interface UIDensitySelectorProps {
  density: UIDensity
  fontSize: number
  onChange: (settings: UISettings) => void
}

export function UIDensitySelector({ density, fontSize, onChange }: UIDensitySelectorProps) {
  const [localFontSize, setLocalFontSize] = useState(fontSize)

  // Update local state when prop changes
  useEffect(() => {
    setLocalFontSize(fontSize)
  }, [fontSize])

  const handleDensityChange = (newDensity: UIDensity) => {
    onChange({ density: newDensity, fontSize: localFontSize })
  }

  const handleFontSizeChange = (newSize: number) => {
    setLocalFontSize(newSize)
    onChange({ density, fontSize: newSize })
  }

  const densityOptions: Array<{
    value: UIDensity
    label: string
    description: string
    spacing: string
  }> = [
    {
      value: 'compact',
      label: 'Compact',
      description: 'More content, less space',
      spacing: '4px',
    },
    {
      value: 'comfortable',
      label: 'Comfortable',
      description: 'Balanced spacing',
      spacing: '8px',
    },
    {
      value: 'spacious',
      label: 'Spacious',
      description: 'More breathing room',
      spacing: '12px',
    },
  ]

  return (
    <div className="space-y-6">
      {/* UI Density Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">UI Density</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Adjust spacing and padding throughout the interface
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {densityOptions.map((option) => {
            const isSelected = density === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleDensityChange(option.value)}
                className={`
                  relative flex flex-col p-4 rounded-lg border-2 transition-all duration-200
                  ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                `}
                aria-pressed={isSelected}
                aria-label={`${option.label} density: ${option.description}`}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
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

                {/* Visual preview */}
                <div className="mb-3 flex flex-col gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="bg-gray-300 dark:bg-gray-600 rounded"
                      style={{
                        height: option.value === 'compact' ? '8px' : option.value === 'comfortable' ? '12px' : '16px',
                        marginBottom: option.spacing,
                      }}
                    />
                  ))}
                </div>

                {/* Label */}
                <div className="text-left">
                  <div className="font-medium text-gray-900 dark:text-gray-100">{option.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.description}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Font Size Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Font Size</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Adjust text size for better readability
          </p>
        </div>

        <div className="space-y-4">
          {/* Slider */}
          <div className="flex items-center gap-4">
            <label htmlFor="font-size-slider" className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[60px]">
              {localFontSize}px
            </label>
            <input
              id="font-size-slider"
              type="range"
              min="12"
              max="20"
              step="1"
              value={localFontSize}
              onChange={(e) => handleFontSizeChange(Number(e.target.value))}
              className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              aria-label="Font size"
              aria-valuemin={12}
              aria-valuemax={20}
              aria-valuenow={localFontSize}
              aria-valuetext={`${localFontSize} pixels`}
            />
          </div>

          {/* Size labels */}
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 px-1">
            <span>Small (12px)</span>
            <span>Default (16px)</span>
            <span>Large (20px)</span>
          </div>

          {/* Live preview */}
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</div>
            <p
              className="text-gray-900 dark:text-gray-100 transition-all duration-200"
              style={{ fontSize: `${localFontSize}px` }}
            >
              The quick brown fox jumps over the lazy dog. This is how your text will appear with the selected font size.
            </p>
          </div>

          {/* Reset button */}
          <button
            type="button"
            onClick={() => handleFontSizeChange(16)}
            disabled={localFontSize === 16}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded px-2 py-1"
          >
            Reset to default (16px)
          </button>
        </div>
      </div>

      {/* Info message */}
      <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
        <svg
          className="w-4 h-4 flex-shrink-0 mt-0.5"
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
        <span>
          Changes apply immediately and affect all UI elements. Your preferences are saved automatically.
        </span>
      </div>
    </div>
  )
}
