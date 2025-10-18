'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { CompanyInfo } from './CompanyInfo'
import { InventorySettings } from './InventorySettings'
import { BackupConfig } from './BackupConfig'
import { SystemLimits } from './SystemLimits'
import { DeveloperSettings } from './DeveloperSettings'

type SystemPreferencesTab = 'company' | 'inventory' | 'backup' | 'limits' | 'developer'

export function SystemPreferences() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<SystemPreferencesTab>('company')

  // Check if user has access (ADMIN or MANAGER)
  const hasAccess = session?.user?.role === 'ADMIN' || session?.user?.role === 'MANAGER'
  const isAdmin = session?.user?.role === 'ADMIN'

  if (!hasAccess) {
    return (
      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-400">
          You do not have permission to access system preferences. This section is only available to administrators and managers.
        </p>
      </div>
    )
  }

  const tabs = [
    { id: 'company' as const, label: 'Company Info', icon: '🏢' },
    { id: 'inventory' as const, label: 'Inventory', icon: '📦' },
    { id: 'backup' as const, label: 'Backup', icon: '💾' },
    { id: 'limits' as const, label: 'System Limits', icon: '⚙️' },
    ...(isAdmin ? [{ id: 'developer' as const, label: 'Developer', icon: '🔧' }] : []),
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          System Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
              `}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'company' && <CompanyInfo />}
        {activeTab === 'inventory' && <InventorySettings />}
        {activeTab === 'backup' && <BackupConfig />}
        {activeTab === 'limits' && <SystemLimits />}
        {activeTab === 'developer' && isAdmin && <DeveloperSettings />}
      </div>
    </div>
  )
}
