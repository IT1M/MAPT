import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  FilterState,
  InventoryItemWithUser,
  DataLogResponse,
} from '@/types';
import { Destination } from '@prisma/client';

interface UseDataLogManagerOptions {
  initialFilters?: Partial<FilterState>;
  autoFetch?: boolean;
}

interface UseDataLogManagerReturn {
  // Data
  items: InventoryItemWithUser[];
  total: number;
  aggregates: {
    totalQuantity: number;
    totalRejects: number;
    averageRejectRate: number;
  };

  // State
  loading: boolean;
  error: Error | null;

  // Pagination
  page: number;
  pageSize: number;
  totalPages: number;

  // Filters
  filters: FilterState;

  // Last updated
  lastUpdated: Date | null;

  // Actions
  fetchData: () => Promise<void>;
  setFilters: (filters: Partial<FilterState>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
  reset: () => void;
}

const DEFAULT_FILTERS: FilterState = {
  search: '',
  startDate: null,
  endDate: null,
  destinations: [],
  categories: [],
  rejectFilter: 'all',
  enteredByIds: [],
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function useDataLogManager(
  options: UseDataLogManagerOptions = {}
): UseDataLogManagerReturn {
  const { initialFilters = {}, autoFetch = true } = options;

  // State
  const [items, setItems] = useState<InventoryItemWithUser[]>([]);
  const [total, setTotal] = useState(0);
  const [aggregates, setAggregates] = useState({
    totalQuantity: 0,
    totalRejects: 0,
    averageRejectRate: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(0);
  const [filters, setFiltersState] = useState<FilterState>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Ref to track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  // Build query parameters
  const buildQueryParams = useCallback(() => {
    const params = new URLSearchParams();

    params.set('page', page.toString());
    params.set('pageSize', pageSize.toString());

    if (filters.search) {
      params.set('search', filters.search);
    }

    if (filters.startDate) {
      params.set('startDate', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      params.set('endDate', filters.endDate.toISOString());
    }

    filters.destinations.forEach((dest) => {
      params.append('destination', dest);
    });

    filters.categories.forEach((cat) => {
      params.append('category', cat);
    });

    if (filters.rejectFilter !== 'all') {
      params.set('rejectFilter', filters.rejectFilter);
    }

    filters.enteredByIds.forEach((id) => {
      params.append('enteredBy', id);
    });

    params.set('sortBy', filters.sortBy);
    params.set('sortOrder', filters.sortOrder);

    return params.toString();
  }, [page, pageSize, filters]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const queryString = buildQueryParams();
      const response = await fetch(`/api/inventory/data-log?${queryString}`, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `Failed to fetch data: ${response.status}`
        );
      }

      const result = await response.json();

      if (!isMountedRef.current) return;

      if (result.success && result.data) {
        const data = result.data as DataLogResponse;
        setItems(data.items);
        setTotal(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
        setAggregates(data.aggregates);
        setLastUpdated(new Date());
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      // Ignore abort errors
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }

      const error =
        err instanceof Error ? err : new Error('Failed to fetch data');
      setError(error);
      console.error('Data fetch error:', error);
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, [buildQueryParams]);

  // Update filters
  const setFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => ({ ...prev, ...newFilters }));
    // Reset to page 1 when filters change
    setPage(1);
  }, []);

  // Update page
  const handleSetPage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Update page size
  const handleSetPageSize = useCallback((newSize: number) => {
    setPageSize(newSize);
    // Reset to page 1 when page size changes
    setPage(1);
  }, []);

  // Refresh data
  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Reset to initial state
  const reset = useCallback(() => {
    setFiltersState({ ...DEFAULT_FILTERS, ...initialFilters });
    setPage(1);
    setPageSize(25);
    setError(null);
  }, [initialFilters]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchData();
    }
  }, [autoFetch, fetchData]);

  return {
    items,
    total,
    aggregates,
    loading,
    error,
    page,
    pageSize,
    totalPages,
    filters,
    lastUpdated,
    fetchData,
    setFilters,
    setPage: handleSetPage,
    setPageSize: handleSetPageSize,
    refresh,
    reset,
  };
}
