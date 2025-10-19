# Accessibility and Responsive Design Guide

## Overview

This document outlines the accessibility and responsive design implementation for the Saudi Mais Medical Inventory System, ensuring WCAG AA compliance and optimal user experience across all devices.

## Accessibility Features

### WCAG AA Compliance

#### Color Contrast
- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- Use `checkColorContrast()` utility to validate colors
- All UI components tested for contrast in both light and dark modes

#### Touch Targets
- **Minimum size**: 44x44 pixels for all interactive elements
- Adequate spacing between touch targets (minimum 8px)
- Use `validateTouchTarget()` to ensure compliance
- Mobile-optimized button and link sizes

#### Keyboard Navigation
- All interactive elements accessible via keyboard
- Visible focus indicators on all focusable elements
- Logical tab order throughout the application
- Skip links for main content navigation
- Roving tabindex for complex components (lists, grids)

#### Screen Reader Support
- Semantic HTML elements used throughout
- ARIA labels and descriptions where needed
- Live regions for dynamic content updates
- Proper heading hierarchy (h1-h6)
- Alternative text for all images
- Form labels associated with inputs

### Keyboard Shortcuts

#### Global Shortcuts
- `Ctrl/Cmd + K`: Open global search
- `Ctrl/Cmd + /`: Show keyboard shortcuts help
- `Escape`: Close modals and dialogs
- `G then D`: Go to Dashboard
- `G then E`: Go to Data Entry
- `G then L`: Go to Data Log
- `G then A`: Go to Analytics
- `G then S`: Go to Settings

#### Page-Specific Shortcuts
- `F`: Open filters
- `E`: Export data
- `R`: Refresh page
- `Arrow keys`: Navigate tables and lists
- `Enter`: Select/activate item
- `Ctrl/Cmd + S`: Save form

### Focus Management

#### Focus Trap
- Modals and dialogs trap focus within
- Tab cycles through focusable elements
- Shift+Tab moves backwards
- Escape closes and returns focus

#### Focus Restoration
- Focus restored to trigger element after modal closes
- Focus moved to first error on form validation
- Focus moved to new content after dynamic updates

### Screen Reader Announcements

#### Live Regions
- Polite announcements for non-critical updates
- Assertive announcements for errors and warnings
- Debounced announcements to prevent spam
- Clear, descriptive messages

#### Status Updates
- Form validation results announced
- Data loading states announced
- Success/error messages announced
- Filter and search results announced

## Responsive Design

### Breakpoints

```typescript
sm: 640px   // Small devices (phones)
md: 768px   // Medium devices (tablets)
lg: 1024px  // Large devices (laptops)
xl: 1280px  // Extra large devices (desktops)
2xl: 1536px // 2X large devices (large desktops)
```

### Mobile-First Approach

#### Layout
- Single column on mobile
- Two columns on tablet
- Three+ columns on desktop
- Collapsible sidebar on mobile
- Bottom navigation on mobile (optional)

#### Typography
- Responsive font sizes using clamp()
- Base: 14px mobile, 16px desktop
- Headings scale proportionally
- Line height adjusted for readability

#### Spacing
- Reduced padding on mobile
- Increased touch targets on mobile
- Adequate white space on all devices
- Responsive margins and gaps

### Touch Optimization

#### Gestures
- Swipe to delete (mobile)
- Pull to refresh (mobile)
- Pinch to zoom (where appropriate)
- Long press for context menu

#### Interactions
- Larger tap targets (44x44px minimum)
- Visual feedback on touch
- Prevent accidental taps
- Debounced actions

### Performance

#### Mobile Optimization
- Lazy loading images
- Code splitting by route
- Reduced bundle size
- Optimized images (WebP)
- Service worker caching

#### Network Awareness
- Offline support via PWA
- Reduced data usage on slow connections
- Progressive enhancement
- Graceful degradation

## Internationalization (i18n)

### RTL Support

#### Layout
- Automatic RTL layout for Arabic
- Mirrored icons and UI elements
- Proper text alignment
- Bidirectional text handling

#### CSS
- Logical properties (start/end vs left/right)
- RTL-specific styles when needed
- Direction-aware animations
- Flipped gradients and shadows

### Locale-Specific Features

#### Date and Time
- Locale-aware formatting
- Hijri calendar support for Arabic
- Timezone handling
- Relative time formatting

#### Numbers
- Locale-specific number formatting
- Currency formatting
- Percentage formatting
- Decimal separators

#### Text
- Translation keys for all UI text
- Pluralization rules
- Gender-specific translations
- Context-aware translations

## Implementation Guidelines

### Component Development

#### Accessibility Checklist
- [ ] Semantic HTML elements
- [ ] ARIA labels where needed
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Screen reader testing
- [ ] Color contrast validation
- [ ] Touch target size validation

#### Responsive Checklist
- [ ] Mobile layout tested
- [ ] Tablet layout tested
- [ ] Desktop layout tested
- [ ] Touch interactions work
- [ ] Keyboard interactions work
- [ ] Images optimized
- [ ] Performance tested

### Testing

#### Accessibility Testing
- **Automated**: axe DevTools, Lighthouse
- **Manual**: Keyboard navigation, screen reader
- **Tools**: NVDA, JAWS, VoiceOver
- **Checklist**: WCAG 2.1 AA criteria

#### Responsive Testing
- **Devices**: iPhone, iPad, Android phones/tablets
- **Browsers**: Chrome, Safari, Firefox, Edge
- **Orientations**: Portrait and landscape
- **Viewports**: 320px to 2560px

### Best Practices

#### Do's
✅ Use semantic HTML
✅ Provide alternative text
✅ Test with keyboard only
✅ Test with screen reader
✅ Validate color contrast
✅ Use responsive units (rem, em, %)
✅ Implement skip links
✅ Provide focus indicators
✅ Use ARIA when needed
✅ Test on real devices

#### Don'ts
❌ Rely on color alone
❌ Use fixed pixel sizes
❌ Disable zoom
❌ Remove focus outlines
❌ Use placeholder as label
❌ Auto-play media
❌ Use ARIA unnecessarily
❌ Ignore keyboard users
❌ Assume mouse/touch only
❌ Skip accessibility testing

## Utilities

### Accessibility Utilities

```typescript
// Check color contrast
checkColorContrast('#000000', '#FFFFFF') // { ratio: 21, passes: true }

// Validate touch target
validateTouchTarget(element) // boolean

// Generate ARIA label
generateAriaLabel({
  component: 'Button',
  state: 'pressed',
  description: 'Submit form'
})

// Create skip link
createSkipLink('main-content', 'Skip to main content')

// Setup roving tabindex
new RovingTabindexManager(container, '.list-item')

// Announce to screen reader
const announcer = new LiveRegionAnnouncer('polite')
announcer.announce('Data loaded successfully')
```

### Responsive Utilities

```typescript
// Get current breakpoint
getCurrentBreakpoint() // 'md' | 'lg' | etc.

// Check device type
isMobile() // boolean
isTablet() // boolean
isDesktop() // boolean
isTouchDevice() // boolean

// Get responsive value
getResponsiveValue({
  base: '1rem',
  md: '1.25rem',
  lg: '1.5rem'
})

// Generate responsive classes
responsiveClass({
  base: 'text-sm',
  md: 'text-base',
  lg: 'text-lg'
})

// Fix mobile viewport height
fixMobileViewportHeight()

// Get safe area insets
getSafeAreaInsets() // { top, right, bottom, left }
```

## Resources

### Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [WAVE](https://wave.webaim.org/)
- [Color Contrast Analyzer](https://www.tpgi.com/color-contrast-checker/)

### Testing
- [NVDA Screen Reader](https://www.nvaccess.org/)
- [JAWS Screen Reader](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/)
- [BrowserStack](https://www.browserstack.com/)

## Support

For accessibility issues or questions, contact the development team or file an issue in the project repository.
