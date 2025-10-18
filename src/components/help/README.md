# Keyboard Shortcuts System

This directory contains the comprehensive keyboard shortcuts system for the Saudi Mais Medical Inventory application.

## Overview

The keyboard shortcuts system provides:
- **Global shortcuts** available throughout the application
- **Page-specific shortcuts** for different pages (data-log, analytics, etc.)
- **Sequence shortcuts** (e.g., G then D for navigation)
- **Platform detection** (Ctrl vs Cmd for Windows/Mac)
- **Help modal** with search and categorization
- **Accessibility support** with screen reader announcements

## Components

### GlobalKeyboardShortcuts

The main provider component that manages all global keyboard shortcuts.

**Location**: `src/components/help/GlobalKeyboardShortcuts.tsx`

**Features**:
- Integrates with GlobalSearchProvider
- Manages global navigation shortcuts
- Opens keyboard shortcuts help modal
- Handles sequence shortcuts (G+D, G+E, etc.)

**Usage**:
```tsx
import { GlobalKeyboardShortcuts } from '@/components/help'

export default function Layout({ children }) {
  return (
    <GlobalKeyboardShortcuts>
      {children}
    </GlobalKeyboardShortcuts>
  )
}
```

### KeyboardShortcutsModal

A comprehensive modal displaying all available keyboard shortcuts.

**Location**: `src/components/help/KeyboardShortcutsModal.tsx`

**Features**:
- Search shortcuts by name or key
- Filter by category
- Platform-specific display (Ctrl vs Cmd)
- Print functionality
- Grouped by category with icons
- Responsive design

**Props**:
```typescript
interface KeyboardShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
  currentPage?: string // For page-specific shortcuts
}
```

## Hooks

### useKeyboardShortcuts

Core hook for managing keyboard shortcuts with platform detection and sequence support.

**Location**: `src/hooks/useKeyboardShortcuts.ts`

**Features**:
- Platform detection (Mac vs Windows/Linux)
- Sequence shortcuts (e.g., G then D)
- Modifier key handling (Ctrl/Cmd, Shift, Alt)
- Input field detection (ignores shortcuts in forms except Escape)
- Timeout for sequence shortcuts (1 second)

**Usage**:
```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function MyComponent() {
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        callback: () => handleSave(),
        description: 'Save form',
        category: 'Actions',
        preventDefault: true,
      },
      {
        key: 'd',
        sequence: ['g', 'd'],
        callback: () => router.push('/dashboard'),
        description: 'Go to dashboard',
        category: 'Navigation',
        preventDefault: true,
      }
    ],
    enabled: true,
  })
}
```

### Page-Specific Hooks

**Location**: `src/hooks/usePageKeyboardShortcuts.ts`

Provides pre-configured shortcuts for specific pages:

- `useDataLogKeyboardShortcuts` - Data log page shortcuts
- `useAnalyticsKeyboardShortcuts` - Analytics page shortcuts
- `useDataEntryKeyboardShortcuts` - Data entry page shortcuts
- `useAuditKeyboardShortcuts` - Audit page shortcuts
- `useTableKeyboardShortcuts` - Generic table shortcuts
- `useFormKeyboardShortcuts` - Generic form shortcuts

**Example**:
```tsx
import { useDataLogKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

function DataLogPage() {
  useDataLogKeyboardShortcuts({
    onFilter: () => setShowFilters(true),
    onExport: () => setShowExport(true),
    onRefresh: () => refetch(),
    onNavigateUp: () => selectPreviousRow(),
    onNavigateDown: () => selectNextRow(),
    onSelectItem: () => openSelectedItem(),
    enabled: true,
  })
}
```

## Configuration

### Global Shortcuts Config

**Location**: `src/config/keyboard-shortcuts.ts`

Defines all available keyboard shortcuts in the application.

**Structure**:
```typescript
export interface GlobalShortcutConfig {
  id: string
  key: string
  ctrlKey?: boolean
  metaKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  sequence?: string[]
  description: string
  category: ShortcutCategory
  pageSpecific?: string[]
  preventDefault?: boolean
}
```

**Categories**:
- Navigation
- Actions
- Search
- Help
- Table
- Forms
- Modals

## Global Shortcuts

### Navigation Shortcuts

| Shortcut | Description |
|----------|-------------|
| `Ctrl/Cmd + K` | Open global search |
| `G then D` | Go to dashboard |
| `G then E` | Go to data entry |
| `G then L` | Go to data log |
| `G then A` | Go to analytics |
| `G then U` | Go to audit logs |
| `G then S` | Go to settings |

### Action Shortcuts

| Shortcut | Description | Pages |
|----------|-------------|-------|
| `Ctrl/Cmd + N` | Create new item | Data Entry |
| `Ctrl/Cmd + S` | Save form | Data Entry, Settings |
| `R` | Refresh page | All |
| `E` | Export data | Data Log, Analytics, Audit |
| `F` | Open filters | Data Log, Analytics, Audit |

### Help Shortcuts

| Shortcut | Description |
|----------|-------------|
| `Ctrl/Cmd + /` | Show keyboard shortcuts |
| `Shift + ?` | Show help |

### Modal Shortcuts

| Shortcut | Description |
|----------|-------------|
| `Escape` | Close modal or dialog |

### Table Shortcuts

| Shortcut | Description | Pages |
|----------|-------------|-------|
| `↑` | Navigate up | Data Log, Audit |
| `↓` | Navigate down | Data Log, Audit |
| `Enter` | Select/open item | Data Log, Audit |
| `Ctrl/Cmd + A` | Select all | Data Log, Audit |

## Integration

### 1. Layout Integration

The `GlobalKeyboardShortcuts` component is integrated in the main layout:

```tsx
// src/app/[locale]/layout.tsx
import { GlobalKeyboardShortcuts } from '@/components/help'

export default function Layout({ children }) {
  return (
    <GlobalSearchProvider>
      <GlobalKeyboardShortcuts>
        {children}
      </GlobalKeyboardShortcuts>
    </GlobalSearchProvider>
  )
}
```

### 2. Page-Specific Integration

Add page-specific shortcuts in your page components:

```tsx
// src/app/[locale]/data-log/page.tsx
import { useDataLogKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

export default function DataLogPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)
  
  useDataLogKeyboardShortcuts({
    onFilter: () => setShowFilters(true),
    onExport: () => setShowExport(true),
    onRefresh: () => window.location.reload(),
  })
  
  return (
    // ... page content
  )
}
```

## Accessibility

The keyboard shortcuts system includes accessibility features:

1. **Screen Reader Support**: Shortcuts are announced when triggered
2. **Input Field Detection**: Shortcuts are disabled in input fields (except Escape)
3. **Visual Indicators**: Help modal shows all available shortcuts
4. **Platform Detection**: Displays correct modifier keys (Ctrl vs Cmd)
5. **Focus Management**: Proper focus handling in modals

## Translations

Keyboard shortcuts support internationalization:

**English** (`messages/en.json`):
```json
{
  "shortcuts": {
    "title": "Keyboard Shortcuts",
    "search": "Search shortcuts...",
    "allCategories": "All Categories",
    "print": "Print",
    "macInfo": "Showing shortcuts for macOS",
    "windowsInfo": "Showing shortcuts for Windows/Linux"
  }
}
```

**Arabic** (`messages/ar.json`):
```json
{
  "shortcuts": {
    "title": "اختصارات لوحة المفاتيح",
    "search": "البحث عن اختصارات...",
    "allCategories": "جميع الفئات",
    "print": "طباعة"
  }
}
```

## Testing

To test keyboard shortcuts:

1. **Open Help Modal**: Press `Ctrl/Cmd + /` or `Shift + ?`
2. **Search**: Press `Ctrl/Cmd + K`
3. **Navigate**: Press `G` then `D` to go to dashboard
4. **Page Actions**: On data-log page, press `F` for filters, `E` for export
5. **Table Navigation**: Use arrow keys in tables

## Best Practices

1. **Don't Override Browser Shortcuts**: Avoid common browser shortcuts like `Ctrl+T`, `Ctrl+W`
2. **Use Sequences for Navigation**: Use `G + X` pattern for navigation shortcuts
3. **Single Keys for Actions**: Use single keys (F, E, R) for page-specific actions
4. **Escape for Cancel**: Always use Escape to close modals/dialogs
5. **Platform Detection**: Always use both `ctrlKey` and `metaKey` for cross-platform support

## Future Enhancements

- [ ] Customizable shortcuts (user preferences)
- [ ] Shortcut conflicts detection
- [ ] Shortcut recording/learning mode
- [ ] Vim-style command mode
- [ ] Shortcut analytics (most used shortcuts)

## Support

For issues or questions about keyboard shortcuts:
1. Check the help modal (`Ctrl/Cmd + /`)
2. Review this documentation
3. Contact the development team
