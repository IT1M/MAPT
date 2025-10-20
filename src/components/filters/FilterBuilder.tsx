'use client';

import React, { useState } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import {
  Filter,
  FilterGroup,
  FilterLogic,
  FilterFieldConfig,
} from '@/types/filters';
import {
  generateFilterId,
  getOperatorLabel,
  validateFilterValue,
} from '@/utils/filter-builder';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface FilterBuilderProps {
  filterGroup: FilterGroup;
  onChange: (filterGroup: FilterGroup) => void;
  fieldConfigs: FilterFieldConfig[];
  onApply?: () => void;
  onReset?: () => void;
}

export function FilterBuilder({
  filterGroup,
  onChange,
  fieldConfigs,
  onApply,
  onReset,
}: FilterBuilderProps) {
  const t = useTranslations('filters');

  const handleAddFilter = () => {
    const newFilter: Filter = {
      id: generateFilterId(),
      field: fieldConfigs[0]?.name || '',
      operator: 'equals',
      value: '',
    };

    onChange({
      ...filterGroup,
      filters: [...filterGroup.filters, newFilter],
    });
  };

  const handleRemoveFilter = (filterId: string) => {
    onChange({
      ...filterGroup,
      filters: filterGroup.filters.filter((f) => f.id !== filterId),
    });
  };

  const handleUpdateFilter = (filterId: string, updates: Partial<Filter>) => {
    onChange({
      ...filterGroup,
      filters: filterGroup.filters.map((f) =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    });
  };

  const handleLogicChange = (logic: FilterLogic) => {
    onChange({
      ...filterGroup,
      logic,
    });
  };

  const getFieldConfig = (fieldName: string): FilterFieldConfig | undefined => {
    return fieldConfigs.find((fc) => fc.name === fieldName);
  };

  return (
    <div className="space-y-4">
      {/* Logic Selector */}
      {filterGroup.filters.length > 1 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('matchLogic')}:
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleLogicChange('AND')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterGroup.logic === 'AND'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('and')}
            </button>
            <button
              type="button"
              onClick={() => handleLogicChange('OR')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                filterGroup.logic === 'OR'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {t('or')}
            </button>
          </div>
        </div>
      )}

      {/* Filter List */}
      <div className="space-y-3">
        {filterGroup.filters.map((filter, index) => {
          const fieldConfig = getFieldConfig(filter.field);
          const operators = fieldConfig?.operators || [];

          return (
            <div
              key={filter.id}
              className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              {/* Filter Number */}
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-primary-500 text-white text-xs font-semibold rounded-full mt-2">
                {index + 1}
              </div>

              {/* Filter Controls */}
              <div className="flex-1 space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {/* Field Selector */}
                  <Select
                    value={filter.field}
                    onChange={(e) => {
                      const newFieldConfig = getFieldConfig(e.target.value);
                      handleUpdateFilter(filter.id, {
                        field: e.target.value,
                        operator: newFieldConfig?.operators[0] || 'equals',
                        value: '',
                      });
                    }}
                    options={fieldConfigs.map((fc) => ({
                      value: fc.name,
                      label: fc.label,
                    }))}
                    aria-label={t('selectField')}
                  />

                  {/* Operator Selector */}
                  <Select
                    value={filter.operator}
                    onChange={(e) =>
                      handleUpdateFilter(filter.id, {
                        operator: e.target.value as any,
                        value: '',
                      })
                    }
                    options={operators.map((op) => ({
                      value: op,
                      label: getOperatorLabel(op),
                    }))}
                    aria-label={t('selectOperator')}
                  />

                  {/* Value Input */}
                  {filter.operator !== 'is_null' &&
                    filter.operator !== 'is_not_null' && (
                      <FilterValueInput
                        filter={filter}
                        fieldConfig={fieldConfig}
                        onChange={(value) =>
                          handleUpdateFilter(filter.id, { value })
                        }
                      />
                    )}
                </div>
              </div>

              {/* Remove Button */}
              <button
                type="button"
                onClick={() => handleRemoveFilter(filter.id)}
                className="flex-shrink-0 p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                aria-label={t('removeFilter')}
              >
                <svg
                  className="w-5 h-5"
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
          );
        })}
      </div>

      {/* Add Filter Button */}
      <Button
        type="button"
        variant="secondary"
        onClick={handleAddFilter}
        className="w-full"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        {t('addFilter')}
      </Button>

      {/* Action Buttons */}
      {(onApply || onReset) && (
        <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
          {onApply && (
            <Button
              type="button"
              variant="primary"
              onClick={onApply}
              className="flex-1"
            >
              {t('applyFilters')}
            </Button>
          )}
          {onReset && (
            <Button
              type="button"
              variant="secondary"
              onClick={onReset}
              className="flex-1"
            >
              {t('resetFilters')}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

interface FilterValueInputProps {
  filter: Filter;
  fieldConfig?: FilterFieldConfig;
  onChange: (value: any) => void;
}

function FilterValueInput({
  filter,
  fieldConfig,
  onChange,
}: FilterValueInputProps) {
  const t = useTranslations('filters');

  if (!fieldConfig) {
    return (
      <Input
        type="text"
        value={filter.value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('enterValue')}
      />
    );
  }

  // Handle between operator (two inputs)
  if (filter.operator === 'between') {
    const values = Array.isArray(filter.value) ? filter.value : ['', ''];
    return (
      <div className="flex gap-2">
        <Input
          type={
            fieldConfig.type === 'number'
              ? 'number'
              : fieldConfig.type === 'date'
                ? 'date'
                : 'text'
          }
          value={values[0] || ''}
          onChange={(e) => onChange([e.target.value, values[1]])}
          placeholder={t('from')}
        />
        <Input
          type={
            fieldConfig.type === 'number'
              ? 'number'
              : fieldConfig.type === 'date'
                ? 'date'
                : 'text'
          }
          value={values[1] || ''}
          onChange={(e) => onChange([values[0], e.target.value])}
          placeholder={t('to')}
        />
      </div>
    );
  }

  // Handle in/not_in operators (multi-select)
  if (filter.operator === 'in' || filter.operator === 'not_in') {
    if (fieldConfig.type === 'enum' && fieldConfig.enumValues) {
      const selectedValues = Array.isArray(filter.value) ? filter.value : [];
      return (
        <div className="space-y-1 max-h-32 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2">
          {fieldConfig.enumValues.map((enumVal) => (
            <label
              key={enumVal.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedValues.includes(enumVal.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedValues, enumVal.value]);
                  } else {
                    onChange(selectedValues.filter((v) => v !== enumVal.value));
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="text-sm">{enumVal.label}</span>
            </label>
          ))}
        </div>
      );
    }
  }

  // Handle enum type (single select)
  if (fieldConfig.type === 'enum' && fieldConfig.enumValues) {
    return (
      <Select
        value={filter.value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={[
          { value: '', label: t('selectValue') },
          ...fieldConfig.enumValues.map((ev) => ({
            value: ev.value,
            label: ev.label,
          })),
        ]}
      />
    );
  }

  // Handle boolean type
  if (fieldConfig.type === 'boolean') {
    return (
      <Select
        value={
          filter.value === true ? 'true' : filter.value === false ? 'false' : ''
        }
        onChange={(e) =>
          onChange(
            e.target.value === 'true'
              ? true
              : e.target.value === 'false'
                ? false
                : null
          )
        }
        options={[
          { value: '', label: t('selectValue') },
          { value: 'true', label: t('yes') },
          { value: 'false', label: t('no') },
        ]}
      />
    );
  }

  // Handle number type
  if (fieldConfig.type === 'number') {
    return (
      <Input
        type="number"
        value={filter.value || ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        placeholder={t('enterValue')}
      />
    );
  }

  // Handle date type
  if (fieldConfig.type === 'date') {
    return (
      <Input
        type="date"
        value={filter.value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('selectDate')}
      />
    );
  }

  // Default: text input
  return (
    <Input
      type="text"
      value={filter.value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={t('enterValue')}
    />
  );
}
