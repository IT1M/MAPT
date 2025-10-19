'use client'

import React, { useState } from 'react'
import { useTranslations } from '@/hooks/useTranslations'
import { SavedFilterData, FilterGroup } from '@/types/filters'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from '@/utils/toast'

interface SavedFiltersManagerProps {
  savedFilters: SavedFilterData[]
  currentPage: string
  onLoad: (filterGroup: FilterGroup) => void
  onSave: (name: string, filterGroup: FilterGroup, isDefault: boolean) => Promise<void>
  onDelete: (filterId: string) => Promise<void>
  onSetDefault: (filterId: string) => Promise<void>
  currentFilterGroup: FilterGroup
}

export function SavedFiltersManager({
  savedFilters,
  currentPage,
  onLoad,
  onSave,
  onDelete,
  onSetDefault,
  currentFilterGroup,
}: SavedFiltersManagerProps) {
  const t = useTranslations('filters')
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [filterName, setFilterName] = useState('')
  const [setAsDefault, setSetAsDefault] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const pageFilters = savedFilters.filter(f => f.page === currentPage)

  const handleSave = async () => {
    if (!filterName.trim()) {
      toast.error(t('errors.nameRequired'))
      return
    }

    setIsSaving(true)
    try {
      await onSave(filterName.trim(), currentFilterGroup, setAsDefault)
      toast.success(t('success.filterSaved'))
      setShowSaveModal(false)
      setFilterName('')
      setSetAsDefault(false)
    } catch (error) {
      toast.error(t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (filterId: string, filterName: string) => {
    if (!confirm(t('confirmDelete', { name: filterName }))) {
      return
    }

    try {
      await onDelete(filterId)
      toast.success(t('success.filterDeleted'))
    } catch (error) {
      toast.error(t('errors.deleteFailed'))
    }
  }

  const handleSetDefault = async (filterId: string) => {
    try {
      await onSetDefault(filterId)
      toast.success(t('success.defaultSet'))
    } catch (error) {
      toast.error(t('errors.setDefaultFailed'))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          {t('savedFilters')}
        </h3>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => setShowSaveModal(true)}
          disabled={currentFilterGroup.filters.length === 0}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          {t('saveFilter')}
        </Button>
      </div>

      {/* Saved Filters List */}
      {pageFilters.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <p className="text-sm">{t('noSavedFilters')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {pageFilters.map(filter => (
            <div
              key={filter.id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              {/* Filter Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {filter.name}
                  </h4>
                  {filter.isDefault && (
                    <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded">
                      {t('default')}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('filterCount', { count: filter.filters.filters?.length || 0 })}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onLoad(filter.filters)}
                  className="p-2 text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                  title={t('loadFilter')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </button>

                {!filter.isDefault && (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(filter.id)}
                    className="p-2 text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                    title={t('setAsDefault')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(filter.id, filter.name)}
                  className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                  title={t('deleteFilter')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('saveFilterTitle')}
            </h3>

            <div className="space-y-4">
              <Input
                label={t('filterName')}
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder={t('filterNamePlaceholder')}
                autoFocus
              />

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={setAsDefault}
                  onChange={(e) => setSetAsDefault(e.target.checked)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {t('setAsDefaultFilter')}
                </span>
              </label>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowSaveModal(false)
                  setFilterName('')
                  setSetAsDefault(false)
                }}
                className="flex-1"
                disabled={isSaving}
              >
                {t('cancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleSave}
                className="flex-1"
                disabled={isSaving || !filterName.trim()}
              >
                {isSaving ? t('saving') : t('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
