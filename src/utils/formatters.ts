/**
 * Format a date according to the specified locale
 * @param date - The date to format
 * @param locale - The locale to use ('en' or 'ar')
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string | number,
  locale: 'en' | 'ar' = 'en',
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  }

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US'

  return new Intl.DateTimeFormat(localeCode, defaultOptions).format(dateObj)
}

/**
 * Format a date and time according to the specified locale
 * @param date - The date to format
 * @param locale - The locale to use ('en' or 'ar')
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string | number,
  locale: 'en' | 'ar' = 'en'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a date as a short date (e.g., 12/31/2023)
 * @param date - The date to format
 * @param locale - The locale to use ('en' or 'ar')
 * @returns Formatted short date string
 */
export function formatShortDate(
  date: Date | string | number,
  locale: 'en' | 'ar' = 'en'
): string {
  return formatDate(date, locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

/**
 * Format a number according to the specified locale
 * @param value - The number to format
 * @param locale - The locale to use ('en' or 'ar')
 * @param options - Intl.NumberFormatOptions for customization
 * @returns Formatted number string
 */
export function formatNumber(
  value: number,
  locale: 'en' | 'ar' = 'en',
  options?: Intl.NumberFormatOptions
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US'

  return new Intl.NumberFormat(localeCode, options).format(value)
}

/**
 * Format a number as a percentage
 * @param value - The number to format (0-1 or 0-100)
 * @param locale - The locale to use ('en' or 'ar')
 * @param asDecimal - Whether the value is a decimal (0-1) or percentage (0-100)
 * @returns Formatted percentage string
 */
export function formatPercentage(
  value: number,
  locale: 'en' | 'ar' = 'en',
  asDecimal: boolean = true
): string {
  const percentValue = asDecimal ? value : value / 100

  return formatNumber(percentValue, locale, {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

/**
 * Format a number as currency (Saudi Riyal)
 * @param amount - The amount to format
 * @param locale - The locale to use ('en' or 'ar')
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number,
  locale: 'en' | 'ar' = 'en'
): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return locale === 'ar' ? '٠٫٠٠ ر.س' : 'SAR 0.00'
  }

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US'

  return new Intl.NumberFormat(localeCode, {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format a large number with compact notation (e.g., 1.2K, 3.4M)
 * @param value - The number to format
 * @param locale - The locale to use ('en' or 'ar')
 * @returns Formatted compact number string
 */
export function formatCompactNumber(
  value: number,
  locale: 'en' | 'ar' = 'en'
): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0'
  }

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US'

  return new Intl.NumberFormat(localeCode, {
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}

/**
 * Format a relative time (e.g., "2 hours ago", "in 3 days")
 * @param date - The date to format
 * @param locale - The locale to use ('en' or 'ar')
 * @returns Formatted relative time string
 */
export function formatRelativeTime(
  date: Date | string | number,
  locale: 'en' | 'ar' = 'en'
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date'
  }

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000)

  const localeCode = locale === 'ar' ? 'ar-SA' : 'en-US'
  const rtf = new Intl.RelativeTimeFormat(localeCode, { numeric: 'auto' })

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ]

  for (const { unit, seconds } of units) {
    const value = Math.floor(Math.abs(diffInSeconds) / seconds)
    if (value >= 1) {
      return rtf.format(diffInSeconds < 0 ? value : -value, unit)
    }
  }

  return rtf.format(0, 'second')
}
