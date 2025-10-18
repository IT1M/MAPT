'use client'

import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { useState } from 'react'
import { UserRole } from '@prisma/client'
import {
  filterNavigationByRole,
  getNavigationLabel,
  NavigationItem,
} from '@/config/navigation'

export function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const locale = useLocale() as 'en' | 'ar'
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Filter navigation items based on user role
  const filteredNavItems = filterNavigationByRole(session?.user?.role as UserRole)

  // Add locale prefix to href
  const getLocalizedHref = (item: NavigationItem) => `/${locale}${item.href}`

  const isActive = (item: NavigationItem) => {
    const itemPath = getLocalizedHref(item)
    return pathname === itemPath || pathname.startsWith(itemPath + '/')
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed bottom-4 right-4 rtl:right-auto rtl:left-4 z-50 p-3 rounded-full bg-primary-500 text-white shadow-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Toggle menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Menu */}
      <nav
        className={`
          fixed lg:static inset-y-0 left-0 rtl:left-auto rtl:right-0 z-40
          w-64 bg-white dark:bg-gray-800 border-r rtl:border-r-0 rtl:border-l border-gray-200 dark:border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0 rtl:-translate-x-0' : '-translate-x-full rtl:translate-x-full lg:translate-x-0 rtl:lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Brand */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Saudi Mais
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-3">
              {filteredNavItems.map((item) => {
                const active = isActive(item)
                const Icon = item.icon
                const label = getNavigationLabel(item, locale)
                
                return (
                  <li key={item.id}>
                    <Link
                      href={getLocalizedHref(item)}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium 
                        transition-all duration-300 ease-in-out
                        ${
                          active
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 border-l-4 rtl:border-l-0 rtl:border-r-4 border-primary-600 dark:border-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-l-4 rtl:border-l-0 rtl:border-r-4 border-transparent'
                        }
                      `}
                    >
                      <span className={`flex-shrink-0 ${active ? 'text-primary-600 dark:text-primary-400' : ''}`}>
                        <Icon className="w-5 h-5" />
                      </span>
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
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              © 2024 Saudi Mais Co.
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
