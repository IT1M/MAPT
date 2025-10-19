/**
 * Date Formatting Helpers
 * Centralized date formatting utilities using English locale
 */

import { formatDistanceToNow, format, parseISO } from 'date-fns'
import { enUS } from 'date-fns/locale'

/**
 * Format a date in various styles
 * @param date - Date to format (Date object or ISO string)
 * @param type - Format type: 'relative', 'short', 'long', 'full'
 * @returns Formatted date string
 */
export function formatDate(
  date: Date | string,
  type: 'relative' | 'short' | 'long' | 'full' = 'short'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  switch (type) {
    case 'relative':
      return formatDistanceToNow(d, { addSuffix: true, locale: enUS })
    case 'short':
      return format(d, 'MMM d, yyyy', { locale: enUS })
    case 'long':
      return format(d, 'MMMM d, yyyy', { locale: enUS })
    case 'full':
      return format(d, 'EEEE, MMMM d, yyyy', { locale: enUS })
    default:
      return d.toLocaleDateString('en-US')
  }
}

/**
 * Format a date with time
 * @param date - Date to format
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted date and time string
 */
export function formatDateTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const timeFormat = includeSeconds ? 'h:mm:ss a' : 'h:mm a'
  return format(d, `MMM d, yyyy ${timeFormat}`, { locale: enUS })
}

/**
 * Format time only
 * @param date - Date to format
 * @param includeSeconds - Whether to include seconds
 * @returns Formatted time string
 */
export function formatTime(
  date: Date | string,
  includeSeconds: boolean = false
): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  const timeFormat = includeSeconds ? 'h:mm:ss a' : 'h:mm a'
  return format(d, timeFormat, { locale: enUS })
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param date - Date to format
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  return formatDate(date, 'relative')
}
