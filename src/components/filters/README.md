# InventoryFilters Component

A comprehensive filter panel component for the Data Log Viewer that provides advanced filtering capabilities for inventory entries.

## Features

- **Search Bar**: Debounced search input (300ms delay) for item name and batch number
- **Date Range Picker**: Preset options (Today, Last 7 days, Last 30 days, This Month) and custom date selection
- **Destination Filter**: Multi-select checkboxes for Mais and Fozan warehouses
- **Category Filter**: Multi-select checkboxes for product categories
- **Reject Filter**: Radio button options (All, No Rejects, Has Rejects, High Rejects >10%)
- **Entered By Filter**: Multi-select user filter (visible only to ADMIN/SUPERVISOR roles)
- **Sort Controls**: Dropdown selectors for sort field and order
- **Action Buttons**: Apply Filters and Reset All buttons
- **Active Filter Badge**: Visual indicator showing count of active filters
- **Mobile Responsive**: Collapsible sidebar with overlay on mobile devices

## Usage

```tsx
import { InventoryFilters } from '@/components/filters/InventoryFilters'
import type { FilterState } from '@/types'
import { UserRole } from '@prisma/client'

function MyComponent() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    startDate: null,
    endDate: null,
    destinations: [],
    categories: [],
    rejectFilter: 'all',
    enteredByIds: [],
    sortBy: 'createdAt',
    sortOrder: 'desc',
  })

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleApply = () => {
    // Fetch data with filters
    console.log('Applying filters:', filters)
  }

  const handleReset = () => {
    setFilters({
      search: '',
      startDate: null,
      endDate: null,
      destinations: [],
      categories: [],
      rejectFilter: 'all',
      enteredByIds: [],
      sortBy: 'createdAt',
      sortOrder: 'desc',
    })
  }

  return (
    <InventoryFilters
      filters={filters}
      onFilterChange={handleFilterChange}
      onApply={handleApply}
      onReset={handleReset}
      activeFilterCount={3}
      isOpen={true}
      onToggle={() => {}}
      userRole={UserRole.ADMIN}
      availableCategories={['Category 1', 'Category 2']}
      availableUsers={[
        { id: '1', name: 'User 1', email: 'user1@example.com' }
      ]}
      isLoading={false}
    />
  )
}
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `filters` | `FilterState` | Yes | Current filter state |
| `onFilterChange` | `(filters: Partial<FilterState>) => void` | Yes | Callback when filters change |
| `onApply` | `() => void` | Yes | Callback when Apply Filters button is clicked |
| `onReset` | `() => void` | Yes | Callback when Reset All button is clicked |
| `activeFilterCount` | `number` | Yes | Number of active filters for badge display |
| `isOpen` | `boolean` | Yes | Whether the filter panel is open |
| `onToggle` | `() => void` | Yes | Callback to toggle filter panel visibility |
| `userRole` | `UserRole` | Yes | Current user's role for role-based filtering |
| `availableCategories` | `string[]` | No | List of available categories (default: []) |
| `availableUsers` | `FilterUser[]` | No | List of users for Entered By filter (default: []) |
| `isLoading` | `boolean` | No | Loading state indicator (default: false) |

## Types

### FilterState

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

### FilterUser

```typescript
interface FilterUser {
  id: string
  name: string
  email: string
}
```

## Behavior

### Debounced Search
The search input is debounced with a 300ms delay to prevent excessive API calls while typing.

### Date Presets
Clicking a date preset automatically populates the start and end date fields. Selecting "Custom" or manually changing dates switches to custom mode.

### Multi-Select Filters
Destination, Category, and Entered By filters support multiple selections. Clicking a checkbox toggles the selection.

### Role-Based Visibility
The "Entered By" filter is only visible to users with ADMIN or SUPERVISOR roles.

### Mobile Responsiveness
On mobile devices (< 768px), the filter panel:
- Becomes a fixed overlay
- Shows a backdrop overlay when open
- Can be closed by clicking the backdrop
- Transforms into a bottom sheet layout

### Active Filter Count
The badge displays the number of active filters:
- Search text is not empty
- Date range is set
- Destinations are selected
- Categories are selected
- Reject filter is not "all"
- Users are selected

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation is fully supported
- Screen reader announcements for filter changes
- Focus management for modal behavior on mobile
- Minimum touch target size of 44x44px

## Internationalization

The component uses `next-intl` for translations. All text is translatable through the `dataLog.filters` namespace.

Translation keys:
- `dataLog.filters.title`
- `dataLog.filters.search`
- `dataLog.filters.dateRange`
- `dataLog.filters.destination`
- `dataLog.filters.category`
- `dataLog.filters.rejectFilter`
- `dataLog.filters.enteredBy`
- `dataLog.filters.sortBy`
- `dataLog.filters.sortOrder`
- `dataLog.filters.applyFilters`
- `dataLog.filters.resetAll`
- And more...

## Styling

The component uses Tailwind CSS for styling with support for:
- Light and dark themes
- RTL (Right-to-Left) layouts for Arabic
- Responsive breakpoints
- Smooth transitions and animations

## Requirements Covered

This component implements the following requirements from the specification:

- **2.1-2.5**: Search functionality with debouncing
- **3.1-3.5**: Date range filtering with presets
- **4.1-4.4**: Destination multi-select filtering
- **5.1-5.4**: Category multi-select filtering
- **6.1-6.4**: Reject status filtering
- **7.1-7.4**: Role-based user filtering
- **8.1-8.5**: Sort controls
- **9.1-9.5**: Filter actions and presets
- **26.3**: Mobile bottom sheet behavior

## Future Enhancements

- Filter preset save/load functionality
- Export/import filter configurations
- Advanced filter combinations with AND/OR logic
- Filter history and recent filters
