'use client';

import React from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { Filter, FilterGroup, FilterFieldConfig } from '@/types/filters';
import { getOperatorLabel } from '@/utils/filter-builder';

interface FilterChipsProps {
  filterGroup: FilterGroup;
  fieldConfigs: FilterFieldConfig[];
  onRemoveFilter: (filterId: string) => void;
  onClearAll: () => void;
}

export function FilterChips({
  filterGroup,
  fieldConfigs,
  onRemoveFilter,
  onClearAll,
}: FilterChipsProps) {
  const t = useTranslations('filters');

  if (filterGroup.filters.length === 0) {
    return null;
  }

  const getFieldLabel = (fieldName: string): string => {
    const config = fieldConfigs.find((fc) => fc.name === fieldName);
    return config?.label || fieldName;
  };

  const getValueDisplay = (filter: Filter): string => {
    const config = fieldConfigs.find((fc) => fc.name === filter.field);

    if (filter.operator === 'is_null') {
      return t('isEmpty');
    }

    if (filter.operator === 'is_not_null') {
      return t('isNotEmpty');
    }

    if (filter.operator === 'between' && Array.isArray(filter.value)) {
      return `${filter.value[0]} - ${filter.value[1]}`;
    }

    if (
      (filter.operator === 'in' || filter.operator === 'not_in') &&
      Array.isArray(filter.value)
    ) {
      if (config?.type === 'enum' && config.enumValues) {
        const labels = filter.value.map((v) => {
          const enumVal = config.enumValues?.find((ev) => ev.value === v);
          return enumVal?.label || v;
        });
        return labels.join(', ');
      }
      return filter.value.join(', ');
    }

    if (config?.type === 'enum' && config.enumValues) {
      const enumVal = config.enumValues.find((ev) => ev.value === filter.value);
      return enumVal?.label || filter.value;
    }

    if (config?.type === 'boolean') {
      return filter.value ? t('yes') : t('no');
    }

    if (config?.type === 'date') {
      return new Date(filter.value).toLocaleDateString();
    }

    return String(filter.value);
  };

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {/* Logic Indicator */}
      {filterGroup.filters.length > 1 && (
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
          {filterGroup.logic}:
        </span>
      )}

      {/* Filter Chips */}
      {filterGroup.filters.map((filter, index) => (
        <div
          key={filter.id}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
        >
          <span className="font-medium">{getFieldLabel(filter.field)}</span>
          <span className="text-primary-600 dark:text-primary-400">
            {getOperatorLabel(filter.operator)}
          </span>
          {filter.operator !== 'is_null' &&
            filter.operator !== 'is_not_null' && (
              <span className="font-semibold">{getValueDisplay(filter)}</span>
            )}
          <button
            type="button"
            onClick={() => onRemoveFilter(filter.id)}
            className="ml-1 p-0.5 hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full transition-colors"
            aria-label={t('removeFilter')}
          >
            <svg
              className="w-3.5 h-3.5"
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
      ))}

      {/* Clear All Button */}
      <button
        type="button"
        onClick={onClearAll}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
      >
        <svg
          className="w-4 h-4"
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
        {t('clearAll')}
      </button>
    </div>
  );
}
