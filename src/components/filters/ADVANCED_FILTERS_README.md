# Advanced Filtering System

A comprehensive filtering system with filter builder, saved filters, and sharing capabilities.

## Features

### 1. Filter Builder
- **Dynamic Filter Creation**: Add/remove filters with field, operator, and value selection
- **Multiple Operators**: Supports equals, contains, greater than, less than, between, in, is null, etc.
- **Logic Operators**: Combine filters with AND/OR logic
- **Type-Aware Inputs**: Different input types based on field type (text, number, date, enum, boolean)
- **Multi-Value Support**: Handle arrays for 'in' and 'not_in' operators
- **Between Operator**: Two inputs for range queries
- **Real-time Validation**: Validate filter values based on operator type

### 2. Saved Filters
- **Save Configurations**: Save filter groups with custom names
- **Default Filters**: Set a default filter per page that loads automatically
- **Load Presets**: Quickly load saved filter configurations
- **Edit/Delete**: Manage saved filters
- **Per-Page Storage**: Filters are organized by page/entity
- **Database Persistence**: Saved filters stored in PostgreSQL via Prisma

### 3. Filter Sharing
- **Shareable URLs**: Generate URLs with encoded filter parameters
- **Share Codes**: Copy/paste filter codes for easy sharing
- **JSON Export**: Download filter configurations as JSON files
- **Import Filters**: Import filters from codes or JSON files
- **Cross-User Sharing**: Share filters with team members

### 4. Filter Chips
- **Visual Display**: Show active filters as removable chips
- **Quick Remove**: Click to remove individual filters
- **Clear All**: Remove all filters at once
- **Logic Indicator**: Display AND/OR logic between filters

## Components

### AdvancedFilterPanel
Main container component that combines all filtering features.

```tsx
import { AdvancedFilterPanel } from '@/components/filters'
import { FilterFieldConfig } from '@/types/filters'

const fieldConfigs: FilterFieldConfig[] = [
  {
    name: 'itemName',
    label: 'Item Name',
    type: 'string',
    operators: ['equals', 'contains', 'starts_with', 'ends_with'],
  },
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  {
    name: 'destination',
    label: 'Destination',
    type: 'enum',
    operators: ['equals', 'in'],
    enumValues: [
      { value: 'MAIS', label: 'Mais' },
      { value: 'FOZAN', label: 'Fozan' },
    ],
  },
]

function MyPage() {
  const [isOpen, setIsOpen] = useState(false)

  const handleApply = (filterGroup: FilterGroup) => {
    // Convert to Prisma where clause
    const where = buildPrismaWhere(filterGroup)
    // Fetch data with filters
    fetchData(where)
  }

  return (
    <AdvancedFilterPanel
      currentPage="inventory"
      fieldConfigs={fieldConfigs}
      onApply={handleApply}
      isOpen={isOpen}
      onToggle={() => setIsOpen(!isOpen)}
    />
  )
}
```

### FilterBuilder
Standalone filter builder component.

```tsx
import { FilterBuilder } from '@/components/filters'

function MyComponent() {
  const [filterGroup, setFilterGroup] = useState<FilterGroup>({
    filters: [],
    logic: 'AND',
  })

  return (
    <FilterBuilder
      filterGroup={filterGroup}
      onChange={setFilterGroup}
      fieldConfigs={fieldConfigs}
      onApply={() => console.log('Apply', filterGroup)}
      onReset={() => setFilterGroup({ filters: [], logic: 'AND' })}
    />
  )
}
```

### SavedFiltersManager
Manage saved filter presets.

```tsx
import { SavedFiltersManager } from '@/components/filters'

function MyComponent() {
  const [savedFilters, setSavedFilters] = useState<SavedFilterData[]>([])

  const handleSave = async (name: string, filters: FilterGroup, isDefault: boolean) => {
    const response = await fetch('/api/filters', {
      method: 'POST',
      body: JSON.stringify({ name, filters, page: 'inventory', isDefault }),
    })
    // Reload saved filters
  }

  return (
    <SavedFiltersManager
      savedFilters={savedFilters}
      currentPage="inventory"
      onLoad={(filters) => setFilterGroup(filters)}
      onSave={handleSave}
      onDelete={handleDelete}
      onSetDefault={handleSetDefault}
      currentFilterGroup={filterGroup}
    />
  )
}
```

### FilterSharing
Share and import filter configurations.

```tsx
import { FilterSharing } from '@/components/filters'

function MyComponent() {
  return (
    <FilterSharing
      filterGroup={filterGroup}
      filterName="My Filter"
      currentPage="inventory"
      onImport={(filters, name) => {
        setFilterGroup(filters)
        setFilterName(name)
      }}
    />
  )
}
```

### FilterChips
Display active filters as chips.

```tsx
import { FilterChips } from '@/components/filters'

function MyComponent() {
  return (
    <FilterChips
      filterGroup={filterGroup}
      fieldConfigs={fieldConfigs}
      onRemoveFilter={(filterId) => {
        setFilterGroup({
          ...filterGroup,
          filters: filterGroup.filters.filter(f => f.id !== filterId),
        })
      }}
      onClearAll={() => setFilterGroup({ filters: [], logic: 'AND' })}
    />
  )
}
```

## API Endpoints

### GET /api/filters
Get all saved filters for the current user.

**Query Parameters:**
- `page` (optional): Filter by page/entity

**Response:**
```json
{
  "success": true,
  "filters": [
    {
      "id": "filter_123",
      "userId": "user_456",
      "name": "High Quantity Items",
      "filters": {
        "filters": [
          {
            "id": "f1",
            "field": "quantity",
            "operator": "greater_than",
            "value": 100
          }
        ],
        "logic": "AND"
      },
      "page": "inventory",
      "isDefault": false,
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/filters
Create a new saved filter.

**Request Body:**
```json
{
  "name": "My Filter",
  "filters": {
    "filters": [...],
    "logic": "AND"
  },
  "page": "inventory",
  "isDefault": false
}
```

### PATCH /api/filters/[id]
Update a saved filter.

**Request Body:**
```json
{
  "name": "Updated Name",
  "filters": {...},
  "isDefault": true
}
```

### DELETE /api/filters/[id]
Delete a saved filter.

## Utilities

### buildPrismaWhere
Convert filter group to Prisma where clause.

```typescript
import { buildPrismaWhere } from '@/utils/filter-builder'

const filterGroup: FilterGroup = {
  filters: [
    { id: '1', field: 'itemName', operator: 'contains', value: 'medical' },
    { id: '2', field: 'quantity', operator: 'greater_than', value: 50 },
  ],
  logic: 'AND',
}

const where = buildPrismaWhere(filterGroup)
// Result:
// {
//   AND: [
//     { itemName: { contains: 'medical', mode: 'insensitive' } },
//     { quantity: { gt: 50 } }
//   ]
// }

const items = await prisma.inventoryItem.findMany({ where })
```

### exportFilterGroup / importFilterGroup
Share filter configurations.

```typescript
import { exportFilterGroup, importFilterGroup } from '@/utils/filter-builder'

// Export
const encoded = exportFilterGroup(filterGroup, 'My Filter', 'inventory')
const url = `${window.location.origin}/inventory?filter=${encoded}`

// Import
const imported = importFilterGroup(encoded)
if (imported) {
  setFilterGroup(imported.filters)
  setFilterName(imported.name)
}
```

## Field Configuration

Define available fields and their operators:

```typescript
const fieldConfigs: FilterFieldConfig[] = [
  // String field
  {
    name: 'itemName',
    label: 'Item Name',
    type: 'string',
    operators: ['equals', 'contains', 'starts_with', 'ends_with', 'is_null'],
  },
  
  // Number field
  {
    name: 'quantity',
    label: 'Quantity',
    type: 'number',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  
  // Date field
  {
    name: 'createdAt',
    label: 'Created Date',
    type: 'date',
    operators: ['equals', 'greater_than', 'less_than', 'between'],
  },
  
  // Boolean field
  {
    name: 'isActive',
    label: 'Active',
    type: 'boolean',
    operators: ['equals'],
  },
  
  // Enum field
  {
    name: 'destination',
    label: 'Destination',
    type: 'enum',
    operators: ['equals', 'in', 'not_in'],
    enumValues: [
      { value: 'MAIS', label: 'Mais' },
      { value: 'FOZAN', label: 'Fozan' },
    ],
  },
]
```

## Supported Operators

| Operator | Description | Value Type | Example |
|----------|-------------|------------|---------|
| `equals` | Exact match | Single | `itemName equals "Syringe"` |
| `not_equals` | Not equal to | Single | `quantity not_equals 0` |
| `contains` | Contains substring | String | `itemName contains "medical"` |
| `not_contains` | Does not contain | String | `itemName not_contains "expired"` |
| `starts_with` | Starts with | String | `batch starts_with "2024"` |
| `ends_with` | Ends with | String | `itemName ends_with "ml"` |
| `greater_than` | Greater than | Number/Date | `quantity greater_than 100` |
| `less_than` | Less than | Number/Date | `quantity less_than 50` |
| `greater_than_or_equal` | >= | Number/Date | `quantity >= 100` |
| `less_than_or_equal` | <= | Number/Date | `quantity <= 50` |
| `between` | Range | Array[2] | `quantity between [10, 100]` |
| `is_null` | Is empty/null | None | `notes is_null` |
| `is_not_null` | Is not empty | None | `notes is_not_null` |
| `in` | In list | Array | `destination in ["MAIS", "FOZAN"]` |
| `not_in` | Not in list | Array | `category not_in ["Expired"]` |

## Database Schema

The SavedFilter model is already defined in Prisma:

```prisma
model SavedFilter {
  id        String   @id
  userId    String
  name      String
  filters   Json
  page      String
  isDefault Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, page])
  @@map("saved_filters")
}
```

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation fully supported
- Screen reader friendly
- Focus management for modals
- Minimum touch target size (44x44px)

## Internationalization

All text is translatable via `next-intl`:
- English: `messages/en.json`
- Arabic: `messages/ar.json`

Translation namespace: `filters`

## Best Practices

1. **Define Field Configs**: Always provide comprehensive field configurations
2. **Validate Filters**: Use `validateFilterValue` before applying filters
3. **Handle Empty States**: Check for empty filter groups
4. **Optimize Queries**: Use Prisma indexes for filtered fields
5. **Limit Complexity**: Consider limiting the number of filters per group
6. **Cache Results**: Cache frequently used filter results
7. **Audit Logging**: Log filter usage for analytics

## Requirements Covered

This implementation covers all requirements from task 13.1:

- ✅ Build filter builder UI (add/remove, field/operator/value selection, AND/OR logic, filter chips)
- ✅ Implement Prisma where clause generator supporting all operators
- ✅ Add saved filters (save modal, load presets, edit/delete, default filter per page, API endpoints)
- ✅ Implement filter sharing (shareable URL, export/import, copy link)

## Future Enhancements

- Filter templates for common use cases
- Filter history and undo/redo
- Advanced date range presets
- Filter performance analytics
- Bulk filter operations
- Filter validation rules
- Custom operator definitions
