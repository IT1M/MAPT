'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  GlobalFilters,
  type AnalyticsFilterState,
  type FilterUser,
} from './GlobalFilters';
import { UserRole, Destination } from '@prisma/client';
import { parseDateParam, parseArrayParam } from '@/utils/urlParams';
import { useSearchParams } from 'next/navigation';
import { type DatePresetType } from '@/utils/datePresets';

interface GlobalFiltersWrapperProps {
  onFiltersChange?: (filters: AnalyticsFilterState) => void;
}

export const GlobalFiltersWrapper: React.FC<GlobalFiltersWrapperProps> = ({
  onFiltersChange,
}) => {
  const { data: session } = useSession();
  const searchParams = useSearchParams();

  // Initialize filters from URL params
  const initializeFilters = useCallback((): AnalyticsFilterState => {
    const startDate = parseDateParam(searchParams.get('startDate'));
    const endDate = parseDateParam(searchParams.get('endDate'));
    const preset =
      (searchParams.get('preset') as DatePresetType) || 'last30days';

    const destinationsParam = parseArrayParam(searchParams, 'destinations');
    const destinations = destinationsParam.filter(
      (d): d is Destination => d === 'MAIS' || d === 'FOZAN'
    );

    const categories = parseArrayParam(searchParams, 'categories');
    const userIds = parseArrayParam(searchParams, 'userIds');

    return {
      dateRange: {
        start: startDate,
        end: endDate,
        preset: startDate || endDate ? 'custom' : preset,
      },
      destinations,
      categories,
      userIds,
    };
  }, [searchParams]);

  const [filters, setFilters] =
    useState<AnalyticsFilterState>(initializeFilters);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableUsers, setAvailableUsers] = useState<FilterUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(new Date());

  // Auto-refresh interval (60 seconds)
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setLastUpdated(new Date());
      // Trigger data refresh by notifying parent
      if (onFiltersChange) {
        onFiltersChange(filters);
      }
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filters, onFiltersChange]);

  // Fetch available categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(
          '/api/inventory/data-log?page=1&pageSize=1'
        );
        if (response.ok) {
          const data = await response.json();
          // Extract unique categories from the response
          // This is a placeholder - adjust based on actual API response
          const categories = data.categories || [];
          setAvailableCategories(categories);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    fetchCategories();
  }, []);

  // Fetch available users (Admin only)
  useEffect(() => {
    if (session?.user?.role !== UserRole.ADMIN) return;

    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          const users = data.data || [];
          setAvailableUsers(
            users.map((u: any) => ({
              id: u.id,
              name: u.name,
              email: u.email,
            }))
          );
        }
      } catch (error) {
        console.error('Failed to fetch users:', error);
      }
    };

    fetchUsers();
  }, [session]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (updates: Partial<AnalyticsFilterState>) => {
      setFilters((prev) => {
        const newFilters = { ...prev, ...updates };

        // Notify parent component
        if (onFiltersChange) {
          onFiltersChange(newFilters);
        }

        return newFilters;
      });

      setLastUpdated(new Date());
    },
    [onFiltersChange]
  );

  // Handle reset
  const handleReset = useCallback(() => {
    const defaultFilters: AnalyticsFilterState = {
      dateRange: {
        start: null,
        end: null,
        preset: 'last30days',
      },
      destinations: [],
      categories: [],
      userIds: [],
    };

    setFilters(defaultFilters);
    setLastUpdated(new Date());

    if (onFiltersChange) {
      onFiltersChange(defaultFilters);
    }
  }, [onFiltersChange]);

  // Handle manual refresh
  const handleRefresh = useCallback(() => {
    setLastUpdated(new Date());

    if (onFiltersChange) {
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  if (!session) {
    return null;
  }

  return (
    <GlobalFilters
      filters={filters}
      onChange={handleFilterChange}
      onReset={handleReset}
      userRole={session.user.role as UserRole}
      availableCategories={availableCategories}
      availableUsers={availableUsers}
      isLoading={isLoading}
      autoRefresh={autoRefresh}
      onAutoRefreshChange={setAutoRefresh}
      lastUpdated={lastUpdated}
      onRefresh={handleRefresh}
    />
  );
};
