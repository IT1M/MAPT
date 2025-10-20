'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  FilterGroup,
  FilterFieldConfig,
  SavedFilterData,
} from '@/types/filters';
import { FilterBuilder } from './FilterBuilder';
import { SavedFiltersManager } from './SavedFiltersManager';
import { FilterSharing } from './FilterSharing';
import { Button } from '@/components/ui/button';
import { toast } from '@/utils/toast';

interface AdvancedFilterPanelProps {
  currentPage: string;
  fieldConfigs: FilterFieldConfig[];
  initialFilterGroup?: FilterGroup;
  onApply: (filterGroup: FilterGroup) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function AdvancedFilterPanel({
  currentPage,
  fieldConfigs,
  initialFilterGroup,
  onApply,
  isOpen,
  onToggle,
}: AdvancedFilterPanelProps) {
  const t = useTranslations('filters');
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(
    initialFilterGroup || { filters: [], logic: 'AND' }
  );
  const [savedFilters, setSavedFilters] = useState<SavedFilterData[]>([]);
  const [activeTab, setActiveTab] = useState<'builder' | 'saved' | 'share'>(
    'builder'
  );
  const [isLoading, setIsLoading] = useState(false);
  const [filterName, setFilterName] = useState('My Filter');

  // Load saved filters on mount
  useEffect(() => {
    loadSavedFilters();
  }, [currentPage]);

  // Load default filter if exists
  useEffect(() => {
    const defaultFilter = savedFilters.find(
      (f) => f.isDefault && f.page === currentPage
    );
    if (defaultFilter && filterGroup.filters.length === 0) {
      setFilterGroup(defaultFilter.filters);
    }
  }, [savedFilters, currentPage]);

  const loadSavedFilters = async () => {
    try {
      const response = await fetch(`/api/filters?page=${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        setSavedFilters(data.filters || []);
      }
    } catch (error) {
      console.error('Failed to load saved filters:', error);
    }
  };

  const handleApply = () => {
    onApply(filterGroup);
    toast.success(t('success.filtersApplied'));
  };

  const handleReset = () => {
    setFilterGroup({ filters: [], logic: 'AND' });
    onApply({ filters: [], logic: 'AND' });
    toast.success(t('success.filtersReset'));
  };

  const handleSaveFilter = async (
    name: string,
    filters: FilterGroup,
    isDefault: boolean
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          filters,
          page: currentPage,
          isDefault,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save filter');
      }

      await loadSavedFilters();
      setFilterName(name);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFilter = async (filterId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete filter');
      }

      await loadSavedFilters();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetDefault = async (filterId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to set default filter');
      }

      await loadSavedFilters();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadFilter = (filters: FilterGroup) => {
    setFilterGroup(filters);
    setActiveTab('builder');
  };

  const handleImportFilter = (filters: FilterGroup, name: string) => {
    setFilterGroup(filters);
    setFilterName(name);
    setActiveTab('builder');
  };

  const activeFilterCount = filterGroup.filters.length;

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out
        ${isOpen ? 'w-96' : 'w-0'}
        overflow-hidden
        md:relative fixed inset-y-0 left-0 z-40
        md:z-auto
      `}
      role="complementary"
      aria-label={t('advancedFilters')}
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
      <div className="h-full overflow-y-auto relative z-40">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {t('advancedFilters')}
            </h2>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-500 rounded-full">
                  {activeFilterCount}
                </span>
              )}
              <button
                type="button"
                onClick={onToggle}
                className="md:hidden p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label={t('close')}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setActiveTab('builder')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'builder'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('builder')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('saved')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'saved'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('saved')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('share')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === 'share'
                  ? 'bg-white dark:bg-gray-800 text-primary-600 dark:text-primary-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('share')}
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'builder' && (
            <FilterBuilder
              filterGroup={filterGroup}
              onChange={setFilterGroup}
              fieldConfigs={fieldConfigs}
              onApply={handleApply}
              onReset={handleReset}
            />
          )}

          {activeTab === 'saved' && (
            <SavedFiltersManager
              savedFilters={savedFilters}
              currentPage={currentPage}
              onLoad={handleLoadFilter}
              onSave={handleSaveFilter}
              onDelete={handleDeleteFilter}
              onSetDefault={handleSetDefault}
              currentFilterGroup={filterGroup}
            />
          )}

          {activeTab === 'share' && (
            <FilterSharing
              filterGroup={filterGroup}
              filterName={filterName}
              currentPage={currentPage}
              onImport={handleImportFilter}
            />
          )}
        </div>
      </div>
    </div>
  );
}
