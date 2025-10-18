'use client'

/**
 * Global Search Provider
 * Makes global search available throughout the application
 */

import { createContext, useContext, ReactNode } from 'react'
import { GlobalSearch } from './GlobalSearch'
import { useGlobalSearch } from '@/hooks/useGlobalSearch'

interface GlobalSearchContextType {
  openSearch: () => void
  closeSearch: () => void
  isOpen: boolean
}

const GlobalSearchContext = createContext<GlobalSearchContextType | undefined>(undefined)

export function GlobalSearchProvider({ children }: { children: ReactNode }) {
  const { isOpen, openSearch, closeSearch } = useGlobalSearch()

  return (
    <GlobalSearchContext.Provider value={{ isOpen, openSearch, closeSearch }}>
      {children}
      <GlobalSearch isOpen={isOpen} onClose={closeSearch} />
    </GlobalSearchContext.Provider>
  )
}

export function useGlobalSearchContext() {
  const context = useContext(GlobalSearchContext)
  if (!context) {
    throw new Error('useGlobalSearchContext must be used within GlobalSearchProvider')
  }
  return context
}
