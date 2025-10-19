/**
 * Route Permissions Tests
 * Tests for route permission checking utilities
 */

import { describe, it, expect } from 'vitest'
import type { UserRole } from '../route-permissions'
import {
  ROUTE_PERMISSIONS,
  isPublicRoute,
  getBaseRoute,
  hasRoutePermission,
  getAllowedRoles,
  canAccessAnyRoute,
  getAccessibleRoutes,
} from '../route-permissions'

describe('Route Permissions', () => {
  describe('isPublicRoute', () => {
    it('should identify root paths as public', () => {
      expect(isPublicRoute('/')).toBe(true)
    })

    it('should identify login path as public', () => {
      expect(isPublicRoute('/login')).toBe(true)
    })

    it('should identify protected routes as not public', () => {
      expect(isPublicRoute('/dashboard')).toBe(false)
      expect(isPublicRoute('/settings')).toBe(false)
      expect(isPublicRoute('/audit')).toBe(false)
    })
  })

  describe('getBaseRoute', () => {
    it('should extract base route from English paths', () => {
      expect(getBaseRoute('/en/dashboard')).toBe('/dashboard')
      expect(getBaseRoute('/en/data-entry')).toBe('/data-entry')
      expect(getBaseRoute('/en/audit/dashboard')).toBe('/audit')
    })

    it('should extract base route from Arabic paths', () => {
      expect(getBaseRoute('/ar/dashboard')).toBe('/dashboard')
      expect(getBaseRoute('/ar/settings')).toBe('/settings')
      expect(getBaseRoute('/ar/backup')).toBe('/backup')
    })

    it('should handle paths without locale', () => {
      expect(getBaseRoute('/dashboard')).toBe('/dashboard')
      expect(getBaseRoute('/settings/users')).toBe('/settings')
    })

    it('should return / for root paths', () => {
      expect(getBaseRoute('/')).toBe('/')
      expect(getBaseRoute('/en')).toBe('/')
      expect(getBaseRoute('/ar')).toBe('/')
    })
  })

  describe('hasRoutePermission', () => {
    it('should allow ADMIN to access all routes', () => {
      const routes = Object.keys(ROUTE_PERMISSIONS)
      routes.forEach(route => {
        expect(hasRoutePermission('ADMIN', route)).toBe(true)
      })
    })

    it('should allow DATA_ENTRY to access permitted routes', () => {
      expect(hasRoutePermission('DATA_ENTRY', '/dashboard')).toBe(true)
      expect(hasRoutePermission('DATA_ENTRY', '/data-entry')).toBe(true)
      expect(hasRoutePermission('DATA_ENTRY', '/data-log')).toBe(true)
      expect(hasRoutePermission('DATA_ENTRY', '/inventory')).toBe(true)
      expect(hasRoutePermission('DATA_ENTRY', '/settings')).toBe(true)
    })

    it('should deny DATA_ENTRY access to restricted routes', () => {
      expect(hasRoutePermission('DATA_ENTRY', '/audit')).toBe(false)
      expect(hasRoutePermission('DATA_ENTRY', '/backup')).toBe(false)
      expect(hasRoutePermission('DATA_ENTRY', '/analytics')).toBe(false)
    })

    it('should allow AUDITOR to access audit routes', () => {
      expect(hasRoutePermission('AUDITOR', '/audit')).toBe(true)
      expect(hasRoutePermission('AUDITOR', '/analytics')).toBe(true)
      expect(hasRoutePermission('AUDITOR', '/reports')).toBe(true)
    })

    it('should deny AUDITOR access to data entry routes', () => {
      expect(hasRoutePermission('AUDITOR', '/data-entry')).toBe(false)
      expect(hasRoutePermission('AUDITOR', '/inventory')).toBe(false)
    })

    it('should allow MANAGER to access management routes', () => {
      expect(hasRoutePermission('MANAGER', '/analytics')).toBe(true)
      expect(hasRoutePermission('MANAGER', '/reports')).toBe(true)
      expect(hasRoutePermission('MANAGER', '/backup')).toBe(true)
    })

    it('should deny MANAGER access to audit routes', () => {
      expect(hasRoutePermission('MANAGER', '/audit')).toBe(false)
    })

    it('should allow SUPERVISOR to access operational routes', () => {
      expect(hasRoutePermission('SUPERVISOR', '/data-entry')).toBe(true)
      expect(hasRoutePermission('SUPERVISOR', '/inventory')).toBe(true)
      expect(hasRoutePermission('SUPERVISOR', '/analytics')).toBe(true)
    })

    it('should allow access to unmapped routes by default', () => {
      expect(hasRoutePermission('DATA_ENTRY', '/unknown-route')).toBe(true)
    })
  })

  describe('getAllowedRoles', () => {
    it('should return allowed roles for a route', () => {
      const dashboardRoles = getAllowedRoles('/dashboard')
      expect(dashboardRoles).toContain('ADMIN')
      expect(dashboardRoles).toContain('DATA_ENTRY')
      expect(dashboardRoles).toContain('SUPERVISOR')
      expect(dashboardRoles).toContain('MANAGER')
      expect(dashboardRoles).toContain('AUDITOR')
    })

    it('should return restricted roles for audit route', () => {
      const auditRoles = getAllowedRoles('/audit')
      expect(auditRoles).toEqual(['ADMIN', 'AUDITOR'])
    })

    it('should return undefined for unmapped routes', () => {
      expect(getAllowedRoles('/unknown-route')).toBeUndefined()
    })
  })

  describe('canAccessAnyRoute', () => {
    it('should return true if user can access at least one route', () => {
      expect(
        canAccessAnyRoute('DATA_ENTRY', ['/dashboard', '/audit'])
      ).toBe(true)
    })

    it('should return false if user cannot access any route', () => {
      expect(
        canAccessAnyRoute('DATA_ENTRY', ['/audit', '/backup'])
      ).toBe(false)
    })

    it('should return true for ADMIN with any routes', () => {
      expect(
        canAccessAnyRoute('ADMIN', ['/audit', '/backup', '/settings'])
      ).toBe(true)
    })
  })

  describe('getAccessibleRoutes', () => {
    it('should return all routes for ADMIN', () => {
      const routes = getAccessibleRoutes('ADMIN')
      expect(routes).toHaveLength(Object.keys(ROUTE_PERMISSIONS).length)
    })

    it('should return limited routes for DATA_ENTRY', () => {
      const routes = getAccessibleRoutes('DATA_ENTRY')
      expect(routes).toContain('/dashboard')
      expect(routes).toContain('/data-entry')
      expect(routes).toContain('/data-log')
      expect(routes).toContain('/inventory')
      expect(routes).not.toContain('/audit')
      expect(routes).not.toContain('/backup')
    })

    it('should return audit routes for AUDITOR', () => {
      const routes = getAccessibleRoutes('AUDITOR')
      expect(routes).toContain('/audit')
      expect(routes).toContain('/analytics')
      expect(routes).not.toContain('/data-entry')
      expect(routes).not.toContain('/inventory')
    })
  })

  describe('ROUTE_PERMISSIONS configuration', () => {
    it('should have permissions defined for all core routes', () => {
      const coreRoutes = [
        '/dashboard',
        '/data-entry',
        '/data-log',
        '/inventory',
        '/analytics',
        '/reports',
        '/backup',
        '/audit',
        '/settings',
      ]

      coreRoutes.forEach(route => {
        expect(ROUTE_PERMISSIONS[route]).toBeDefined()
        expect(Array.isArray(ROUTE_PERMISSIONS[route])).toBe(true)
        expect(ROUTE_PERMISSIONS[route].length).toBeGreaterThan(0)
      })
    })

    it('should have ADMIN role in all route permissions', () => {
      Object.values(ROUTE_PERMISSIONS).forEach(roles => {
        expect(roles).toContain('ADMIN')
      })
    })

    it('should not have duplicate roles in any route', () => {
      Object.entries(ROUTE_PERMISSIONS).forEach(([route, roles]) => {
        const uniqueRoles = [...new Set(roles)]
        expect(roles.length).toBe(uniqueRoles.length)
      })
    })
  })
})
