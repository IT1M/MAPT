# Theme Customization Integration Guide

## Quick Start

### 1. Add ThemeCustomizer to Settings Page

```tsx
// src/app/[locale]/settings/appearance/page.tsx
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';

export default function AppearanceSettingsPage() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <ThemeCustomizer />
    </div>
  );
}
```

### 2. Add Quick Theme Switcher to Header

```tsx
// src/components/layout/Header.tsx
import { QuickThemeSwitcher } from '@/components/settings/THEME_USAGE_EXAMPLE';

export function Header() {
  return (
    <header className="flex items-center justify-between p-4">
      <div>Logo</div>
      <div className="flex items-center gap-4">
        <QuickThemeSwitcher />
        {/* Other header items */}
      </div>
    </header>
  );
}
```

### 3. Use Theme Classes in Components

```tsx
// Any component
export function MyComponent() {
  return (
    <div className="theme-card">
      <h2 className="theme-primary">Title</h2>
      <button className="theme-button-primary">Action</button>
    </div>
  );
}
```

## Integration Steps

### Step 1: Verify CSS Import

Ensure `theme-customization.css` is imported in `globals.css`:

```css
/* src/app/globals.css */
@import '../styles/theme-customization.css';
```

### Step 2: Add to Settings Navigation

Update your settings navigation to include the theme customizer:

```tsx
// src/components/settings/SettingsNavigation.tsx
const navigationItems = [
  // ... other items
  {
    id: 'appearance',
    label: 'Appearance',
    icon: '🎨',
    href: '/settings/appearance',
  },
];
```

### Step 3: Create Appearance Settings Page

```tsx
// src/app/[locale]/settings/appearance/page.tsx
import { ThemeCustomizer } from '@/components/settings/ThemeCustomizer';

export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Appearance</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Customize how the application looks and feels
        </p>
      </div>

      <ThemeCustomizer />
    </div>
  );
}
```

### Step 4: Update Existing Components

Replace hardcoded colors with theme variables:

**Before:**

```tsx
<button className="bg-blue-600 text-white px-4 py-2 rounded">Click me</button>
```

**After:**

```tsx
<button className="theme-button-primary">Click me</button>
```

Or use CSS variables:

```tsx
<button
  style={{
    backgroundColor: 'var(--theme-primary)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '0.375rem',
  }}
>
  Click me
</button>
```

### Step 5: Update Chart Components

Make charts use theme colors:

```tsx
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

function MyChart() {
  const { currentTheme } = useThemeCustomization();

  const chartOptions = {
    colors: [
      currentTheme.colors.primary,
      currentTheme.colors.secondary,
      currentTheme.colors.accent,
    ],
    // ... other options
  };

  return <Chart options={chartOptions} />;
}
```

### Step 6: Add Density Support

Wrap layouts with density-aware containers:

```tsx
<div className="grid grid-cols-3" style={{ gap: 'var(--theme-gap)' }}>
  <div className="theme-card">Card 1</div>
  <div className="theme-card">Card 2</div>
  <div className="theme-card">Card 3</div>
</div>
```

## Advanced Integration

### Custom Theme Provider (Optional)

If you need theme context throughout your app:

```tsx
// src/contexts/ThemeContext.tsx
'use client';

import React, { createContext, useContext } from 'react';
import { useThemeCustomization } from '@/hooks/useThemeCustomization';
import type { Theme } from '@/config/themes';

interface ThemeContextValue {
  theme: Theme;
  updateTheme: (theme: Theme) => void;
  // ... other methods
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeCustomization = useThemeCustomization();

  return (
    <ThemeContext.Provider value={themeCustomization}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
```

Then wrap your app:

```tsx
// src/app/layout.tsx
import { ThemeProvider } from '@/contexts/ThemeContext';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

### Programmatic Theme Updates

```tsx
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

function AdminPanel() {
  const { updateColors, selectPreset } = useThemeCustomization();

  const applyCompanyBranding = () => {
    updateColors({
      primary: '#company-primary',
      secondary: '#company-secondary',
    });
  };

  return <button onClick={applyCompanyBranding}>Apply Company Branding</button>;
}
```

### Theme-Aware Animations

```tsx
function AnimatedComponent() {
  return (
    <div className="theme-transition-transform hover:scale-105">
      {/* This will respect animation settings */}
      Hover me
    </div>
  );
}
```

### Responsive Theme Adjustments

```tsx
import { useThemeCustomization } from '@/hooks/useThemeCustomization';
import { useMediaQuery } from '@/hooks/useMediaQuery';

function ResponsiveComponent() {
  const { updateDensity } = useThemeCustomization();
  const isMobile = useMediaQuery('(max-width: 768px)');

  React.useEffect(() => {
    if (isMobile) {
      updateDensity('compact');
    }
  }, [isMobile, updateDensity]);

  return <div>Content</div>;
}
```

## Migration Guide

### Migrating Existing Components

1. **Identify hardcoded colors:**

   ```bash
   # Search for hardcoded Tailwind colors
   grep -r "bg-blue-" src/components
   grep -r "text-blue-" src/components
   ```

2. **Replace with theme classes:**
   - `bg-blue-600` → `theme-bg-primary`
   - `text-blue-600` → `theme-primary`
   - `border-blue-600` → `theme-border-primary`

3. **Update custom styles:**

   ```css
   /* Before */
   .my-component {
     background-color: #0d9488;
   }

   /* After */
   .my-component {
     background-color: var(--theme-primary);
   }
   ```

4. **Test with different themes:**
   - Apply each preset theme
   - Verify colors look good
   - Check contrast ratios
   - Test in dark mode

### Migrating Charts

```tsx
// Before
const chartColors = ['#0d9488', '#06b6d4', '#3b82f6'];

// After
import { useThemeCustomization } from '@/hooks/useThemeCustomization';

function MyChart() {
  const { currentTheme } = useThemeCustomization();
  const chartColors = [
    currentTheme.colors.primary,
    currentTheme.colors.secondary,
    currentTheme.colors.accent,
  ];

  // Use chartColors in your chart
}
```

## Testing Checklist

- [ ] Theme customizer loads without errors
- [ ] All preset themes can be selected
- [ ] Color picker updates work
- [ ] Font family changes apply
- [ ] Font size adjustments work
- [ ] Density changes affect layout
- [ ] Animation toggle works
- [ ] Animation speed changes apply
- [ ] Export theme downloads JSON
- [ ] Import theme from file works
- [ ] Share code generation works
- [ ] Import from share code works
- [ ] Cross-tab synchronization works
- [ ] Theme persists after page reload
- [ ] Theme works in dark mode
- [ ] Responsive design works on mobile
- [ ] Accessibility features work
- [ ] Print styles work correctly

## Troubleshooting

### Theme not applying

**Problem:** Theme changes don't appear

**Solutions:**

1. Check if CSS file is imported in globals.css
2. Clear browser cache
3. Check browser console for errors
4. Verify localStorage is enabled

### Colors not updating

**Problem:** Color changes don't take effect

**Solutions:**

1. Check if CSS variables are being overridden
2. Verify color format is valid hex
3. Inspect element to see computed styles
4. Try hard refresh (Ctrl+Shift+R)

### Cross-tab sync not working

**Problem:** Theme changes don't sync across tabs

**Solutions:**

1. Check if localStorage is enabled
2. Verify same origin policy
3. Check browser console for errors
4. Try closing and reopening tabs

### Performance issues

**Problem:** Theme changes are slow

**Solutions:**

1. Disable animations temporarily
2. Reduce number of themed elements
3. Use CSS classes instead of inline styles
4. Optimize component re-renders

## Best Practices

1. **Use theme classes when possible:**

   ```tsx
   // Good
   <button className="theme-button-primary">Click</button>

   // Avoid
   <button style={{ backgroundColor: currentTheme.colors.primary }}>Click</button>
   ```

2. **Group theme-related styles:**

   ```css
   .my-component {
     background-color: var(--theme-card);
     color: var(--theme-cardForeground);
     border: 1px solid var(--theme-border);
     padding: var(--theme-padding);
   }
   ```

3. **Test with all presets:**
   - Ensure your components look good with all preset themes
   - Check contrast ratios for accessibility
   - Test in both light and dark modes

4. **Respect user preferences:**
   - Honor `prefers-reduced-motion`
   - Honor `prefers-contrast`
   - Provide fallbacks for older browsers

5. **Document custom theme usage:**
   - Add comments for complex theme integrations
   - Document any custom CSS variables
   - Provide examples in component documentation

## Support

For issues or questions:

1. Check the README: `THEME_CUSTOMIZATION_README.md`
2. Review usage examples: `THEME_USAGE_EXAMPLE.tsx`
3. Test on the demo page: `/theme-test`
4. Check browser console for errors
5. Verify all dependencies are installed

## Future Enhancements

Planned features:

- [ ] Dark mode variants for each preset
- [ ] More preset themes
- [ ] Theme marketplace
- [ ] Advanced color palette generation
- [ ] Gradient support
- [ ] Custom font upload
- [ ] Theme preview before applying
- [ ] Scheduled theme switching
- [ ] Theme analytics
- [ ] A/B testing support
