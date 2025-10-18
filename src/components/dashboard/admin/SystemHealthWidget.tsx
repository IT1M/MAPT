'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

interface SystemHealth {
  database: 'connected' | 'disconnected'
  geminiAI: 'active' | 'inactive'
  lastBackup: string | null
  storageUsed: number
  activeUsers: number
}

export function SystemHealthWidget() {
  const t = useTranslations()
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSystemHealth()
    const interval = setInterval(fetchSystemHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchSystemHealth = async () => {
    try {
      const response = await fetch('/api/dashboard/system-health')
      if (response.ok) {
        const data = await response.json()
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch system health:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!health) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <p className="text-gray-500 dark:text-gray-400">Failed to load system health</p>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    if (status === 'connected' || status === 'active') return 'text-green-600 dark:text-green-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getStatusIcon = (status: string) => {
    if (status === 'connected' || status === 'active') {
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          System Health
        </h3>
        <button
          onClick={fetchSystemHealth}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Refresh"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="space-y-4">
        {/* Database Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getStatusColor(health.database)}>
              {getStatusIcon(health.database)}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Database</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(health.database)}`}>
            {health.database === 'connected' ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        {/* Gemini AI Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={getStatusColor(health.geminiAI)}>
              {getStatusIcon(health.geminiAI)}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">Gemini AI</span>
          </div>
          <span className={`text-sm font-medium ${getStatusColor(health.geminiAI)}`}>
            {health.geminiAI === 'active' ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Last Backup */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-700 dark:text-gray-300">Last Backup</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {health.lastBackup ? new Date(health.lastBackup).toLocaleDateString() : 'Never'}
          </span>
        </div>

        {/* Storage Used */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Storage Used</span>
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {health.storageUsed}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                health.storageUsed > 80 ? 'bg-red-600' : 
                health.storageUsed > 60 ? 'bg-yellow-600' : 'bg-green-600'
              }`}
              style={{ width: `${health.storageUsed}%` }}
            />
          </div>
        </div>

        {/* Active Users */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-700 dark:text-gray-300">Active Users</span>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {health.activeUsers}
          </span>
        </div>
      </div>
    </div>
  )
}
