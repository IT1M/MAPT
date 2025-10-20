/**
 * Accessibility Tests: Navigation Components
 * Tests WCAG AA compliance for navigation elements
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { SessionProvider } from 'next-auth/react';
import { NextIntlClientProvider } from 'next-intl';
import { ThemeProvider } from 'next-themes';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { Breadcrumbs } from '@/components/layout/Breadcrumbs';
import { NotificationProvider } from '@/context/NotificationContext';

expect.extend(toHaveNoViolations);

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock next-auth
vi.mock('next-auth/react', async () => {
  const actual = await vi.importActual('next-auth/react');
  return {
    ...actual,
    useSession: vi.fn(),
    signOut: vi.fn(),
  };
});

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
    home: 'Home',
  },
  settings: {
    sections: {
      profile: 'Profile',
    },
  },
};

const TestWrapper = ({ children, session }: any) => (
  <SessionProvider session={session}>
    <NextIntlClientProvider locale="en" messages={messages}>
      <ThemeProvider attribute="class" defaultTheme="light">
        <NotificationProvider>{children}</NotificationProvider>
      </ThemeProvider>
    </NextIntlClientProvider>
  </SessionProvider>
);

describe('Navigation Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Sidebar Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels on navigation items', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const nav = container.querySelector('nav');
      expect(nav).toHaveAttribute('role', 'navigation');
      expect(nav).toHaveAttribute('aria-label', 'Main navigation');

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        expect(link).toHaveAttribute('aria-label');
      });
    });

    it('should have proper focus indicators', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        const classes = link.className;
        expect(classes).toContain('focus:outline-none');
        expect(classes).toContain('focus:ring-2');
      });
    });

    it('should support keyboard navigation', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        expect(link).toHaveAttribute('href');
        // Links should be keyboard accessible (no tabindex=-1)
        const tabindex = link.getAttribute('tabindex');
        expect(tabindex === null || parseInt(tabindex) >= 0).toBe(true);
      });
    });

    it('should have accessible toggle button', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const toggleButton = container.querySelector(
        'button[aria-label*="sidebar"]'
      );
      expect(toggleButton).toBeInTheDocument();
      expect(toggleButton).toHaveAttribute('aria-label');
      expect(toggleButton).toHaveAttribute('title');
    });
  });

  describe('Header Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Header />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes on dropdown', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Header />
        </TestWrapper>
      );

      const userButton = container.querySelector(
        'button[aria-haspopup="true"]'
      );
      expect(userButton).toBeInTheDocument();
      expect(userButton).toHaveAttribute('aria-expanded');
      expect(userButton).toHaveAttribute('aria-label');
    });

    it('should have accessible theme toggle', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Header />
        </TestWrapper>
      );

      // Theme toggle should be accessible
      const buttons = container.querySelectorAll('button');
      buttons.forEach((button) => {
        expect(button).toHaveAttribute('aria-label');
      });
    });
  });

  describe('Breadcrumbs Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper session={null}>
          <Breadcrumbs />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use proper semantic HTML', async () => {
      const { container } = render(
        <TestWrapper session={null}>
          <Breadcrumbs />
        </TestWrapper>
      );

      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb');

      const list = container.querySelector('ol');
      expect(list).toBeInTheDocument();
    });

    it('should mark current page correctly', async () => {
      const { container } = render(
        <TestWrapper session={null}>
          <Breadcrumbs />
        </TestWrapper>
      );

      // Last breadcrumb should have aria-current="page"
      const links = container.querySelectorAll('a, span');
      if (links.length > 0) {
        const lastItem = links[links.length - 1];
        // Either the last link or a span should indicate current page
        const hasAriaCurrent = Array.from(links).some(
          (item) => item.getAttribute('aria-current') === 'page'
        );
        expect(hasAriaCurrent || lastItem.tagName === 'SPAN').toBe(true);
      }
    });
  });

  describe('Color Contrast', () => {
    it('should have sufficient color contrast in light mode', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should have descriptive link text', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <Sidebar />
        </TestWrapper>
      );

      const links = container.querySelectorAll('a');
      links.forEach((link) => {
        const ariaLabel = link.getAttribute('aria-label');
        const textContent = link.textContent;
        // Each link should have either visible text or aria-label
        expect(ariaLabel || textContent?.trim()).toBeTruthy();
      });
    });

    it('should have proper heading hierarchy', async () => {
      const { useSession } = await import('next-auth/react');
      vi.mocked(useSession).mockReturnValue({
        data: {
          user: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
            role: 'ADMIN',
            permissions: [
              'inventory:read',
              'inventory:write',
              'users:manage',
              'settings:manage',
            ],
          },
          expires: '2024-12-31',
        },
        status: 'authenticated',
        update: vi.fn(),
      });

      const { container } = render(
        <TestWrapper session={{ user: { role: 'ADMIN' } }}>
          <div>
            <Header />
            <Sidebar />
          </div>
        </TestWrapper>
      );

      const results = await axe(container, {
        rules: {
          'heading-order': { enabled: true },
        },
      });

      expect(results).toHaveNoViolations();
    });
  });
});
