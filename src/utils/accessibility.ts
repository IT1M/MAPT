/**
 * Accessibility utilities for analytics dashboard
 * Provides ARIA labels, keyboard navigation, and screen reader support
 */

// ============================================================================
// ARIA Label Generators
// ============================================================================

export function getChartAriaLabel(
  chartType: string,
  dataPoints: number,
  dateRange?: { start: string; end: string }
): string {
  const dateInfo = dateRange
    ? ` from ${dateRange.start} to ${dateRange.end}`
    : '';
  
  return `${chartType} chart with ${dataPoints} data points${dateInfo}. Use arrow keys to navigate data points, Tab to move between controls, and Escape to exit chart focus.`;
}

export function getKPIAriaLabel(
  title: string,
  value: string | number,
  trend?: { direction: 'up' | 'down' | 'stable'; percentage: number }
): string {
  const trendInfo = trend
    ? ` Trend: ${trend.direction} by ${trend.percentage.toFixed(1)} percent`
    : '';
  
  return `${title}: ${value}${trendInfo}. Press Enter or Space to filter dashboard by this metric.`;
}

export function getFilterAriaLabel(
  filterType: string,
  selectedCount: number,
  totalOptions: number
): string {
  return `${filterType} filter. ${selectedCount} of ${totalOptions} options selected. Press Enter to open filter menu.`;
}

// ============================================================================
// Keyboard Navigation
// ============================================================================

export interface KeyboardNavigationConfig {
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
  onEnter?: () => void;
  onSpace?: () => void;
  onEscape?: () => void;
  onTab?: () => void;
}

export function handleKeyboardNavigation(
  event: React.KeyboardEvent,
  config: KeyboardNavigationConfig
): void {
  const { key, shiftKey } = event;

  switch (key) {
    case 'ArrowUp':
      event.preventDefault();
      config.onArrowUp?.();
      break;
    case 'ArrowDown':
      event.preventDefault();
      config.onArrowDown?.();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      config.onArrowLeft?.();
      break;
    case 'ArrowRight':
      event.preventDefault();
      config.onArrowRight?.();
      break;
    case 'Enter':
      event.preventDefault();
      config.onEnter?.();
      break;
    case ' ':
      event.preventDefault();
      config.onSpace?.();
      break;
    case 'Escape':
      event.preventDefault();
      config.onEscape?.();
      break;
    case 'Tab':
      if (!shiftKey) {
        config.onTab?.();
      }
      break;
  }
}

// ============================================================================
// Screen Reader Announcements
// ============================================================================

export class ScreenReaderAnnouncer {
  private static instance: ScreenReaderAnnouncer;
  private liveRegion: HTMLDivElement | null = null;

  private constructor() {
    if (typeof window !== 'undefined') {
      this.createLiveRegion();
    }
  }

  static getInstance(): ScreenReaderAnnouncer {
    if (!ScreenReaderAnnouncer.instance) {
      ScreenReaderAnnouncer.instance = new ScreenReaderAnnouncer();
    }
    return ScreenReaderAnnouncer.instance;
  }

  private createLiveRegion(): void {
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('role', 'status');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    this.liveRegion.style.position = 'absolute';
    this.liveRegion.style.left = '-10000px';
    this.liveRegion.style.width = '1px';
    this.liveRegion.style.height = '1px';
    this.liveRegion.style.overflow = 'hidden';
    document.body.appendChild(this.liveRegion);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (!this.liveRegion) {
      this.createLiveRegion();
    }

    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      // Clear first to ensure announcement
      this.liveRegion.textContent = '';
      // Use setTimeout to ensure the change is detected
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = message;
        }
      }, 100);
    }
  }

  announceDataUpdate(chartType: string, dataPoints: number): void {
    this.announce(
      `${chartType} chart updated with ${dataPoints} data points`,
      'polite'
    );
  }

  announceFilterChange(filterType: string, value: string): void {
    this.announce(
      `Filter applied: ${filterType} set to ${value}`,
      'polite'
    );
  }

  announceError(message: string): void {
    this.announce(`Error: ${message}`, 'assertive');
  }

  announceSuccess(message: string): void {
    this.announce(message, 'polite');
  }
}

// ============================================================================
// Focus Management
// ============================================================================

export function trapFocus(element: HTMLElement): () => void {
  const focusableElements = element.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstFocusable = focusableElements[0];
  const lastFocusable = focusableElements[focusableElements.length - 1];

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable) {
        e.preventDefault();
        lastFocusable?.focus();
      }
    } else {
      if (document.activeElement === lastFocusable) {
        e.preventDefault();
        firstFocusable?.focus();
      }
    }
  };

  element.addEventListener('keydown', handleKeyDown);

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleKeyDown);
  };
}

export function restoreFocus(previousElement: HTMLElement | null): void {
  if (previousElement && document.body.contains(previousElement)) {
    previousElement.focus();
  }
}

// ============================================================================
// High Contrast Mode Detection
// ============================================================================

export function isHighContrastMode(): boolean {
  if (typeof window === 'undefined') return false;

  // Check for Windows High Contrast Mode
  const mediaQuery = window.matchMedia('(prefers-contrast: high)');
  return mediaQuery.matches;
}

// ============================================================================
// Color Contrast Utilities
// ============================================================================

export function getAccessibleColor(
  backgroundColor: string,
  lightColor: string = '#ffffff',
  darkColor: string = '#000000'
): string {
  // Simple contrast check - in production, use a proper contrast ratio calculator
  const bgLuminance = getRelativeLuminance(backgroundColor);
  return bgLuminance > 0.5 ? darkColor : lightColor;
}

function getRelativeLuminance(color: string): number {
  // Simplified luminance calculation
  // In production, use a proper color library
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

// ============================================================================
// Chart Data Table Generator
// ============================================================================

export interface TableColumn {
  key: string;
  label: string;
  format?: (value: any) => string;
}

export function generateDataTable(
  data: any[],
  columns: TableColumn[]
): string {
  const headers = columns.map((col) => col.label).join('\t');
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        return col.format ? col.format(value) : String(value);
      })
      .join('\t')
  );

  return [headers, ...rows].join('\n');
}
