'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react'
import type { ColumnMapping, ParsedData } from '@/types/import'

interface ColumnMappingStepProps {
  parsedData: ParsedData
  initialMapping: ColumnMapping
  onComplete: (mapping: ColumnMapping) => void
  onBack: () => void
}

const REQUIRED_FIELDS = ['itemName', 'batch', 'quantity', 'destination']
const OPTIONAL_FIELDS = ['reject', 'category', 'notes']

export default function ColumnMappingStep({
  parsedData,
  initialMapping,
  onComplete,
  onBack,
}: ColumnMappingStepProps) {
  const t = useTranslations('import.mapping')
  const [mapping, setMapping] = useState<ColumnMapping>(initialMapping)
  const [autoDetected, setAutoDetected] = useState(false)

  // Auto-detect column mapping
  useEffect(() => {
    if (autoDetected) return

    const newMapping: ColumnMapping = {
      itemName: null,
      batch: null,
      quantity: null,
      reject: null,
      destination: null,
      category: null,
      notes: null,
    }

    const headers = parsedData.headers.map((h) => h.toLowerCase())

    // Auto-detect itemName
    const itemNameVariants = ['itemname', 'item_name', 'item name', 'name', 'product']
    for (const variant of itemNameVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.itemName = parsedData.headers[index]
        break
      }
    }

    // Auto-detect batch
    const batchVariants = ['batch', 'batch number', 'batch_number', 'batchnumber', 'lot']
    for (const variant of batchVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.batch = parsedData.headers[index]
        break
      }
    }

    // Auto-detect quantity
    const quantityVariants = ['quantity', 'qty', 'amount', 'count']
    for (const variant of quantityVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.quantity = parsedData.headers[index]
        break
      }
    }

    // Auto-detect reject
    const rejectVariants = ['reject', 'rejected', 'defect', 'defective']
    for (const variant of rejectVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.reject = parsedData.headers[index]
        break
      }
    }

    // Auto-detect destination
    const destinationVariants = ['destination', 'dest', 'location', 'site']
    for (const variant of destinationVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.destination = parsedData.headers[index]
        break
      }
    }

    // Auto-detect category
    const categoryVariants = ['category', 'cat', 'type', 'class']
    for (const variant of categoryVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.category = parsedData.headers[index]
        break
      }
    }

    // Auto-detect notes
    const notesVariants = ['notes', 'note', 'comments', 'comment', 'remarks', 'description']
    for (const variant of notesVariants) {
      const index = headers.findIndex((h) => h.includes(variant))
      if (index !== -1) {
        newMapping.notes = parsedData.headers[index]
        break
      }
    }

    setMapping(newMapping)
    setAutoDetected(true)
  }, [parsedData.headers, autoDetected])

  const handleMappingChange = useCallback((field: keyof ColumnMapping, value: string | null) => {
    setMapping((prev) => ({ ...prev, [field]: value }))
  }, [])

  const isValid = useCallback(() => {
    return REQUIRED_FIELDS.every((field) => mapping[field as keyof ColumnMapping] !== null)
  }, [mapping])

  const handleContinue = useCallback(() => {
    if (isValid()) {
      onComplete(mapping)
    }
  }, [isValid, mapping, onComplete])

  const getExampleValue = useCallback(
    (columnName: string | null) => {
      if (!columnName || parsedData.preview.length === 0) return null
      return parsedData.preview[0][columnName]
    },
    [parsedData.preview]
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {t('title')}
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{t('description')}</p>
      </div>

      {/* Mapping Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('systemField')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('fileColumn')}
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {t('exampleValue')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {[...REQUIRED_FIELDS, ...OPTIONAL_FIELDS].map((field) => {
              const isRequired = REQUIRED_FIELDS.includes(field)
              const selectedColumn = mapping[field as keyof ColumnMapping]
              const exampleValue = getExampleValue(selectedColumn)

              return (
                <tr key={field}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {t(`fields.${field}`)}
                      </span>
                      {isRequired ? (
                        <span className="text-xs text-red-600 dark:text-red-400">*</span>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({t('optional')})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="relative">
                      <select
                        value={selectedColumn || ''}
                        onChange={(e) =>
                          handleMappingChange(
                            field as keyof ColumnMapping,
                            e.target.value || null
                          )
                        }
                        className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent appearance-none"
                      >
                        <option value="">{t('selectColumn')}</option>
                        {parsedData.headers.map((header) => (
                          <option key={header} value={header}>
                            {header}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {exampleValue ? (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {String(exampleValue).substring(0, 50)}
                        {String(exampleValue).length > 50 ? '...' : ''}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Validation Status */}
      <div
        className={`flex items-start gap-3 p-4 rounded-lg ${
          isValid()
            ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
        }`}
      >
        {isValid() ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-200">
                {t('mappingComplete')}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                {t('allRequiredMapped')}
              </p>
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">
                {t('mappingIncomplete')}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {t('mapRequiredFields')}
              </p>
            </div>
          </>
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
          disabled={!isValid()}
          className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          {t('continue')}
        </button>
      </div>
    </div>
  )
}
