import { describe, it, expect } from 'vitest'
import { getDashboardPath, getDashboardUrl, ROLE_DASHBOARDS } from '../dashboard-routing'
import { UserRole } from '@prisma/client'

describe('Dashboard Routing', () => {
  describe('ROLE_DASHBOARDS mapping', () => {
    it('should have correct paths for all roles', () => {
      expect(ROLE_DASHBOARDS.ADMIN).toBe('/dashboard')
      expect(ROLE_DASHBOARDS.MANAGER).toBe('/analytics')
      expect(ROLE_DASHBOARDS.SUPERVISOR).toBe('/data-log')
      expect(ROLE_DASHBOARDS.DATA_ENTRY).toBe('/data-entry')
      expect(ROLE_DASHBOARDS.AUDITOR).toBe('/audit')
    })
  })

  describe('getDashboardPath', () => {
    it('should return correct path for ADMIN role', () => {
      expect(getDashboardPath('ADMIN' as UserRole)).toBe('/dashboard')
    })

    it('should return correct path for MANAGER role', () => {
      expect(getDashboardPath('MANAGER' as UserRole)).toBe('/analytics')
    })

    it('should return correct path for SUPERVISOR role', () => {
      expect(getDashboardPath('SUPERVISOR' as UserRole)).toBe('/data-log')
    })

    it('should return correct path for DATA_ENTRY role', () => {
      expect(getDashboardPath('DATA_ENTRY' as UserRole)).toBe('/data-entry')
    })

    it('should return correct path for AUDITOR role', () => {
      expect(getDashboardPath('AUDITOR' as UserRole)).toBe('/audit')
    })

    it('should use callback URL when provided and valid', () => {
      const callbackUrl = '/inventory'
      expect(getDashboardPath('ADMIN' as UserRole, callbackUrl)).toBe('/inventory')
    })

    it('should reject callback URL with protocol', () => {
      const callbackUrl = 'http://evil.com'
      expect(getDashboardPath('ADMIN' as UserRole, callbackUrl)).toBe('/dashboard')
    })

    it('should reject callback URL with double slashes', () => {
      const callbackUrl = '//evil.com'
      expect(getDashboardPath('ADMIN' as UserRole, callbackUrl)).toBe('/dashboard')
    })

    it('should reject callback URL with backslashes', () => {
      const callbackUrl = '/\\evil.com'
      expect(getDashboardPath('ADMIN' as UserRole, callbackUrl)).toBe('/dashboard')
    })
  })

  describe('getDashboardUrl', () => {
    it('should prepend locale to dashboard path', () => {
      expect(getDashboardUrl('ADMIN' as UserRole, 'en')).toBe('/en/dashboard')
      expect(getDashboardUrl('MANAGER' as UserRole, 'ar')).toBe('/ar/analytics')
    })

    it('should not duplicate locale if already present', () => {
      const callbackUrl = '/en/inventory'
      expect(getDashboardUrl('ADMIN' as UserRole, 'en', callbackUrl)).toBe('/en/inventory')
    })

    it('should handle callback URL with locale prepending', () => {
      const callbackUrl = '/inventory'
      expect(getDashboardUrl('ADMIN' as UserRole, 'ar', callbackUrl)).toBe('/ar/inventory')
    })
  })
})
