'use client'

import React, { useState } from 'react'
import { useThemeCustomization } from '@/hooks/useThemeCustomization'
import { PRESET_THEMES, FONT_FAMILIES, Theme, ThemeDensity, AnimationSpeed } from '@/config/themes'

export function ThemeCustomizer() {
  const {
    currentTheme,
    isLoading,
    selectPreset,
    updateColors,
    updateFonts,
    updateDensity,
    updateAnimations,
    exportTheme,
    importTheme,
    generateShareCode,
    importFromShareCode,
    resetToDefault,
  } = useThemeCustomization()

  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'layout' | 'share'>('presets')
  const [importInput, setImportInput] = useState('')
  const [shareCode, setShareCode] = useState('')
  const [importError, setImportError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    )
  }

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const result = importTheme(content)
      if (result.success) {
        setImportError('')
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 3000)
      } else {
        setImportError(result.error || 'Failed to import theme')
      }
    }
    reader.readAsText(file)
  }

  const handleImportFromCode = () => {
    if (!importInput.trim()) {
      setImportError('Please enter a share code')
      return
    }

    const result = importFromShareCode(importInput.trim())
    if (result.success) {
      setImportError('')
      setImportInput('')
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 3000)
    } else {
      setImportError(result.error || 'Invalid share code')
    }
  }

  const handleGenerateShareCode = () => {
    const code = generateShareCode()
    setShareCode(code)
  }

  const handleCopyShareCode = () => {
    navigator.clipboard.writeText(shareCode)
    setShowSuccess(true)
    setTimeout(() => setShowSuccess(false), 2000)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Theme Customization
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Personalize the appearance of your workspace
        </p>
      </div>

      {/* Success Message */}
      {showSuccess && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 dark:text-green-200">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">Theme updated successfully!</span>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4" aria-label="Theme customization tabs">
          {[
            { id: 'presets', label: 'Presets', icon: '🎨' },
            { id: 'colors', label: 'Colors', icon: '🌈' },
            { id: 'typography', label: 'Typography', icon: '📝' },
            { id: 'layout', label: 'Layout', icon: '📐' },
            { id: 'share', label: 'Share', icon: '🔗' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                px-4 py-2 border-b-2 font-medium text-sm transition-colors
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* Presets Tab */}
        {activeTab === 'presets' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Choose from our professionally designed themes
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {PRESET_THEMES.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => selectPreset(preset.id)}
                  className={`
                    relative p-6 rounded-lg border-2 transition-all text-left
                    ${currentTheme.id === preset.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  {currentTheme.id === preset.id && (
                    <div className="absolute top-3 right-3">
                      <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                      {preset.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {preset.description}
                    </p>
                    
                    {/* Color Preview */}
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: preset.colors.primary }}
                        title="Primary"
                      />
                      <div
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: preset.colors.secondary }}
                        title="Secondary"
                      />
                      <div
                        className="w-8 h-8 rounded border border-gray-300 dark:border-gray-600"
                        style={{ backgroundColor: preset.colors.accent }}
                        title="Accent"
                      />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Customize individual colors to match your brand
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(currentTheme.colors).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => updateColors({ [key]: e.target.value })}
                      className="w-16 h-10 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateColors({ [key]: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="#000000"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Typography Tab */}
        {activeTab === 'typography' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Adjust fonts and text sizes for better readability
            </p>
            
            {/* Font Family */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Family
              </label>
              <select
                value={currentTheme.fonts.family}
                onChange={(e) => updateFonts({ family: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                {FONT_FAMILIES.map((font) => (
                  <option key={font.value} value={font.value}>
                    {font.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Font Sizes */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Font Sizes
              </h3>
              
              {Object.entries(currentTheme.fonts.size).map(([key, value]) => (
                <div key={key} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {key}
                    </label>
                    <span className="text-sm font-mono text-gray-500">
                      {value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="12"
                    max="24"
                    step="1"
                    value={parseInt(value)}
                    onChange={(e) => updateFonts({
                      size: { ...currentTheme.fonts.size, [key]: `${e.target.value}px` }
                    })}
                    className="w-full"
                  />
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Preview:</p>
              <div style={{ fontFamily: currentTheme.fonts.family }}>
                <p style={{ fontSize: currentTheme.fonts.size.sm }}>Small text sample</p>
                <p style={{ fontSize: currentTheme.fonts.size.base }}>Base text sample</p>
                <p style={{ fontSize: currentTheme.fonts.size.lg }}>Large text sample</p>
                <p style={{ fontSize: currentTheme.fonts.size.xl }}>Extra large text sample</p>
              </div>
            </div>
          </div>
        )}

        {/* Layout Tab */}
        {activeTab === 'layout' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control spacing, density, and animations
            </p>
            
            {/* Density */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                UI Density
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['compact', 'comfortable', 'spacious'] as ThemeDensity[]).map((density) => (
                  <button
                    key={density}
                    onClick={() => updateDensity(density)}
                    className={`
                      px-4 py-3 rounded-lg border-2 transition-all capitalize
                      ${currentTheme.spacing.density === density
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }
                    `}
                  >
                    {density}
                  </button>
                ))}
              </div>
            </div>

            {/* Animations */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Animations
                </label>
                <button
                  onClick={() => updateAnimations({ enabled: !currentTheme.animations.enabled })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${currentTheme.animations.enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${currentTheme.animations.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            {currentTheme.animations.enabled && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Animation Speed
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((speed) => (
                    <button
                      key={speed}
                      onClick={() => updateAnimations({ speed })}
                      className={`
                        px-4 py-3 rounded-lg border-2 transition-all capitalize
                        ${currentTheme.animations.speed === speed
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Share Tab */}
        {activeTab === 'share' && (
          <div className="space-y-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Export, import, or share your custom theme
            </p>
            
            {/* Export */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Export Theme
              </h3>
              <button
                onClick={exportTheme}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download Theme JSON
              </button>
            </div>

            {/* Import from File */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Import from File
              </h3>
              <label className="block">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/20 dark:file:text-blue-300"
                />
              </label>
            </div>

            {/* Share Code */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Share Code
              </h3>
              {!shareCode ? (
                <button
                  onClick={handleGenerateShareCode}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 rounded-lg transition-colors"
                >
                  Generate Share Code
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareCode}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono text-sm"
                    />
                    <button
                      onClick={handleCopyShareCode}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Share this code with others to let them use your theme
                  </p>
                </div>
              )}
            </div>

            {/* Import from Code */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Import from Share Code
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={importInput}
                  onChange={(e) => {
                    setImportInput(e.target.value)
                    setImportError('')
                  }}
                  placeholder="Paste share code here"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  onClick={handleImportFromCode}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Import
                </button>
              </div>
              {importError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {importError}
                </p>
              )}
            </div>

            {/* Reset */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={resetToDefault}
                className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Reset to Default Theme
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
