import { describe, it, expect } from 'vitest'
import {
  getDateRangeForPreset,
  getPresetFromDateRange,
  formatDateRange,
  getPresetLabel,
  getAvailablePresets,
} from '../datePresets'

describe('datePresets', () => {
  describe('getDateRangeForPreset', () => {
    it('returns correct range for today', () => {
      const range = getDateRangeForPreset('today')
      expect(range).toBeTruthy()
      
      const today = new Date()
      expect(range!.startDate.getDate()).toBe(today.getDate())
      expect(range!.endDate.getDate()).toBe(today.getDate())
    })

    it('returns correct range for last7days', () => {
      const range = getDateRangeForPreset('last7days')
      expect(range).toBeTruthy()
      
      const daysDiff = Math.floor(
        (range!.endDate.getTime() - range!.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(6)
    })

    it('returns correct range for last30days', () => {
      const range = getDateRangeForPreset('last30days')
      expect(range).toBeTruthy()
      
      const daysDiff = Math.floor(
        (range!.endDate.getTime() - range!.startDate.getTime()) / (1000 * 60 * 60 * 24)
      )
      expect(daysDiff).toBe(29)
    })

    it('returns correct range for thisMonth', () => {
      const range = getDateRangeForPreset('thisMonth')
      expect(range).toBeTruthy()
      
      const now = new Date()
      expect(range!.startDate.getDate()).toBe(1)
      expect(range!.startDate.getMonth()).toBe(now.getMonth())
    })

    it('returns null for custom', () => {
      const range = getDateRangeForPreset('custom')
      expect(range).toBeNull()
    })
  })

  describe('getPresetFromDateRange', () => {
    it('detects today preset', () => {
      const range = getDateRangeForPreset('today')
      const preset = getPresetFromDateRange(range!.startDate, range!.endDate)
      expect(preset).toBe('today')
    })

    it('returns custom for non-matching dates', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-01-15')
      const preset = getPresetFromDateRange(startDate, endDate)
      expect(preset).toBe('custom')
    })

    it('returns custom for null dates', () => {
      const preset = getPresetFromDateRange(null, null)
      expect(preset).toBe('custom')
    })
  })

  describe('formatDateRange', () => {
    it('formats date range in English', () => {
      const startDate = new Date('2024-01-01')
      const endDate = new Date('2024-12-31')
      const formatted = formatDateRange(startDate, endDate, 'en')
      expect(formatted).toContain('2024')
    })

    it('returns "All time" for null dates', () => {
      const formatted = formatDateRange(null, null, 'en')
      expect(formatted).toBe('All time')
    })

    it('formats start date only', () => {
      const startDate = new Date('2024-01-01')
      const formatted = formatDateRange(startDate, null, 'en')
      expect(formatted).toContain('From')
    })

    it('formats end date only', () => {
      const endDate = new Date('2024-12-31')
      const formatted = formatDateRange(null, endDate, 'en')
      expect(formatted).toContain('Until')
    })
  })

  describe('getPresetLabel', () => {
    it('returns English labels', () => {
      expect(getPresetLabel('today', 'en')).toBe('Today')
      expect(getPresetLabel('last7days', 'en')).toBe('Last 7 days')
      expect(getPresetLabel('last30days', 'en')).toBe('Last 30 days')
      expect(getPresetLabel('thisMonth', 'en')).toBe('This month')
      expect(getPresetLabel('custom', 'en')).toBe('Custom')
    })

    it('returns Arabic labels', () => {
      expect(getPresetLabel('today', 'ar')).toBe('اليوم')
      expect(getPresetLabel('last7days', 'ar')).toBe('آخر 7 أيام')
      expect(getPresetLabel('custom', 'ar')).toBe('مخصص')
    })
  })

  describe('getAvailablePresets', () => {
    it('returns all preset types', () => {
      const presets = getAvailablePresets()
      expect(presets).toContain('today')
      expect(presets).toContain('last7days')
      expect(presets).toContain('last30days')
      expect(presets).toContain('thisMonth')
      expect(presets).toContain('custom')
      expect(presets.length).toBeGreaterThan(5)
    })
  })
})
