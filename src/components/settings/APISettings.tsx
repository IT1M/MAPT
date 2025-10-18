'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { GeminiConfig } from './GeminiConfig'
import { DatabaseStatus } from './DatabaseStatus'
import { GeminiConfiguration, DatabaseInfo, ValidationResult } from '@/types/settings'

export function APISettings() {
  const t = useTranslations('settings')
  const [geminiConfig, setGeminiConfig] = useState<GeminiConfiguration | null>(null)
  const [databaseInfo, setDatabaseInfo] = useState<DatabaseInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load Gemini configuration from settings
      const settingsResponse = await fetch('/api/settings')
      if (!settingsResponse.ok) {
        throw new Error('Failed to load settings')
      }

      const settingsData = await settingsResponse.json()
      
      // Extract Gemini configuration from settings
      const apiSettings = settingsData.data?.settings?.api || []
      
      const config: GeminiConfiguration = {
        apiKey: apiSettings.find((s: any) => s.key === 'gemini_api_key')?.value || '',
        model: apiSettings.find((s: any) => s.key === 'gemini_model')?.value || 'gemini-pro',
        temperature: parseFloat(apiSettings.find((s: any) => s.key === 'gemini_temperature')?.value || '0.7'),
        maxTokens: parseInt(apiSettings.find((s: any) => s.key === 'gemini_max_tokens')?.value || '2048'),
        cacheInsightsDuration: parseInt(apiSettings.find((s: any) => s.key === 'gemini_cache_duration')?.value || '30'),
        features: {
          insights: apiSettings.find((s: any) => s.key === 'ai_insights_enabled')?.value === true,
          predictiveAnalytics: apiSettings.find((s: any) => s.key === 'ai_predictive_enabled')?.value === true,
          naturalLanguageQueries: apiSettings.find((s: any) => s.key === 'ai_nlq_enabled')?.value === true,
        },
      }

      setGeminiConfig(config)

      // Load database status
      const dbResponse = await fetch('/api/settings/database/status')
      if (dbResponse.ok) {
        const dbData = await dbResponse.json()
        setDatabaseInfo(dbData.data)
      }
    } catch (err) {
      console.error('Failed to load API settings:', err)
      setError('Failed to load settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGeminiUpdate = async (updates: Partial<GeminiConfiguration>) => {
    if (!geminiConfig) return

    try {
      const settingsToUpdate = []

      if (updates.apiKey !== undefined) {
        settingsToUpdate.push({ key: 'gemini_api_key', value: updates.apiKey })
      }
      if (updates.model !== undefined) {
        settingsToUpdate.push({ key: 'gemini_model', value: updates.model })
      }
      if (updates.temperature !== undefined) {
        settingsToUpdate.push({ key: 'gemini_temperature', value: updates.temperature })
      }
      if (updates.maxTokens !== undefined) {
        settingsToUpdate.push({ key: 'gemini_max_tokens', value: updates.maxTokens })
      }
      if (updates.cacheInsightsDuration !== undefined) {
        settingsToUpdate.push({ key: 'gemini_cache_duration', value: updates.cacheInsightsDuration })
      }
      if (updates.features !== undefined) {
        settingsToUpdate.push({ key: 'ai_insights_enabled', value: updates.features.insights })
        settingsToUpdate.push({ key: 'ai_predictive_enabled', value: updates.features.predictiveAnalytics })
        settingsToUpdate.push({ key: 'ai_nlq_enabled', value: updates.features.naturalLanguageQueries })
      }

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      // Update local state
      setGeminiConfig({ ...geminiConfig, ...updates })
    } catch (err) {
      console.error('Failed to update Gemini config:', err)
      throw err
    }
  }

  const handleValidate = async (): Promise<ValidationResult> => {
    if (!geminiConfig) {
      return {
        valid: false,
        message: 'Configuration not loaded',
      }
    }

    try {
      const response = await fetch('/api/settings/gemini/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey: geminiConfig.apiKey }),
      })

      if (!response.ok) {
        throw new Error('Validation request failed')
      }

      const data = await response.json()
      
      // Update usage stats if available
      if (data.data?.usage) {
        setGeminiConfig({
          ...geminiConfig,
          usage: data.data.usage,
        })
      }

      return data.data?.validation || {
        valid: false,
        message: 'Validation failed',
      }
    } catch (err) {
      console.error('Validation error:', err)
      return {
        valid: false,
        message: 'Failed to validate API key. Please try again.',
      }
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{error}</h3>
            <button
              onClick={loadData}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
            >
              {t('common.retry')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('api.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('api.description')}
        </p>
      </div>

      {geminiConfig && (
        <GeminiConfig
          config={geminiConfig}
          onUpdate={handleGeminiUpdate}
          onValidate={handleValidate}
        />
      )}

      {databaseInfo && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('database.title')}
          </h2>
          <DatabaseStatus status={databaseInfo} />
        </div>
      )}
    </div>
  )
}
