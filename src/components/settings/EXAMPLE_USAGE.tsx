/**
 * EXAMPLE: Settings Page Integration
 * 
 * This file demonstrates how to integrate the settings infrastructure
 * into your application. Copy and adapt this code to your settings page.
 */

'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { SettingsLayout, SettingsContent } from '@/components/settings'
import type { SettingsSection } from '@/types/settings'

export default function SettingsPageExample() {
  const { data: session } = useSession()
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  // Redirect if not authenticated
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Authentication Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please log in to access settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <SettingsLayout
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      userRole={session.user.role}
    >
      {/* 
        Replace SettingsContent with actual section components as they are implemented:
        
        {activeSection === 'profile' && <ProfileSettings />}
        {activeSection === 'security' && <SecuritySettings />}
        {activeSection === 'users' && <UserManagement />}
        {activeSection === 'appearance' && <AppearanceSettings />}
        {activeSection === 'notifications' && <NotificationSettings />}
        {activeSection === 'api' && <APISettings />}
        {activeSection === 'system' && <SystemPreferences />}
      */}
      <SettingsContent section={activeSection} />
    </SettingsLayout>
  )
}

/**
 * EXAMPLE: Using Auto-Save Hook
 */
/*
import { useAutoSave } from '@/hooks/useAutoSave'

function ProfileFormExample() {
  const [profile, setProfile] = useState({
    name: 'John Doe',
    email: 'john@example.com',
    department: 'IT',
  })

  const { status, error } = useAutoSave({
    data: profile,
    onSave: async (data) => {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to save')
    },
    delay: 500,
    enabled: true,
  })

  return (
    <div className="space-y-4">
      <input
        value={profile.name}
        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
        className="w-full px-3 py-2 border rounded"
      />
      
      <div className="flex items-center gap-2">
        {status === 'saving' && (
          <span className="text-sm text-gray-500">Saving...</span>
        )}
        {status === 'saved' && (
          <span className="text-sm text-green-600">✓ Saved</span>
        )}
        {status === 'error' && (
          <span className="text-sm text-red-600">Error: {error}</span>
        )}
      </div>
    </div>
  )
}
*/

/**
 * EXAMPLE: Using User Preferences Hook
 */
/*
import { useUserPreferences } from '@/hooks/useUserPreferences'

function ThemeSelectorExample() {
  const { preferences, updatePreferences, isLoading } = useUserPreferences()

  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    try {
      await updatePreferences({ theme })
      // Apply theme to document
      if (theme === 'dark') {
        document.documentElement.classList.add('dark')
      } else if (theme === 'light') {
        document.documentElement.classList.remove('dark')
      } else {
        // System preference
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        document.documentElement.classList.toggle('dark', isDark)
      }
    } catch (error) {
      console.error('Failed to update theme:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>

  return (
    <div className="space-y-2">
      <button
        onClick={() => handleThemeChange('light')}
        className={`px-4 py-2 rounded ${
          preferences.theme === 'light' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Light
      </button>
      <button
        onClick={() => handleThemeChange('dark')}
        className={`px-4 py-2 rounded ${
          preferences.theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => handleThemeChange('system')}
        className={`px-4 py-2 rounded ${
          preferences.theme === 'system' ? 'bg-blue-500 text-white' : 'bg-gray-200'
        }`}
      >
        System
      </button>
    </div>
  )
}
*/

/**
 * EXAMPLE: Using Settings Hook
 */
/*
import { useSettings } from '@/hooks/useSettings'

function SystemLimitsExample() {
  const { settings, updateSettings, isLoading, error } = useSettings<{
    maxItemsPerUserPerDay: number
    maxFileUploadSizeMB: number
    sessionTimeoutMinutes: number
  }>({ category: 'limits' })

  const handleUpdate = async (key: string, value: number) => {
    try {
      await updateSettings({ [key]: value })
    } catch (error) {
      console.error('Failed to update settings:', error)
    }
  }

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!settings) return <div>No settings found</div>

  return (
    <div className="space-y-4">
      <div>
        <label>Max Items Per User Per Day</label>
        <input
          type="number"
          value={settings.maxItemsPerUserPerDay}
          onChange={(e) => handleUpdate('maxItemsPerUserPerDay', Number(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label>Max File Upload Size (MB)</label>
        <input
          type="number"
          value={settings.maxFileUploadSizeMB}
          onChange={(e) => handleUpdate('maxFileUploadSizeMB', Number(e.target.value))}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
    </div>
  )
}
*/

/**
 * EXAMPLE: Form Validation
 */
/*
import { validateProfile, validatePasswordChange } from '@/utils/settings-validation'

function ProfileFormWithValidationExample() {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const result = validateProfile(formData)
    
    if (!result.success) {
      // Convert Zod errors to simple object
      const newErrors: Record<string, string> = {}
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0].toString()] = err.message
        }
      })
      setErrors(newErrors)
      return
    }
    
    // Submit valid data
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result.data),
      })
      if (!response.ok) throw new Error('Failed to save')
      alert('Profile updated!')
    } catch (error) {
      alert('Error saving profile')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Name</label>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.name && <p className="text-red-600 text-sm">{errors.name}</p>}
      </div>
      
      <div>
        <label>Phone Number</label>
        <input
          value={formData.phoneNumber}
          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
          className="w-full px-3 py-2 border rounded"
        />
        {errors.phoneNumber && <p className="text-red-600 text-sm">{errors.phoneNumber}</p>}
      </div>
      
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        Save
      </button>
    </form>
  )
}
*/
