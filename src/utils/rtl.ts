/**
 * RTL (Right-to-Left) support utilities
 */

/**
 * Check if the current locale is RTL
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur']
  return rtlLocales.includes(locale.toLowerCase())
}

/**
 * Get text direction based on locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr'
}

/**
 * Get appropriate margin/padding class for RTL
 */
export function getSpacingClass(
  property: 'margin' | 'padding',
  side: 'left' | 'right' | 'top' | 'bottom',
  value: string,
  locale: string
): string {
  const dir = getTextDirection(locale)
  
  // Swap left/right for RTL
  if (dir === 'rtl') {
    if (side === 'left') side = 'right'
    else if (side === 'right') side = 'left'
  }
  
  const prefix = property === 'margin' ? 'm' : 'p'
  const sidePrefix = {
    left: 'l',
    right: 'r',
    top: 't',
    bottom: 'b',
  }[side]
  
  return `${prefix}${sidePrefix}-${value}`
}

/**
 * Get flex direction for RTL
 */
export function getFlexDirection(
  direction: 'row' | 'row-reverse' | 'col' | 'col-reverse',
  locale: string
): string {
  const dir = getTextDirection(locale)
  
  if (dir === 'rtl') {
    if (direction === 'row') return 'flex-row-reverse'
    if (direction === 'row-reverse') return 'flex-row'
  }
  
  return `flex-${direction}`
}

/**
 * Get text alignment for RTL
 */
export function getTextAlign(
  align: 'left' | 'right' | 'center' | 'justify',
  locale: string
): string {
  const dir = getTextDirection(locale)
  
  if (dir === 'rtl') {
    if (align === 'left') return 'text-right'
    if (align === 'right') return 'text-left'
  }
  
  return `text-${align}`
}

/**
 * Get border radius classes for RTL
 */
export function getBorderRadiusClass(
  corner: 'tl' | 'tr' | 'bl' | 'br',
  value: string,
  locale: string
): string {
  const dir = getTextDirection(locale)
  
  if (dir === 'rtl') {
    if (corner === 'tl') corner = 'tr'
    else if (corner === 'tr') corner = 'tl'
    else if (corner === 'bl') corner = 'br'
    else if (corner === 'br') corner = 'bl'
  }
  
  const cornerMap = {
    tl: 'rounded-tl',
    tr: 'rounded-tr',
    bl: 'rounded-bl',
    br: 'rounded-br',
  }
  
  return `${cornerMap[corner]}-${value}`
}

/**
 * Mirror transform for RTL (useful for icons)
 */
export function getMirrorTransform(locale: string): string {
  return isRTL(locale) ? 'scale(-1, 1)' : 'scale(1, 1)'
}

/**
 * Get appropriate icon rotation for RTL
 */
export function getIconRotation(locale: string): number {
  return isRTL(locale) ? 180 : 0
}

/**
 * Format number for RTL locales
 */
export function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(num)
}

/**
 * Format date for RTL locales
 */
export function formatDate(date: Date, locale: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options).format(date)
}

/**
 * Get CSS logical properties for RTL support
 */
export function getLogicalProperty(
  property: 'margin' | 'padding' | 'border',
  side: 'inline-start' | 'inline-end' | 'block-start' | 'block-end',
  value: string
): string {
  return `${property}-${side}: ${value}`
}
