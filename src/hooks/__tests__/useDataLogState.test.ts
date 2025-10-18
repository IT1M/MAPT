import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDataLogState } from '../useDataLogState'
import { Destination } from '@prisma/client'

// Mock Next.js router
const mockPush = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useSearchParams: () => mockSearchParams,
}))

describe('useDataLogState', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockSearchParams.forEach((_, key) => mockSearchParams.delete(key))
  })

  it('initializes with default state', () => {
    const { result } = renderHook(() => useDataLogState())

    expect(result.current.filters.search).toBe('')
    expect(result.current.filters.sortBy).toBe('createdAt')
    expect(result.current.filters.sortOrder).toBe('desc')
    expect(result.current.pagination.page).toBe(1)
    expect(result.current.pagination.pageSize).toBe(25)
    expect(result.current.selectedIds.size).toBe(0)
  })

  it('updates filters', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.updateFilters({ search: 'test item' })
    })

    expect(result.current.filters.search).toBe('test item')
  })

  it('resets to page 1 when filters change', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.setPage(3)
    })

    expect(result.current.pagination.page).toBe(3)

    act(() => {
      result.current.updateFilters({ search: 'test' })
    })

    expect(result.current.pagination.page).toBe(1)
  })

  it('updates pagination', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.setPage(2)
    })

    expect(result.current.pagination.page).toBe(2)

    act(() => {
      result.current.setPageSize(50)
    })

    expect(result.current.pagination.pageSize).toBe(50)
    expect(result.current.pagination.page).toBe(1) // Reset to page 1
  })

  it('manages selection state', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.toggleSelection('id1')
    })

    expect(result.current.selectedIds.has('id1')).toBe(true)

    act(() => {
      result.current.toggleSelection('id2')
    })

    expect(result.current.selectedIds.has('id2')).toBe(true)
    expect(result.current.selectedIds.size).toBe(2)

    act(() => {
      result.current.toggleSelection('id1')
    })

    expect(result.current.selectedIds.has('id1')).toBe(false)
    expect(result.current.selectedIds.size).toBe(1)
  })

  it('selects all items', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.selectAll(['id1', 'id2', 'id3'])
    })

    expect(result.current.selectedIds.size).toBe(3)
    expect(result.current.selectedIds.has('id1')).toBe(true)
    expect(result.current.selectedIds.has('id2')).toBe(true)
    expect(result.current.selectedIds.has('id3')).toBe(true)
  })

  it('clears selection', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.selectAll(['id1', 'id2', 'id3'])
    })

    expect(result.current.selectedIds.size).toBe(3)

    act(() => {
      result.current.clearSelection()
    })

    expect(result.current.selectedIds.size).toBe(0)
  })

  it('resets filters to default', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.updateFilters({
        search: 'test',
        destinations: [Destination.MAIS],
        rejectFilter: 'high',
      })
    })

    expect(result.current.filters.search).toBe('test')
    expect(result.current.pagination.page).toBe(1) // Reset by filter change

    act(() => {
      result.current.setPage(3)
    })

    expect(result.current.pagination.page).toBe(3)

    act(() => {
      result.current.resetFilters()
    })

    expect(result.current.filters.search).toBe('')
    expect(result.current.filters.destinations).toEqual([])
    expect(result.current.filters.rejectFilter).toBe('all')
    expect(result.current.pagination.page).toBe(1)
    expect(result.current.pagination.pageSize).toBe(25)
  })

  it('calculates active filter count', () => {
    const { result } = renderHook(() => useDataLogState())

    expect(result.current.activeFilterCount).toBe(0)

    act(() => {
      result.current.updateFilters({ search: 'test' })
    })

    expect(result.current.activeFilterCount).toBe(1)

    act(() => {
      result.current.updateFilters({
        destinations: [Destination.MAIS],
        rejectFilter: 'high',
      })
    })

    expect(result.current.activeFilterCount).toBe(3)
  })

  it('updates multiple filter properties at once', () => {
    const { result } = renderHook(() => useDataLogState())

    act(() => {
      result.current.updateFilters({
        search: 'test',
        destinations: [Destination.MAIS, Destination.FOZAN],
        categories: ['category1', 'category2'],
        rejectFilter: 'high',
        sortBy: 'quantity',
        sortOrder: 'asc',
      })
    })

    expect(result.current.filters.search).toBe('test')
    expect(result.current.filters.destinations).toEqual([Destination.MAIS, Destination.FOZAN])
    expect(result.current.filters.categories).toEqual(['category1', 'category2'])
    expect(result.current.filters.rejectFilter).toBe('high')
    expect(result.current.filters.sortBy).toBe('quantity')
    expect(result.current.filters.sortOrder).toBe('asc')
  })
})
