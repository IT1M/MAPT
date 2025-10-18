'use client'

/**
 * Global Keyboard Shortcuts Provider
 * Manages all global keyboard shortcuts throughout the application
 */

import { useState, useCallback, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal'
import { useGlobalSearchContext } from '@/components/search'

interface GlobalKeyboardShortcutsProps {
  children?: React.ReactNode
}

export function GlobalKeyboardShortcuts({ children }: GlobalKeyboardShortcutsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { openSearch } = useGlobalSearchContext()
  const [showShortcutsModal, setShowShortcutsModal] = useState(false)

  // Get current page for context-aware shortcuts
  const getCurrentPage = useCallback(() => {
    if (pathname.includes('/data-entry')) return 'data-entry'
    if (pathname.includes('/data-log')) return 'data-log'
    if (pathname.includes('/analytics')) return 'analytics'
    if (pathname.includes('/audit')) return 'audit'
    if (pathname.includes('/settings')) return 'settings'
    if (pathname.includes('/dashboard')) return 'dashboard'
    return 'other'
  }, [pathname])

  // Define global shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      // Search
      {
        key: 'k',
        ctrlKey: true,
        metaKey: true,
        callback: () => openSearch(),
        description: 'Open global search',
        category: 'Search',
        preventDefault: true,
      },

      // Help
      {
        key: '/',
        ctrlKey: true,
        metaKey: true,
        callback: () => setShowShortcutsModal(true),
        description: 'Show keyboard shortcuts',
        category: 'Help',
        preventDefault: true,
      },
      {
        key: '?',
        shiftKey: true,
        callback: () => setShowShortcutsModal(true),
        description: 'Show help',
        category: 'Help',
        preventDefault: true,
      },

      // Navigation - Go to pages (sequences)
      {
        key: 'd',
        sequence: ['g', 'd'],
        callback: () => router.push('/dashboard'),
        description: 'Go to dashboard',
        category: 'Navigation',
        preventDefault: true,
      },
      {
        key: 'e',
        sequence: ['g', 'e'],
        callback: () => router.push('/data-entry'),
        description: 'Go to data entry',
        category: 'Navigation',
        preventDefault: true,
      },
      {
        key: 'l',
        sequence: ['g', 'l'],
        callback: () => router.push('/data-log'),
        description: 'Go to data log',
        category: 'Navigation',
        preventDefault: true,
      },
      {
        key: 'a',
        sequence: ['g', 'a'],
        callback: () => router.push('/analytics'),
        description: 'Go to analytics',
        category: 'Navigation',
        preventDefault: true,
      },
      {
        key: 'u',
        sequence: ['g', 'u'],
        callback: () => router.push('/audit'),
        description: 'Go to audit logs',
        category: 'Navigation',
        preventDefault: true,
      },
      {
        key: 's',
        sequence: ['g', 's'],
        callback: () => router.push('/settings'),
        description: 'Go to settings',
        category: 'Navigation',
        preventDefault: true,
      },

      // Actions - Refresh
      {
        key: 'r',
        callback: () => {
          window.location.reload()
        },
        description: 'Refresh current page',
        category: 'Actions',
        preventDefault: true,
      },
    ],
    enabled: true,
  })

  return (
    <>
      {children}
      <KeyboardShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
        currentPage={getCurrentPage()}
      />
    </>
  )
}
