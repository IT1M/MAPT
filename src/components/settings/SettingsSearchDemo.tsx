'use client'

/**
 * SettingsSearchDemo Component
 * Demonstrates the settings search functionality with RTL support
 * This component can be integrated into the main settings page
 */

import React, { useRef, useEffect } from 'react'
import { useLocale } from 'next-intl'
import { SettingsSearch } from './SettingsSearch'
import { SearchResults } from './SearchResults'
import { useSettingsSearch } from '@/hooks/useSettingsSearch'

interface SettingsSearchDemoProps {
  onSectionChange?: (section: string) => void
  className?: string
}

export function SettingsSearchDemo({
  onSectionChange,
  className = '',
}: SettingsSearchDemoProps) {
  const locale = useLocale()
  const isRTL = locale === 'ar'
  const searchInputRef = useRef<HTMLInputElement>(null)
  
  const {
    query,
    results,
    resultsBySection,
    isSearching,
    hasResults,
    handleSearch,
    clearSearch,
    handleResultClick,
  } = useSettingsSearch({
    maxResults: 20,
    onResultClick: (result) => {
      // Extract section from path
      const urlParams = new URLSearchParams(result.path.split('?')[1])
      const section = urlParams.get('section')
      if (section && onSectionChange) {
        onSectionChange(section)
      }
      // Clear search after selection
      clearSearch()
    },
  })

  // Keyboard shortcut: Ctrl/Cmd + K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={`settings-search-container ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Search Input */}
      <div className="mb-4">
        <SettingsSearch
          ref={searchInputRef}
          onSearch={handleSearch}
          locale={locale}
          debounceMs={300}
        />
        
        {/* Keyboard shortcut hint */}
        <div 
          className={`
            mt-2 text-xs text-gray-500 dark:text-gray-400 
            ${isRTL ? 'text-right' : 'text-left'}
          `}
        >
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
          </kbd>
          {' + '}
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">
            K
          </kbd>
          {' '}
          {isRTL ? 'للبحث السريع' : 'for quick search'}
        </div>
      </div>

      {/* Search Results */}
      {query && (
        <div 
          className="
            bg-white dark:bg-gray-900 
            border border-gray-200 dark:border-gray-700 
            rounded-lg shadow-lg 
            max-h-[500px] overflow-y-auto
          "
          role="listbox"
          aria-label={isRTL ? 'نتائج البحث' : 'Search results'}
        >
          <SearchResults
            results={results}
            resultsBySection={resultsBySection}
            onResultClick={handleResultClick}
            isSearching={isSearching}
            query={query}
          />
        </div>
      )}

      {/* Results count */}
      {hasResults && !isSearching && (
        <div 
          className={`
            mt-2 text-sm text-gray-600 dark:text-gray-400 
            ${isRTL ? 'text-right' : 'text-left'}
          `}
          role="status"
          aria-live="polite"
        >
          {isRTL 
            ? `تم العثور على ${results.length} نتيجة` 
            : `Found ${results.length} result${results.length !== 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  )
}
