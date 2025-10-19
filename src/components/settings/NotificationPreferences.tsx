'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from '@/hooks/useTranslations'

interface NotificationPreference {
  type: string
  label: string
  description: string
  email: boolean
  inApp: boolean
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
  {
    type: 'SYSTEM',
    label: 'System Updates',
    description: 'System maintenance, updates, and announcements',
    email: true,
    inApp: true
  },
  {
    type: 'ACTIVITY',
    label: 'Activity Notifications',
    description: 'Item additions, updates, and bulk operations',
    email: false,
    inApp: true
  },
  {
    type: 'APPROVAL',
    label: 'Approval Requests',
    description: 'Approval requests and decisions',
    email: true,
    inApp: true
  },
  {
    type: 'ALERT',
    label: 'Alerts',
    description: 'High reject rates, low stock, security alerts',
    email: true,
    inApp: true
  },
  {
    type: 'MENTION',
    label: 'Mentions',
    description: 'When someone mentions you in a comment',
    email: true,
    inApp: true
  }
]

interface QuietHours {
  enabled: boolean
  startTime: string
  endTime: string
}

export function NotificationPreferences() {
  const t = useTranslations()
  const [preferences, setPreferences] = useState<NotificationPreference[]>(DEFAULT_PREFERENCES)
  const [quietHours, setQuietHours] = useState<QuietHours>({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('notification-preferences')
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences(parsed.preferences || DEFAULT_PREFERENCES)
        setQuietHours(parsed.quietHours || quietHours)
      }
    } catch (error) {
      console.error('Failed to load notification preferences:', error)
    }
  }, [])

  const handleToggle = (index: number, field: 'email' | 'inApp') => {
    setPreferences(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: !updated[index][field] }
      return updated
    })
  }

  const handleQuietHoursToggle = () => {
    setQuietHours(prev => ({ ...prev, enabled: !prev.enabled }))
  }

  const handleQuietHoursChange = (field: 'startTime' | 'endTime', value: string) => {
    setQuietHours(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveMessage(null)

    try {
      // Save to localStorage
      localStorage.setItem('notification-preferences', JSON.stringify({
        preferences,
        quietHours
      }))

      // In a real implementation, you would also save to the backend
      // await fetch('/api/user/notification-preferences', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ preferences, quietHours })
      // })

      setSaveMessage({ type: 'success', text: 'Preferences saved successfully' })
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000)
    } catch (error) {
      console.error('Failed to save preferences:', error)
      setSaveMessage({ type: 'error', text: 'Failed to save preferences' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Notification Preferences
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Manage how you receive notifications for different types of events
        </p>
      </div>

      {/* Notification Types */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Notification Type
              </h3>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Email
              </h3>
            </div>
            <div className="text-center">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                In-App
              </h3>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {preferences.map((pref, index) => (
            <div key={pref.type} className="px-4 py-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {pref.label}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {pref.description}
                  </p>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggle(index, 'email')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      pref.email
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    role="switch"
                    aria-checked={pref.email}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pref.email ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => handleToggle(index, 'inApp')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      pref.inApp
                        ? 'bg-primary-600'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    role="switch"
                    aria-checked={pref.inApp}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        pref.inApp ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Quiet Hours
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Pause non-urgent notifications during specific hours
            </p>
          </div>
          <button
            onClick={handleQuietHoursToggle}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              quietHours.enabled
                ? 'bg-primary-600'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
            role="switch"
            aria-checked={quietHours.enabled}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                quietHours.enabled ? 'translate-x-6 rtl:-translate-x-6' : 'translate-x-1 rtl:-translate-x-1'
              }`}
            />
          </button>
        </div>

        {quietHours.enabled && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={quietHours.startTime}
                onChange={(e) => handleQuietHoursChange('startTime', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                End Time
              </label>
              <input
                type="time"
                value={quietHours.endTime}
                onChange={(e) => handleQuietHoursChange('endTime', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {saveMessage && (
            <p className={`text-sm ${
              saveMessage.type === 'success'
                ? 'text-green-600 dark:text-green-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {saveMessage.text}
            </p>
          )}
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}
