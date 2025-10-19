'use client'

/**
 * Keyboard Shortcuts Help Modal
 * Displays all available keyboard shortcuts grouped by category
 * with search functionality and platform-specific key display
 */

import { useState, useMemo } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { 
  GLOBAL_SHORTCUTS, 
  getAllCategories,
  type ShortcutCategory,
  type GlobalShortcutConfig
} from '@/config/keyboard-shortcuts'
import { getModifierKey, isMac } from '@/hooks/useKeyboardShortcuts'

interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPage?: string
}

export function KeyboardShortcutsModal({ 
  isOpen, 
  onClose,
  currentPage 
}: KeyboardShortcutsModalProps) {
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ShortcutCategory | 'all'>('all')

  const modifierKey = getModifierKey()
  const categories = getAllCategories()

  // Filter shortcuts based on search and category
  const filteredShortcuts = useMemo(() => {
    let shortcuts = GLOBAL_SHORTCUTS

    // Filter by current page
    if (currentPage) {
      shortcuts = shortcuts.filter(
        s => !s.pageSpecific || s.pageSpecific.includes(currentPage)
      )
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      shortcuts = shortcuts.filter(
        s => s.description.toLowerCase().includes(query) ||
             s.key.toLowerCase().includes(query) ||
             s.category.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      shortcuts = shortcuts.filter(s => s.category === selectedCategory)
    }

    return shortcuts
  }, [searchQuery, selectedCategory, currentPage])

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups: Record<ShortcutCategory, GlobalShortcutConfig[]> = {} as any

    filteredShortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = []
      }
      groups[shortcut.category].push(shortcut)
    })

    return groups
  }, [filteredShortcuts])

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 
                id="shortcuts-title"
                className="text-2xl font-bold text-gray-900 dark:text-gray-100"
              >
                ⌨️ {t('shortcuts.title') || 'Keyboard Shortcuts'}
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="flex-1 relative">
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
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('shortcuts.search') || 'Search shortcuts...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as ShortcutCategory | 'all')}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('shortcuts.allCategories') || 'All Categories'}</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              {/* Print Button */}
              <button
                onClick={handlePrint}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2"
                title={t('shortcuts.print') || 'Print shortcuts'}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span className="hidden sm:inline">
                  {t('shortcuts.print') || 'Print'}
                </span>
              </button>
            </div>

            {/* Platform Info */}
            <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {isMac() ? (
                <span>💡 {t('shortcuts.macInfo') || 'Showing shortcuts for macOS'}</span>
              ) : (
                <span>💡 {t('shortcuts.windowsInfo') || 'Showing shortcuts for Windows/Linux'}</span>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredShortcuts.length === 0 ? (
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
                  {t('shortcuts.noResults') || 'No shortcuts found'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                      <span className="text-2xl">{getCategoryIcon(category as ShortcutCategory)}</span>
                      <span>{category}</span>
                    </h3>
                    <div className="space-y-2">
                      {shortcuts.map(shortcut => (
                        <ShortcutRow
                          key={shortcut.id}
                          shortcut={shortcut}
                          modifierKey={modifierKey}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {t('shortcuts.showing') || 'Showing'} {filteredShortcuts.length} {t('shortcuts.shortcuts') || 'shortcuts'}
              </span>
              <span className="flex items-center gap-2">
                <kbd className="px-2 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-xs">
                  Esc
                </kbd>
                {t('shortcuts.toClose') || 'to close'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Shortcut Row Component
interface ShortcutRowProps {
  shortcut: GlobalShortcutConfig
  modifierKey: 'Ctrl' | 'Cmd'
}

function ShortcutRow({ shortcut, modifierKey }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      <span className="text-gray-700 dark:text-gray-300">
        {shortcut.description}
      </span>
      <div className="flex items-center gap-1">
        {renderShortcutKeys(shortcut, modifierKey)}
      </div>
    </div>
  )
}

// Render shortcut keys
function renderShortcutKeys(shortcut: GlobalShortcutConfig, modifierKey: 'Ctrl' | 'Cmd') {
  const keys: string[] = []

  if (shortcut.sequence) {
    return shortcut.sequence.map((key, index) => (
      <span key={index} className="flex items-center gap-1">
        <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono shadow-sm">
          {key.toUpperCase()}
        </kbd>
        {index < shortcut.sequence!.length - 1 && (
          <span className="text-gray-400 text-xs mx-1">then</span>
        )}
      </span>
    ))
  }

  if (shortcut.ctrlKey || shortcut.metaKey) {
    keys.push(modifierKey)
  }
  if (shortcut.shiftKey) {
    keys.push('Shift')
  }
  if (shortcut.altKey) {
    keys.push('Alt')
  }
  keys.push(getKeyDisplay(shortcut.key))

  return keys.map((key, index) => (
    <span key={index} className="flex items-center gap-1">
      <kbd className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm font-mono shadow-sm">
        {key}
      </kbd>
      {index < keys.length - 1 && (
        <span className="text-gray-400 text-xl mx-1">+</span>
      )}
    </span>
  ))
}

// Get display name for special keys
function getKeyDisplay(key: string): string {
  const keyMap: Record<string, string> = {
    'Escape': 'Esc',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Enter': '↵',
    ' ': 'Space',
  }

  return keyMap[key] || key.toUpperCase()
}

// Get icon for category
function getCategoryIcon(category: ShortcutCategory): string {
  const iconMap: Record<ShortcutCategory, string> = {
    'Navigation': '🧭',
    'Actions': '⚡',
    'Search': '🔍',
    'Help': '❓',
    'Table': '📊',
    'Forms': '📝',
    'Modals': '🪟',
  }

  return iconMap[category] || '⌨️'
}
