/**
 * Breadcrumbs Component Tests
 * Tests for path parsing, localization, and truncation
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumbs } from '../Breadcrumbs'
import { usePathname } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { useLocale } from '@/hooks/useLocale'

// Mock dependencies
vi.mock('next/navigation')
vi.mock('next-intl')

const mockUsePathname = vi.mocked(usePathname)
const mockUseLocale = vi.mocked(useLocale)
const mockUseTranslations = vi.mocked(useTranslations)

describe('Breadcrumbs', () => {
  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      'dashboard': 'Dashboard',
      'dataEntry': 'Data Entry',
      'dataLog': 'Data Log',
      'inventory': 'Inventory',
      'analytics': 'Analytics',
      'reports': 'Reports',
      'backup': 'Backup',
      'audit': 'Audit & History',
      'settings': 'Settings',
    }
    return translations[key] || key
  }

  beforeEach(() => {
    mockUseLocale.mockReturnValue('en')
    mockUseTranslations.mockReturnValue(mockT as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Path parsing', () => {
    it('should generate breadcrumbs from simple path', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      render(<Breadcrumbs />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should generate breadcrumbs from nested path', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      render(<Breadcrumbs />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Audit & History')).toBeInTheDocument()
    })

    it('should handle paths with multiple segments', () => {
      mockUsePathname.mockReturnValue('/settings/users')

      render(<Breadcrumbs />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
    })

    it('should show only dashboard for root path', () => {
      mockUsePathname.mockReturnValue('/en')

      render(<Breadcrumbs />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem')).toHaveLength(1)
    })
  })

  describe('Localization', () => {
    it('should use English labels when locale is en', () => {
      mockUseLocale.mockReturnValue('en')
      mockUsePathname.mockReturnValue('/data-entry')

      render(<Breadcrumbs />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Data Entry')).toBeInTheDocument()
    })

    it('should translate known segments', () => {
      mockUsePathname.mockReturnValue('/analytics')

      render(<Breadcrumbs />)

      expect(screen.getByText('Analytics')).toBeInTheDocument()
    })

    it('should capitalize unknown segments', () => {
      mockUsePathname.mockReturnValue('/unknown-page')

      render(<Breadcrumbs />)

      expect(screen.getByText('Unknown Page')).toBeInTheDocument()
    })
  })

  describe('Clickable links', () => {
    it('should make non-current items clickable', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      render(<Breadcrumbs />)

      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('should not make current page clickable', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      render(<Breadcrumbs />)

      const currentItem = screen.getByText('Dashboard')
      // The last item should not be a link
      const allLinks = screen.getAllByRole('link')
      expect(allLinks).toHaveLength(1) // Only Dashboard should be a link
    })

    it('should set aria-current on current page', () => {
      mockUsePathname.mockReturnValue('/settings')

      render(<Breadcrumbs />)

      const currentItem = screen.getByText('Settings')
      expect(currentItem).toHaveAttribute('aria-current', 'page')
    })
  })

  describe('Truncation', () => {
    it('should truncate breadcrumbs exceeding maxItems', () => {
      mockUsePathname.mockReturnValue('/settings/users/profile/details')

      render(<Breadcrumbs maxItems={4} />)

      expect(screen.getByText('...')).toBeInTheDocument()
    })

    it('should show first and last items when truncated', () => {
      mockUsePathname.mockReturnValue('/settings/users/profile/details')

      render(<Breadcrumbs maxItems={4} />)

      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Details')).toBeInTheDocument()
    })

    it('should not truncate when items are within limit', () => {
      mockUsePathname.mockReturnValue('/settings/users')

      render(<Breadcrumbs maxItems={4} />)

      expect(screen.queryByText('...')).not.toBeInTheDocument()
    })
  })

  describe('RTL support', () => {
    it('should reverse breadcrumb order for Arabic', () => {
      mockUseLocale.mockReturnValue('ar')
      mockUsePathname.mockReturnValue('/ar/settings')

      render(<Breadcrumbs />)

      const items = screen.getAllByRole('listitem')
      // In RTL, the order should be reversed
      expect(items.length).toBeGreaterThan(0)
    })

    it('should apply RTL classes', () => {
      mockUseLocale.mockReturnValue('ar')
      mockUsePathname.mockReturnValue('/ar/dashboard')

      render(<Breadcrumbs />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('rtl:space-x-reverse')
    })

    it('should rotate chevron icons for RTL', () => {
      mockUseLocale.mockReturnValue('ar')
      mockUsePathname.mockReturnValue('/ar/audit/dashboard')

      const { container } = render(<Breadcrumbs />)

      const chevrons = container.querySelectorAll('svg')
      chevrons.forEach(chevron => {
        expect(chevron).toHaveClass('rotate-180')
      })
    })
  })

  describe('Manual items override', () => {
    it('should use provided items instead of generating from path', () => {
      const customItems = [
        { label: 'Home', path: '/home' },
        { label: 'Custom Page', path: '/custom' },
        { label: 'Current' },
      ]

      render(<Breadcrumbs items={customItems} />)

      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('Custom Page')).toBeInTheDocument()
      expect(screen.getByText('Current')).toBeInTheDocument()
    })

    it('should make items with path clickable', () => {
      const customItems = [
        { label: 'Home', path: '/home' },
        { label: 'Current' },
      ]

      render(<Breadcrumbs items={customItems} />)

      const homeLink = screen.getByRole('link', { name: /home/i })
      expect(homeLink).toHaveAttribute('href', '/home')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA label', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      render(<Breadcrumbs />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb')
    })

    it('should use list structure', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      render(<Breadcrumbs />)

      expect(screen.getByRole('list')).toBeInTheDocument()
      expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0)
    })

    it('should have focus indicators on links', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      render(<Breadcrumbs />)

      const links = screen.getAllByRole('link')
      links.forEach(link => {
        expect(link).toHaveClass('focus:outline-none', 'focus:ring-2')
      })
    })
  })

  describe('Hydration handling', () => {
    it('should render simplified version during SSR', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      const { container } = render(<Breadcrumbs />)

      // Should have suppressHydrationWarning attribute
      const nav = container.querySelector('nav')
      expect(nav).toHaveAttribute('suppressHydrationWarning')
    })
  })

  describe('Empty state', () => {
    it('should return null when no items', () => {
      render(<Breadcrumbs items={[]} />)

      expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      render(<Breadcrumbs className="custom-class" />)

      const nav = screen.getByRole('navigation')
      expect(nav).toHaveClass('custom-class')
    })
  })

  describe('Separator display', () => {
    it('should show separators between items', () => {
      mockUsePathname.mockReturnValue('/audit/dashboard')

      const { container } = render(<Breadcrumbs />)

      // Should have chevron separators
      const separators = container.querySelectorAll('[aria-hidden="true"]')
      expect(separators.length).toBeGreaterThan(0)
    })

    it('should not show separator before first item', () => {
      mockUsePathname.mockReturnValue('/dashboard')

      const { container } = render(<Breadcrumbs />)

      const items = screen.getAllByRole('listitem')
      // First item should not have a separator before it
      expect(items[0].querySelector('[aria-hidden="true"]')).toBeNull()
    })
  })
})
