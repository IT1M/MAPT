/**
 * Example: How to integrate AppearanceSettings into your settings page
 *
 * This file demonstrates the proper way to use the AppearanceSettings component
 * in a settings page with navigation and other sections.
 */

'use client';

import React, { useState } from 'react';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { SecuritySettings } from '@/components/settings/SecuritySettings';

type SettingsSection = 'profile' | 'security' | 'appearance' | 'notifications';

export default function SettingsPageExample() {
  const [activeSection, setActiveSection] =
    useState<SettingsSection>('appearance');

  const sections = [
    { id: 'profile' as const, label: 'Profile', icon: '👤' },
    { id: 'security' as const, label: 'Security', icon: '🔒' },
    { id: 'appearance' as const, label: 'Appearance', icon: '🎨' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Sidebar Navigation */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-2">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${
                      activeSection === section.id
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="text-xl">{section.icon}</span>
                  <span>{section.label}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeSection === 'appearance' && <AppearanceSettings />}
            {activeSection === 'profile' && (
              <div className="text-gray-600 dark:text-gray-400">
                Profile settings would go here
              </div>
            )}
            {activeSection === 'security' && (
              <div className="text-gray-600 dark:text-gray-400">
                Security settings would go here
              </div>
            )}
            {activeSection === 'notifications' && (
              <div className="text-gray-600 dark:text-gray-400">
                Notification settings would go here
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Standalone usage
 *
 * You can also use AppearanceSettings as a standalone component
 * on its own page or in a modal.
 */
export function StandaloneAppearanceExample() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <AppearanceSettings />
    </div>
  );
}

/**
 * Alternative: With custom wrapper
 *
 * You can wrap AppearanceSettings with your own layout and styling
 */
export function CustomWrapperExample() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Customize Your Experience
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Make the interface your own with these personalization options
            </p>
          </div>

          <AppearanceSettings />
        </div>
      </div>
    </div>
  );
}

/**
 * Alternative: Programmatic control
 *
 * You can also control the appearance settings programmatically
 * using the useUserPreferences hook directly
 */
export function ProgrammaticControlExample() {
  const { preferences, updatePreferences } = useUserPreferences();

  const quickActions = [
    {
      label: 'Dark Mode',
      action: () => updatePreferences({ theme: 'dark' }),
    },
    {
      label: 'Light Mode',
      action: () => updatePreferences({ theme: 'light' }),
    },
    {
      label: 'Compact View',
      action: () => updatePreferences({ uiDensity: 'compact' }),
    },
    {
      label: 'Spacious View',
      action: () => updatePreferences({ uiDensity: 'spacious' }),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={action.action}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {action.label}
          </button>
        ))}
      </div>

      <AppearanceSettings />
    </div>
  );
}

// Import statement needed for the programmatic example
import { useUserPreferences } from '@/hooks/useUserPreferences';
