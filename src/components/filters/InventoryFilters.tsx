'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Destination, UserRole } from '@prisma/client'
import { getDateRangeForPreset, type DatePresetType } from '@/utils/datePresets'

// Filter state interface
export interface FilterState {
  search: string
  startDate: Date | null
  endDate: Date | null
  destinations: Destination[]
  categories: string[]
  rejectFilter: 'all' | 'none' | 'has' | 'high'
  enteredByIds: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

// User type for EnteredBy filter
export interface FilterUser {
  id: string
  name: string
  email: string
}

// Component props
export interface InventoryFiltersProps {
  filters: FilterState
  onFilterChange: (filters: Partial<FilterState>) => void
  onApply: () => void
  onReset: () => void
  activeFilterCount: number
  isOpen: boolean
  onToggle: () => void
  userRole: UserRole
  availableCategories?: string[]
  availableUsers?: FilterUser[]
  isLoading?: boolean
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
  filters,
  onFilterChange,
  onApply,
  onReset,
  activeFilterCount,
  isOpen,
  onToggle,
  userRole,
  availableCategories = [],
  availableUsers = [],
  isLoading = false,
}) => {
  const t = useTranslations('dataLog.filters')
  const tCommon = useTranslations('common')

  // Local state for debounced search
  const [searchInput, setSearchInput] = useState(filters.search)
  const [datePreset, setDatePreset] = useState<DatePresetType>('custom')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        onFilterChange({ search: searchInput })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchInput, filters.search, onFilterChange])

  // Sync search input with filters
  useEffect(() => {
    setSearchInput(filters.search)
  }, [filters.search])

  // Handle date preset selection
  const handleDatePresetChange = useCallback((preset: DatePresetType) => {
    setDatePreset(preset)
    if (preset === 'custom') {
      return
    }
    const range = getDateRangeForPreset(preset)
    if (range) {
      onFilterChange({
        startDate: range.startDate,
        endDate: range.endDate,
      })
    }
  }, [onFilterChange])

  // Handle destination toggle
  const handleDestinationToggle = useCallback((destination: Destination) => {
    const newDestinations = filters.destinations.includes(destination)
      ? filters.destinations.filter(d => d !== destination)
      : [...filters.destinations, destination]
    onFilterChange({ destinations: newDestinations })
  }, [filters.destinations, onFilterChange])

  // Handle category toggle
  const handleCategoryToggle = useCallback((category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    onFilterChange({ categories: newCategories })
  }, [filters.categories, onFilterChange])

  // Handle user toggle
  const handleUserToggle = useCallback((userId: string) => {
    const newUserIds = filters.enteredByIds.includes(userId)
      ? filters.enteredByIds.filter(id => id !== userId)
      : [...filters.enteredByIds, userId]
    onFilterChange({ enteredByIds: newUserIds })
  }, [filters.enteredByIds, onFilterChange])

  // Check if user can see EnteredBy filter
  const canViewEnteredByFilter = userRole === UserRole.ADMIN || userRole === UserRole.SUPERVISOR

  // Sort field options
  const sortFieldOptions = useMemo(() => [
    { value: 'createdAt', label: t('sortFields.createdAt') },
    { value: 'itemName', label: t('sortFields.itemName') },
    { value: 'quantity', label: t('sortFields.quantity') },
    { value: 'batch', label: t('sortFields.batch') },
  ], [t])

  // Sort order options
  const sortOrderOptions = useMemo(() => [
    { value: 'asc', label: t('ascending') },
    { value: 'desc', label: t('descending') },
  ], [t])

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-80' : 'w-0'}
        overflow-hidden
        md:relative fixed inset-y-0 left-0 z-40
        md:z-auto
      `}
      role="complementary"
      aria-label={t('title')}
    >
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 md:hidden z-30"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      {/* Filter content */}
      <div className="h-full overflow-y-auto p-4 space-y-6 relative z-40">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('title')}
          </h2>
          {activeFilterCount > 0 && (
            <span
              className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-500 rounded-full"
              aria-label={t('activeFilters', { count: activeFilterCount })}
            >
              {activeFilterCount}
            </span>
          )}
        </div>

        {/* Search Bar */}
        <div>
          <label
            htmlFor="filter-search"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            {t('search')}
          </label>
          <div className="relative">
            <Input
              id="filter-search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="pr-10"
              aria-label={t('search')}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={t('clearSearch')}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <svg className="animate-spin h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Date Range Picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('dateRange')}
          </label>
          
          {/* Date Presets */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {(['today', 'last7days', 'last30days', 'thisMonth'] as DatePresetType[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handleDatePresetChange(preset)}
                className={`
                  px-3 py-2 text-sm rounded-lg border transition-colors
                  ${datePreset === preset
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                  }
                `}
              >
                {t(`datePresets.${preset}`)}
              </button>
            ))}
          </div>

          {/* Custom Date Inputs */}
          <div className="space-y-3">
            <Input
              type="date"
              label={t('startDate')}
              value={filters.startDate ? filters.startDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setDatePreset('custom')
                onFilterChange({ startDate: e.target.value ? new Date(e.target.value) : null })
              }}
            />
            <Input
              type="date"
              label={t('endDate')}
              value={filters.endDate ? filters.endDate.toISOString().split('T')[0] : ''}
              onChange={(e) => {
                setDatePreset('custom')
                onFilterChange({ endDate: e.target.value ? new Date(e.target.value) : null })
              }}
            />
          </div>

          {(filters.startDate || filters.endDate) && (
            <button
              type="button"
              onClick={() => {
                setDatePreset('custom')
                onFilterChange({ startDate: null, endDate: null })
              }}
              className="mt-2 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t('clearDateRange')}
            </button>
          )}
        </div>

        {/* Destination Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('destination')}
          </label>
          <div className="space-y-2">
            {Object.values(Destination).map((destination) => (
              <label
                key={destination}
                className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.destinations.includes(destination)}
                  onChange={() => handleDestinationToggle(destination)}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {destination === Destination.MAIS ? 'Mais' : 'Fozan'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        {availableCategories.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('category')}
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              {availableCategories.map((category) => (
                <label
                  key={category}
                  className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {category}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Reject Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('rejectFilter')}
          </label>
          <div className="space-y-2">
            {(['all', 'none', 'has', 'high'] as const).map((option) => (
              <label
                key={option}
                className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <input
                  type="radio"
                  name="rejectFilter"
                  checked={filters.rejectFilter === option}
                  onChange={() => onFilterChange({ rejectFilter: option })}
                  className="w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option === 'all' && t('allRejects')}
                  {option === 'none' && t('noRejects')}
                  {option === 'has' && t('hasRejects')}
                  {option === 'high' && t('highRejects')}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Entered By Filter (Role-based) */}
        {canViewEnteredByFilter && availableUsers.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('enteredBy')}
            </label>
            <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
              {availableUsers.map((user) => (
                <label
                  key={user.id}
                  className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={filters.enteredByIds.includes(user.id)}
                    onChange={() => handleUserToggle(user.id)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="space-y-3">
          <Select
            label={t('sortBy')}
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            options={sortFieldOptions}
          />
          <Select
            label={t('sortOrder')}
            value={filters.sortOrder}
            onChange={(e) => onFilterChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
            options={sortOrderOptions}
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            variant="primary"
            className="w-full"
            onClick={onApply}
            disabled={isLoading}
          >
            {t('applyFilters')}
          </Button>
          <Button
            variant="secondary"
            className="w-full"
            onClick={onReset}
            disabled={isLoading || activeFilterCount === 0}
          >
            {t('resetAll')}
          </Button>
        </div>
      </div>
    </div>
  )
}
