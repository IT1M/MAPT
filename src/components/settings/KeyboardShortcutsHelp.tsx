'use client'

import React, { useState } from 'react'

interface KeyboardShortcut {
  keys: string[]
  description: string
  category: string
}

const SHORTCUTS: KeyboardShortcut[] = [
  {
    keys: ['Ctrl', 'K'],
    description: 'Focus search input',
    category: 'Navigation',
  },
  {
    keys: ['Ctrl', 'S'],
    description: 'Save current settings',
    category: 'Actions',
  },
  {
    keys: ['Esc'],
    description: 'Close modal or sidebar',
    category: 'Navigation',
  },
  {
    keys: ['Tab'],
    description: 'Navigate to next element',
    category: 'Navigation',
  },
  {
    keys: ['Shift', 'Tab'],
    description: 'Navigate to previous element',
    category: 'Navigation',
  },
  {
    keys: ['↑', '↓'],
    description: 'Navigate within lists',
    category: 'Navigation',
  },
  {
    keys: ['Enter'],
    description: 'Activate button or link',
    category: 'Actions',
  },
  {
    keys: ['Space'],
    description: 'Toggle checkbox or button',
    category: 'Actions',
  },
]

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  const categories = Array.from(new Set(SHORTCUTS.map((s) => s.category)))

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  const formatKey = (key: string) => {
    if (key === 'Ctrl' && isMac) return '⌘'
    if (key === 'Alt' && isMac) return '⌥'
    if (key === 'Shift') return '⇧'
    if (key === '↑') return '↑'
    if (key === '↓') return '↓'
    if (key === '←') return '←'
    if (key === '→') return '→'
    return key
  }

  return (
    <>
      {/* Help Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-gray-800 text-white rounded-full shadow-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 z-50 min-h-[44px] min-w-[44px]"
        aria-label="Show keyboard shortcuts"
        title="Keyboard shortcuts (Press ? to toggle)"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="shortcuts-title"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2
                  id="shortcuts-title"
                  className="text-2xl font-bold text-gray-900 dark:text-gray-100"
                >
                  Keyboard Shortcuts
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label="Close keyboard shortcuts"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
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

              {/* Shortcuts List */}
              <div className="space-y-6">
                {categories.map((category) => (
                  <div key={category}>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {SHORTCUTS.filter((s) => s.category === category).map(
                        (shortcut, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <span className="text-gray-700 dark:text-gray-300">
                              {shortcut.description}
                            </span>
                            <div className="flex items-center gap-1">
                              {shortcut.keys.map((key, keyIndex) => (
                                <React.Fragment key={keyIndex}>
                                  <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded-lg dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 min-w-[32px] text-center">
                                    {formatKey(key)}
                                  </kbd>
                                  {keyIndex < shortcut.keys.length - 1 && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      +
                                    </span>
                                  )}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Press <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600">?</kbd> anytime to view this help
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
