/**
 * Unit Tests: Search Service
 * Tests search functionality and recent searches
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  searchSettings,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '@/services/search'
import type { UserRole } from '@prisma/client'

describe('Search Service Unit Tests', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  afterEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
    }
  })

  describe('Settings Search', () => {
    it('should search settings for ADMIN role', () => {
      const results = searchSettings('user', 'ADMIN' as UserRole)
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.title.toLowerCase().includes('user'))).toBe(true)
    })

    it('should filter settings by role', () => {
      const adminResults = searchSettings('user', 'ADMIN' as UserRole)
      const dataEntryResults = searchSettings('user', 'DATA_ENTRY' as UserRole)
      
      // Admin should see more results than DATA_ENTRY
      expect(adminResults.length).toBeGreaterThanOrEqual(dataEntryResults.length)
    })

    it('should search by keywords', () => {
      const results = searchSettings('security', 'ADMIN' as UserRole)
      expect(results.some(r => 
        r.title.toLowerCase().includes('security') ||
        r.description.toLowerCase().includes('security')
      )).toBe(true)
    })

    it('should limit search results', () => {
      const results = searchSettings('settings', 'ADMIN' as UserRole, 3)
      expect(results.length).toBeLessThanOrEqual(3)
    })

    it('should return empty array for no matches', () => {
      const results = searchSettings('nonexistent-term-xyz', 'ADMIN' as UserRole)
      expect(results).toEqual([])
    })

    it('should be case insensitive', () => {
      const lowerResults = searchSettings('profile', 'ADMIN' as UserRole)
      const upperResults = searchSettings('PROFILE', 'ADMIN' as UserRole)
      expect(lowerResults.length).toBe(upperResults.length)
    })

    it('should include metadata in results', () => {
      const results = searchSettings('profile', 'ADMIN' as UserRole)
      if (results.length > 0) {
        expect(results[0]).toHaveProperty('metadata')
        expect(results[0].metadata).toHaveProperty('keywords')
      }
    })
  })

  describe('Recent Searches', () => {
    it('should return empty array initially', () => {
      const recent = getRecentSearches()
      expect(recent).toEqual([])
    })

    it('should save search query', () => {
      saveRecentSearch('test query')
      const recent = getRecentSearches()
      expect(recent).toContain('test query')
    })

    it('should save multiple searches', () => {
      saveRecentSearch('query 1')
      saveRecentSearch('query 2')
      saveRecentSearch('query 3')
      
      const recent = getRecentSearches()
      expect(recent).toContain('query 1')
      expect(recent).toContain('query 2')
      expect(recent).toContain('query 3')
    })

    it('should keep most recent searches first', () => {
      saveRecentSearch('first')
      saveRecentSearch('second')
      saveRecentSearch('third')
      
      const recent = getRecentSearches()
      expect(recent[0]).toBe('third')
      expect(recent[1]).toBe('second')
      expect(recent[2]).toBe('first')
    })

    it('should limit to 10 recent searches', () => {
      for (let i = 0; i < 15; i++) {
        saveRecentSearch(`query ${i}`)
      }
      
      const recent = getRecentSearches()
      expect(recent.length).toBe(10)
    })

    it('should not duplicate searches', () => {
      saveRecentSearch('duplicate')
      saveRecentSearch('other')
      saveRecentSearch('duplicate')
      
      const recent = getRecentSearches()
      const duplicateCount = recent.filter(q => q === 'duplicate').length
      expect(duplicateCount).toBe(1)
      expect(recent[0]).toBe('duplicate') // Should be moved to top
    })

    it('should ignore empty searches', () => {
      saveRecentSearch('')
      saveRecentSearch('   ')
      
      const recent = getRecentSearches()
      expect(recent).toEqual([])
    })

    it('should clear recent searches', () => {
      saveRecentSearch('query 1')
      saveRecentSearch('query 2')
      
      clearRecentSearches()
      
      const recent = getRecentSearches()
      expect(recent).toEqual([])
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })
      
      expect(() => saveRecentSearch('test')).not.toThrow()
      
      // Restore original
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Search Result Structure', () => {
    it('should return results with correct structure', () => {
      const results = searchSettings('profile', 'ADMIN' as UserRole)
      
      if (results.length > 0) {
        const result = results[0]
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('type')
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('description')
        expect(result).toHaveProperty('url')
        expect(result.type).toBe('setting')
      }
    })

    it('should have valid URLs', () => {
      const results = searchSettings('settings', 'ADMIN' as UserRole)
      
      results.forEach(result => {
        expect(result.url).toMatch(/^\//)
        expect(result.url.length).toBeGreaterThan(1)
      })
    })
  })
})
