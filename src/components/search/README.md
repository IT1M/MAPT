# Global Search System

A comprehensive global search system that provides full-text search across inventory items, reports, users, and settings with role-based filtering and keyboard shortcuts.

## Features

- **Universal Search**: Search across inventory, reports, users, and settings
- **Role-Based Filtering**: Results filtered based on user permissions
- **Keyboard Shortcuts**: 
  - `Ctrl+K` / `Cmd+K` - Open search modal
  - `↑` / `↓` - Navigate results
  - `Enter` - Select result
  - `Esc` - Close modal
- **Recent Searches**: Automatically saves and displays recent searches
- **Debounced Search**: 300ms debounce for optimal performance
- **Responsive Design**: Works on desktop, tablet, and mobile
- **RTL Support**: Full support for Arabic (RTL) layout
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

## Components

### GlobalSearch
Main search modal component with input, results display, and keyboard navigation.

### GlobalSearchProvider
Context provider that makes search available throughout the app.

### SearchButton
Button component to trigger search, displays keyboard shortcut hint.

### useGlobalSearch
Hook for managing search state and keyboard shortcut.

## Usage

### Basic Setup

The GlobalSearchProvider is already integrated in the app layout:

```tsx
// src/app/[locale]/layout.tsx
import { GlobalSearchProvider } from '@/components/search'

export default function Layout({ children }) {
  return (
    <GlobalSearchProvider>
      {children}
    </GlobalSearchProvider>
  )
}
```

### Using the Search Button

Add the SearchButton to any component:

```tsx
import { SearchButton } from '@/components/search'

export function MyComponent() {
  return (
    <div>
      <SearchButton />
    </div>
  )
}
```

### Programmatic Control

Use the context to control search programmatically:

```tsx
import { useGlobalSearchContext } from '@/components/search'

export function MyComponent() {
  const { openSearch, closeSearch, isOpen } = useGlobalSearchContext()
  
  return (
    <button onClick={openSearch}>
      Open Search
    </button>
  )
}
```

## API Endpoint

### POST /api/search

Performs global search with role-based filtering.

**Request Body:**
```json
{
  "query": "search term",
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "reports": [...],
    "users": [...],
    "settings": [...],
    "total": 10
  }
}
```

## Search Service

The search service (`src/services/search.ts`) provides:

- `globalSearch()` - Main search function with role-based filtering
- `getRecentSearches()` - Get recent searches from localStorage
- `saveRecentSearch()` - Save search to recent searches
- `clearRecentSearches()` - Clear all recent searches

## Role-Based Access

Search results are filtered based on user role:

- **Inventory Items**: All roles
- **Reports**: All except DATA_ENTRY
- **Users**: ADMIN, MANAGER, SUPERVISOR only
- **Settings**: All roles (filtered by page access)

## Performance

- **Debouncing**: 300ms delay before search API call
- **Caching**: API responses cached for 60 seconds
- **Optimized Queries**: Database queries use indexes and limit results
- **Lazy Loading**: Modal only renders when open

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open search modal |
| `↑` | Navigate to previous result |
| `↓` | Navigate to next result |
| `Enter` | Select highlighted result |
| `Esc` | Close search modal |

## Translations

Search translations are available in both English and Arabic:

```json
{
  "search": {
    "search": "Search",
    "placeholder": "Search inventory, reports, users, settings...",
    "recent": "Recent Searches",
    "items": "Inventory Items",
    "reports": "Reports",
    "users": "Users",
    "settings": "Settings",
    "noResults": "No results found"
  }
}
```

## Styling

The search modal uses Tailwind CSS with dark mode support:

- Light/dark mode compatible
- Smooth animations
- Responsive design
- RTL support for Arabic

## Future Enhancements

- Advanced filters (date range, categories)
- Search suggestions/autocomplete
- Search history analytics
- Fuzzy search for typo tolerance
- Search result highlighting
- Export search results
