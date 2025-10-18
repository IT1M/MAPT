'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { UserRole } from '@prisma/client'
import {
  navigationConfig,
  filterNavigationByRole,
  getNavigationLabel,
  NavigationItem,
} from '@/config/navigation'

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const locale = useLocale() as 'en' | 'ar'
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState<number>(-1)
  const navItemsRef = useRef<(HTMLAnchorElement | null)[]>([])

  // Load collapsed state from localStorage on mount
  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY)
    if (stored !== null) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  // Save collapsed state to localStorage
  const toggleCollapsed = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(newState))
  }

  // Sync collapsed state across tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === SIDEBAR_STORAGE_KEY && e.newValue !== null) {
        setIsCollapsed(e.newValue === 'true')
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Filter navigation items based on user role
  const filteredNavItems = filterNavigationByRole(session?.user?.role as UserRole)

  // Add locale prefix to href
  const getLocalizedHref = (item: NavigationItem) => `/${locale}${item.href}`

  const isActive = (item: NavigationItem) => {
    const itemPath = getLocalizedHref(item)
    return pathname === itemPath || pathname.startsWith(itemPath + '/')
  }

  // Keyboard navigation handler
  const handleKeyDown = (e: KeyboardEvent<HTMLAnchorElement>, index: number) => {
    const totalItems = filteredNavItems.length

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        const nextIndex = (index + 1) % totalItems
        navItemsRef.current[nextIndex]?.focus()
        setFocusedIndex(nextIndex)
        break
      case 'ArrowUp':
        e.preventDefault()
        const prevIndex = (index - 1 + totalItems) % totalItems
        navItemsRef.current[prevIndex]?.focus()
        setFocusedIndex(prevIndex)
        break
      case 'Home':
        e.preventDefault()
        navItemsRef.current[0]?.focus()
        setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        navItemsRef.current[totalItems - 1]?.focus()
        setFocusedIndex(totalItems - 1)
        break
    }
  }

  // Prevent hydration mismatch
  if (!isMounted) {
    return (
      <aside className="hidden lg:block w-64 bg-white dark:bg-gray-800 border-r rtl:border-r-0 rtl:border-l border-gray-200 dark:border-gray-700">
        <div className="h-full" />
      </aside>
    )
  }

  return (
    <aside
      className={`
        hidden lg:block bg-white dark:bg-gray-800 border-r rtl:border-r-0 rtl:border-l border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isCollapsed ? 'w-20' : 'w-64'}
      `}
    >
      <div className="flex flex-col h-full">
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Saudi Mais
              </span>
            </div>
          )}
          
          {/* Toggle Button */}
          <button
            onClick={toggleCollapsed}
            className={`
              p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
              focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
              ${isCollapsed ? 'mx-auto' : ''}
            `}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className={`w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform ${
                isCollapsed ? 'rotate-180 rtl:rotate-0' : 'rtl:rotate-180'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4" role="navigation" aria-label="Main navigation">
          <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`} role="list">
            {filteredNavItems.map((item, index) => {
              const active = isActive(item)
              const Icon = item.icon
              const label = getNavigationLabel(item, locale)
              
              return (
                <li key={item.id}>
                  <Link
                    ref={(el) => {
                      navItemsRef.current[index] = el
                    }}
                    href={getLocalizedHref(item)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                      transition-all duration-300 ease-in-out
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                      dark:focus:ring-offset-gray-800
                      ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary-600 dark:border-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? label : undefined}
                    aria-label={label}
                    aria-current={active ? 'page' : undefined}
                  >
                    <span className={`flex-shrink-0 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                      <Icon className="w-5 h-5" />
                    </span>
                    {!isCollapsed && (
                      <>
                        <span className="flex-1">{label}</span>
                        {item.badge && (
                          <span
                            className={`
                              px-2 py-0.5 text-xs font-semibold rounded-full
                              ${
                                item.badge.variant === 'new'
                                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                  : item.badge.variant === 'info'
                                  ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
                                  : item.badge.variant === 'warning'
                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }
                            `}
                          >
                            {item.badge.count !== undefined ? item.badge.count : item.badge.text}
                          </span>
                        )}
                        {active && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div
                        className={`
                          absolute left-full rtl:left-auto rtl:right-full
                          ml-2 rtl:ml-0 rtl:mr-2 px-3 py-1.5
                          bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium rounded-md
                          opacity-0 group-hover:opacity-100 group-focus:opacity-100
                          pointer-events-none transition-opacity duration-150
                          whitespace-nowrap z-50 shadow-lg
                        `}
                        role="tooltip"
                      >
                        {label}
                        {item.badge && (
                          <span className="ml-2 rtl:ml-0 rtl:mr-2">
                            {item.badge.count !== undefined ? `(${item.badge.count})` : item.badge.text}
                          </span>
                        )}
                      </div>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2024 Saudi Mais Co.
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
