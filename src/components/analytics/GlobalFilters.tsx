'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslations } from '@/hooks/useTranslations';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Destination, UserRole } from '@prisma/client';
import {
  getDateRangeForPreset,
  type DatePresetType,
  getPresetLabel,
} from '@/utils/datePresets';
import { buildSearchParams } from '@/utils/urlParams';
import { useFilterPresets, type FilterPreset } from '@/hooks/useFilterPresets';

// Filter state interface for analytics
export interface AnalyticsFilterState {
  dateRange: {
    start: Date | null;
    end: Date | null;
    preset: DatePresetType;
  };
  destinations: Destination[];
  categories: string[];
  userIds: string[]; // Admin only
}

// User type for filter
export interface FilterUser {
  id: string;
  name: string;
  email: string;
}

// Component props
export interface GlobalFiltersProps {
  filters: AnalyticsFilterState;
  onChange: (filters: Partial<AnalyticsFilterState>) => void;
  onReset: () => void;
  userRole: UserRole;
  availableCategories?: string[];
  availableUsers?: FilterUser[];
  isLoading?: boolean;
  autoRefresh: boolean;
  onAutoRefreshChange: (enabled: boolean) => void;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onChange,
  onReset,
  userRole,
  availableCategories = [],
  availableUsers = [],
  isLoading = false,
  autoRefresh,
  onAutoRefreshChange,
  lastUpdated,
  onRefresh,
}) => {
  const t = useTranslations('analytics.filters');
  const tCommon = useTranslations('common');
  const tDatePresets = useTranslations('dataLog.filters.datePresets');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Filter presets hook
  const { presets, savePreset, loadPreset, deletePreset } = useFilterPresets();

  // Local state for preset management
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Debounce timer ref
  const debounceTimerRef = React.useRef<NodeJS.Timeout>();

  // Check if user can see user filter
  const canViewUserFilter = userRole === UserRole.ADMIN;

  // Date preset options for analytics (matching requirements: today, 7d, 30d, 90d, YTD, custom)
  const datePresetOptions: DatePresetType[] = useMemo(
    () => [
      'today',
      'last7days',
      'last30days',
      'last90days',
      'thisYear',
      'custom',
    ],
    []
  );

  // Handle date preset selection
  const handleDatePresetChange = useCallback(
    (preset: DatePresetType) => {
      if (preset === 'custom') {
        onChange({
          dateRange: {
            ...filters.dateRange,
            preset: 'custom',
          },
        });
        return;
      }

      const range = getDateRangeForPreset(preset);
      if (range) {
        onChange({
          dateRange: {
            start: range.startDate,
            end: range.endDate,
            preset,
          },
        });
      }
    },
    [filters.dateRange, onChange]
  );

  // Handle destination toggle
  const handleDestinationToggle = useCallback(
    (destination: Destination) => {
      const newDestinations = filters.destinations.includes(destination)
        ? filters.destinations.filter((d) => d !== destination)
        : [...filters.destinations, destination];
      onChange({ destinations: newDestinations });
    },
    [filters.destinations, onChange]
  );

  // Handle category toggle
  const handleCategoryToggle = useCallback(
    (category: string) => {
      const newCategories = filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category];
      onChange({ categories: newCategories });
    },
    [filters.categories, onChange]
  );

  // Handle user toggle
  const handleUserToggle = useCallback(
    (userId: string) => {
      const newUserIds = filters.userIds.includes(userId)
        ? filters.userIds.filter((id) => id !== userId)
        : [...filters.userIds, userId];
      onChange({ userIds: newUserIds });
    },
    [filters.userIds, onChange]
  );

  // Sync filters with URL query parameters (debounced)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const params = buildSearchParams({
        startDate: filters.dateRange.start,
        endDate: filters.dateRange.end,
        preset:
          filters.dateRange.preset !== 'custom'
            ? filters.dateRange.preset
            : undefined,
        destinations: filters.destinations,
        categories: filters.categories,
        userIds: canViewUserFilter ? filters.userIds : undefined,
      });

      const newUrl = `${pathname}?${params.toString()}`;
      router.replace(newUrl, { scroll: false });
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [filters, pathname, router, canViewUserFilter]);

  // Save current filters as preset
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return;

    const preset = savePreset(presetName, {
      search: '',
      startDate: filters.dateRange.start,
      endDate: filters.dateRange.end,
      destinations: filters.destinations,
      categories: filters.categories,
      rejectFilter: 'all',
      enteredByIds: filters.userIds,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });

    setSelectedPresetId(preset.id);
    setPresetName('');
    setShowPresetDialog(false);
  }, [presetName, filters, savePreset]);

  // Load a saved preset
  const handleLoadPreset = useCallback(
    (presetId: string) => {
      const preset = loadPreset(presetId);
      if (preset) {
        onChange({
          dateRange: {
            start: preset.filters.startDate,
            end: preset.filters.endDate,
            preset: 'custom',
          },
          destinations: preset.filters.destinations,
          categories: preset.filters.categories,
          userIds: preset.filters.enteredByIds,
        });
        setSelectedPresetId(presetId);
      }
    },
    [loadPreset, onChange]
  );

  // Format last updated time
  const formatLastUpdated = useCallback(() => {
    if (!lastUpdated) return tCommon('loading');

    const now = new Date();
    const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }, [lastUpdated, tCommon]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.destinations.length > 0 && filters.destinations.length < 2)
      count++;
    if (filters.categories.length > 0) count++;
    if (filters.userIds.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <div
      className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6"
      dir={pathname.includes('/ar/') ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('dateRange')}
          </h2>
          {activeFilterCount > 0 && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {activeFilterCount} active
            </span>
          )}
        </div>

        {/* Auto-refresh toggle */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => onAutoRefreshChange(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 dark:border-gray-600 dark:bg-gray-700"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Auto-refresh (60s)
            </span>
          </label>

          {/* Manual refresh button */}
          <Button
            variant="secondary"
            size="small"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label={tCommon('refresh')}
          >
            <svg
              className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </Button>
        </div>
      </div>

      {/* Last updated timestamp */}
      {lastUpdated && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {tCommon('updated')}: {formatLastUpdated()}
        </div>
      )}

      {/* Date Range Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {t('dateRange')}
        </label>

        <div className="grid grid-cols-2 gap-2 mb-3">
          {datePresetOptions.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => handleDatePresetChange(preset)}
              className={`
                px-3 py-2 text-sm rounded-lg border transition-colors
                ${
                  filters.dateRange.preset === preset
                    ? 'bg-primary-500 text-white border-primary-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }
              `}
            >
              {preset === 'last7days'
                ? '7d'
                : preset === 'last30days'
                  ? '30d'
                  : preset === 'last90days'
                    ? '90d'
                    : preset === 'thisYear'
                      ? 'YTD'
                      : tDatePresets(preset)}
            </button>
          ))}
        </div>

        {/* Custom Date Inputs */}
        <div className="space-y-3">
          <Input
            type="date"
            label="Start Date"
            value={
              filters.dateRange.start
                ? filters.dateRange.start.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              onChange({
                dateRange: {
                  ...filters.dateRange,
                  start: e.target.value ? new Date(e.target.value) : null,
                  preset: 'custom',
                },
              });
            }}
          />
          <Input
            type="date"
            label="End Date"
            value={
              filters.dateRange.end
                ? filters.dateRange.end.toISOString().split('T')[0]
                : ''
            }
            onChange={(e) => {
              onChange({
                dateRange: {
                  ...filters.dateRange,
                  end: e.target.value ? new Date(e.target.value) : null,
                  preset: 'custom',
                },
              });
            }}
          />
        </div>
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

      {/* User Filter (Admin only) */}
      {canViewUserFilter && availableUsers.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t('user')}
          </label>
          <div className="max-h-40 overflow-y-auto space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2">
            {availableUsers.map((user) => (
              <label
                key={user.id}
                className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={filters.userIds.includes(user.id)}
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

      {/* Saved Presets */}
      {presets.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Saved Presets
          </label>
          <div className="space-y-2">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => handleLoadPreset(preset.id)}
                  className={`
                    flex-1 text-left text-sm
                    ${
                      selectedPresetId === preset.id
                        ? 'text-primary-600 dark:text-primary-400 font-medium'
                        : 'text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  {preset.name}
                </button>
                <button
                  type="button"
                  onClick={() => deletePreset(preset.id)}
                  className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  aria-label="Delete preset"
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
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="secondary"
          className="w-full"
          onClick={onReset}
          disabled={isLoading || activeFilterCount === 0}
        >
          {t('reset')}
        </Button>
        <Button
          variant="primary"
          className="w-full"
          onClick={() => setShowPresetDialog(true)}
          disabled={isLoading}
        >
          {t('savePreset')}
        </Button>
      </div>

      {/* Save Preset Dialog */}
      {showPresetDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              {t('savePreset')}
            </h3>
            <Input
              type="text"
              label="Preset Name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="e.g., Last 30 days - Mais only"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowPresetDialog(false);
                  setPresetName('');
                }}
              >
                {tCommon('cancel')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                onClick={handleSavePreset}
                disabled={!presetName.trim()}
              >
                {tCommon('save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
