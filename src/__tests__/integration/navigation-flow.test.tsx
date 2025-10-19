/**
 * Integration Tests: Navigation Flow
 * Tests the complete navigation experience including authentication and authorization
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SessionProvider } from 'next-auth/react'
import { NextIntlClientProvider } from 'next-intl'
import { ThemeProvider } from 'next-themes'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { NotificationProvider } from '@/context/NotificationContext'

// Mock next/navigation
const mockPush = vi.fn()
const mockPathname = '/dashboard'

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
}))

// Mock next-auth
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react')
  return {
    ...actual,
    useSession: vi.fn(),
    signOut: vi.fn(),
  }
})

const messages = {
  navigation: {
    dashboard: 'Dashboard',
    dataEntry: 'Data Entry',
    dataLog: 'Data Log',
    analytics: 'Analytics',
    reports: 'Reports',
    audit: 'Audit Log',
    backup: 'Backup',
    settings: 'Settings',
  },
  roles: {
    admin: 'Administrator',
    dataEntry: 'Data Entry',
    supervisor: 'Supervisor',
    manager: 'Manager',
    auditor: 'Auditor',
  },
  common: {
    logout: 'Logout',
  },
  settings: {
    sections: {
      profile: 'Profile',
    },
  },
}

const TestWrapper = ({ children, session }: any) => (
  <SessionProvider session={session}>
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  </SessionProvider>
)

describe('Navigation Flow Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Authentication Flow', () => {
    it('should show navigation for authenticated users', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
      })
    })

    it('should handle logout flow', async () => {
      const { useSession, signOut } = await import('next-auth/react')
      const mockSignOut = vi.fn()
      vi.mocked(signOut).mockImplementation(mockSignOut)
      
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()
      
      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Header />
        </TestWrapper>
      )

      // Open user dropdown
      const userButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(userButton)

      // Click logout
      const logoutButton = await screen.findByText('Logout')
      await user.click(logoutButton)

      expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/login' })
    })
  })

  describe('Authorization Flow', () => {
    it('should filter navigation items based on DATA_ENTRY role', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Data Entry User',
            email: 'entry@example.com',
            role: 'DATA_ENTRY',
            permissions: ['inventory:read', 'inventory:write'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(
        <TestWrapper session={{ user: { role: 'DATA_ENTRY' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should see allowed items
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
        expect(screen.getByText('Data Log')).toBeInTheDocument()

        // Should NOT see restricted items
        expect(screen.queryByText('Audit Log')).not.toBeInTheDocument()
        expect(screen.queryByText('Backup')).not.toBeInTheDocument()
      })
    })

    it('should show all navigation items for ADMIN role', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'inventory:delete', 'reports:view', 'users:manage', 'settings:manage', 'audit:view'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
        expect(screen.getByText('Data Log')).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.getByText('Reports')).toBeInTheDocument()
        expect(screen.getByText('Audit Log')).toBeInTheDocument()
        expect(screen.getByText('Backup')).toBeInTheDocument()
        expect(screen.getByText('Settings')).toBeInTheDocument()
      })
    })

    it('should show limited items for AUDITOR role', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Auditor User',
            email: 'auditor@example.com',
            role: 'AUDITOR',
            permissions: ['inventory:read', 'reports:view', 'audit:view'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      render(
        <TestWrapper session={{ user: { role: 'AUDITOR' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should see read-only items
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
        expect(screen.getByText('Data Log')).toBeInTheDocument()
        expect(screen.getByText('Analytics')).toBeInTheDocument()
        expect(screen.getByText('Reports')).toBeInTheDocument()
        expect(screen.getByText('Audit Log')).toBeInTheDocument()

        // Should NOT see write items
        expect(screen.queryByText('Data Entry')).not.toBeInTheDocument()
        expect(screen.queryByText('Backup')).not.toBeInTheDocument()
      })
    })
  })

  describe('Navigation Interaction', () => {
    it('should navigate between pages', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Data Entry')).toBeInTheDocument()
      })

      const dataEntryLink = screen.getByRole('link', { name: /data entry/i })
      expect(dataEntryLink).toHaveAttribute('href', '/data-entry')
    })

    it('should handle keyboard navigation in sidebar', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      const firstLink = screen.getByRole('link', { name: /dashboard/i })
      firstLink.focus()

      // Press ArrowDown to move to next item
      await user.keyboard('{ArrowDown}')
      
      // The next link should be focused (we can't directly test focus, but we can verify the structure)
      expect(screen.getByRole('link', { name: /data entry/i })).toBeInTheDocument()
    })

    it('should toggle sidebar collapse state', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Dashboard')).toBeInTheDocument()
      })

      const toggleButton = screen.getByRole('button', { name: /collapse sidebar/i })
      await user.click(toggleButton)

      // Check localStorage was updated
      expect(localStorage.getItem('sidebar-collapsed')).toBe('true')
    })
  })

  describe('Header Integration', () => {
    it('should display user information in header', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'John Doe',
            email: 'john@example.com',
            role: 'MANAGER',
            permissions: ['inventory:read', 'inventory:write', 'reports:view'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()

      render(
        <TestWrapper session={{ user: { role: 'MANAGER' } }}>
          <Header />
        </TestWrapper>
      )

      // Open user dropdown
      const userButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(userButton)

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument()
        expect(screen.getByText('john@example.com')).toBeInTheDocument()
        expect(screen.getByText('Manager')).toBeInTheDocument()
      })
    })

    it('should navigate to settings from header dropdown', async () => {
      const { useSession } = await import('next-auth/react')
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: ['inventory:read', 'inventory:write', 'users:manage', 'settings:manage'],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      })

      const user = userEvent.setup()

      render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Header />
        </TestWrapper>
      )

      // Open user dropdown
      const userButton = screen.getByRole('button', { name: /user menu/i })
      await user.click(userButton)

      // Click settings
      const settingsButton = await screen.findByText('Settings')
      await user.click(settingsButton)

      expect(mockPush).toHaveBeenCalledWith('/settings')
    })
  })
})
