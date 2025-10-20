# Keyboard Shortcuts Usage Examples

This document provides practical examples of how to use the keyboard shortcuts system in your pages and components.

## Basic Usage

### 1. Using Global Shortcuts

Global shortcuts are automatically available throughout the application. No additional setup required!

**Available Global Shortcuts**:

- `Ctrl/Cmd + K` - Open global search
- `Ctrl/Cmd + /` - Show keyboard shortcuts help
- `Shift + ?` - Show help
- `G then D` - Go to dashboard
- `G then E` - Go to data entry
- `G then L` - Go to data log
- `G then A` - Go to analytics
- `G then U` - Go to audit logs
- `G then S` - Go to settings
- `R` - Refresh current page

### 2. Adding Page-Specific Shortcuts

Use the pre-built hooks for common page types:

#### Data Log Page

```tsx
import { useDataLogKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

export default function DataLogPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)

  // Add keyboard shortcuts
  useDataLogKeyboardShortcuts({
    onFilter: () => setShowFilters(true),
    onExport: () => setShowExport(true),
    onRefresh: () => window.location.reload(),
    onNavigateUp: () => selectPreviousRow(),
    onNavigateDown: () => selectNextRow(),
    onSelectItem: () => openSelectedItem(),
    enabled: true,
  })

  return (
    // ... your page content
  )
}
```

**Shortcuts Added**:

- `F` - Open filters
- `E` - Export data
- `R` - Refresh data
- `↑` - Navigate up in table
- `↓` - Navigate down in table
- `Enter` - Select/open item

#### Analytics Page

```tsx
import { useAnalyticsKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

export default function AnalyticsPage() {
  const [showFilters, setShowFilters] = useState(false)
  const [showExport, setShowExport] = useState(false)

  useAnalyticsKeyboardShortcuts({
    onFilter: () => setShowFilters(true),
    onExport: () => setShowExport(true),
    onRefresh: () => refetchData(),
    enabled: true,
  })

  return (
    // ... your page content
  )
}
```

#### Data Entry Page

```tsx
import { useDataEntryKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

export default function DataEntryPage() {
  const [form, setForm] = useState(initialForm)

  useDataEntryKeyboardShortcuts({
    onNewItem: () => setForm(initialForm),
    onSave: () => handleSubmit(),
    onClear: () => setForm(initialForm),
    enabled: true,
  })

  return (
    // ... your page content
  )
}
```

**Shortcuts Added**:

- `Ctrl/Cmd + N` - Create new item
- `Ctrl/Cmd + S` - Save form
- `Escape` - Clear form

#### Audit Page

```tsx
import { useAuditKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

export default function AuditPage() {
  useAuditKeyboardShortcuts({
    onFilter: () => setShowFilters(true),
    onExport: () => setShowExport(true),
    onRefresh: () => refetch(),
    onNavigateUp: () => selectPreviousLog(),
    onNavigateDown: () => selectNextLog(),
    onSelectItem: () => viewLogDetails(),
    enabled: true,
  })

  return (
    // ... your page content
  )
}
```

### 3. Generic Table Shortcuts

For any table component:

```tsx
import { useTableKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

function MyTableComponent() {
  const [selectedRow, setSelectedRow] = useState(0)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  useTableKeyboardShortcuts({
    onNavigateUp: () => setSelectedRow(prev => Math.max(0, prev - 1)),
    onNavigateDown: () => setSelectedRow(prev => Math.min(data.length - 1, prev + 1)),
    onSelectItem: () => openItem(data[selectedRow]),
    onSelectAll: () => setSelectedIds(new Set(data.map(item => item.id))),
    enabled: true,
  })

  return (
    // ... table content
  )
}
```

**Shortcuts Added**:

- `↑` - Navigate up
- `↓` - Navigate down
- `Enter` - Select/open item
- `Ctrl/Cmd + A` - Select all

### 4. Generic Form Shortcuts

For any form component:

```tsx
import { useFormKeyboardShortcuts } from '@/hooks/usePageKeyboardShortcuts'

function MyFormComponent() {
  const [formData, setFormData] = useState(initialData)
  const [isDirty, setIsDirty] = useState(false)

  useFormKeyboardShortcuts({
    onSave: () => handleSubmit(),
    onCancel: () => handleCancel(),
    onReset: () => setFormData(initialData),
    enabled: true,
  })

  return (
    // ... form content
  )
}
```

**Shortcuts Added**:

- `Ctrl/Cmd + S` - Save form
- `Escape` - Cancel
- `Ctrl/Cmd + R` - Reset form

### 5. Custom Shortcuts

For custom shortcuts, use the base hook:

```tsx
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'

function MyComponent() {
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'p',
        ctrlKey: true,
        metaKey: true,
        callback: () => handlePrint(),
        description: 'Print document',
        category: 'Actions',
        preventDefault: true,
      },
      {
        key: 'h',
        callback: () => toggleHelp(),
        description: 'Toggle help',
        category: 'Help',
        preventDefault: true,
      },
      // Sequence shortcut
      {
        key: 'p',
        sequence: ['g', 'p'],
        callback: () => router.push('/profile'),
        description: 'Go to profile',
        category: 'Navigation',
        preventDefault: true,
      }
    ],
    enabled: true,
  })

  return (
    // ... component content
  )
}
```

## Advanced Usage

### Conditional Shortcuts

Enable/disable shortcuts based on conditions:

```tsx
function MyComponent() {
  const [isEditing, setIsEditing] = useState(false)

  // Only enable save shortcut when editing
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 's',
        ctrlKey: true,
        metaKey: true,
        callback: () => handleSave(),
        description: 'Save',
        category: 'Actions',
        preventDefault: true,
      }
    ],
    enabled: isEditing, // Only active when editing
  })

  return (
    // ... component content
  )
}
```

### Multiple Shortcut Groups

Combine multiple shortcut hooks:

```tsx
function ComplexPage() {
  // Table shortcuts
  useTableKeyboardShortcuts({
    onNavigateUp: () => selectPrevious(),
    onNavigateDown: () => selectNext(),
    enabled: true,
  })

  // Form shortcuts
  useFormKeyboardShortcuts({
    onSave: () => handleSave(),
    onCancel: () => handleCancel(),
    enabled: isEditing,
  })

  // Custom shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'd',
        callback: () => handleDelete(),
        description: 'Delete item',
        category: 'Actions',
        preventDefault: true,
      }
    ],
    enabled: hasSelection,
  })

  return (
    // ... page content
  )
}
```

### Sequence Shortcuts

Create multi-key sequences:

```tsx
useKeyboardShortcuts({
  shortcuts: [
    {
      key: 'n',
      sequence: ['g', 'n'],
      callback: () => router.push('/notifications'),
      description: 'Go to notifications',
      category: 'Navigation',
      preventDefault: true,
    },
    {
      key: 'p',
      sequence: ['g', 'p'],
      callback: () => router.push('/profile'),
      description: 'Go to profile',
      category: 'Navigation',
      preventDefault: true,
    },
  ],
  enabled: true,
});
```

**Usage**: Press `G` then `N` within 1 second to navigate to notifications.

## Best Practices

### 1. Don't Override Browser Shortcuts

Avoid common browser shortcuts:

- ❌ `Ctrl+T` (new tab)
- ❌ `Ctrl+W` (close tab)
- ❌ `Ctrl+N` (new window) - unless in specific context
- ❌ `Ctrl+R` (refresh) - unless you handle it properly
- ✅ `Ctrl+K` (safe, commonly used for search)
- ✅ `Ctrl+/` (safe, commonly used for help)

### 2. Use Consistent Patterns

Follow established patterns:

- `G + X` for navigation (Gmail-style)
- `F` for filters
- `E` for export
- `R` for refresh
- `Escape` for cancel/close
- `Ctrl/Cmd + S` for save

### 3. Provide Visual Hints

Show shortcuts in tooltips and buttons:

```tsx
<Button onClick={handleSave} title="Save (Ctrl+S)">
  Save
</Button>
```

### 4. Document Your Shortcuts

Add shortcuts to the help modal by updating the configuration:

```tsx
// src/config/keyboard-shortcuts.ts
export const GLOBAL_SHORTCUTS: GlobalShortcutConfig[] = [
  // ... existing shortcuts
  {
    id: 'my-custom-shortcut',
    key: 'x',
    ctrlKey: true,
    metaKey: true,
    description: 'My custom action',
    category: 'Actions',
    preventDefault: true,
    pageSpecific: ['my-page'],
  },
];
```

### 5. Test on Multiple Platforms

Always test shortcuts on:

- Windows (Ctrl key)
- macOS (Cmd key)
- Linux (Ctrl key)

## Troubleshooting

### Shortcuts Not Working

1. **Check if enabled**: Ensure `enabled: true` in hook options
2. **Check input focus**: Shortcuts are disabled in input fields (except Escape)
3. **Check conflicts**: Another shortcut might be intercepting the key
4. **Check browser**: Some browsers block certain shortcuts

### Shortcuts Conflicting

If shortcuts conflict:

```tsx
// Disable one when the other is active
useKeyboardShortcuts({
  shortcuts: [...],
  enabled: !isModalOpen, // Disable when modal is open
})
```

### Platform Detection Issues

If platform detection fails:

```tsx
import { isMac, getModifierKey } from '@/hooks/useKeyboardShortcuts';

const modKey = getModifierKey(); // 'Ctrl' or 'Cmd'
const isMacOS = isMac(); // true or false
```

## Testing

### Manual Testing

1. Open the help modal: `Ctrl/Cmd + /`
2. Verify all shortcuts are listed
3. Test each shortcut
4. Test on different platforms
5. Test in different browsers

### Automated Testing

```tsx
import { renderHook } from '@testing-library/react';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

test('keyboard shortcut triggers callback', () => {
  const callback = jest.fn();

  renderHook(() =>
    useKeyboardShortcuts({
      shortcuts: [
        {
          key: 's',
          ctrlKey: true,
          callback,
          description: 'Save',
          category: 'Actions',
        },
      ],
      enabled: true,
    })
  );

  // Simulate Ctrl+S
  const event = new KeyboardEvent('keydown', {
    key: 's',
    ctrlKey: true,
  });
  window.dispatchEvent(event);

  expect(callback).toHaveBeenCalled();
});
```

## Support

For questions or issues:

1. Check the help modal (`Ctrl/Cmd + /`)
2. Review the [README](./README.md)
3. Contact the development team
