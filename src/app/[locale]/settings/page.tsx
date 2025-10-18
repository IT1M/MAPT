'use client'

import React, { Suspense, lazy, useState, useCallback, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import type { SettingsSection } from '@/types/settings'
import { UserRole } from '@prisma/client'

// Lazy load all section components for code splitting
const AppearanceSettings = lazy(() => import('@/components/settings/AppearanceSettings').then(m => ({ default: m.AppearanceSettings })))
const NotificationSettings = lazy(() => import('@/components/settings/NotificationSettings').then(m => ({ default: m.NotificationSettings })))
const SystemPreferences = lazy(() => import('@/components/settings/SystemPreferences').then(m => ({ default: m.SystemPreferences })))

// Loading skeleton component
function SectionLoadingSkeleton() {
  return (
    <div className="p-6 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      </div>
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  )
}

// Error boundary fallback component
function SectionErrorFallback({ error, resetError }: { error: Error; resetError: () => void }) {
  return (
    <div className="p-6">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
              Failed to load section
            </h3>
            <p className="text-sm text-red-700 dark:text-red-300 mb-4">
              {error.message || 'An unexpected error occurred while loading this section.'}
            </p>
            <button
              onClick={resetError}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Error boundary class component
class SectionErrorBoundary extends React.Component<
  { children: React.ReactNode; onReset?: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; onReset?: () => void }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Settings section error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <SectionErrorFallback error={this.state.error} resetError={this.resetError} />
    }

    return this.props.children
  }
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [errorResetKey, setErrorResetKey] = useState(0)

  // Redirect if not authenticated
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      const locale = typeof window !== 'undefined' ?
        document.documentElement.lang || 'en' : 'en'
      router.push(`/${locale}/login`)
    }
  }, [status, router])

  // Memoize user role to prevent unnecessary re-renders
  const userRole = useMemo(() => {
    return (session?.user?.role as UserRole) || UserRole.DATA_ENTRY
  }, [session?.user?.role])

  // Memoize section change handler
  const handleSectionChange = useCallback((section: SettingsSection) => {
    setActiveSection(section)
    // Reset error boundary when changing sections
    setErrorResetKey((prev) => prev + 1)
  }, [])

  // Reset error boundary callback
  const handleErrorReset = useCallback(() => {
    setErrorResetKey((prev) => prev + 1)
  }, [])

  // Render section content with lazy loading and error boundary
  const renderSectionContent = useMemo(() => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Profile Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Profile settings coming soon...</p>
          </div>
        )

      case 'security':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">Security Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">Security settings coming soon...</p>
          </div>
        )

      case 'users':
        return userRole === UserRole.ADMIN ? (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">User Management</h2>
            <p className="text-gray-600 dark:text-gray-400">User management coming soon...</p>
          </div>
        ) : null

      case 'appearance':
        return <AppearanceSettings />

      case 'notifications':
        return <NotificationSettings />

      case 'api':
        return userRole === UserRole.ADMIN ? (
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-4">API Settings</h2>
            <p className="text-gray-600 dark:text-gray-400">API settings coming soon...</p>
          </div>
        ) : null

      case 'system':
        return userRole === UserRole.ADMIN || userRole === UserRole.MANAGER ? (
          <SystemPreferences />
        ) : null

      default:
        return null
    }
  }, [activeSection, userRole])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated
  if (!session) {
    return null
  }

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={handleSectionChange}
      userRole={userRole}
    >
      <SectionErrorBoundary key={errorResetKey} onReset={handleErrorReset}>
        <Suspense fallback={<SectionLoadingSkeleton />}>
          {renderSectionContent}
        </Suspense>
      </SectionErrorBoundary>
    </SettingsLayout>
  )
}
