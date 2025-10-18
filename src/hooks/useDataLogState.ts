import { useState, useCallback, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Destination } from '@prisma/client'

export type RejectFilterType = 'all' | 'none' | 'has' | 'high'

export interface FilterState {
  search: string
  startDate: Date | null
  endDate: Date | null
  destinations: Destination[]
  categories: string[]
  rejectFilter: RejectFilterType
  enteredByIds: string[]
  sortBy: string
  sortOrder: 'asc' | 'desc'
}

export interface PaginationState {
  page: number
  pageSize: number
}

export interface DataLogState {
  filters: FilterState
  pagination: PaginationState
  selectedIds: Set<string>
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
}

const DEFAULT_PAGINATION: PaginationState = {
  page: 1,
  pageSize: 25,
}

/**
 * Custom hook for managing data log state with URL synchronization
 */
export function useDataLogState() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize state from URL on mount
  const [filters, setFilters] = useState<FilterState>(() => 
    parseFiltersFromURL(searchParams)
  )
  
  const [pagination, setPagination] = useState<PaginationState>(() => 
    parsePaginationFromURL(searchParams)
  )
  
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Sync state to URL whenever it changes
  useEffect(() => {
    const params = buildURLParams(filters, pagination)
    const newURL = `?${params.toString()}`
    
    // Only update if URL actually changed to avoid unnecessary history entries
    if (newURL !== `?${searchParams.toString()}`) {
      router.push(newURL, { scroll: false })
    }
  }, [filters, pagination, router, searchParams])

  // Update filters
  const updateFilters = useCallback((updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }))
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  // Reset filters to default
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setPagination(DEFAULT_PAGINATION)
  }, [])

  // Update pagination
  const updatePagination = useCallback((updates: Partial<PaginationState>) => {
    setPagination(prev => ({ ...prev, ...updates }))
  }, [])

  // Update page
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }, [])

  // Update page size
  const setPageSize = useCallback((pageSize: number) => {
    setPagination({ page: 1, pageSize })
  }, [])

  // Toggle selection
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  // Select all
  const selectAll = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids))
  }, [])

  // Clear selection
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  // Get active filter count
  const activeFilterCount = getActiveFilterCount(filters)

  return {
    filters,
    pagination,
    selectedIds,
    updateFilters,
    resetFilters,
    updatePagination,
    setPage,
    setPageSize,
    toggleSelection,
    selectAll,
    clearSelection,
    activeFilterCount,
  }
}

/**
 * Parse filters from URL search params
 */
function parseFiltersFromURL(searchParams: URLSearchParams): FilterState {
  return {
    search: searchParams.get('search') || '',
    startDate: searchParams.get('startDate') 
      ? new Date(searchParams.get('startDate')!) 
      : null,
    endDate: searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate')!) 
      : null,
    destinations: searchParams.getAll('destination') as Destination[],
    categories: searchParams.getAll('category'),
    rejectFilter: (searchParams.get('rejectFilter') || 'all') as RejectFilterType,
    enteredByIds: searchParams.getAll('enteredBy'),
    sortBy: searchParams.get('sortBy') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc',
  }
}

/**
 * Parse pagination from URL search params
 */
function parsePaginationFromURL(searchParams: URLSearchParams): PaginationState {
  return {
    page: parseInt(searchParams.get('page') || '1', 10),
    pageSize: parseInt(searchParams.get('pageSize') || '25', 10),
  }
}

/**
 * Build URL search params from state
 */
function buildURLParams(
  filters: FilterState, 
  pagination: PaginationState
): URLSearchParams {
  const params = new URLSearchParams()
  
  // Pagination
  params.set('page', pagination.page.toString())
  params.set('pageSize', pagination.pageSize.toString())
  
  // Filters
  if (filters.search) {
    params.set('search', filters.search)
  }
  
  if (filters.startDate) {
    params.set('startDate', filters.startDate.toISOString())
  }
  
  if (filters.endDate) {
    params.set('endDate', filters.endDate.toISOString())
  }
  
  filters.destinations.forEach(dest => {
    params.append('destination', dest)
  })
  
  filters.categories.forEach(cat => {
    params.append('category', cat)
  })
  
  if (filters.rejectFilter !== 'all') {
    params.set('rejectFilter', filters.rejectFilter)
  }
  
  filters.enteredByIds.forEach(id => {
    params.append('enteredBy', id)
  })
  
  params.set('sortBy', filters.sortBy)
  params.set('sortOrder', filters.sortOrder)
  
  return params
}

/**
 * Count active filters (excluding defaults)
 */
function getActiveFilterCount(filters: FilterState): number {
  let count = 0
  
  if (filters.search) count++
  if (filters.startDate || filters.endDate) count++
  if (filters.destinations.length > 0) count++
  if (filters.categories.length > 0) count++
  if (filters.rejectFilter !== 'all') count++
  if (filters.enteredByIds.length > 0) count++
  
  return count
}
