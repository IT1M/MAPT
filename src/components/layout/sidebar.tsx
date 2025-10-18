'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { useState, useEffect } from 'react'
import { UserRole } from '.prisma/client'

interface NavItem {
  label: string
  path: string
  icon: React.ReactNode
  roles: UserRole[]
}

const SIDEBAR_STORAGE_KEY = 'sidebar-collapsed'

export function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

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

  // Define navigation items with role-based access
  const navItems: NavItem[] = [
    {
      label: t('dashboard'),
      path: `/${locale}/dashboard`,
      roles: ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      label: t('dataEntry'),
      path: `/${locale}/data-entry`,
      roles: ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: t('dataLog'),
      path: `/${locale}/data-log`,
      roles: ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
        </svg>
      ),
    },
    {
      label: t('inventory'),
      path: `/${locale}/inventory`,
      roles: ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
    },
    {
      label: t('reports'),
      path: `/${locale}/reports`,
      roles: ['ADMIN', 'MANAGER', 'AUDITOR', 'SUPERVISOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      label: t('settings'),
      path: `/${locale}/settings`,
      roles: ['ADMIN'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      label: t('audit'),
      path: `/${locale}/audit`,
      roles: ['ADMIN', 'AUDITOR'],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
  ]

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter((item) => {
    if (!session?.user?.role) return false
    return item.roles.includes(session.user.role as UserRole)
  })

  const isActive = (path: string) => {
    return pathname === path
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
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className={`space-y-1 ${isCollapsed ? 'px-2' : 'px-3'}`}>
            {filteredNavItems.map((item) => {
              const active = isActive(item.path)
              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    className={`
                      group relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                      ${
                        active
                          ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <span className={active ? 'text-primary-600 dark:text-primary-400' : ''}>
                      {item.icon}
                    </span>
                    {!isCollapsed && (
                      <>
                        <span>{item.label}</span>
                        {active && (
                          <span className="ml-auto rtl:ml-0 rtl:mr-auto w-1.5 h-1.5 rounded-full bg-primary-600 dark:bg-primary-400" />
                        )}
                      </>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full rtl:left-auto rtl:right-full ml-2 rtl:ml-0 rtl:mr-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                        {item.label}
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
