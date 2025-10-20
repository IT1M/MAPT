'use client';

import React from 'react';
import type { SettingsSection } from '@/types/settings';

interface SettingsContentProps {
  section: SettingsSection;
}

export function SettingsContent({ section }: SettingsContentProps) {
  return (
    <div id="settings-content" className="p-6">
      {/* Placeholder content - will be replaced by actual section components */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            {getSectionTitle(section)}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {getSectionDescription(section)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
            Section Under Development
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This section will be implemented in the next tasks.
          </p>
        </div>
      </div>
    </div>
  );
}

function getSectionTitle(section: SettingsSection): string {
  const titles: Record<SettingsSection, string> = {
    profile: 'Profile Settings',
    security: 'Security Settings',
    users: 'User Management',
    appearance: 'Appearance',
    notifications: 'Notifications',
    api: 'API & Integrations',
    system: 'System Preferences',
  };
  return titles[section];
}

function getSectionDescription(section: SettingsSection): string {
  const descriptions: Record<SettingsSection, string> = {
    profile: 'Manage your personal information and avatar',
    security: 'Configure password, sessions, and security settings',
    users: 'Manage user accounts and permissions',
    appearance: 'Customize theme and UI preferences',
    notifications: 'Configure notification preferences',
    api: 'Manage API keys and integrations',
    system: 'Configure system-wide settings',
  };
  return descriptions[section];
}
