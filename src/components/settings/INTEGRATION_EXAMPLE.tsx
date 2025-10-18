/**
 * Settings Page Integration Example
 * 
 * This file demonstrates how to integrate the internationalization and search
 * functionality into the main settings page.
 * 
 * NOTE: This is a SIMPLIFIED example showing the search and i18n integration.
 * The actual settings components require props with data and handlers.
 * See the full implementation in src/app/[locale]/settings/page.tsx
 */

'use client'

import React, { useState } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SettingsSearchDemo } from '@/components/settings/SettingsSearchDemo'

// Import RTL styles
import '@/styles/settings-rtl.css'

type SettingsSection = 
  | 'profile' 
  | 'security' 
  | 'users' 
  | 'appearance' 
  | 'notifications' 
  | 'api' 
  | 'system'

/**
 * Simplified Settings Page showing Search and i18n integration
 * 
 * For the full implementation with data fetching and component props,
 * refer to the actual settings page implementation.
 */
export default function SettingsPage() {
  const t = useTranslations('settings')
  const locale = useLocale()
  const isRTL = locale === 'ar'
  
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  // Section configuration
  const sections = [
    { id: 'profile', label: t('sections.profile') },
    { id: 'security', label: t('sections.security') },
    { id: 'users', label: t('sections.users') },
    { id: 'appearance', label: t('sections.appearance') },
    { id: 'notifications', label: t('sections.notifications') },
    { id: 'api', label: t('sections.api') },
    { id: 'system', label: t('sections.system') },
  ] as const

  // Render the appropriate section content
  const renderSectionContent = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSectionPlaceholder />
      case 'security':
        return <SecuritySectionPlaceholder />
      case 'users':
        return <UsersSectionPlaceholder />
      case 'appearance':
        return <AppearanceSectionPlaceholder />
      case 'notifications':
        return <NotificationsSectionPlaceholder />
      case 'api':
        return <APISectionPlaceholder />
      case 'system':
        return <SystemSectionPlaceholder />
      default:
        return <ProfileSectionPlaceholder />
    }
  }

  return (
    <div 
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold text-gray-900 dark:text-gray-100 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('title')}
          </h1>
          <p className={`mt-2 text-gray-600 dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'}`}>
            {t('subtitle')}
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <SettingsSearchDemo 
            onSectionChange={(section) => setActiveSection(section as SettingsSection)}
          />
        </div>

        {/* Settings Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Navigation Sidebar */}
          <nav 
            className={`
              lg:w-64 flex-shrink-0
              ${isRTL ? 'lg:border-l' : 'lg:border-r'}
              border-gray-200 dark:border-gray-700
            `}
            aria-label={t('title')}
          >
            <ul className="space-y-1">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id as SettingsSection)}
                    className={`
                      w-full px-4 py-3 text-sm font-medium rounded-lg
                      transition-colors
                      ${isRTL ? 'text-right' : 'text-left'}
                      ${
                        activeSection === section.id
                          ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                    aria-current={activeSection === section.id ? 'page' : undefined}
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* Content Area */}
          <main className="flex-1 min-w-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
              {renderSectionContent()}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

// Placeholder components to demonstrate the layout
// Replace these with your actual settings components that fetch data and handle state

function ProfileSectionPlaceholder() {
  const t = useTranslations('settings.profile')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual ProfileSettings component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function SecuritySectionPlaceholder() {
  const t = useTranslations('settings.security')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual SecuritySettings component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function UsersSectionPlaceholder() {
  const t = useTranslations('settings.users')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual UserManagement component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function AppearanceSectionPlaceholder() {
  const t = useTranslations('settings.appearance')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual AppearanceSettings component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function NotificationsSectionPlaceholder() {
  const t = useTranslations('settings.notifications')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual NotificationSettings component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function APISectionPlaceholder() {
  const t = useTranslations('settings.api')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('description')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual APISettings component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

function SystemSectionPlaceholder() {
  const t = useTranslations('settings.system')
  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">{t('title')}</h3>
      <p className="text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          Replace this with the actual SystemPreferences component with proper data fetching and props.
        </p>
      </div>
    </div>
  )
}

/**
 * Usage Notes:
 * 
 * 1. Import RTL styles in your layout:
 *    import '@/styles/settings-rtl.css'
 * 
 * 2. Ensure next-intl is configured in your app
 * 
 * 3. The search component will automatically:
 *    - Debounce input (300ms)
 *    - Highlight matches
 *    - Group results by section
 *    - Support keyboard shortcuts (Ctrl/Cmd + K)
 * 
 * 4. RTL support is automatic based on locale
 * 
 * 5. All translations are loaded from messages/[locale].json
 * 
 * 6. Replace placeholder components with actual settings components:
 *    - Each settings component requires specific props (data, handlers)
 *    - Fetch data using React Query, SWR, or server components
 *    - Pass appropriate handlers for mutations
 *    - See individual component files for required props
 * 
 * Example with actual component:
 * 
 * ```tsx
 * import { SecuritySettings } from '@/components/settings/SecuritySettings'
 * import { useSecurityData } from '@/hooks/useSecurityData'
 * 
 * function SecuritySection() {
 *   const { sessions, events, handlers } = useSecurityData()
 *   
 *   return (
 *     <SecuritySettings
 *       userId={userId}
 *       sessions={sessions}
 *       currentSessionId={currentSessionId}
 *       securityEvents={events}
 *       totalEvents={totalEvents}
 *       currentPage={currentPage}
 *       pageSize={pageSize}
 *       onPasswordChange={handlers.changePassword}
 *       onSessionTerminate={handlers.terminateSession}
 *       onSessionTerminateAll={handlers.terminateAllSessions}
 *       onSessionsRefresh={handlers.refreshSessions}
 *       onPageChange={handlers.changePage}
 *       onExportLog={handlers.exportLog}
 *     />
 *   )
 * }
 * ```
 */
