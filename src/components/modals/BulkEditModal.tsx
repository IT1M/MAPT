'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Destination } from '@prisma/client'
import type { InventoryItemWithUser } from '@/types'

interface BulkEditModalProps {
  items: InventoryItemWithUser[]
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface BulkEditFields {
  destination?: Destination
  category?: string
  notes?: string
}

interface BulkEditResult {
  successful: number
  failed: number
  errors: string[]
}

export function BulkEditModal({
  items,
  isOpen,
  onClose,
  onSuccess,
}: BulkEditModalProps) {
  const t = useTranslations()
  const [fields, setFields] = useState<BulkEditFields>({})
  const [notesMode, setNotesMode] = useState<'replace' | 'append'>('replace')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState<number>(0)
  const [result, setResult] = useState<BulkEditResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFieldChange = (field: keyof BulkEditFields, value: any) => {
    setFields(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate at least one field is selected
    if (!fields.destination && !fields.category && !fields.notes) {
      setError('Please select at least one field to update')
      return
    }

    setError(null)
    setLoading(true)
    setProgress(0)
    setResult(null)

    try {
      // Prepare update data
      const updates: any = {}
      if (fields.destination) updates.destination = fields.destination
      if (fields.category) updates.category = fields.category
      if (fields.notes) {
        updates.notes = fields.notes
        updates.notesMode = notesMode
      }

      const response = await fetch('/api/inventory/bulk-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ids: items.map((item) => item.id),
          updates,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to update items')
      }

      setProgress(100)
      setResult({
        successful: data.data.updatedCount || 0,
        failed: data.data.failedCount || 0,
        errors: data.data.errors || []
      })

      // If all successful, close after a short delay
      if (data.data.failedCount === 0) {
        setTimeout(() => {
          onSuccess()
          handleClose()
        }, 1500)
      }
    } catch (err) {
      console.error('Bulk edit error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFields({})
      setNotesMode('replace')
      setError(null)
      setProgress(0)
      setResult(null)
      setShowPreview(false)
      onClose()
    }
  }

  // Get unique categories from selected items
  const uniqueCategories = Array.from(
    new Set(items.map(item => item.category).filter(Boolean))
  ) as string[]

  // Count items by destination
  const destinationCounts = items.reduce((acc, item) => {
    acc[item.destination] = (acc[item.destination] || 0) + 1
    return acc
  }, {} as Record<Destination, number>)

  const hasSelectedFields = fields.destination || fields.category || fields.notes

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Edit Items"
      size="large"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Info Section */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                Editing {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Select the fields you want to update. Only selected fields will be modified.
              </p>
            </div>
          </div>
        </div>

        {/* Field Selection */}
        <div className="space-y-4">
          {/* Destination */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fields.destination !== undefined}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFields(prev => ({ ...prev, destination: Destination.MAIS }))
                  } else {
                    setFields(prev => {
                      const { destination, ...rest } = prev
                      return rest
                    })
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Destination
              </span>
            </label>
            
            {fields.destination !== undefined && (
              <div className="ml-6">
                <select
                  name="destination"
                  value={fields.destination}
                  onChange={(e) => handleFieldChange('destination', e.target.value as Destination)}
                  disabled={loading}
                  required
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value={Destination.MAIS}>MAIS</option>
                  <option value={Destination.FOZAN}>FOZAN</option>
                </select>
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Current: {Object.entries(destinationCounts).map(([dest, count]) => 
                    `${dest} (${count})`
                  ).join(', ')}
                </div>
              </div>
            )}
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fields.category !== undefined}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFields(prev => ({ ...prev, category: '' }))
                  } else {
                    setFields(prev => {
                      const { category, ...rest } = prev
                      return rest
                    })
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Category
              </span>
            </label>
            
            {fields.category !== undefined && (
              <div className="ml-6">
                <input
                  type="text"
                  value={fields.category || ''}
                  onChange={(e) => handleFieldChange('category', e.target.value)}
                  placeholder="Enter category"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  disabled={loading}
                  list="category-suggestions"
                />
                {uniqueCategories.length > 0 && (
                  <datalist id="category-suggestions">
                    {uniqueCategories.map(cat => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fields.notes !== undefined}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFields(prev => ({ ...prev, notes: '' }))
                  } else {
                    setFields(prev => {
                      const { notes, ...rest } = prev
                      return rest
                    })
                  }
                }}
                className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Update Notes
              </span>
            </label>
            
            {fields.notes !== undefined && (
              <div className="ml-6 space-y-2">
                <div className="flex gap-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="notesMode"
                      value="replace"
                      checked={notesMode === 'replace'}
                      onChange={(e) => setNotesMode(e.target.value as 'replace' | 'append')}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Replace</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="notesMode"
                      value="append"
                      checked={notesMode === 'append'}
                      onChange={(e) => setNotesMode(e.target.value as 'replace' | 'append')}
                      className="h-4 w-4 border-gray-300 text-primary-600 focus:ring-primary-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Append</span>
                  </label>
                </div>
                <textarea
                  value={fields.notes || ''}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder={notesMode === 'append' ? 'Text to append to existing notes' : 'New notes (will replace existing)'}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  disabled={loading}
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview Section */}
        {hasSelectedFields && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Items to Update ({items.length})
              </h4>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
              >
                {showPreview ? 'Hide' : 'Show'} Preview
              </button>
            </div>
            
            {showPreview && (
              <div className="max-h-60 overflow-y-auto space-y-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                {items.slice(0, 20).map((item) => (
                  <div
                    key={item.id}
                    className="text-sm text-gray-700 dark:text-gray-300 flex items-center justify-between py-1.5 px-2 bg-white dark:bg-gray-900 rounded"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-medium truncate">{item.itemName}</span>
                      <span className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                        {item.batch}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {fields.destination && (
                        <span className="text-gray-500 dark:text-gray-400">
                          {item.destination} → {fields.destination}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {items.length > 20 && (
                  <div className="text-sm text-gray-500 dark:text-gray-400 italic text-center pt-2">
                    and {items.length - 20} more...
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Progress Bar */}
        {loading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Updating items...</span>
              <span className="text-gray-500 dark:text-gray-400">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Result Summary */}
        {result && (
          <div className={`rounded-lg p-4 ${
            result.failed === 0
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start gap-3">
              <svg
                className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  result.failed === 0
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-yellow-600 dark:text-yellow-400'
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={result.failed === 0
                    ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  }
                />
              </svg>
              <div className="flex-1">
                <p className={`text-sm font-medium mb-1 ${
                  result.failed === 0
                    ? 'text-green-900 dark:text-green-100'
                    : 'text-yellow-900 dark:text-yellow-100'
                }`}>
                  {result.failed === 0
                    ? `Successfully updated ${result.successful} ${result.successful === 1 ? 'item' : 'items'}`
                    : `Updated ${result.successful} items, ${result.failed} failed`
                  }
                </p>
                {result.errors.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.errors.slice(0, 5).map((error, idx) => (
                      <p key={idx} className="text-xs text-yellow-700 dark:text-yellow-300">
                        • {error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 italic">
                        and {result.errors.length - 5} more errors...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
          >
            {result ? 'Close' : 'Cancel'}
          </Button>
          {!result && (
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !hasSelectedFields}
              loading={loading}
            >
              Update {items.length} {items.length === 1 ? 'Item' : 'Items'}
            </Button>
          )}
        </div>
      </form>
    </Modal>
  )
}
