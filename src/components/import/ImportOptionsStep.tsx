'use client'

import { useState, useCallback } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { Settings, Info } from 'lucide-react'
import type { ImportOptions, ValidationError } from '@/types/import'

interface ImportOptionsStepProps {
  initialOptions: ImportOptions
  validationErrors: ValidationError[]
  onComplete: (options: ImportOptions) => void
  onBack: () => void
}

export default function ImportOptionsStep({
  initialOptions,
  validationErrors,
  onComplete,
  onBack,
}: ImportOptionsStepProps) {
  const t = useTranslations('import.options')
  const [options, setOptions] = useState<ImportOptions>(initialOptions)

  const handleContinue = useCallback(() => {
    onComplete(options)
  }, [options, onComplete])

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('title')}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>
      </div>

      <div className="space-y-6">
        {/* Duplicate Handling */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <label className="block text-sm font-medium text-gray-900 dark:text-white mb-4">
            {t('duplicateHandling.label')}
          </label>
          <div className="space-y-3">
            {(['skip', 'update', 'create'] as const).map((value) => (
              <label
                key={value}
                className="flex items-start gap-3 p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-teal-500 dark:hover:border-teal-500 transition-colors"
              >
                <input
                  type="radio"
                  name="duplicateHandling"
                  value={value}
                  checked={options.duplicateHandling === value}
                  onChange={(e) =>
                    setOptions({ ...options, duplicateHandling: e.target.value as any })
                  }
                  className="mt-1 w-4 h-4 text-teal-600 focus:ring-teal-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {t(`duplicateHandling.${value}.title`)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {t(`duplicateHandling.${value}.description`)}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Default Values */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
            {t('defaultValues.title')}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t('defaultValues.description')}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('defaultValues.destination')}
              </label>
              <select
                value={options.defaultDestination || ''}
                onChange={(e) =>
                  setOptions({
                    ...options,
                    defaultDestination: e.target.value ? (e.target.value as any) : undefined,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              >
                <option value="">{t('defaultValues.none')}</option>
                <option value="MAIS">MAIS</option>
                <option value="FOZAN">FOZAN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('defaultValues.category')}
              </label>
              <input
                type="text"
                value={options.defaultCategory || ''}
                onChange={(e) =>
                  setOptions({ ...options, defaultCategory: e.target.value || undefined })
                }
                placeholder={t('defaultValues.categoryPlaceholder')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Info about errors */}
        {validationErrors.length > 0 && (
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {t('errorInfo.title')}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                {t('errorInfo.description', { count: validationErrors.length })}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          {t('back')}
        </button>
        <button
          onClick={handleContinue}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          {t('continue')}
        </button>
      </div>
    </div>
  )
}
