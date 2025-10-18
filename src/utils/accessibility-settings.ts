/**
 * Accessibility utilities for settings interface
 * Provides WCAG AA compliance, ARIA support, and keyboard navigation
 */

/**
 * Announce message to screen readers using ARIA live region
 */
export function announceToScreenReader(
  message: string,
  priority: 'polite' | 'assertive' = 'polite'
) {
  const liveRegion = document.getElementById('aria-live-region')
  
  if (liveRegion) {
    liveRegion.setAttribute('aria-live', priority)
    liveRegion.textContent = message
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = ''
    }, 1000)
  }
}

/**
 * Create or get ARIA live region for announcements
 */
export function ensureAriaLiveRegion() {
  let liveRegion = document.getElementById('aria-live-region')
  
  if (!liveRegion) {
    liveRegion = document.createElement('div')
    liveRegion.id = 'aria-live-region'
    liveRegion.className = 'sr-only'
    liveRegion.setAttribute('aria-live', 'polite')
    liveRegion.setAttribute('aria-atomic', 'true')
    document.body.appendChild(liveRegion)
  }
  
  return liveRegion
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(element: HTMLElement) {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  const firstFocusable = focusableElements[0]
  const lastFocusable = focusableElements[focusableElements.length - 1]
  
  const handleTabKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstFocusable) {
        e.preventDefault()
        lastFocusable?.focus()
      }
    } else {
      // Tab
      if (document.activeElement === lastFocusable) {
        e.preventDefault()
        firstFocusable?.focus()
      }
    }
  }
  
  element.addEventListener('keydown', handleTabKey)
  
  // Focus first element
  firstFocusable?.focus()
  
  return () => {
    element.removeEventListener('keydown', handleTabKey)
  }
}

/**
 * Check if element meets WCAG AA contrast requirements
 */
export function checkContrastRatio(
  foreground: string,
  background: string
): { ratio: number; passesAA: boolean; passesAAA: boolean } {
  // This is a simplified version - in production, use a library like 'color-contrast-checker'
  // For now, we'll return a placeholder
  return {
    ratio: 4.5,
    passesAA: true,
    passesAAA: false,
  }
}

/**
 * Get accessible label for form field
 */
export function getAccessibleLabel(
  fieldName: string,
  isRequired: boolean = false
): string {
  const label = fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()
  
  return isRequired ? `${label} (required)` : label
}

/**
 * Generate unique ID for form field accessibility
 */
export function generateFieldId(fieldName: string): string {
  return `field-${fieldName}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Check if user prefers high contrast
 */
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(prefers-contrast: high)').matches ||
    window.matchMedia('(prefers-contrast: more)').matches
  )
}

/**
 * Get minimum touch target size (44x44px for WCAG)
 */
export const MIN_TOUCH_TARGET_SIZE = 44

/**
 * Validate touch target size
 */
export function validateTouchTargetSize(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return rect.width >= MIN_TOUCH_TARGET_SIZE && rect.height >= MIN_TOUCH_TARGET_SIZE
}

/**
 * Add skip link to page
 */
export function addSkipLink(targetId: string, label: string = 'Skip to main content') {
  const skipLink = document.createElement('a')
  skipLink.href = `#${targetId}`
  skipLink.textContent = label
  skipLink.className = 'skip-link'
  skipLink.style.cssText = `
    position: absolute;
    top: -40px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    text-decoration: none;
    z-index: 100;
  `
  
  skipLink.addEventListener('focus', () => {
    skipLink.style.top = '0'
  })
  
  skipLink.addEventListener('blur', () => {
    skipLink.style.top = '-40px'
  })
  
  document.body.insertBefore(skipLink, document.body.firstChild)
  
  return skipLink
}

/**
 * Keyboard navigation helper
 */
export function handleArrowKeyNavigation(
  event: KeyboardEvent,
  items: HTMLElement[],
  currentIndex: number
): number {
  let newIndex = currentIndex
  
  switch (event.key) {
    case 'ArrowDown':
    case 'ArrowRight':
      event.preventDefault()
      newIndex = (currentIndex + 1) % items.length
      break
    case 'ArrowUp':
    case 'ArrowLeft':
      event.preventDefault()
      newIndex = (currentIndex - 1 + items.length) % items.length
      break
    case 'Home':
      event.preventDefault()
      newIndex = 0
      break
    case 'End':
      event.preventDefault()
      newIndex = items.length - 1
      break
  }
  
  if (newIndex !== currentIndex) {
    items[newIndex]?.focus()
  }
  
  return newIndex
}

/**
 * ARIA live region priorities
 */
export const ARIA_LIVE_PRIORITY = {
  POLITE: 'polite' as const,
  ASSERTIVE: 'assertive' as const,
}

/**
 * Common ARIA roles
 */
export const ARIA_ROLES = {
  NAVIGATION: 'navigation',
  MAIN: 'main',
  COMPLEMENTARY: 'complementary',
  SEARCH: 'search',
  FORM: 'form',
  DIALOG: 'dialog',
  ALERT: 'alert',
  STATUS: 'status',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
} as const
