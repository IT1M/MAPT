'use client'

import React, { useState, useEffect, useRef } from 'react'
import { UserRole } from '@prisma/client'
import type { SettingsSection } from '@/types/settings'
import { SettingsNavigation } from './SettingsNavigation'
import { SettingsSearch } from './SettingsSearch'
import { useSettingsKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { ensureAriaLiveRegion, announceToScreenReader } from '@/utils/accessibility-settings'

interface SettingsLayoutProps {
  children: React.ReactNode
  activeSection: SettingsSection
  onSectionChange: (section: SettingsSection) => void
  userRole: UserRole
}

export function SettingsLayout({
  children,
  activeSection,
  onSectionChange,
  userRole,
}: SettingsLayoutProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize ARIA live region
  useEffect(() => {
    ensureAriaLiveRegion()
  }, [])

  // Announce section changes to screen readers
  useEffect(() => {
    const sectionNames: Record<SettingsSection, string> = {
      profile: 'Profile Settings',
      security: 'Security Settings',
      users: 'User Management',
      appearance: 'Appearance Settings',
      notifications: 'Notification Settings',
      api: 'API & Integrations',
      system: 'System Preferences',
    }
    announceToScreenReader(`Navigated to ${sectionNames[activeSection]}`)
  }, [activeSection])

  // Keyboard shortcuts
  useSettingsKeyboardShortcuts({
    onSearch: () => {
      searchInputRef.current?.focus()
    },
    onEscape: () => {
      if (sidebarOpen) {
        setSidebarOpen(false)
      }
    },
    enabled: true,
  })

  // Close sidebar when section changes on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false)
    }
  }, [activeSection, isMobile])

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    // TODO: Implement search filtering logic
    if (query) {
      announceToScreenReader(`Searching for ${query}`)
    }
  }

  // Handle swipe gestures on mobile
  useEffect(() => {
    if (!isMobile) return

    let touchStartX = 0
    let touchEndX = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.changedTouches[0].screenX
    }

    const handleTouchEnd = (e: TouchEvent) => {
      touchEndX = e.changedTouches[0].screenX
      handleSwipe()
    }

    const handleSwipe = () => {
      const swipeThreshold = 50
      const diff = touchStartX - touchEndX

      if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0) {
          // Swipe left - close sidebar
          setSidebarOpen(false)
        } else {
          // Swipe right - open sidebar
          setSidebarOpen(true)
        }
      }
    }

    const mainContent = mainContentRef.current
    if (mainContent) {
      mainContent.addEventListener('touchstart', handleTouchStart)
      mainContent.addEventListener('touchend', handleTouchEnd)

      return () => {
        mainContent.removeEventListener('touchstart', handleTouchStart)
        mainContent.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [isMobile])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Skip to main content link for accessibility */}
      <a
        href="#settings-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
      >
        Skip to main content
      </a>

      {/* Keyboard shortcuts hint (visible on focus) */}
      <div
        className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:top-16 focus-within:right-4 focus-within:z-50 focus-within:bg-gray-800 focus-within:text-white focus-within:px-4 focus-within:py-2 focus-within:rounded-lg focus-within:text-sm"
        tabIndex={0}
        role="complementary"
        aria-label="Keyboard shortcuts"
      >
        <p className="font-semibold mb-1">Keyboard Shortcuts:</p>
        <ul className="space-y-1 text-xs">
          <li>Ctrl/Cmd + K: Focus search</li>
          <li>Esc: Close modal or sidebar</li>
          <li>Tab: Navigate between elements</li>
        </ul>
      </div>

      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 flex-1">
              {isMobile && (
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                  aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                  aria-expanded={sidebarOpen}
                  aria-controls="settings-navigation"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {sidebarOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
            </div>
            <div className="w-full max-w-md hidden md:block">
              <SettingsSearch onSearch={handleSearch} ref={searchInputRef} />
            </div>
          </div>
          {isMobile && (
            <div className="pb-4">
              <SettingsSearch onSearch={handleSearch} ref={searchInputRef} />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={mainContentRef}>
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          {isMobile ? (
            // Mobile: Collapsible navigation
            <>
              {sidebarOpen && (
                <>
                  {/* Backdrop */}
                  <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-20 transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                    aria-hidden="true"
                  />
                  {/* Sidebar */}
                  <nav
                    id="settings-navigation"
                    className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-xl z-30 overflow-y-auto transform transition-transform"
                    role="navigation"
                    aria-label="Settings navigation"
                  >
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Navigation</h2>
                        <button
                          onClick={() => setSidebarOpen(false)}
                          className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 min-h-[44px] min-w-[44px] focus:outline-none focus:ring-2 focus:ring-primary-500"
                          aria-label="Close navigation menu"
                        >
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <SettingsNavigation
                        activeSection={activeSection}
                        onSectionChange={onSectionChange}
                        userRole={userRole}
                        isMobile={true}
                      />
                    </div>
                  </nav>
                </>
              )}
            </>
          ) : (
            // Desktop: Always visible sidebar
            <aside className="w-64 flex-shrink-0" role="complementary" aria-label="Settings sections">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-24">
                <SettingsNavigation
                  activeSection={activeSection}
                  onSectionChange={onSectionChange}
                  userRole={userRole}
                  isMobile={false}
                />
              </div>
            </aside>
          )}

          {/* Content Area */}
          <main
            id="settings-content"
            className="flex-1 min-w-0"
            role="main"
            aria-label="Settings content"
            tabIndex={-1}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* ARIA live region for announcements */}
      <div
        id="aria-live-region"
        className="sr-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      />
    </div>
  )
}
