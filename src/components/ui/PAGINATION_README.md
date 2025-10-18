# Pagination Component

A fully-featured pagination component with keyboard navigation, jump-to-page, and items-per-page selection.

## Features

- **Page Navigation**: Previous/Next buttons with disabled states
- **Page Numbers**: Smart page number display (shows 5 at a time with ellipsis)
- **Jump to Page**: Input field for direct page navigation (shown for >10 pages)
- **Items Per Page**: Configurable dropdown selector
- **Item Count Display**: "Showing X-Y of Z items" format
- **Keyboard Navigation**: Arrow keys, Home, End support
- **Responsive Design**: Mobile-friendly layout
- **Auto-reset**: Resets to page 1 when changing items per page

## Usage

```tsx
import { Pagination } from '@/components/ui/Pagination'

function MyComponent() {
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(25)
  const totalItems = 1000

  const totalPages = Math.ceil(totalItems / itemsPerPage)

  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      totalItems={totalItems}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
      onItemsPerPageChange={setItemsPerPage}
    />
  )
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentPage` | `number` | Required | Current active page (1-indexed) |
| `totalPages` | `number` | Required | Total number of pages |
| `totalItems` | `number` | Required | Total number of items across all pages |
| `itemsPerPage` | `number` | Required | Number of items per page |
| `onPageChange` | `(page: number) => void` | Required | Callback when page changes |
| `onItemsPerPageChange` | `(count: number) => void` | Required | Callback when items per page changes |
| `className` | `string` | `''` | Additional CSS classes |
| `showJumpToPage` | `boolean` | `true` | Show jump-to-page input (only for >10 pages) |
| `showItemsPerPage` | `boolean` | `true` | Show items-per-page selector |
| `itemsPerPageOptions` | `number[]` | `[10, 25, 50, 100, 200]` | Available items-per-page options |

## Page Number Display Logic

The component intelligently displays page numbers:

- **Small page count** (≤7 pages): Shows all pages
- **Near start** (pages 1-3): Shows first 5 pages + ellipsis + last page
- **Middle**: Shows first page + ellipsis + current ±1 + ellipsis + last page
- **Near end** (last 3 pages): Shows first page + ellipsis + last 5 pages

Examples:
- 5 pages: `1 2 3 4 5`
- 20 pages (on page 1): `1 2 3 4 5 ... 20`
- 20 pages (on page 10): `1 ... 9 10 11 ... 20`
- 20 pages (on page 19): `1 ... 16 17 18 19 20`

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `←` (Left Arrow) | Previous page |
| `→` (Right Arrow) | Next page |
| `Home` | First page |
| `End` | Last page |

## Responsive Behavior

- **Desktop**: Full pagination with all features
- **Tablet**: Simplified page numbers
- **Mobile**: Compact layout with "Page X of Y" indicator

## Accessibility

- ARIA labels for all interactive elements
- `aria-current="page"` for active page
- Disabled state management
- Focus indicators
- Screen reader friendly

## Integration with Data Fetching

```tsx
// Example with URL state synchronization
const [searchParams, setSearchParams] = useSearchParams()
const currentPage = parseInt(searchParams.get('page') || '1', 10)
const itemsPerPage = parseInt(searchParams.get('limit') || '25', 10)

const handlePageChange = (page: number) => {
  setSearchParams(prev => {
    prev.set('page', page.toString())
    return prev
  })
}

const handleItemsPerPageChange = (limit: number) => {
  setSearchParams(prev => {
    prev.set('limit', limit.toString())
    prev.set('page', '1') // Reset to first page
    return prev
  })
}
```

## Styling

The component uses Tailwind CSS classes and supports dark mode. All colors and spacing can be customized via the `className` prop or by modifying the component's internal classes.
