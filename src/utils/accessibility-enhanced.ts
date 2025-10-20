/**
 * Enhanced Accessibility Utilities
 * Comprehensive ARIA support, keyboard navigation, and WCAG AA compliance
 */

/**
 * Touch target size validator (WCAG 2.1 Level AAA: 44x44px minimum)
 */
export function validateTouchTarget(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return rect.width >= 44 && rect.height >= 44;
}

/**
 * Add touch-friendly class to elements
 */
export function ensureTouchTargetSize(selector: string): void {
  if (typeof document === 'undefined') return;

  const elements = document.querySelectorAll(selector);
  elements.forEach((element) => {
    const htmlElement = element as HTMLElement;
    if (!validateTouchTarget(htmlElement)) {
      htmlElement.classList.add('min-w-[44px]', 'min-h-[44px]');
    }
  });
}

/**
 * Color contrast checker (WCAG AA: 4.5:1 for normal text, 3:1 for large text)
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  isLargeText = false
): { ratio: number; passes: boolean } {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  const ratio = (lighter + 0.05) / (darker + 0.05);
  const requiredRatio = isLargeText ? 3 : 4.5;

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes: ratio >= requiredRatio,
  };
}

function getRelativeLuminance(color: string): number {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const [rs, gs, bs] = [r, g, b].map((c) => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Generate comprehensive ARIA labels for complex components
 */
export function generateAriaLabel(config: {
  component: string;
  state?: string;
  value?: string | number;
  total?: number;
  position?: number;
  description?: string;
}): string {
  const parts: string[] = [config.component];

  if (config.state) parts.push(config.state);
  if (config.value !== undefined) parts.push(`value ${config.value}`);
  if (config.total !== undefined && config.position !== undefined) {
    parts.push(`${config.position} of ${config.total}`);
  }
  if (config.description) parts.push(config.description);

  return parts.join(', ');
}

/**
 * Skip link component for keyboard navigation
 */
export function createSkipLink(
  targetId: string,
  label: string
): HTMLAnchorElement {
  const skipLink = document.createElement('a');
  skipLink.href = `#${targetId}`;
  skipLink.textContent = label;
  skipLink.className =
    'sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded';

  skipLink.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  return skipLink;
}

/**
 * Roving tabindex manager for keyboard navigation in lists
 */
export class RovingTabindexManager {
  private items: HTMLElement[];
  private currentIndex: number = 0;

  constructor(container: HTMLElement, itemSelector: string) {
    this.items = Array.from(container.querySelectorAll(itemSelector));
    this.initialize();
  }

  private initialize(): void {
    this.items.forEach((item, index) => {
      item.setAttribute('tabindex', index === 0 ? '0' : '-1');
      item.addEventListener('keydown', (e) =>
        this.handleKeyDown(e as KeyboardEvent, index)
      );
      item.addEventListener('focus', () => this.setCurrentIndex(index));
    });
  }

  private handleKeyDown(event: KeyboardEvent, index: number): void {
    let newIndex = index;

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        newIndex = (index + 1) % this.items.length;
        break;
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = (index - 1 + this.items.length) % this.items.length;
        break;
      case 'Home':
        event.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        event.preventDefault();
        newIndex = this.items.length - 1;
        break;
      default:
        return;
    }

    this.focusItem(newIndex);
  }

  private focusItem(index: number): void {
    this.items[this.currentIndex].setAttribute('tabindex', '-1');
    this.items[index].setAttribute('tabindex', '0');
    this.items[index].focus();
    this.currentIndex = index;
  }

  private setCurrentIndex(index: number): void {
    this.currentIndex = index;
  }

  destroy(): void {
    this.items.forEach((item) => {
      item.removeAttribute('tabindex');
    });
  }
}

/**
 * Announce live region updates with debouncing
 */
export class LiveRegionAnnouncer {
  private liveRegion: HTMLDivElement | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;

  constructor(priority: 'polite' | 'assertive' = 'polite') {
    if (typeof document !== 'undefined') {
      this.createLiveRegion(priority);
    }
  }

  private createLiveRegion(priority: 'polite' | 'assertive'): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', priority);
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, debounce = 300): void {
    if (!this.liveRegion) return;

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      if (this.liveRegion) {
        this.liveRegion.textContent = '';
        setTimeout(() => {
          if (this.liveRegion) {
            this.liveRegion.textContent = message;
          }
        }, 50);
      }
    }, debounce);
  }

  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}

/**
 * Focus visible utility (only show focus ring for keyboard navigation)
 */
export function setupFocusVisible(): void {
  if (typeof document === 'undefined') return;

  let hadKeyboardEvent = false;

  const handleKeyDown = () => {
    hadKeyboardEvent = true;
  };

  const handleMouseDown = () => {
    hadKeyboardEvent = false;
  };

  const handleFocus = (e: FocusEvent) => {
    const target = e.target as HTMLElement;
    if (hadKeyboardEvent) {
      target.classList.add('focus-visible');
    } else {
      target.classList.remove('focus-visible');
    }
  };

  document.addEventListener('keydown', handleKeyDown, true);
  document.addEventListener('mousedown', handleMouseDown, true);
  document.addEventListener('focus', handleFocus, true);
}

/**
 * Reduced motion preference detector
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Apply reduced motion styles
 */
export function applyReducedMotion(): void {
  if (prefersReducedMotion()) {
    document.documentElement.classList.add('reduce-motion');
  }
}

/**
 * Screen reader only text utility
 */
export function createSROnlyText(text: string): HTMLSpanElement {
  const span = document.createElement('span');
  span.className = 'sr-only';
  span.textContent = text;
  return span;
}

/**
 * Validate form accessibility
 */
export function validateFormAccessibility(form: HTMLFormElement): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check all inputs have labels
  const inputs = form.querySelectorAll('input, select, textarea');
  inputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement;
    const id = htmlInput.id;
    const label = form.querySelector(`label[for="${id}"]`);
    const ariaLabel = htmlInput.getAttribute('aria-label');
    const ariaLabelledby = htmlInput.getAttribute('aria-labelledby');

    if (!label && !ariaLabel && !ariaLabelledby) {
      issues.push(
        `Input "${htmlInput.name || htmlInput.type}" is missing a label`
      );
    }
  });

  // Check required fields have aria-required
  const requiredInputs = form.querySelectorAll('[required]');
  requiredInputs.forEach((input) => {
    const htmlInput = input as HTMLInputElement;
    if (!htmlInput.hasAttribute('aria-required')) {
      issues.push(
        `Required input "${htmlInput.name}" is missing aria-required attribute`
      );
    }
  });

  // Check error messages are associated
  const errorMessages = form.querySelectorAll('[role="alert"]');
  errorMessages.forEach((error) => {
    const htmlError = error as HTMLElement;
    const describedBy = htmlError.id;
    const associatedInput = form.querySelector(
      `[aria-describedby="${describedBy}"]`
    );

    if (!associatedInput) {
      issues.push(
        `Error message "${htmlError.textContent}" is not associated with any input`
      );
    }
  });

  return {
    valid: issues.length === 0,
    issues,
  };
}

/**
 * Generate accessible table markup
 */
export function makeTableAccessible(table: HTMLTableElement): void {
  // Add role if not present
  if (!table.hasAttribute('role')) {
    table.setAttribute('role', 'table');
  }

  // Add caption if missing
  if (!table.querySelector('caption')) {
    const caption = document.createElement('caption');
    caption.className = 'sr-only';
    caption.textContent = 'Data table';
    table.insertBefore(caption, table.firstChild);
  }

  // Add scope to headers
  const headers = table.querySelectorAll('th');
  headers.forEach((th) => {
    if (!th.hasAttribute('scope')) {
      const isColumnHeader =
        th.parentElement?.parentElement?.tagName === 'THEAD';
      th.setAttribute('scope', isColumnHeader ? 'col' : 'row');
    }
  });
}
