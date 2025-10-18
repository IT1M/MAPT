'use client'

/**
 * Hook for managing global search state and keyboard shortcut
 * Provides Ctrl+K / Cmd+K shortcut to open search modal
 */

import { useState, useEffect } from 'react'

export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const openSearch = () => setIsOpen(true)
  const closeSearch = () => setIsOpen(false)

  return {
    isOpen,
    openSearch,
    closeSearch
  }
}
