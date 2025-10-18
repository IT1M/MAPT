/**
 * System Preferences Usage Example
 * 
 * This file demonstrates how to integrate the SystemPreferences component
 * into your settings page.
 */

import { SystemPreferences } from '@/components/settings'

/**
 * Example 1: Basic Usage
 * Simply import and use the component. It handles all routing,
 * access control, and state management internally.
 */
export function SettingsPageExample1() {
  return (
    <div className="container mx-auto px-4 py-8">
      <SystemPreferences />
    </div>
  )
}

/**
 * Example 2: With Custom Layout
 * Wrap the component in your custom layout
 */
export function SettingsPageExample2() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <SystemPreferences />
        </div>
      </div>
    </div>
  )
}

/**
 * Example 3: Individual Components
 * You can also use individual components if you need more control
 */
import {
  CompanyInfo,
  InventorySettings,
  BackupConfig,
  SystemLimits,
  DeveloperSettings,
} from '@/components/settings'

export function CustomSystemPreferencesPage() {
  return (
    <div className="space-y-8">
      {/* Company Information */}
      <section>
        <CompanyInfo onSave={(data) => console.log('Company info saved:', data)} />
      </section>

      {/* Inventory Settings */}
      <section>
        <InventorySettings onSave={(data) => console.log('Inventory settings saved:', data)} />
      </section>

      {/* Backup Configuration */}
      <section>
        <BackupConfig onSave={(data) => console.log('Backup config saved:', data)} />
      </section>

      {/* System Limits */}
      <section>
        <SystemLimits onSave={(data) => console.log('System limits saved:', data)} />
      </section>

      {/* Developer Settings (Admin only) */}
      <section>
        <DeveloperSettings onSave={(data) => console.log('Developer settings saved:', data)} />
      </section>
    </div>
  )
}

/**
 * Example 4: With Loading State
 * Show a loading state while checking permissions
 */
import { useSession } from 'next-auth/react'

export function SettingsPageExample4() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Please log in to access settings</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SystemPreferences />
    </div>
  )
}

/**
 * Example 5: In Next.js App Router
 * Use in a server component with proper authentication
 */
import { auth } from '@/services/auth'
import { redirect } from 'next/navigation'

export async function SystemPreferencesServerPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  // Check if user has access (Admin or Manager)
  const hasAccess = session.user.role === 'ADMIN' || session.user.role === 'MANAGER'

  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-400">
            You do not have permission to access system preferences.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SystemPreferences />
    </div>
  )
}

/**
 * API Usage Examples
 */

// Fetch all settings
async function fetchSettings() {
  const response = await fetch('/api/settings')
  const data = await response.json()
  
  if (data.success) {
    console.log('Settings:', data.data.settings)
    console.log('Categories:', data.data.categories)
  }
}

// Update settings
async function updateSettings() {
  const response = await fetch('/api/settings', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      settings: [
        { key: 'company_name', value: 'My Company' },
        { key: 'backup_enabled', value: true },
        { key: 'debug_mode', value: false },
      ],
    }),
  })

  const data = await response.json()
  
  if (data.success) {
    console.log('Settings updated:', data.data.settings)
  } else {
    console.error('Error:', data.error)
  }
}

// Export system logs (Admin only)
async function exportSystemLogs() {
  const response = await fetch('/api/settings/logs/export')
  
  if (response.ok) {
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } else {
    console.error('Failed to export logs')
  }
}

/**
 * TypeScript Type Examples
 */
import type {
  CompanyInformation,
  InventoryConfiguration,
  BackupConfiguration,
  SystemLimitsConfiguration,
  DeveloperConfiguration,
} from '@/types/settings'

// Example: Type-safe settings object
const companyInfo: CompanyInformation = {
  name: 'My Company',
  logo: 'data:image/png;base64,...',
  fiscalYearStart: 1, // January
  timezone: 'America/New_York',
}

const inventorySettings: InventoryConfiguration = {
  defaultDestination: 'MAIS',
  categoriesEnabled: true,
  predefinedCategories: ['Electronics', 'Furniture', 'Supplies'],
  autoBatchNumbers: true,
  batchNumberPattern: 'BATCH-{YYYY}-{####}',
  supervisorApproval: true,
  approvalThreshold: 1000,
}

const backupConfig: BackupConfiguration = {
  enabled: true,
  time: '02:00',
  retentionDays: 30,
  format: ['CSV', 'JSON'],
}

const systemLimits: SystemLimitsConfiguration = {
  maxItemsPerUserPerDay: 1000,
  maxFileUploadSizeMB: 10,
  sessionTimeoutMinutes: 60,
  maxLoginAttempts: 5,
  rateLimitPerMinute: 100,
}

const developerSettings: DeveloperConfiguration = {
  debugMode: false,
  logLevel: 'info',
  apiRateLimits: {
    perMinute: 60,
    perHour: 1000,
  },
}
