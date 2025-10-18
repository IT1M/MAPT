# Data Log State Management Hooks

This directory contains custom hooks for managing the Data Log Viewer state, including filters, pagination, selection, table preferences, and filter presets.

## Overview

The state management system is designed to:
- Synchronize state with URL query parameters for shareable links
- Persist user preferences to localStorage
- Support browser back/forward navigation
- Provide a clean API for state updates

## Main Hook: `useDataLogManager`

The `useDataLogManager` hook is the primary interface that combines all state management functionality.

### Basic Usage

```typescript
import { useDataLogManager } from '@/hooks/useDataLogManager'

function DataLogPage() {
  const {
    // State
    filters,
    pagination,
    selectedIds,
    preferences,
    presets,
    
    // Computed
    activeFilterCount,
    hasSelection,
    selectedCount,
    
    // Actions
    updateFilters,
    resetFilters,
    setPage,
    setPageSize,
    toggleSelection,
    clearSelection,
    // ... more actions
  } = useDataLogManager()
  
  return (
    <div>
      {/* Your component JSX */}
    </div>
  )
}
```

## Individual Hooks

### 1. `useDataLogState`

Manages filters, pagination, and selection with URL synchronization.

```typescript
import { useDataLogState } from '@/hooks/useDataLogState'

const {
  filters,           // Current filter state
  pagination,        // Current pagination state
  selectedIds,       // Set of selected item IDs
  updateFilters,     // Update filter values
  resetFilters,      // Reset to defaults
  setPage,           // Change page
  setPageSize,       // Change page size
  toggleSelection,   // Toggle item selection
  selectAll,         // Select all items
  clearSelection,    // Clear selection
  activeFilterCount, // Number of active filters
} = useDataLogState()
```

#### Filter State Structure

```typescript
interface FilterState {
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
```

#### Examples

```typescript
// Update search filter
updateFilters({ search: 'item name' })

// Update date range
updateFilters({ 
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31')
})

// Update multiple filters
updateFilters({
  destinations: ['MAIS', 'FOZAN'],
  rejectFilter: 'high'
})

// Change page
setPage(2)

// Change page size (resets to page 1)
setPageSize(50)

// Toggle item selection
toggleSelection('item-id-123')

// Select all items
selectAll(['id1', 'id2', 'id3'])

// Clear all selections
clearSelection()
```

### 2. `useTablePreferences`

Manages table column visibility, widths, and order with localStorage persistence.

```typescript
import { useTablePreferences } from '@/hooks/useTablePreferences'

const {
  preferences,            // Current preferences
  setColumnVisibility,    // Show/hide column
  toggleColumnVisibility, // Toggle column visibility
  setColumnWidth,         // Set column width
  setColumnOrder,         // Reorder columns
  setDefaultPageSize,     // Set default page size
  resetPreferences,       // Reset to defaults
} = useTablePreferences()
```

#### Table Preferences Structure

```typescript
interface TablePreferences {
  columnVisibility: Record<string, boolean>
  columnWidths: Record<string, number>
  columnOrder: string[]
  defaultPageSize: number
}
```

#### Examples

```typescript
// Hide a column
setColumnVisibility('category', false)

// Toggle column visibility
toggleColumnVisibility('enteredBy')

// Set column width
setColumnWidth('itemName', 250)

// Reorder columns
setColumnOrder(['itemName', 'batch', 'quantity', 'destination'])

// Set default page size
setDefaultPageSize(50)

// Reset all preferences
resetPreferences()
```

### 3. `useFilterPresets`

Manages saved filter presets with localStorage persistence.

```typescript
import { useFilterPresets } from '@/hooks/useFilterPresets'

const {
  presets,       // Array of saved presets
  savePreset,    // Save new preset
  loadPreset,    // Load preset by ID
  deletePreset,  // Delete preset
  updatePreset,  // Update existing preset
  clearPresets,  // Clear all presets
} = useFilterPresets()
```

#### Filter Preset Structure

```typescript
interface FilterPreset {
  id: string
  name: string
  filters: FilterState
  createdAt: Date
}
```

#### Examples

```typescript
// Save current filters as preset
const preset = savePreset('High Rejects - Last 30 Days', currentFilters)

// Load a preset
const preset = loadPreset('preset-id-123')
if (preset) {
  updateFilters(preset.filters)
}

// Delete a preset
deletePreset('preset-id-123')

// Update a preset
updatePreset('preset-id-123', 'New Name', updatedFilters)

// Clear all presets
clearPresets()
```

## Utility Functions

### localStorage Utilities

```typescript
import {
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
  clearLocalStorage,
  isLocalStorageAvailable,
  getLocalStorageKeys,
  getLocalStorageSize,
  clearLocalStorageByPrefix,
} from '@/utils/localStorage'

// Get item with default value
const value = getLocalStorageItem('key', defaultValue)

// Set item
setLocalStorageItem('key', value)

// Remove item
removeLocalStorageItem('key')

// Check availability
if (isLocalStorageAvailable()) {
  // Use localStorage
}

// Get all keys with prefix
const keys = getLocalStorageKeys('dataLog.')

// Get storage size in bytes
const size = getLocalStorageSize()

// Clear by prefix
clearLocalStorageByPrefix('dataLog.')
```

### URL Parameter Utilities

```typescript
import {
  parseDateParam,
  parseIntParam,
  parseBooleanParam,
  parseEnumParam,
  parseArrayParam,
  buildSearchParams,
  mergeSearchParams,
  removeSearchParams,
  areSearchParamsEqual,
  searchParamsToObject,
  getCleanURL,
} from '@/utils/urlParams'

// Parse date
const date = parseDateParam(searchParams.get('date'))

// Parse integer
const page = parseIntParam(searchParams.get('page'), 1)

// Parse boolean
const enabled = parseBooleanParam(searchParams.get('enabled'), false)

// Parse enum
const filter = parseEnumParam(
  searchParams.get('filter'),
  ['all', 'none', 'has', 'high'],
  'all'
)

// Parse array
const ids = parseArrayParam(searchParams, 'id')

// Build search params
const params = buildSearchParams({
  page: 1,
  search: 'query',
  destinations: ['MAIS', 'FOZAN']
})

// Merge params
const merged = mergeSearchParams(currentParams, { page: 2 })

// Remove params
const cleaned = removeSearchParams(currentParams, ['page', 'search'])

// Compare params
const equal = areSearchParamsEqual(params1, params2)

// Convert to object
const obj = searchParamsToObject(params)

// Get clean URL
const url = getCleanURL('/data-log', params)
```

### Date Preset Utilities

```typescript
import {
  getDateRangeForPreset,
  getPresetFromDateRange,
  formatDateRange,
  getPresetLabel,
  getAvailablePresets,
} from '@/utils/datePresets'

// Get date range for preset
const range = getDateRangeForPreset('last7days')
// { startDate: Date, endDate: Date }

// Detect preset from dates
const preset = getPresetFromDateRange(startDate, endDate)
// 'today' | 'last7days' | 'last30days' | 'thisMonth' | 'custom'

// Format date range
const formatted = formatDateRange(startDate, endDate, 'en')
// "Jan 1, 2024 - Dec 31, 2024"

// Get preset label
const label = getPresetLabel('last7days', 'en')
// "Last 7 days"

// Get all presets
const presets = getAvailablePresets()
// ['today', 'last7days', 'last30days', 'thisMonth', 'lastMonth', 'thisYear', 'custom']
```

## URL Synchronization

The state is automatically synchronized with URL query parameters:

```
/data-log?page=2&pageSize=50&search=item&destination=MAIS&destination=FOZAN&rejectFilter=high&sortBy=quantity&sortOrder=desc
```

This enables:
- **Shareable links**: Users can share filtered views
- **Browser navigation**: Back/forward buttons work correctly
- **Bookmarks**: Users can bookmark specific views
- **Deep linking**: Direct access to specific filter states

## localStorage Keys

The following keys are used in localStorage:

- `dataLog.tablePreferences`: Table column preferences
- `dataLog.filterPresets`: Saved filter presets

## Best Practices

1. **Use `useDataLogManager`**: For most cases, use the combined hook instead of individual hooks
2. **Debounce search inputs**: Use debouncing for search to avoid excessive URL updates
3. **Reset page on filter change**: The hooks automatically reset to page 1 when filters change
4. **Handle SSR**: All hooks handle server-side rendering gracefully
5. **Error handling**: localStorage operations include error handling
6. **Type safety**: All hooks are fully typed with TypeScript

## Example: Complete Data Log Page

```typescript
'use client'

import { useDataLogManager } from '@/hooks/useDataLogManager'
import { getDateRangeForPreset } from '@/utils/datePresets'

export default function DataLogPage() {
  const {
    filters,
    pagination,
    selectedIds,
    preferences,
    activeFilterCount,
    hasSelection,
    selectedCount,
    updateFilters,
    resetFilters,
    setPage,
    setPageSize,
    toggleSelection,
    clearSelection,
    toggleSort,
    saveCurrentFiltersAsPreset,
    applyPreset,
  } = useDataLogManager()

  // Apply date preset
  const handleDatePreset = (preset: string) => {
    const range = getDateRangeForPreset(preset as any)
    if (range) {
      updateFilters({
        startDate: range.startDate,
        endDate: range.endDate,
      })
    }
  }

  // Save current filters
  const handleSavePreset = () => {
    const name = prompt('Enter preset name:')
    if (name) {
      saveCurrentFiltersAsPreset(name)
    }
  }

  return (
    <div>
      {/* Filter Panel */}
      <div>
        <input
          value={filters.search}
          onChange={(e) => updateFilters({ search: e.target.value })}
          placeholder="Search..."
        />
        
        <button onClick={() => handleDatePreset('last7days')}>
          Last 7 Days
        </button>
        
        <button onClick={resetFilters}>
          Reset Filters ({activeFilterCount})
        </button>
        
        <button onClick={handleSavePreset}>
          Save Preset
        </button>
      </div>

      {/* Data Table */}
      <table>
        <thead>
          <tr>
            <th onClick={() => toggleSort('itemName')}>
              Item Name
            </th>
            <th onClick={() => toggleSort('quantity')}>
              Quantity
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Table rows */}
        </tbody>
      </table>

      {/* Pagination */}
      <div>
        <button 
          onClick={() => setPage(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          Previous
        </button>
        
        <span>Page {pagination.page}</span>
        
        <button onClick={() => setPage(pagination.page + 1)}>
          Next
        </button>
        
        <select
          value={pagination.pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {hasSelection && (
        <div>
          <span>{selectedCount} selected</span>
          <button onClick={clearSelection}>Clear</button>
        </div>
      )}
    </div>
  )
}
```

## Testing

All hooks are designed to be testable:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useDataLogState } from '@/hooks/useDataLogState'

test('updates filters', () => {
  const { result } = renderHook(() => useDataLogState())
  
  act(() => {
    result.current.updateFilters({ search: 'test' })
  })
  
  expect(result.current.filters.search).toBe('test')
})
```
