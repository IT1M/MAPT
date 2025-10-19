'use client'

/**
 * Global Search Modal Component
 * Provides universal search across inventory, reports, users, and settings
 * with keyboard navigation and recent searches
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { useDebounce } from '@/hooks/useDebounce'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import {
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  type SearchResult,
  type SearchResultItem
} from '@/services/search'

interface GlobalSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const t = useTranslations()
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const debouncedQuery = useDebounce(query, 300)

  // Load recent searches on mount
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches())
      // Focus input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery)
    } else {
      setResults(null)
      setSelectedIndex(0)
    }
  }, [debouncedQuery])

  // Perform search API call
  const performSearch = async (searchQuery: string) => {
    setLoading(true)
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, limit: 5 })
      })

      if (response.ok) {
        const data = await response.json()
        setResults(data.data)
        setSelectedIndex(0)
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get all results as flat array for keyboard navigation
  const getAllResults = useCallback((): SearchResultItem[] => {
    if (!results) return []
    return [
      ...results.items,
      ...results.reports,
      ...results.users,
      ...results.settings
    ]
  }, [results])

  // Handle result selection
  const handleSelectResult = useCallback((result: SearchResultItem) => {
    saveRecentSearch(query)
    router.push(result.url)
    onClose()
    setQuery('')
  }, [query, router, onClose])

  // Handle recent search selection
  const handleSelectRecentSearch = useCallback((search: string) => {
    setQuery(search)
    inputRef.current?.focus()
  }, [])

  // Clear recent searches
  const handleClearRecent = useCallback(() => {
    clearRecentSearches()
    setRecentSearches([])
  }, [])

  // Keyboard navigation
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'Escape',
        callback: () => {
          onClose()
          setQuery('')
        },
        description: 'Close search',
        preventDefault: true
      },
      {
        key: 'ArrowDown',
        callback: () => {
          const allResults = getAllResults()
          if (allResults.length > 0) {
            setSelectedIndex(prev => (prev + 1) % allResults.length)
          }
        },
        description: 'Navigate down',
        preventDefault: true
      },
      {
        key: 'ArrowUp',
        callback: () => {
          const allResults = getAllResults()
          if (allResults.length > 0) {
            setSelectedIndex(prev => (prev - 1 + allResults.length) % allResults.length)
          }
        },
        description: 'Navigate up',
        preventDefault: true
      },
      {
        key: 'Enter',
        callback: () => {
          const allResults = getAllResults()
          if (allResults[selectedIndex]) {
            handleSelectResult(allResults[selectedIndex])
          }
        },
        description: 'Select result',
        preventDefault: true
      }
    ],
    enabled: isOpen
  })

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      )
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  const allResults = getAllResults()
  const hasResults = results && results.total > 0
  const showRecent = !query.trim() && recentSearches.length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-label="Global search"
        >
          {/* Search Input */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder') || 'Search inventory, reports, users, settings...'}
                className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:outline-none text-lg"
                autoComplete="off"
                aria-label="Search query"
              />
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="flex-1 overflow-y-auto p-2"
            role="listbox"
          >
            {/* Recent Searches */}
            {showRecent && (
              <div className="p-2">
                <div className="flex items-center justify-between mb-2 px-2">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t('search.recent') || 'Recent Searches'}
                  </h3>
                  <button
                    onClick={handleClearRecent}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                  >
                    {t('search.clearRecent') || 'Clear'}
                  </button>
                </div>
                <div className="space-y-1">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectRecentSearch(search)}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
                    >
                      <svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span>{search}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {hasResults && (
              <div className="space-y-4">
                {/* Inventory Items */}
                {results.items.length > 0 && (
                  <SearchResultGroup
                    title={t('search.items') || 'Inventory Items'}
                    icon="📦"
                    results={results.items}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelectResult}
                    startIndex={0}
                  />
                )}

                {/* Reports */}
                {results.reports.length > 0 && (
                  <SearchResultGroup
                    title={t('search.reports') || 'Reports'}
                    icon="📊"
                    results={results.reports}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelectResult}
                    startIndex={results.items.length}
                  />
                )}

                {/* Users */}
                {results.users.length > 0 && (
                  <SearchResultGroup
                    title={t('search.users') || 'Users'}
                    icon="👤"
                    results={results.users}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelectResult}
                    startIndex={results.items.length + results.reports.length}
                  />
                )}

                {/* Settings */}
                {results.settings.length > 0 && (
                  <SearchResultGroup
                    title={t('search.settings') || 'Settings'}
                    icon="⚙️"
                    results={results.settings}
                    selectedIndex={selectedIndex}
                    onSelect={handleSelectResult}
                    startIndex={
                      results.items.length + results.reports.length + results.users.length
                    }
                  />
                )}
              </div>
            )}

            {/* No Results */}
            {query.trim() && !loading && results && results.total === 0 && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('search.noResults') || 'No results found'}
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {t('search.tryDifferent') || 'Try a different search term'}
                </p>
              </div>
            )}

            {/* Empty State */}
            {!query.trim() && !showRecent && (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-500 dark:text-gray-400">
                  {t('search.startTyping') || 'Start typing to search'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                    ↑↓
                  </kbd>
                  {t('search.navigate') || 'Navigate'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                    ↵
                  </kbd>
                  {t('search.select') || 'Select'}
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                    Esc
                  </kbd>
                  {t('search.close') || 'Close'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Search Result Group Component
interface SearchResultGroupProps {
  title: string
  icon: string
  results: SearchResultItem[]
  selectedIndex: number
  onSelect: (result: SearchResultItem) => void
  startIndex: number
}

function SearchResultGroup({
  title,
  icon,
  results,
  selectedIndex,
  onSelect,
  startIndex
}: SearchResultGroupProps) {
  return (
    <div className="p-2">
      <h3 className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 px-2 flex items-center gap-2">
        <span>{icon}</span>
        <span>{title}</span>
      </h3>
      <div className="space-y-1">
        {results.map((result, index) => {
          const globalIndex = startIndex + index
          const isSelected = globalIndex === selectedIndex

          return (
            <button
              key={result.id}
              data-index={globalIndex}
              onClick={() => onSelect(result)}
              className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
              role="option"
              aria-selected={isSelected}
            >
              <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                {result.title}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {result.description}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
