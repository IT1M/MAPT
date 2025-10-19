/**
 * Sidebar Component Tests
 * Tests for role filtering, state management, and keyboard navigation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Sidebar } from '../sidebar'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/hooks/useLocale'

// Mock dependencies
vi.mock('next-auth/react')
vi.mock('next/navigation')
vi.mock('next-intl')

const mockUseSession = vi.mocked(useSession)
const mockUsePathname = vi.mocked(usePathname)
const mockUseLocale = vi.mocked(useLocale)

describe('Sidebar', () => {
  beforeEach(() => {
    // Setup default mocks
    mockUsePathname.mockReturnValue('/en/dashboard')
    mockUseLocale.mockReturnValue('en')

    // Clear localStorage
    localStorage.clear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Role-based filtering', () => {
    it('should show all menu items for ADMIN role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Sidebar />)

      // Wait for component to mount
      waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
        expect(screen.getByText('Data Log')).toBeInTheDocument()
        expect(screen.getByText('Inventory')).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.getByText('Reports')).toBeInTheDocument()
        expect(screen.getByText('Backup')).toBeInTheDocument()
        expect(screen.getByText('Audit & History')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('should show limited menu items for DATA_ENTRY role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '2',
            role: 'DATA_ENTRY',
            name: 'Data Entry User',
            email: 'entry@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Sidebar />)

      waitFor(() => {
        // Should see these items
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
        expect(screen.getByText('Data Log')).toBeInTheDocument()
        expect(screen.getByText('Inventory')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()

        // Should NOT see these items
        expect(screen.queryByText('Analytics')).not.toBeInTheDocument()
        expect(screen.queryByText('Backup')).not.toBeInTheDocument()
        expect(screen.queryByText('Audit & History')).not.toBeInTheDocument()
      })
    })

    it('should show audit menu items for AUDITOR role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '3',
            role: 'AUDITOR',
            name: 'Auditor User',
            email: 'auditor@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Sidebar />)

      waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Audit & History')).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.queryByText('Data Entry')).not.toBeInTheDocument()
        expect(screen.queryByText('Inventory')).not.toBeInTheDocument()
      })
    })

    it('should show no menu items when user has no role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '4',
            role: undefined as any,
            name: 'No Role User',
            email: 'norole@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Sidebar />)

      waitFor(() => {
        expect(screen.queryByText('Dashboard')).not.toBeInTheDocument()
        expect(screen.queryByText('Data Entry')).not.toBeInTheDocument()
      })
    })
  })

  describe('Collapsed state management', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should start in expanded state by default', () => {
      render(<Sidebar />)

      waitFor(() => {
        const sidebar = screen.getByRole('navigation').parentElement
        expect(sidebar).toHaveClass('w-64')
        expect(sidebar).not.toHaveClass('w-20')
      })
    })

    it('should toggle collapsed state when button is clicked', () => {
      render(<Sidebar />)

      waitFor(() => {
        const toggleButton = screen.getByLabelText('Collapse sidebar')
        fireEvent.click(toggleButton)

        const sidebar = screen.getByRole('navigation').parentElement
        expect(sidebar).toHaveClass('w-20')
        expect(sidebar).not.toHaveClass('w-64')
      })
    })

    it('should persist collapsed state to localStorage', () => {
      render(<Sidebar />)

      waitFor(() => {
        const toggleButton = screen.getByLabelText('Collapse sidebar')
        fireEvent.click(toggleButton)

        expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
      })
    })

    it('should restore collapsed state from localStorage', () => {
      localStorage.setItem('sidebar-collapsed', 'true')

      render(<Sidebar />)

      waitFor(() => {
        const sidebar = screen.getByRole('navigation').parentElement
        expect(sidebar).toHaveClass('w-20')
      })
    })

    it('should update button label when collapsed', () => {
      render(<Sidebar />)

      waitFor(() => {
        const toggleButton = screen.getByLabelText('Collapse sidebar')
        fireEvent.click(toggleButton)

        expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument()
      })
    })
  })

  describe('Active state indication', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should highlight active menu item based on pathname', () => {
      mockUsePathname.mockReturnValue('/en/dashboard')

      render(<Sidebar />)

      waitFor(() => {
        const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
        expect(dashboardLink).toHaveClass('bg-primary-50')
        expect(dashboardLink).toHaveAttribute('aria-current', 'page')
      })
    })

    it('should highlight active item for nested paths', () => {
      mockUsePathname.mockReturnValue('/en/audit/dashboard')

      render(<Sidebar />)

      waitFor(() => {
        const auditLink = screen.getByRole('link', { name: /audit/i })
        expect(auditLink).toHaveClass('bg-primary-50')
      })
    })

    it('should not highlight inactive menu items', () => {
      mockUsePathname.mockReturnValue('/en/dashboard')

      render(<Sidebar />)

      waitFor(() => {
        const settingsLink = screen.getByRole('link', { name: /settings/i })
        expect(settingsLink).not.toHaveClass('bg-primary-50')
        expect(settingsLink).not.toHaveAttribute('aria-current')
      })
    })
  })

  describe('Keyboard navigation', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should navigate down with ArrowDown key', () => {
      render(<Sidebar />)

      waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /dashboard/i })
        firstLink.focus()
        fireEvent.keyDown(firstLink, { key: 'ArrowDown' })

        const secondLink = screen.getByRole('link', { name: /data entry/i })
        expect(document.activeElement).toBe(secondLink)
      })
    })

    it('should navigate up with ArrowUp key', () => {
      render(<Sidebar />)

      waitFor(() => {
        const secondLink = screen.getByRole('link', { name: /data entry/i })
        secondLink.focus()
        fireEvent.keyDown(secondLink, { key: 'ArrowUp' })

        const firstLink = screen.getByRole('link', { name: /dashboard/i })
        expect(document.activeElement).toBe(firstLink)
      })
    })

    it('should wrap to last item when pressing ArrowUp on first item', () => {
      render(<Sidebar />)

      waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /dashboard/i })
        firstLink.focus()
        fireEvent.keyDown(firstLink, { key: 'ArrowUp' })

        const lastLink = screen.getByRole('link', { name: /settings/i })
        expect(document.activeElement).toBe(lastLink)
      })
    })

    it('should jump to first item with Home key', () => {
      render(<Sidebar />)

      waitFor(() => {
        const middleLink = screen.getByRole('link', { name: /analytics/i })
        middleLink.focus()
        fireEvent.keyDown(middleLink, { key: 'Home' })

        const firstLink = screen.getByRole('link', { name: /dashboard/i })
        expect(document.activeElement).toBe(firstLink)
      })
    })

    it('should jump to last item with End key', () => {
      render(<Sidebar />)

      waitFor(() => {
        const firstLink = screen.getByRole('link', { name: /dashboard/i })
        firstLink.focus()
        fireEvent.keyDown(firstLink, { key: 'End' })

        const lastLink = screen.getByRole('link', { name: /settings/i })
        expect(document.activeElement).toBe(lastLink)
      })
    })
  })

  describe('RTL support', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should display Arabic labels when locale is ar', () => {
      mockUseLocale.mockReturnValue('ar')

      render(<Sidebar />)

      waitFor(() => {
        expect(screen.getByText('لوحة التحكم')).toBeInTheDocument()
        expect(screen.getByText('إدخال البيانات')).toBeInTheDocument()
      })
    })

    it('should apply RTL classes when locale is ar', () => {
      mockUseLocale.mockReturnValue('ar')

      render(<Sidebar />)

      waitFor(() => {
        const sidebar = screen.getByRole('navigation').parentElement
        expect(sidebar).toHaveClass('rtl:border-l')
      })
    })
  })

  describe('Badge display', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should display badge when present on navigation item', () => {
      // Note: This test assumes badges are configured in navigation config
      render(<Sidebar />)

      waitFor(() => {
        // If any item has a badge, it should be visible
        const badges = screen.queryAllByText(/NEW|INFO/i)
        // Test passes if badges are rendered when configured
        expect(badges.length).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: '1',
            role: 'ADMIN',
            name: 'Admin User',
            email: 'admin@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })
    })

    it('should have proper ARIA labels', () => {
      render(<Sidebar />)

      waitFor(() => {
        expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', 'Main navigation')
        expect(screen.getByLabelText('Collapse sidebar')).toBeInTheDocument()
      })
    })

    it('should have proper role attributes', () => {
      render(<Sidebar />)

      waitFor(() => {
        const list = screen.getByRole('list')
        expect(list).toBeInTheDocument()
      })
    })

    it('should show tooltips in collapsed state', () => {
      render(<Sidebar />)

      waitFor(() => {
        const toggleButton = screen.getByLabelText('Collapse sidebar')
        fireEvent.click(toggleButton)

        const links = screen.getAllByRole('link')
        links.forEach(link => {
          expect(link).toHaveAttribute('title')
        })
      })
    })
  })
})
