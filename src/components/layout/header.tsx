'use client'

import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LocaleSwitcher } from '@/components/ui/locale-switcher'
import { useState, useRef, useEffect } from 'react'

export function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const t = useTranslations()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Generate breadcrumbs from pathname
  const generateBreadcrumbs = () => {
    const segments = pathname.split('/').filter(Boolean)
    // Remove locale from segments (first segment)
    const pathSegments = segments.slice(1)
    
    if (pathSegments.length === 0) {
      return [{ label: t('navigation.dashboard'), path: '' }]
    }

    return pathSegments.map((segment, index) => {
      const path = '/' + segments.slice(0, index + 2).join('/')
      const label = t(`navigation.${segment}`) || segment.charAt(0).toUpperCase() + segment.slice(1)
      return { label, path }
    })
  }

  const breadcrumbs = generateBreadcrumbs()

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  const getRoleLabel = (role: string) => {
    const roleMap: Record<string, string> = {
      ADMIN: t('roles.admin'),
      DATA_ENTRY: t('roles.dataEntry'),
      SUPERVISOR: t('roles.supervisor'),
      MANAGER: t('roles.manager'),
      AUDITOR: t('roles.auditor'),
    }
    return roleMap[role] || role
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center space-x-2 rtl:space-x-reverse" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-2 rtl:space-x-reverse">
              {breadcrumbs.map((crumb, index) => (
                <li key={crumb.path} className="flex items-center">
                  {index > 0 && (
                    <svg
                      className="w-4 h-4 mx-2 text-gray-400 rtl:rotate-180"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span
                    className={`text-sm font-medium ${
                      index === breadcrumbs.length - 1
                        ? 'text-gray-900 dark:text-gray-100'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {crumb.label}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Locale Switcher */}
            <LocaleSwitcher />

            {/* User Profile Dropdown */}
            {session?.user && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                  aria-expanded={isDropdownOpen}
                  aria-haspopup="true"
                >
                  {/* User Avatar */}
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium text-sm">
                    {session.user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  
                  {/* User Info */}
                  <div className="hidden md:block text-left rtl:text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {session.user.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {getRoleLabel(session.user.role)}
                    </div>
                  </div>

                  {/* Dropdown Arrow */}
                  <svg
                    className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-56 rounded-lg shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 animate-fade-in">
                    <div className="py-1">
                      {/* User Info (Mobile) */}
                      <div className="md:hidden px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {session.user.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {session.user.email}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {getRoleLabel(session.user.role)}
                        </div>
                      </div>

                      {/* Logout Button */}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left rtl:text-right px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
