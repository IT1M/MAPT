/**
 * Search Service Tests
 * Tests for global search functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  searchSettings,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
} from '../search'
import type { UserRole } from '@prisma/client'

describe('Search Service', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('searchSettings', () => {
    it('should return settings accessible to ADMIN', () => {
      const results = searchSettings('user', 'ADMIN')
      
      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.title.includes('User Management'))).toBe(true)
    })

    it('should not return admin settings for DATA_ENTRY', () => {
      const results = searchSettings('user', 'DATA_ENTRY')
      
      expect(results.every(r => !r.title.includes('User Management'))).toBe(true)
      expect(results.every(r => !r.title.includes('System Settings'))).toBe(true)
    })

    it('should return profile settings for all roles', () => {
      const roles: UserRole[] = ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR']
      
      roles.forEach(role => {
        const results = searchSettings('profile', role)
        expect(results.some(r => r.title.includes('Profile'))).toBe(true)
      })
    })

    it('should return security settings for all roles', () => {
      const roles: UserRole[] = ['ADMIN', 'DATA_ENTRY', 'SUPERVISOR', 'MANAGER', 'AUDITOR']
      
      roles.forEach(role => {
        const results = searchSettings('security', role)
        expect(results.some(r => r.title.includes('Security'))).toBe(true)
      })
    })

    it('should return audit logs only for ADMIN and AUDITOR', () => {
      const adminResults = searchSettings('audit', 'ADMIN')
      const auditorResults = searchSettings('audit', 'AUDITOR')
      const dataEntryResults = searchSettings('audit', 'DATA_ENTRY')
      
      expect(adminResults.some(r => r.title.includes('Audit'))).toBe(true)
      expect(auditorResults.some(r => r.title.includes('Audit'))).toBe(true)
      expect(dataEntryResults.some(r => r.title.includes('Audit'))).toBe(false)
    })

    it('should search by keywords', () => {
      const results = searchSettings('password', 'ADMIN')
      
      expect(results.some(r => r.title.includes('Security'))).toBe(true)
    })

    it('should search case-insensitively', () => {
      const lowerResults = searchSettings('security', 'ADMIN')
      const upperResults = searchSettings('SECURITY', 'ADMIN')
      const mixedResults = searchSettings('SeCuRiTy', 'ADMIN')
      
      expect(lowerResults.length).toBeGreaterThan(0)
      expect(upperResults.length).toBe(lowerResults.length)
      expect(mixedResults.length).toBe(lowerResults.length)
    })

    it('should respect limit parameter', () => {
      const results = searchSettings('settings', 'ADMIN', 2)
      
      expect(results.length).toBeLessThanOrEqual(2)
    })

    it('should return empty array for no matches', () => {
      const results = searchSettings('nonexistent', 'ADMIN')
      
      expect(results).toEqual([])
    })

    it('should include correct metadata', () => {
      const results = searchSettings('profile', 'ADMIN')
      
      expect(results.length).toBeGreaterThan(0)
      results.forEach(result => {
        expect(result).toHaveProperty('id')
        expect(result).toHaveProperty('type', 'setting')
        expect(result).toHaveProperty('title')
        expect(result).toHaveProperty('description')
        expect(result).toHaveProperty('url')
        expect(result).toHaveProperty('metadata')
        expect(result.metadata).toHaveProperty('keywords')
      })
    })
  })

  describe('Recent Searches', () => {
    it('should save recent search', () => {
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

    it('should not duplicate searches', () => {
      saveRecentSearch('duplicate')
      saveRecentSearch('other')
      saveRecentSearch('duplicate')
      
      const recent = getRecentSearches()
      const duplicateCount = recent.filter(q => q === 'duplicate').length
      expect(duplicateCount).toBe(1)
      expect(recent[0]).toBe('duplicate')
    })

    it('should limit to 10 recent searches', () => {
      for (let i = 0; i < 15; i++) {
        saveRecentSearch(`query ${i}`)
      }
      
      const recent = getRecentSearches()
      expect(recent.length).toBe(10)
    })

    it('should ignore empty searches', () => {
      saveRecentSearch('')
      saveRecentSearch('   ')
      
      const recent = getRecentSearches()
      expect(recent.length).toBe(0)
    })

    it('should clear recent searches', () => {
      saveRecentSearch('query 1')
      saveRecentSearch('query 2')
      
      clearRecentSearches()
      
      const recent = getRecentSearches()
      expect(recent).toEqual([])
    })

    it('should return empty array when no searches saved', () => {
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
      
      // Restore
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Search Result Structure', () => {
    it('should return results with correct structure', () => {
      const results = searchSettings('security', 'ADMIN')
      
      expect(results.length).toBeGreaterThan(0)
      
      results.forEach(result => {
        expect(typeof result.id).toBe('string')
        expect(result.type).toBe('setting')
        expect(typeof result.title).toBe('string')
        expect(typeof result.description).toBe('string')
        expect(typeof result.url).toBe('string')
        expect(result.url).toMatch(/^\//)
      })
    })
  })
})
