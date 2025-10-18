# Appearance Settings Components

This directory contains the appearance customization components for the settings interface, allowing users to personalize the look and feel of the application.

## Components

### AppearanceSettings

Main container component that combines all appearance customization features.

**Features:**
- Theme selection (Light/Dark/System)
- UI density adjustment (Compact/Comfortable/Spacious)
- Font size customization (12-20px)
- Color scheme customization with presets
- Auto-save functionality
- Live preview of changes

**Usage:**
```tsx
import { AppearanceSettings } from '@/components/settings'

export default function SettingsPage() {
  return <AppearanceSettings />
}
```

### ThemeSelector

Allows users to choose between light, dark, or system theme.

**Props:**
```typescript
interface ThemeSelectorProps {
  currentTheme: ThemeMode // 'light' | 'dark' | 'system'
  onChange: (theme: ThemeMode) => void
}
```

**Features:**
- Visual preview cards for each theme
- Live theme switching with smooth transitions
- System theme detection and display
- Accessible keyboard navigation

### UIDensitySelector

Adjusts spacing and font size throughout the interface.

**Props:**
```typescript
interface UIDensitySelectorProps {
  density: UIDensity // 'compact' | 'comfortable' | 'spacious'
  fontSize: number // 12-20
  onChange: (settings: UISettings) => void
}
```

**Features:**
- Three density presets with visual previews
- Font size slider with live preview
- Reset to default functionality
- Accessible range input

### ColorSchemeCustomizer

Customizes primary and accent colors used throughout the interface.

**Props:**
```typescript
interface ColorSchemeCustomizerProps {
  primaryColor: string // Hex color
  accentColor: string // Hex color
  onChange: (colors: ColorScheme) => void
  onReset: () => void
}
```

**Features:**
- 8 color presets (Default, Blue, Green, Purple, Red, Orange, Pink, Teal)
- Custom color pickers for primary and accent colors
- Live preview of buttons, badges, and links
- Reset to default colors
- Hex color input validation

## API Integration

### GET /api/users/preferences

Fetches the current user's preferences including appearance settings.

**Response:**
```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "uiDensity": "comfortable",
    "fontSize": 16,
    "colorScheme": {
      "primary": "#3B82F6",
      "accent": "#8B5CF6"
    },
    ...
  }
}
```

### PATCH /api/users/preferences

Updates user preferences with partial updates supported.

**Request:**
```json
{
  "theme": "dark",
  "uiDensity": "spacious",
  "fontSize": 18,
  "colorScheme": {
    "primary": "#10B981",
    "accent": "#34D399"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated preferences */ },
  "message": "Preferences updated successfully"
}
```

## CSS Variables

The appearance settings apply changes via CSS variables defined in `globals.css`:

```css
:root {
  --font-size-base: 16px;
  --spacing-unit: 8px;
  --color-primary: #3B82F6;
  --color-accent: #8B5CF6;
}
```

These variables are dynamically updated when preferences change:

- `--font-size-base`: Controls base font size (12-20px)
- `--spacing-unit`: Controls spacing/padding (4px/8px/12px for compact/comfortable/spacious)
- `--color-primary`: Primary color for buttons, links, highlights
- `--color-accent`: Accent color for secondary elements, badges

## Hooks

### useUserPreferences

Custom hook for managing user preferences with auto-save functionality.

**Usage:**
```tsx
import { useUserPreferences } from '@/hooks/useUserPreferences'

function MyComponent() {
  const { preferences, updatePreferences, isLoading, error } = useUserPreferences()

  const handleThemeChange = async (theme: ThemeMode) => {
    await updatePreferences({ theme })
  }

  return (
    // Component JSX
  )
}
```

**Features:**
- Automatic fetching on mount
- Optimistic updates
- Error handling with rollback
- Loading states

## Accessibility

All appearance components follow WCAG 2.1 AA guidelines:

- **Keyboard Navigation**: Full keyboard support with visible focus indicators
- **Screen Readers**: Proper ARIA labels and live regions for announcements
- **Color Contrast**: All color presets meet WCAG AA contrast requirements
- **Touch Targets**: Minimum 44x44px touch targets on mobile
- **Focus Management**: Logical tab order and focus trapping in modals

## Responsive Design

Components adapt to different screen sizes:

- **Desktop (≥1024px)**: Full layout with side-by-side previews
- **Tablet (768-1023px)**: Stacked layout with responsive grids
- **Mobile (<768px)**: Single column layout with full-width inputs

## Testing

To test the appearance settings:

1. Navigate to the settings page
2. Select different themes and verify immediate application
3. Adjust UI density and font size, check preview updates
4. Choose color presets or use custom colors
5. Verify changes persist across page refreshes
6. Test with keyboard navigation only
7. Test with screen reader

## Requirements Covered

This implementation satisfies the following requirements from the spec:

- **12.1**: Theme options (Light/Dark/System)
- **12.2**: Live theme switching with smooth transitions
- **12.4**: Theme persistence across sessions
- **13.1**: UI density options (Compact/Comfortable/Spacious)
- **13.2**: Immediate density changes throughout interface
- **13.4**: Font size preview with real-time updates
- **21.2**: Auto-save with 500ms debounce
- **21.5**: Settings sync across active sessions

## Future Enhancements

Potential improvements for future iterations:

1. **High Contrast Mode**: Additional theme for users with visual impairments
2. **Custom Theme Builder**: Allow users to create and save custom themes
3. **Animation Preferences**: Control for reduced motion
4. **Color Blindness Modes**: Specialized color schemes for different types of color blindness
5. **Font Family Selection**: Allow users to choose preferred font families
6. **Export/Import Settings**: Share appearance settings across devices
