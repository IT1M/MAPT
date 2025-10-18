'use client'

import React from 'react'
import { UserRole } from '@prisma/client'
import type { SettingsSection, SettingsNavigationItem } from '@/types/settings'

interface SettingsNavigationProps {
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  userRole: UserRole
  isMobile?: boolean
}

const NAVIGATION_ITEMS: SettingsNavigationItem[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: 'user',
    description: 'Manage your personal information and avatar',
  },
  {
    id: 'security',
    label: 'Security',
    icon: 'shield',
    description: 'Password, sessions, and security settings',
  },
  {
    id: 'users',
    label: 'User Management',
    icon: 'users',
    description: 'Manage user accounts and permissions',
    requiredRoles: [UserRole.ADMIN],
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: 'palette',
    description: 'Customize theme and UI preferences',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: 'bell',
    description: 'Configure notification preferences',
  },
  {
    id: 'api',
    label: 'API & Integrations',
    icon: 'plug',
    description: 'Manage API keys and integrations',
    requiredRoles: [UserRole.ADMIN],
  },
  {
    id: 'system',
    label: 'System Preferences',
    icon: 'settings',
    description: 'System-wide configuration',
    requiredRoles: [UserRole.ADMIN, UserRole.MANAGER],
  },
]

const ICONS: Record<string, React.ReactNode> = {
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  shield: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  users: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  palette: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
    </svg>
  ),
  bell: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  ),
  plug: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
}

export const SettingsNavigation = React.memo<SettingsNavigationProps>(function SettingsNavigation({
  activeSection,
  onSectionChange,
  userRole,
  isMobile = false,
}) {
  // Filter navigation items based on user role - memoized
  const visibleItems = React.useMemo(() => {
    return NAVIGATION_ITEMS.filter((item) => {
      if (!item.requiredRoles) return true
      return item.requiredRoles.includes(userRole)
    })
  }, [userRole])

  if (isMobile) {
    // Accordion layout for mobile
    return (
      <div className="space-y-1">
        {visibleItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors min-h-[44px] ${
              activeSection === item.id
                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
            }`}
            aria-current={activeSection === item.id ? 'page' : undefined}
          >
            <span className={activeSection === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>
              {ICONS[item.icon]}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.label}</div>
              {item.description && (
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                  {item.description}
                </div>
              )}
            </div>
            {activeSection === item.id && (
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        ))}
      </div>
    )
  }

  // Sidebar layout for desktop
  return (
    <nav className="space-y-1" aria-label="Settings navigation">
      {visibleItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onSectionChange(item.id)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors min-h-[44px] ${
            activeSection === item.id
              ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400'
              : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
          }`}
          aria-current={activeSection === item.id ? 'page' : undefined}
        >
          <span className={activeSection === item.id ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400'}>
            {ICONS[item.icon]}
          </span>
          <div className="flex-1 min-w-0">
            <div className="font-medium">{item.label}</div>
            {item.description && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {item.description}
              </div>
            )}
          </div>
        </button>
      ))}
    </nav>
  )
})
