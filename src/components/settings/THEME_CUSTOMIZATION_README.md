# Theme Customization System

## Overview

The Theme Customization System allows users to personalize the visual appearance of the application with preset themes, custom colors, typography settings, layout density, and animation controls. Themes can be exported, imported, and shared across users.

## Features

### 1. Preset Themes
Six professionally designed themes:
- **Medical Blue** (Default): Professional medical theme with calming blue tones
- **Ocean**: Deep blue ocean-inspired theme
- **Forest**: Natural green forest theme
- **Sunset**: Warm sunset colors with orange and pink tones
- **Royal**: Elegant purple and gold royal theme
- **Monochrome**: Clean black and white minimalist theme

### 2. Color Customization
Customize individual colors:
- Primary, Secondary, Accent colors
- Background and Foreground colors
- Muted colors and borders
- Card colors
- Status colors (Success, Warning, Error, Info)

### 3. Typography Settings
- Font family selection (Inter, System UI, Georgia, Courier New, Arial, Times New Roman)
- Font size adjustments (Small, Base, Large, Extra Large)
- Live preview of typography changes

### 4. Layout Density
Three density options:
- **Compact**: Minimal spacing, smaller fonts (ideal for power users)
- **Comfortable**: Balanced spacing (default)
- **Spacious**: Maximum spacing, larger fonts (ideal for accessibility)

### 5. Animation Controls
- Enable/disable animations globally
- Animation speed control (Slow, Normal, Fast)
- Respects `prefers-reduced-motion` system preference

### 6. Theme Sharing
- **Export**: Download theme as JSON file
- **Import**: Upload theme JSON file
- **Share Code**: Generate base64-encoded share code
- **Import from Code**: Apply theme from share code

## Usage

### Basic Usage

```tsx
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer'

export default function SettingsPage() {
  return (
    <div>
      <ThemeCustomizer />
    </div>
  )
}
```

### Using the Hook

```tsx
import { useThemeCustomization } from '@/hooks/useThemeCustomization'

function MyComponent() {
  const {
    currentTheme,
    selectPreset,
    updateColors,
    updateFonts,
    updateDensity,
    updateAnimations,
  } = useThemeCustomization()

  return (
    <div>
      <button onClick={() => selectPreset('ocean')}>
        Apply Ocean Theme
      </button>
      
      <button onClick={() => updateColors({ primary: '#ff0000' })}>
        Change Primary Color
      </button>
    </div>
  )
}
```

### Applying Theme Classes

Use theme CSS classes in your components:

```tsx
// Themed card
<div className="theme-card">
  <h2>Card Title</h2>
  <p>Card content</p>
</div>

// Themed buttons
<button className="theme-button-primary">Primary Action</button>
<button className="theme-button-secondary">Secondary Action</button>

// Themed input
<input className="theme-input" type="text" />

// Status badges
<span className="theme-badge-success">Success</span>
<span className="theme-badge-warning">Warning</span>
<span className="theme-badge-error">Error</span>
<span className="theme-badge-info">Info</span>
```

### Using CSS Variables

Access theme variables in your custom CSS:

```css
.my-component {
  background-color: var(--theme-primary);
  color: var(--theme-foreground);
  border: 1px solid var(--theme-border);
  padding: var(--theme-padding);
  gap: var(--theme-gap);
  font-family: var(--theme-font-family);
  font-size: var(--theme-font-size-base);
  transition: all var(--theme-animation-speed);
}
```

## API Reference

### useThemeCustomization Hook

```typescript
interface UseThemeCustomization {
  // Current theme state
  currentTheme: Theme
  isLoading: boolean
  
  // Theme management
  updateTheme: (theme: Theme) => void
  selectPreset: (presetId: string) => void
  resetToDefault: () => void
  
  // Partial updates
  updateColors: (colors: Partial<Theme['colors']>) => void
  updateFonts: (fonts: Partial<Theme['fonts']>) => void
  updateDensity: (density: ThemeDensity) => void
  updateAnimations: (animations: Partial<Theme['animations']>) => void
  
  // Import/Export
  exportTheme: () => void
  importTheme: (themeJson: string) => { success: boolean; error?: string }
  generateShareCode: () => string
  importFromShareCode: (shareCode: string) => { success: boolean; error?: string }
}
```

### Theme Interface

```typescript
interface Theme {
  id: string
  name: string
  description: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    mutedForeground: string
    border: string
    card: string
    cardForeground: string
    success: string
    warning: string
    error: string
    info: string
  }
  fonts: {
    family: string
    size: {
      base: string
      sm: string
      lg: string
      xl: string
    }
  }
  spacing: {
    density: 'compact' | 'comfortable' | 'spacious'
  }
  animations: {
    enabled: boolean
    speed: 'slow' | 'normal' | 'fast'
  }
}
```

## CSS Variables Reference

### Color Variables
- `--theme-primary`
- `--theme-secondary`
- `--theme-accent`
- `--theme-background`
- `--theme-foreground`
- `--theme-muted`
- `--theme-mutedForeground`
- `--theme-border`
- `--theme-card`
- `--theme-cardForeground`
- `--theme-success`
- `--theme-warning`
- `--theme-error`
- `--theme-info`

### Typography Variables
- `--theme-font-family`
- `--theme-font-size-base`
- `--theme-font-size-sm`
- `--theme-font-size-lg`
- `--theme-font-size-xl`

### Spacing Variables
- `--theme-padding`
- `--theme-gap`
- `--theme-density-font-size`

### Animation Variables
- `--theme-animation-speed`

## Density Classes

Apply density classes to containers:

```tsx
<div className="density-compact">
  {/* Content will use compact spacing */}
</div>

<div className="density-comfortable">
  {/* Content will use comfortable spacing */}
</div>

<div className="density-spacious">
  {/* Content will use spacious spacing */}
</div>
```

## Cross-Tab Synchronization

Theme changes are automatically synchronized across all open tabs using:
1. `localStorage` events for cross-tab communication
2. `BroadcastChannel` API for same-origin tabs
3. Automatic theme application on sync

## Accessibility

The theme system includes:
- Respects `prefers-reduced-motion` system preference
- Respects `prefers-contrast` system preference
- Keyboard navigation support
- ARIA labels and descriptions
- Focus indicators
- Screen reader announcements

## Performance

- Theme changes apply instantly using CSS variables
- No page reload required
- Minimal re-renders using React hooks
- Efficient localStorage persistence
- Debounced updates for color pickers

## Browser Support

- Modern browsers with CSS custom properties support
- localStorage API
- BroadcastChannel API (with fallback)
- File API for import/export

## Examples

### Creating a Custom Theme

```typescript
const customTheme: Theme = {
  id: 'custom-brand',
  name: 'My Brand',
  description: 'Custom brand colors',
  colors: {
    primary: '#ff6b6b',
    secondary: '#4ecdc4',
    accent: '#ffe66d',
    // ... other colors
  },
  fonts: {
    family: 'Roboto, sans-serif',
    size: {
      base: '16px',
      sm: '14px',
      lg: '18px',
      xl: '20px',
    },
  },
  spacing: {
    density: 'comfortable',
  },
  animations: {
    enabled: true,
    speed: 'normal',
  },
}

// Apply the custom theme
updateTheme(customTheme)
```

### Exporting and Sharing

```typescript
// Export theme to file
exportTheme()

// Generate share code
const shareCode = generateShareCode()
console.log('Share this code:', shareCode)

// Import from share code
const result = importFromShareCode(shareCode)
if (result.success) {
  console.log('Theme imported successfully!')
}
```

## Troubleshooting

### Theme not applying
- Check browser console for errors
- Verify CSS file is imported in globals.css
- Ensure component is wrapped in proper context

### Colors not updating
- Clear browser cache
- Check if CSS variables are being overridden
- Verify color format is valid hex code

### Cross-tab sync not working
- Check if localStorage is enabled
- Verify same origin policy
- Check browser console for errors

## Future Enhancements

- Dark mode variants for each preset
- More preset themes
- Theme marketplace
- Advanced color palette generation
- Gradient support
- Custom font upload
- Theme preview before applying
- Scheduled theme switching (day/night)
