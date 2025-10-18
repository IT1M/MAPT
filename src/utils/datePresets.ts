/**
 * Utility functions for date range presets
 */

export interface DateRange {
  startDate: Date
  endDate: Date
}

export type DatePresetType = 'today' | 'last7days' | 'last30days' | 'last90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom'

/**
 * Get date range for a preset
 */
export function getDateRangeForPreset(preset: DatePresetType): DateRange | null {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  switch (preset) {
    case 'today':
      return {
        startDate: today,
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      }
    
    case 'last7days':
      return {
        startDate: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      }
    
    case 'last30days':
      return {
        startDate: new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      }
    
    case 'last90days':
      return {
        startDate: new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000),
        endDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59),
      }
    
    case 'thisMonth':
      return {
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
      }
    
    case 'lastMonth': {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return {
        startDate: lastMonth,
        endDate: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59),
      }
    }
    
    case 'thisYear':
      return {
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: new Date(now.getFullYear(), 11, 31, 23, 59, 59),
      }
    
    case 'custom':
      return null
    
    default:
      return null
  }
}

/**
 * Get preset type from date range
 */
export function getPresetFromDateRange(startDate: Date | null, endDate: Date | null): DatePresetType {
  if (!startDate || !endDate) {
    return 'custom'
  }
  
  const presets: DatePresetType[] = ['today', 'last7days', 'last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisYear']
  
  for (const preset of presets) {
    const range = getDateRangeForPreset(preset)
    if (range && isSameDay(range.startDate, startDate) && isSameDay(range.endDate, endDate)) {
      return preset
    }
  }
  
  return 'custom'
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format date range for display
 */
export function formatDateRange(startDate: Date | null, endDate: Date | null, locale: string = 'en'): string {
  if (!startDate && !endDate) {
    return locale === 'ar' ? 'كل الأوقات' : 'All time'
  }
  
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
  
  const formatter = new Intl.DateTimeFormat(locale, options)
  
  if (startDate && endDate) {
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`
  }
  
  if (startDate) {
    return locale === 'ar' 
      ? `من ${formatter.format(startDate)}`
      : `From ${formatter.format(startDate)}`
  }
  
  if (endDate) {
    return locale === 'ar'
      ? `حتى ${formatter.format(endDate)}`
      : `Until ${formatter.format(endDate)}`
  }
  
  return ''
}

/**
 * Get preset label
 */
export function getPresetLabel(preset: DatePresetType, locale: string = 'en'): string {
  const labels: Record<DatePresetType, { en: string; ar: string }> = {
    today: { en: 'Today', ar: 'اليوم' },
    last7days: { en: 'Last 7 days', ar: 'آخر 7 أيام' },
    last30days: { en: 'Last 30 days', ar: 'آخر 30 يوم' },
    last90days: { en: 'Last 90 days', ar: 'آخر 90 يوم' },
    thisMonth: { en: 'This month', ar: 'هذا الشهر' },
    lastMonth: { en: 'Last month', ar: 'الشهر الماضي' },
    thisYear: { en: 'This year', ar: 'هذا العام' },
    custom: { en: 'Custom', ar: 'مخصص' },
  }
  
  return locale === 'ar' ? labels[preset].ar : labels[preset].en
}

/**
 * Get all available presets
 */
export function getAvailablePresets(): DatePresetType[] {
  return ['today', 'last7days', 'last30days', 'last90days', 'thisMonth', 'lastMonth', 'thisYear', 'custom']
}
