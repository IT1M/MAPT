# Animation System Documentation

## Overview

This animation system provides a comprehensive set of animations and transitions for the application. All animations are optimized for 60fps performance using CSS transforms and opacity, and respect the user's `prefers-reduced-motion` preference.

## Files

- **`animations.css`** - CSS animation definitions and keyframes
- **`PageTransition.tsx`** - React components for page and content transitions
- **`useAnimation.ts`** - React hooks for managing animation state
- **`animations.ts`** - Central export point and utility functions

## Quick Start

### Import Animations

```typescript
import {
  PageTransition,
  useModalAnimation,
  ANIMATION_CLASSES,
} from '@/components/layout/animations';
```

### Basic Usage

#### Page Transitions

```tsx
import { PageTransition } from '@/components/layout/animations';

export default function Layout({ children }) {
  return <PageTransition>{children}</PageTransition>;
}
```

#### Modal Animations

```tsx
import { useModalAnimation } from '@/components/layout/animations';

function Modal({ isOpen, onClose, children }) {
  const { shouldRender, backdropClass, contentClass } =
    useModalAnimation(isOpen);

  if (!shouldRender) return null;

  return (
    <div className={`fixed inset-0 z-50 ${backdropClass}`}>
      <div className={`modal-content ${contentClass}`}>{children}</div>
    </div>
  );
}
```

#### Dropdown Animations

```tsx
import { useDropdownAnimation } from '@/components/layout/animations';

function Dropdown({ isOpen, children }) {
  const { shouldRender, animationClass } = useDropdownAnimation(isOpen);

  if (!shouldRender) return null;

  return <div className={`dropdown ${animationClass}`}>{children}</div>;
}
```

## Components

### PageTransition

Provides smooth fade transitions between page navigations.

```tsx
<PageTransition>
  <YourPageContent />
</PageTransition>
```

**Props:**

- `children: ReactNode` - Content to animate
- `className?: string` - Additional CSS classes

### FadeTransition

Simple fade transition for conditional content.

```tsx
<FadeTransition show={isVisible} duration={200}>
  <YourContent />
</FadeTransition>
```

**Props:**

- `children: ReactNode` - Content to animate
- `show?: boolean` - Whether to show content (default: true)
- `duration?: number` - Animation duration in ms (default: 200)
- `className?: string` - Additional CSS classes

### SlideTransition

Slide and fade transition for panels and drawers.

```tsx
<SlideTransition show={isOpen} direction="down" duration={300}>
  <YourPanel />
</SlideTransition>
```

**Props:**

- `children: ReactNode` - Content to animate
- `show?: boolean` - Whether to show content (default: true)
- `direction?: 'up' | 'down' | 'left' | 'right'` - Slide direction (default: 'down')
- `duration?: number` - Animation duration in ms (default: 300)
- `className?: string` - Additional CSS classes

### ScaleTransition

Scale transition for modals and popovers.

```tsx
<ScaleTransition show={isOpen} origin="top" duration={200}>
  <YourModal />
</ScaleTransition>
```

**Props:**

- `children: ReactNode` - Content to animate
- `show?: boolean` - Whether to show content (default: true)
- `duration?: number` - Animation duration in ms (default: 200)
- `origin?: 'center' | 'top' | 'bottom' | 'left' | 'right'` - Transform origin (default: 'center')
- `className?: string` - Additional CSS classes

### StaggerChildren

Animates list items with a delay between each.

```tsx
<StaggerChildren staggerDelay={50}>
  {items.map((item) => (
    <ListItem key={item.id} {...item} />
  ))}
</StaggerChildren>
```

**Props:**

- `children: ReactNode` - List items to animate
- `staggerDelay?: number` - Delay between items in ms (default: 50)
- `className?: string` - Additional CSS classes

## Hooks

### useReducedMotion

Detects if user prefers reduced motion.

```tsx
const prefersReducedMotion = useReducedMotion();

if (prefersReducedMotion) {
  // Skip animations
}
```

**Returns:** `boolean` - True if user prefers reduced motion

### useAnimationDuration

Gets animation duration based on reduced motion preference.

```tsx
const duration = useAnimationDuration(200);
// Returns 0 if user prefers reduced motion, 200 otherwise
```

**Parameters:**

- `defaultDuration: number` - Default duration in ms

**Returns:** `number` - Duration in ms (0 if reduced motion)

### useModalAnimation

Manages modal animation state.

```tsx
const { shouldRender, backdropClass, contentClass } = useModalAnimation(isOpen);
```

**Parameters:**

- `isOpen: boolean` - Whether modal is open

**Returns:**

- `shouldRender: boolean` - Whether to render modal in DOM
- `backdropClass: string` - CSS class for backdrop animation
- `contentClass: string` - CSS class for content animation

### useDropdownAnimation

Manages dropdown animation state.

```tsx
const { shouldRender, animationClass } = useDropdownAnimation(isOpen);
```

**Parameters:**

- `isOpen: boolean` - Whether dropdown is open

**Returns:**

- `shouldRender: boolean` - Whether to render dropdown in DOM
- `animationClass: string` - CSS class for animation

### useToastAnimation

Manages toast notification animation state.

```tsx
const { shouldRender, animationClass } = useToastAnimation(isVisible);
```

**Parameters:**

- `isVisible: boolean` - Whether toast is visible

**Returns:**

- `shouldRender: boolean` - Whether to render toast in DOM
- `animationClass: string` - CSS class for animation

### useShakeAnimation

Triggers shake animation (useful for errors).

```tsx
const { isShaking, shake, className } = useShakeAnimation();

// Trigger shake on error
if (error) {
  shake();
}

return <div className={className}>...</div>;
```

**Returns:**

- `isShaking: boolean` - Whether currently shaking
- `shake: () => void` - Function to trigger shake
- `className: string` - CSS class to apply

### useBounceAnimation

Triggers bounce animation (useful for attention).

```tsx
const { isBouncing, bounce, className } = useBounceAnimation();

// Trigger bounce on new notification
if (newNotification) {
  bounce();
}

return <div className={className}>...</div>;
```

**Returns:**

- `isBouncing: boolean` - Whether currently bouncing
- `bounce: () => void` - Function to trigger bounce
- `className: string` - CSS class to apply

### useScrollAnimation

Adds animation class when scrolled past threshold.

```tsx
const hasScrolled = useScrollAnimation(100);

return <header className={hasScrolled ? 'shadow-lg' : ''}>...</header>;
```

**Parameters:**

- `threshold?: number` - Scroll threshold in pixels (default: 100)

**Returns:** `boolean` - True if scrolled past threshold

### useStaggerAnimation

Manages stagger animation for list items.

```tsx
const visibleItems = useStaggerAnimation(items.length, 50);

return (
  <ul>
    {items.slice(0, visibleItems).map((item) => (
      <li key={item.id} className="list-item-enter">
        {item.name}
      </li>
    ))}
  </ul>
);
```

**Parameters:**

- `itemCount: number` - Total number of items
- `staggerDelay?: number` - Delay between items in ms (default: 50)

**Returns:** `number` - Number of items to show

## CSS Classes

### Page Transitions

- `page-transition-enter` - Fade in animation (200ms)
- `page-transition-exit` - Fade out animation (200ms)
- `page-slide-up` - Slide up with fade (300ms)

### Dropdown Animations

- `dropdown-enter` - Slide down animation (150ms)
- `dropdown-exit` - Slide up animation (150ms)
- `dropdown-scale-enter` - Scale in animation (150ms)

### Modal Animations

- `modal-backdrop-enter` - Backdrop fade in (200ms)
- `modal-backdrop-exit` - Backdrop fade out (200ms)
- `modal-content-enter` - Content scale in (200ms)
- `modal-content-exit` - Content scale out (200ms)
- `modal-mobile-enter` - Slide up from bottom (300ms)
- `modal-mobile-exit` - Slide down to bottom (300ms)

### Toast Animations

- `toast-enter` - Slide in from right (200ms)
- `toast-exit` - Slide out to right (200ms)

### Sidebar Animations

- `sidebar-enter` - Slide in from left (300ms)
- `sidebar-exit` - Slide out to left (300ms)
- `sidebar-transition` - Smooth width transition (300ms)

### Loading Animations

- `skeleton-pulse` - Pulse animation for skeletons
- `animate-spin` - Rotation animation for spinners
- `progress-indeterminate` - Indeterminate progress bar
- `dots-bounce` - Bouncing dots loader

### Micro-interactions

- `button-press` - Button press effect (150ms)
- `hover-lift` - Lift on hover with shadow
- `focus-ring-animate` - Animated focus ring

### Feedback Animations

- `animate-shake` - Shake animation for errors (500ms)
- `animate-bounce` - Bounce animation for attention (600ms)
- `animate-wiggle` - Wiggle animation (500ms)
- `checkmark-draw` - Checkmark draw animation (500ms)

### Badge Animations

- `badge-pulse` - Pulse animation for badges
- `bell-ring` - Bell ring animation for notifications

### List Animations

- `list-item-enter` - Fade in with slide up (300ms)
- `expand-height` - Expand height animation (300ms)
- `collapse-height` - Collapse height animation (300ms)

### Utility Classes

- `transition-smooth` - Smooth transition (200ms)
- `transition-fast` - Fast transition (150ms)
- `transition-slow` - Slow transition (300ms)
- `gpu-accelerated` - Enable GPU acceleration
- `will-animate` - Hint for upcoming animation
- `no-animation` - Disable all animations

## Constants

### Animation Durations

```typescript
import { ANIMATION_DURATION } from '@/components/layout/animations';

ANIMATION_DURATION.FAST; // 150ms
ANIMATION_DURATION.NORMAL; // 200ms
ANIMATION_DURATION.SLOW; // 300ms
ANIMATION_DURATION.VERY_SLOW; // 500ms
```

### Animation Easing

```typescript
import { ANIMATION_EASING } from '@/components/layout/animations';

ANIMATION_EASING.EASE_IN; // 'ease-in'
ANIMATION_EASING.EASE_OUT; // 'ease-out'
ANIMATION_EASING.EASE_IN_OUT; // 'ease-in-out'
ANIMATION_EASING.LINEAR; // 'linear'
ANIMATION_EASING.SPRING; // 'cubic-bezier(0.68, -0.55, 0.265, 1.55)'
```

## Utility Functions

### combineAnimationClasses

Combines multiple animation classes, filtering out falsy values.

```typescript
import { combineAnimationClasses } from '@/components/layout/animations';

const className = combineAnimationClasses(
  'base-class',
  isActive && 'active-class',
  isHovered && 'hover-class'
);
```

### getStaggerDelay

Creates stagger delay style for list items.

```typescript
import { getStaggerDelay } from '@/components/layout/animations'

<div style={getStaggerDelay(index, 50)}>
  {item.name}
</div>
```

### createTransitionStyle

Creates transition style object.

```typescript
import {
  createTransitionStyle,
  ANIMATION_EASING,
} from '@/components/layout/animations';

const style = createTransitionStyle(
  ['opacity', 'transform'],
  200,
  ANIMATION_EASING.EASE_OUT
);
```

## Performance Guidelines

### Do's

✅ Use CSS transforms and opacity for animations
✅ Keep animations under 300ms for most interactions
✅ Use `will-change` for elements that will animate
✅ Remove `will-change` after animation completes
✅ Respect `prefers-reduced-motion` preference
✅ Use GPU acceleration for smooth 60fps animations
✅ Test on low-end devices

### Don'ts

❌ Don't animate width, height, or position directly
❌ Don't use JavaScript for simple animations
❌ Don't chain too many animations
❌ Don't animate during page load
❌ Don't ignore reduced motion preference
❌ Don't use animations longer than 500ms
❌ Don't animate too many elements at once

## Accessibility

All animations respect the user's `prefers-reduced-motion` preference. When this preference is set, animations are either disabled or reduced to minimal duration (0.01ms).

### Testing Reduced Motion

**macOS:**
System Preferences → Accessibility → Display → Reduce motion

**Windows:**
Settings → Ease of Access → Display → Show animations

**Browser DevTools:**
Chrome/Edge: Rendering tab → Emulate CSS media feature prefers-reduced-motion

## Examples

### Complete Modal Example

```tsx
import { useModalAnimation } from '@/components/layout/animations';

function Modal({ isOpen, onClose, children }) {
  const { shouldRender, backdropClass, contentClass } =
    useModalAnimation(isOpen);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${backdropClass}`}
      onClick={onClose}
    >
      <div
        className={`bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full ${contentClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

### Complete Dropdown Example

```tsx
import { useDropdownAnimation } from '@/components/layout/animations';

function Dropdown({ isOpen, items }) {
  const { shouldRender, animationClass } = useDropdownAnimation(isOpen);

  if (!shouldRender) return null;

  return (
    <div
      className={`absolute top-full mt-2 bg-white rounded-lg shadow-lg ${animationClass}`}
    >
      {items.map((item) => (
        <button
          key={item.id}
          className="block w-full px-4 py-2 text-left hover:bg-gray-100"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
```

### Complete List with Stagger Example

```tsx
import { StaggerChildren } from '@/components/layout/animations';

function ItemList({ items }) {
  return (
    <StaggerChildren staggerDelay={50}>
      {items.map((item) => (
        <div key={item.id} className="p-4 bg-white rounded-lg shadow">
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}
    </StaggerChildren>
  );
}
```

## Browser Support

All animations use standard CSS and are supported in:

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

## Troubleshooting

### Animations not working

1. Check that `animations.css` is imported in `globals.css`
2. Verify the element has the correct animation class
3. Check browser console for CSS errors
4. Test with reduced motion disabled

### Animations are janky

1. Use CSS transforms instead of position/size changes
2. Add `gpu-accelerated` class for hardware acceleration
3. Reduce number of simultaneous animations
4. Check for layout thrashing in DevTools Performance tab

### Animations too fast/slow

1. Adjust duration using constants from `ANIMATION_DURATION`
2. Use appropriate easing from `ANIMATION_EASING`
3. Test on different devices and connection speeds

## Contributing

When adding new animations:

1. Add keyframes to `animations.css`
2. Create corresponding hook in `useAnimation.ts` if needed
3. Export from `animations.ts`
4. Add documentation to this README
5. Test with reduced motion enabled
6. Verify 60fps performance in DevTools
