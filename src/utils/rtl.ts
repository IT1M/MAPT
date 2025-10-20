/**
 * RTL (Right-to-Left) support utilities
 */

/**
 * Check if the current locale is RTL
 */
export function isRTL(locale: string): boolean {
  const rtlLocales = ['ar', 'he', 'fa', 'ur'];
  return rtlLocales.includes(locale.toLowerCase());
}

/**
 * Get text direction based on locale
 */
export function getTextDirection(locale: string): 'ltr' | 'rtl' {
  return isRTL(locale) ? 'rtl' : 'ltr';
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
  const dir = getTextDirection(locale);

  // Swap left/right for RTL
  if (dir === 'rtl') {
    if (side === 'left') side = 'right';
    else if (side === 'right') side = 'left';
  }

  const prefix = property === 'margin' ? 'm' : 'p';
  const sidePrefix = {
    left: 'l',
    right: 'r',
    top: 't',
    bottom: 'b',
  }[side];

  return `${prefix}${sidePrefix}-${value}`;
}

/**
 * Get flex direction for RTL
 */
export function getFlexDirection(
  direction: 'row' | 'row-reverse' | 'col' | 'col-reverse',
  locale: string
): string {
  const dir = getTextDirection(locale);

  if (dir === 'rtl') {
    if (direction === 'row') return 'flex-row-reverse';
    if (direction === 'row-reverse') return 'flex-row';
  }

  return `flex-${direction}`;
}

/**
 * Get text alignment for RTL
 */
export function getTextAlign(
  align: 'left' | 'right' | 'center' | 'justify',
  locale: string
): string {
  const dir = getTextDirection(locale);

  if (dir === 'rtl') {
    if (align === 'left') return 'text-right';
    if (align === 'right') return 'text-left';
  }

  return `text-${align}`;
}

/**
 * Get border radius classes for RTL
 */
export function getBorderRadiusClass(
  corner: 'tl' | 'tr' | 'bl' | 'br',
  value: string,
  locale: string
): string {
  const dir = getTextDirection(locale);

  if (dir === 'rtl') {
    if (corner === 'tl') corner = 'tr';
    else if (corner === 'tr') corner = 'tl';
    else if (corner === 'bl') corner = 'br';
    else if (corner === 'br') corner = 'bl';
  }

  const cornerMap = {
    tl: 'rounded-tl',
    tr: 'rounded-tr',
    bl: 'rounded-bl',
    br: 'rounded-br',
  };

  return `${cornerMap[corner]}-${value}`;
}

/**
 * Mirror transform for RTL (useful for icons)
 */
export function getMirrorTransform(locale: string): string {
  return isRTL(locale) ? 'scale(-1, 1)' : 'scale(1, 1)';
}

/**
 * Get appropriate icon rotation for RTL
 */
export function getIconRotation(locale: string): number {
  return isRTL(locale) ? 180 : 0;
}

/**
 * Format number for RTL locales
 */
export function formatNumber(num: number, locale: string): string {
  return new Intl.NumberFormat(locale).format(num);
}

/**
 * Format date for RTL locales
 */
export function formatDate(
  date: Date,
  locale: string,
  options?: Intl.DateTimeFormatOptions
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Get CSS logical properties for RTL support
 */
export function getLogicalProperty(
  property: 'margin' | 'padding' | 'border',
  side: 'inline-start' | 'inline-end' | 'block-start' | 'block-end',
  value: string
): string {
  return `${property}-${side}: ${value}`;
}

/**
 * Get directional class names for Tailwind CSS
 * Automatically handles RTL/LTR based on locale
 */
export function getDirectionalClasses(locale: string) {
  const rtl = isRTL(locale);

  return {
    // Text alignment
    textStart: rtl ? 'text-right' : 'text-left',
    textEnd: rtl ? 'text-left' : 'text-right',

    // Margins
    marginStart: rtl ? 'mr' : 'ml',
    marginEnd: rtl ? 'ml' : 'mr',

    // Padding
    paddingStart: rtl ? 'pr' : 'pl',
    paddingEnd: rtl ? 'pl' : 'pr',

    // Borders
    borderStart: rtl ? 'border-r' : 'border-l',
    borderEnd: rtl ? 'border-l' : 'border-r',

    // Rounded corners
    roundedStart: rtl ? 'rounded-r' : 'rounded-l',
    roundedEnd: rtl ? 'rounded-l' : 'rounded-r',
    roundedTopStart: rtl ? 'rounded-tr' : 'rounded-tl',
    roundedTopEnd: rtl ? 'rounded-tl' : 'rounded-tr',
    roundedBottomStart: rtl ? 'rounded-br' : 'rounded-bl',
    roundedBottomEnd: rtl ? 'rounded-bl' : 'rounded-br',

    // Flex direction
    flexRow: rtl ? 'flex-row-reverse' : 'flex-row',

    // Positioning
    left: rtl ? 'right' : 'left',
    right: rtl ? 'left' : 'right',

    // Transforms
    translateX: (value: number) => (rtl ? -value : value),
  };
}

/**
 * Apply RTL-aware inline styles
 */
export function getDirectionalStyle(
  property:
    | 'marginLeft'
    | 'marginRight'
    | 'paddingLeft'
    | 'paddingRight'
    | 'left'
    | 'right'
    | 'textAlign',
  value: string | number,
  locale: string
): Record<string, string | number> {
  const rtl = isRTL(locale);

  const propertyMap: Record<string, string> = {
    marginLeft: rtl ? 'marginRight' : 'marginLeft',
    marginRight: rtl ? 'marginLeft' : 'marginRight',
    paddingLeft: rtl ? 'paddingRight' : 'paddingLeft',
    paddingRight: rtl ? 'paddingLeft' : 'paddingRight',
    left: rtl ? 'right' : 'left',
    right: rtl ? 'left' : 'right',
    textAlign:
      value === 'left'
        ? rtl
          ? 'right'
          : 'left'
        : value === 'right'
          ? rtl
            ? 'left'
            : 'right'
          : (value as string),
  };

  const mappedProperty = propertyMap[property] || property;
  const mappedValue = property === 'textAlign' ? propertyMap[property] : value;

  return { [mappedProperty]: mappedValue };
}

/**
 * Get icon transform for RTL (useful for directional icons like arrows)
 */
export function getIconTransform(
  locale: string,
  shouldFlip = true
): React.CSSProperties {
  if (!shouldFlip) return {};

  return {
    transform: getMirrorTransform(locale),
  };
}

/**
 * Check if a number or date should remain LTR in RTL context
 */
export function shouldRemainLTR(content: string): boolean {
  // Check if content is primarily numbers or dates
  const numberPattern = /^[\d\s.,:/\-]+$/;
  return numberPattern.test(content);
}

/**
 * Wrap content with LTR direction if needed (for numbers/dates in RTL)
 */
export function wrapLTRIfNeeded(content: string, locale: string): string {
  if (isRTL(locale) && shouldRemainLTR(content)) {
    return `<span dir="ltr">${content}</span>`;
  }
  return content;
}
