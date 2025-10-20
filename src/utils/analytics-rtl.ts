/**
 * RTL (Right-to-Left) support utilities for Analytics Dashboard
 * Handles chart axes, text alignment, and layout mirroring for Arabic locale
 */

import { isRTL } from './rtl';

/**
 * Get chart layout configuration for RTL support
 */
export function getChartLayout(locale: string) {
  const rtl = isRTL(locale);

  return {
    // Reverse X-axis for RTL
    reverseXAxis: rtl,
    // Adjust margins for RTL
    margin: rtl
      ? { top: 5, right: 20, left: 30, bottom: 5 }
      : { top: 5, right: 30, left: 20, bottom: 5 },
    // Text anchor for labels
    textAnchor: rtl ? 'end' : 'start',
    // Legend alignment
    legendAlign: rtl ? 'right' : 'left',
  };
}

/**
 * Get axis configuration for RTL charts
 */
export function getAxisConfig(locale: string, axis: 'x' | 'y') {
  const rtl = isRTL(locale);

  if (axis === 'x') {
    return {
      reversed: rtl,
      orientation: rtl ? 'top' : 'bottom',
      tick: {
        textAnchor: (rtl ? 'end' : 'start') as 'end' | 'start',
      },
    };
  }

  // Y-axis remains the same for RTL
  return {
    reversed: false,
    orientation: rtl ? 'right' : 'left',
    tick: {
      textAnchor: (rtl ? 'start' : 'end') as 'start' | 'end',
    },
  };
}

/**
 * Get tooltip position for RTL
 */
export function getTooltipPosition(locale: string) {
  const rtl = isRTL(locale);

  return {
    cursor: rtl ? 'w-resize' : 'e-resize',
    position: rtl ? 'left' : 'right',
  };
}

/**
 * Get legend configuration for RTL
 */
export function getLegendConfig(locale: string) {
  const rtl = isRTL(locale);

  return {
    align: rtl ? 'right' : 'left',
    verticalAlign: 'top',
    layout: 'horizontal',
    iconType: 'line',
    wrapperStyle: {
      paddingLeft: rtl ? 0 : 20,
      paddingRight: rtl ? 20 : 0,
      direction: rtl ? 'rtl' : 'ltr',
    },
  };
}

/**
 * Get text direction class for chart containers
 */
export function getChartDirectionClass(locale: string): string {
  return isRTL(locale) ? 'rtl' : 'ltr';
}

/**
 * Get flex direction for chart controls
 */
export function getChartControlsClass(locale: string): string {
  const rtl = isRTL(locale);
  return rtl ? 'flex-row-reverse' : 'flex-row';
}

/**
 * Get text alignment for chart titles
 */
export function getChartTitleAlign(locale: string): string {
  const rtl = isRTL(locale);
  return rtl ? 'text-right' : 'text-left';
}

/**
 * Mirror icon transform for RTL (for arrows, chevrons, etc.)
 */
export function getIconTransform(
  locale: string,
  iconType: 'arrow' | 'chevron' | 'trend'
): string {
  const rtl = isRTL(locale);

  if (!rtl) return '';

  switch (iconType) {
    case 'arrow':
    case 'chevron':
      return 'scaleX(-1)';
    case 'trend':
      // Trend arrows should be mirrored
      return 'scaleX(-1)';
    default:
      return '';
  }
}

/**
 * Get spacing class for RTL (margin/padding)
 */
export function getSpacingClassRTL(
  property: 'margin' | 'padding',
  side: 'left' | 'right',
  value: string,
  locale: string
): string {
  const rtl = isRTL(locale);
  const prefix = property === 'margin' ? 'm' : 'p';

  // Swap left/right for RTL
  const actualSide = rtl
    ? side === 'left'
      ? 'r'
      : 'l'
    : side === 'left'
      ? 'l'
      : 'r';

  return `${prefix}${actualSide}-${value}`;
}

/**
 * Get grid column order for RTL
 */
export function getGridColumnOrder(locale: string, columns: number): string[] {
  const rtl = isRTL(locale);
  const order = Array.from({ length: columns }, (_, i) => `col-${i + 1}`);

  return rtl ? order.reverse() : order;
}

/**
 * Format number with locale-specific formatting
 */
export function formatChartNumber(
  value: number,
  locale: string,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format date for chart axes with locale support
 */
export function formatChartDate(
  date: Date | string,
  locale: string,
  format: 'short' | 'medium' | 'long' = 'short'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  const optionsMap: Record<string, Intl.DateTimeFormatOptions> = {
    short: { month: 'short', day: 'numeric' },
    medium: { month: 'short', day: 'numeric', year: 'numeric' },
    long: { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' },
  };

  const options = optionsMap[format];

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Get heatmap cell position for RTL
 */
export function getHeatmapCellPosition(
  dayIndex: number,
  hourIndex: number,
  cellWidth: number,
  cellHeight: number,
  locale: string
): { x: number; y: number } {
  const rtl = isRTL(locale);

  // For RTL, reverse the day order (right to left)
  const x = rtl ? (6 - dayIndex) * cellWidth : dayIndex * cellWidth;
  const y = hourIndex * cellHeight;

  return { x, y };
}

/**
 * Get bar chart orientation for RTL
 */
export function getBarChartOrientation(
  locale: string,
  categoryCount: number
): 'horizontal' | 'vertical' {
  // Use horizontal layout for >8 categories regardless of RTL
  // But adjust the direction based on locale
  return categoryCount > 8 ? 'horizontal' : 'vertical';
}

/**
 * Get pie chart label position for RTL
 */
export function getPieChartLabelPosition(locale: string) {
  const rtl = isRTL(locale);

  return {
    position: rtl ? 'insideLeft' : 'insideRight',
    textAnchor: rtl ? 'end' : 'start',
  };
}

/**
 * Get trend indicator direction for RTL
 */
export function getTrendIndicatorClass(
  direction: 'up' | 'down' | 'stable',
  locale: string
): string {
  const rtl = isRTL(locale);

  if (direction === 'stable') return '';

  // For RTL, we might want to mirror the trend arrows
  // But typically trend indicators (↑↓) are universal
  return '';
}

/**
 * Get KPI card layout class for RTL
 */
export function getKPICardLayoutClass(locale: string): string {
  const rtl = isRTL(locale);
  return rtl ? 'flex-row-reverse' : 'flex-row';
}

/**
 * Get filter panel position for RTL
 */
export function getFilterPanelPosition(locale: string): 'left' | 'right' {
  const rtl = isRTL(locale);
  return rtl ? 'right' : 'left';
}

/**
 * Get export button position for RTL
 */
export function getExportButtonClass(locale: string): string {
  const rtl = isRTL(locale);
  return rtl ? 'mr-auto' : 'ml-auto';
}

/**
 * Recharts-specific RTL configuration
 */
export function getRechartsRTLConfig(locale: string) {
  const rtl = isRTL(locale);

  return {
    // Layout direction
    layout: rtl ? ('rtl' as const) : ('ltr' as const),

    // Reverse data for line/area charts
    reverseStackOrder: rtl,

    // Tooltip configuration
    tooltip: {
      cursor: { strokeDasharray: '3 3' },
      contentStyle: {
        direction: rtl ? ('rtl' as const) : ('ltr' as const),
        textAlign: rtl ? ('right' as const) : ('left' as const),
      },
    },

    // Legend configuration
    legend: {
      align: rtl ? ('right' as const) : ('left' as const),
      wrapperStyle: {
        direction: rtl ? ('rtl' as const) : ('ltr' as const),
      },
    },

    // Axis configuration
    xAxis: {
      reversed: rtl,
      tick: { textAnchor: rtl ? ('end' as const) : ('start' as const) },
    },

    yAxis: {
      orientation: rtl ? ('right' as const) : ('left' as const),
      tick: { textAnchor: rtl ? ('start' as const) : ('end' as const) },
    },
  };
}
