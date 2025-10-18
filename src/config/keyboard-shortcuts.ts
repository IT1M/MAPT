/**
 * Global Keyboard Shortcuts Configuration
 * Defines all keyboard shortcuts available throughout the application
 */

import { KeyboardShortcut } from '@/hooks/useKeyboardShortcuts'

export type ShortcutCategory = 
  | 'Navigation'
  | 'Actions'
  | 'Search'
  | 'Help'
  | 'Table'
  | 'Forms'
  | 'Modals'

export interface GlobalShortcutConfig extends Omit<KeyboardShortcut, 'callback'> {
  id: string
  category: ShortcutCategory
  pageSpecific?: string[] // Pages where this shortcut is active
}

/**
 * Global keyboard shortcuts configuration
 * These are the shortcuts available throughout the application
 */
export const GLOBAL_SHORTCUTS: GlobalShortcutConfig[] = [
  // Navigation shortcuts
  {
    id: 'open-search',
    key: 'k',
    ctrlKey: true,
    metaKey: true,
    description: 'Open global search',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-dashboard',
    key: 'd',
    sequence: ['g', 'd'],
    description: 'Go to dashboard',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-data-entry',
    key: 'e',
    sequence: ['g', 'e'],
    description: 'Go to data entry',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-data-log',
    key: 'l',
    sequence: ['g', 'l'],
    description: 'Go to data log',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-analytics',
    key: 'a',
    sequence: ['g', 'a'],
    description: 'Go to analytics',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-audit',
    key: 'u',
    sequence: ['g', 'u'],
    description: 'Go to audit logs',
    category: 'Navigation',
    preventDefault: true,
  },
  {
    id: 'go-settings',
    key: 's',
    sequence: ['g', 's'],
    description: 'Go to settings',
    category: 'Navigation',
    preventDefault: true,
  },

  // Action shortcuts
  {
    id: 'new-item',
    key: 'n',
    ctrlKey: true,
    metaKey: true,
    description: 'Create new item',
    category: 'Actions',
    preventDefault: true,
    pageSpecific: ['data-entry'],
  },
  {
    id: 'save',
    key: 's',
    ctrlKey: true,
    metaKey: true,
    description: 'Save current form',
    category: 'Actions',
    preventDefault: true,
    pageSpecific: ['data-entry', 'settings'],
  },
  {
    id: 'refresh',
    key: 'r',
    description: 'Refresh current page',
    category: 'Actions',
    preventDefault: true,
  },
  {
    id: 'export',
    key: 'e',
    description: 'Export data',
    category: 'Actions',
    preventDefault: true,
    pageSpecific: ['data-log', 'analytics', 'audit'],
  },
  {
    id: 'filter',
    key: 'f',
    description: 'Open filters',
    category: 'Actions',
    preventDefault: true,
    pageSpecific: ['data-log', 'analytics', 'audit'],
  },

  // Help shortcuts
  {
    id: 'show-shortcuts',
    key: '/',
    ctrlKey: true,
    metaKey: true,
    description: 'Show keyboard shortcuts',
    category: 'Help',
    preventDefault: true,
  },
  {
    id: 'show-help',
    key: '?',
    shiftKey: true,
    description: 'Show help',
    category: 'Help',
    preventDefault: true,
  },

  // Modal shortcuts
  {
    id: 'close-modal',
    key: 'Escape',
    description: 'Close modal or dialog',
    category: 'Modals',
    preventDefault: false,
  },

  // Table shortcuts
  {
    id: 'navigate-down',
    key: 'ArrowDown',
    description: 'Navigate down in table',
    category: 'Table',
    preventDefault: true,
    pageSpecific: ['data-log', 'audit'],
  },
  {
    id: 'navigate-up',
    key: 'ArrowUp',
    description: 'Navigate up in table',
    category: 'Table',
    preventDefault: true,
    pageSpecific: ['data-log', 'audit'],
  },
  {
    id: 'select-item',
    key: 'Enter',
    description: 'Select/open item',
    category: 'Table',
    preventDefault: true,
    pageSpecific: ['data-log', 'audit'],
  },
  {
    id: 'select-all',
    key: 'a',
    ctrlKey: true,
    metaKey: true,
    description: 'Select all items',
    category: 'Table',
    preventDefault: true,
    pageSpecific: ['data-log', 'audit'],
  },
]

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: ShortcutCategory): GlobalShortcutConfig[] {
  return GLOBAL_SHORTCUTS.filter(s => s.category === category)
}

/**
 * Get shortcuts for a specific page
 */
export function getShortcutsForPage(page: string): GlobalShortcutConfig[] {
  return GLOBAL_SHORTCUTS.filter(
    s => !s.pageSpecific || s.pageSpecific.includes(page)
  )
}

/**
 * Get all categories
 */
export function getAllCategories(): ShortcutCategory[] {
  return Array.from(new Set(GLOBAL_SHORTCUTS.map(s => s.category)))
}
