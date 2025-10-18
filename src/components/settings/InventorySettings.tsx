'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Destination } from '@prisma/client'
import { inventorySettingsSchema } from '@/utils/settings-validation'
import type { InventoryConfiguration } from '@/types/settings'

interface InventorySettingsProps {
  onSave?: (data: InventoryConfiguration) => void
}

export function InventorySettings({ onSave }: InventorySettingsProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [formData, setFormData] = useState<InventoryConfiguration>({
    defaultDestination: null,
    categoriesEnabled: false,
    predefinedCategories: [],
    autoBatchNumbers: false,
    batchNumberPattern: 'BATCH-{YYYY}-{####}',
    supervisorApproval: false,
    approvalThreshold: 0,
  })

  const [newCategory, setNewCategory] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch current settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/settings')
        
        if (!response.ok) {
          throw new Error('Failed to fetch settings')
        }

        const data = await response.json()
        
        if (data.success && data.data.settings) {
          const settings = data.data.settings
          
          // Extract inventory settings
          const inventorySettings: InventoryConfiguration = {
            defaultDestination: settings.inventory?.find((s: any) => s.key === 'default_destination')?.value || null,
            categoriesEnabled: settings.inventory?.find((s: any) => s.key === 'categories_enabled')?.value || false,
            predefinedCategories: settings.inventory?.find((s: any) => s.key === 'predefined_categories')?.value || [],
            autoBatchNumbers: settings.inventory?.find((s: any) => s.key === 'auto_batch_numbers')?.value || false,
            batchNumberPattern: settings.inventory?.find((s: any) => s.key === 'batch_number_pattern')?.value || 'BATCH-{YYYY}-{####}',
            supervisorApproval: settings.inventory?.find((s: any) => s.key === 'supervisor_approval')?.value || false,
            approvalThreshold: settings.inventory?.find((s: any) => s.key === 'approval_threshold')?.value || 0,
          }
          
          setFormData(inventorySettings)
        }
      } catch (err) {
        console.error('Error fetching settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to load settings')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const handleChange = (field: keyof InventoryConfiguration, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
    setSuccessMessage(null)
  }

  const handleAddCategory = () => {
    if (newCategory.trim() && !formData.predefinedCategories.includes(newCategory.trim())) {
      handleChange('predefinedCategories', [...formData.predefinedCategories, newCategory.trim()])
      setNewCategory('')
    }
  }

  const handleRemoveCategory = (category: string) => {
    handleChange(
      'predefinedCategories',
      formData.predefinedCategories.filter((c) => c !== category)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate form data
    const validation = inventorySettingsSchema.safeParse(formData)
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {}
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message
        }
      })
      setErrors(fieldErrors)
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      // Convert to settings format
      const settingsToUpdate = [
        { key: 'default_destination', value: formData.defaultDestination },
        { key: 'categories_enabled', value: formData.categoriesEnabled },
        { key: 'predefined_categories', value: formData.predefinedCategories },
        { key: 'auto_batch_numbers', value: formData.autoBatchNumbers },
        { key: 'batch_number_pattern', value: formData.batchNumberPattern },
        { key: 'supervisor_approval', value: formData.supervisorApproval },
        { key: 'approval_threshold', value: formData.approvalThreshold },
      ]

      const response = await fetch('/api/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ settings: settingsToUpdate }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message || 'Failed to update settings')
      }

      setSuccessMessage('Inventory settings updated successfully')
      onSave?.(formData)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading inventory settings...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Inventory Settings
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configure inventory management preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Default Destination */}
        <div>
          <label htmlFor="default-destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Default Destination
          </label>
          <select
            id="default-destination"
            value={formData.defaultDestination || ''}
            onChange={(e) => handleChange('defaultDestination', e.target.value || null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
          >
            <option value="">None</option>
            <option value={Destination.MAIS}>MAIS</option>
            <option value={Destination.FOZAN}>FOZAN</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Default destination for new inventory items
          </p>
        </div>

        {/* Categories Enabled */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="categories-enabled"
              type="checkbox"
              checked={formData.categoriesEnabled}
              onChange={(e) => handleChange('categoriesEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="categories-enabled" className="font-medium text-gray-700 dark:text-gray-300">
              Enable Categories
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Allow categorization of inventory items
            </p>
          </div>
        </div>

        {/* Predefined Categories */}
        {formData.categoriesEnabled && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Predefined Categories
            </label>
            <div className="mt-2 space-y-2">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  placeholder="Add category"
                  className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.predefinedCategories.map((category) => (
                  <span
                    key={category}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                  >
                    {category}
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category)}
                      className="ml-2 inline-flex items-center justify-center w-4 h-4 text-blue-600 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-100"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Auto-generate Batch Numbers */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="auto-batch"
              type="checkbox"
              checked={formData.autoBatchNumbers}
              onChange={(e) => handleChange('autoBatchNumbers', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="auto-batch" className="font-medium text-gray-700 dark:text-gray-300">
              Auto-generate Batch Numbers
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Automatically generate batch numbers for new items
            </p>
          </div>
        </div>

        {/* Batch Number Pattern */}
        {formData.autoBatchNumbers && (
          <div>
            <label htmlFor="batch-pattern" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Batch Number Pattern
            </label>
            <input
              type="text"
              id="batch-pattern"
              value={formData.batchNumberPattern}
              onChange={(e) => handleChange('batchNumberPattern', e.target.value)}
              placeholder="BATCH-{YYYY}-{####}"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Use {'{YYYY}'} for year, {'{MM}'} for month, {'{DD}'} for day, {'{####}'} for sequential number
            </p>
          </div>
        )}

        {/* Supervisor Approval */}
        <div className="flex items-start">
          <div className="flex items-center h-5">
            <input
              id="supervisor-approval"
              type="checkbox"
              checked={formData.supervisorApproval}
              onChange={(e) => handleChange('supervisorApproval', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
          </div>
          <div className="ml-3 text-sm">
            <label htmlFor="supervisor-approval" className="font-medium text-gray-700 dark:text-gray-300">
              Require Supervisor Approval
            </label>
            <p className="text-gray-500 dark:text-gray-400">
              Require supervisor approval for high-value items
            </p>
          </div>
        </div>

        {/* Approval Threshold */}
        {formData.supervisorApproval && (
          <div>
            <label htmlFor="approval-threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Approval Threshold
            </label>
            <input
              type="number"
              id="approval-threshold"
              value={formData.approvalThreshold}
              onChange={(e) => handleChange('approvalThreshold', parseInt(e.target.value) || 0)}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Items with quantity above this threshold require supervisor approval
            </p>
          </div>
        )}

        {/* Error/Success Messages */}
        {error && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {successMessage && (
          <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
            <p className="text-sm text-green-800 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
