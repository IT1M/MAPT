/**
 * Header Component Tests
 * Tests for breadcrumbs, dropdowns, and notifications
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Header } from '../header'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/hooks/useTranslations'
import { useLocale } from '@/hooks/useLocale'

// Mock dependencies
vi.mock('next-auth/react')
vi.mock('next/navigation')
vi.mock('next-intl')
vi.mock('@/components/layout/Breadcrumbs', () => ({
  Breadcrumbs: () => <div data-testid="breadcrumbs">Breadcrumbs</div>
}))
vi.mock('@/components/notifications', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Notifications</div>
}))
vi.mock('@/components/ui/theme-toggle', () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>
}))
vi.mock('@/components/ui/locale-switcher', () => ({
  LocaleSwitcher: () => <button data-testid="locale-switcher">Locale</button>
}))

const mockUseSession = vi.mocked(useSession)
const mockSignOut = vi.mocked(signOut)
const mockUseRouter = vi.mocked(useRouter)
const mockUseLocale = vi.mocked(useLocale)
const mockUseTranslations = vi.mocked(useTranslations)

describe('Header', () => {
  const mockRouter = {
    push: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }

  const mockT = (key: string) => {
    const translations: Record<string, string> = {
      'roles.admin': 'Admin',
      'roles.dataEntry': 'Data Entry',
      'roles.supervisor': 'Supervisor',
      'roles.manager': 'Manager',
      'roles.auditor': 'Auditor',
      'settings.sections.profile': 'Profile',
      'navigation.settings': 'Settings',
      'common.logout': 'Logout',
    }
    return translations[key] || key
  }

  beforeEach(() => {
    mockUseRouter.mockReturnValue(mockRouter as any)
    mockUseLocale.mockReturnValue('en')
    mockUseTranslations.mockReturnValue(mockT as any)
    mockSignOut.mockResolvedValue(undefined as any)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component rendering', () => {
    it('should render header with all components', () => {
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

      render(<Header />)

      waitFor(() => {
        expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument()
        expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
        expect(screen.getByTestId('theme-toggle')).toBeInTheDocument()
        expect(screen.getByTestId('locale-switcher')).toBeInTheDocument()
      })
    })

    it('should show user avatar and name', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { 
            id: '1',
            role: 'ADMIN', 
            name: 'John Doe', 
            email: 'john@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('J')).toBeInTheDocument() // Avatar initial
      })
    })

    it('should show role label', () => {
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

      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })

    it('should apply sticky header shadow on scroll', () => {
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

      render(<Header />)

      // Simulate scroll
      fireEvent.scroll(window, { target: { scrollY: 100 } })

      waitFor(() => {
        const header = screen.getByRole('banner')
        expect(header).toHaveClass('shadow-md')
      })
    })
  })

  describe('User dropdown menu', () => {
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

    it('should toggle dropdown when user button is clicked', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        
        // Dropdown should be closed initially
        expect(screen.queryByText('Profile')).not.toBeInTheDocument()
        
        // Click to open
        fireEvent.click(userButton)
        expect(screen.getByText('Profile')).toBeInTheDocument()
        
        // Click to close
        fireEvent.click(userButton)
        expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      })
    })

    it('should show user info in dropdown', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        fireEvent.click(userButton)

        expect(screen.getByText('Admin User')).toBeInTheDocument()
        expect(screen.getByText('admin@test.com')).toBeInTheDocument()
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })

    it('should navigate to profile when profile button is clicked', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        fireEvent.click(userButton)

        const profileButton = screen.getByText('Profile')
        fireEvent.click(profileButton)

        expect(mockRouter.push).toHaveBeenCalledWith('/settings?section=profile')
      })
    })

    it('should navigate to settings when settings button is clicked', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        fireEvent.click(userButton)

        const settingsButton = screen.getByText('Settings')
        fireEvent.click(settingsButton)

        expect(mockRouter.push).toHaveBeenCalledWith('/settings')
      })
    })

    it('should call signOut when logout button is clicked', async () => {
      render(<Header />)

      await waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        fireEvent.click(userButton)

        const logoutButton = screen.getByText('Logout')
        fireEvent.click(logoutButton)

        expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
      })
    })

    it('should close dropdown when clicking outside', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        fireEvent.click(userButton)

        expect(screen.getByText('Profile')).toBeInTheDocument()

        // Click outside
        fireEvent.mouseDown(document.body)

        expect(screen.queryByText('Profile')).not.toBeInTheDocument()
      })
    })

    it('should update aria-expanded attribute', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        
        expect(userButton).toHaveAttribute('aria-expanded', 'false')
        
        fireEvent.click(userButton)
        expect(userButton).toHaveAttribute('aria-expanded', 'true')
      })
    })
  })

  describe('Role label translation', () => {
    it('should translate ADMIN role', () => {
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

      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('Admin')).toBeInTheDocument()
      })
    })

    it('should translate DATA_ENTRY role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { 
            id: '2',
            role: 'DATA_ENTRY', 
            name: 'Entry User', 
            email: 'entry@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
      })
    })

    it('should translate SUPERVISOR role', () => {
      mockUseSession.mockReturnValue({
        data: {
          user: { 
            id: '3',
            role: 'SUPERVISOR', 
            name: 'Supervisor User', 
            email: 'supervisor@test.com',
            permissions: []
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('Supervisor')).toBeInTheDocument()
      })
    })
  })

  describe('Mobile responsiveness', () => {
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

    it('should show app name on mobile', () => {
      render(<Header />)

      waitFor(() => {
        expect(screen.getByText('Saudi Mais')).toBeInTheDocument()
      })
    })

    it('should hide breadcrumbs on mobile', () => {
      render(<Header />)

      waitFor(() => {
        const breadcrumbs = screen.getByTestId('breadcrumbs')
        expect(breadcrumbs).toHaveClass('hidden', 'md:flex')
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

    it('should have proper ARIA attributes', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        expect(userButton).toHaveAttribute('aria-haspopup', 'true')
        expect(userButton).toHaveAttribute('aria-expanded')
      })
    })

    it('should have focus management', () => {
      render(<Header />)

      waitFor(() => {
        const userButton = screen.getByLabelText('User menu')
        userButton.focus()
        expect(document.activeElement).toBe(userButton)
      })
    })
  })

  describe('Hydration handling', () => {
    it('should not render notifications before mount', () => {
      mockUseSession.mockReturnValue({
        data: null,
        status: 'loading',
        update: vi.fn(),
      })

      render(<Header />)

      // Should not show notifications during SSR
      expect(screen.queryByTestId('notification-bell')).not.toBeInTheDocument()
    })

    it('should render notifications after mount', () => {
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

      render(<Header />)

      waitFor(() => {
        expect(screen.getByTestId('notification-bell')).toBeInTheDocument()
      })
    })
  })
})
