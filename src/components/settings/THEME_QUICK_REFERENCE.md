# Theme Customization - Quick Reference

## Import

```tsx
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer'
import { useThemeCustomization } from '@/hooks/useThemeCustomization'
```

## Hook API

```tsx
const {
  currentTheme,           // Current theme object
  isLoading,             // Loading state
  selectPreset,          // (id: string) => void
  updateColors,          // (colors: Partial<Colors>) => void
  updateFonts,           // (fonts: Partial<Fonts>) => void
  updateDensity,         // (density: 'compact' | 'comfortable' | 'spacious') => void
  updateAnimations,      // (animations: Partial<Animations>) => void
  exportTheme,           // () => void
  importTheme,           // (json: string) => { success: boolean; error?: string }
  generateShareCode,     // () => string
  importFromShareCode,   // (code: string) => { success: boolean; error?: string }
  resetToDefault,        // () => void
} = useThemeCustomization()
```

## Preset Themes

- `default` - Medical Blue
- `ocean` - Ocean Blue
- `forest` - Natural Green
- `sunset` - Warm Orange/Pink
- `royal` - Purple/Gold
- `monochrome` - Black/White

## CSS Classes

### Buttons
```tsx
<button className="theme-button-primary">Primary</button>
<button className="theme-button-secondary">Secondary</button>
```

### Cards
```tsx
<div className="theme-card">Content</div>
```

### Inputs
```tsx
<input className="theme-input" />
```

### Badges
```tsx
<span className="theme-badge-success">Success</span>
<span className="theme-badge-warning">Warning</span>
<span className="theme-badge-error">Error</span>
<span className="theme-badge-info">Info</span>
```

### Colors
```tsx
<div className="theme-primary">Text</div>
<div className="theme-bg-primary">Background</div>
<div className="theme-border-primary">Border</div>
```

### Transitions
```tsx
<div className="theme-transition">All</div>
<div className="theme-transition-colors">Colors</div>
<div className="theme-transition-transform">Transform</div>
```

## CSS Variables

### Colors
```css
var(--theme-primary)
var(--theme-secondary)
var(--theme-accent)
var(--theme-background)
var(--theme-foreground)
var(--theme-muted)
var(--theme-mutedForeground)
var(--theme-border)
var(--theme-card)
var(--theme-cardForeground)
var(--theme-success)
var(--theme-warning)
var(--theme-error)
var(--theme-info)
```

### Typography
```css
var(--theme-font-family)
var(--theme-font-size-base)
var(--theme-font-size-sm)
var(--theme-font-size-lg)
var(--theme-font-size-xl)
```

### Spacing
```css
var(--theme-padding)
var(--theme-gap)
var(--theme-density-font-size)
```

### Animation
```css
var(--theme-animation-speed)
```

## Common Patterns

### Apply Preset
```tsx
selectPreset('ocean')
```

### Update Single Color
```tsx
updateColors({ primary: '#ff0000' })
```

### Update Multiple Colors
```tsx
updateColors({
  primary: '#ff0000',
  secondary: '#00ff00',
  accent: '#0000ff',
})
```

### Change Font
```tsx
updateFonts({ family: 'Arial, sans-serif' })
```

### Change Density
```tsx
updateDensity('compact')
```

### Toggle Animations
```tsx
updateAnimations({ enabled: false })
```

### Export Theme
```tsx
exportTheme() // Downloads JSON file
```

### Generate Share Code
```tsx
const code = generateShareCode()
// Share this code with others
```

### Import from Code
```tsx
const result = importFromShareCode(code)
if (result.success) {
  console.log('Theme imported!')
}
```

## Inline Styles

```tsx
<div style={{
  backgroundColor: 'var(--theme-primary)',
  color: 'var(--theme-foreground)',
  padding: 'var(--theme-padding)',
  gap: 'var(--theme-gap)',
  transition: 'all var(--theme-animation-speed)',
}}>
  Content
</div>
```

## Density Classes

```tsx
<div className="density-compact">Compact spacing</div>
<div className="density-comfortable">Comfortable spacing</div>
<div className="density-spacious">Spacious spacing</div>
```

## Test Page

Visit `/theme-test` to see all features in action.

## Files

- Config: `src/config/themes.ts`
- Hook: `src/hooks/useThemeCustomization.ts`
- Component: `src/components/settings/ThemeCustomizer.tsx`
- Styles: `src/styles/theme-customization.css`
- Examples: `src/components/settings/THEME_USAGE_EXAMPLE.tsx`
- Docs: `src/components/settings/THEME_CUSTOMIZATION_README.md`
