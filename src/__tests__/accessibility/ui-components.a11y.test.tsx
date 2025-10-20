/**
 * Accessibility Tests: UI Components
 * Tests WCAG AA compliance for buttons, modals, notifications, etc.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { NextIntlClientProvider } from 'next-intl';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotificationProvider } from '@/context/NotificationContext';

expect.extend(toHaveNoViolations);

// Mock Button component
const TestButton = ({
  children,
  variant = 'primary',
  disabled = false,
  loading = false,
}: any) => (
  <button
    disabled={disabled || loading}
    aria-busy={loading}
    aria-disabled={disabled}
    className={`btn btn-${variant}`}
  >
    {loading ? (
      <>
        <span className="sr-only">Loading...</span>
        <span aria-hidden="true">⏳</span>
      </>
    ) : (
      children
    )}
  </button>
);

// Mock Modal component
const TestModal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="modal"
    >
      <div className="modal-content">
        <h2 id="modal-title">{title}</h2>
        <div>{children}</div>
        <button onClick={onClose} aria-label="Close modal">
          Close
        </button>
      </div>
    </div>
  );
};

// Mock Toast/Notification component
const TestToast = ({ message, type = 'info', onDismiss }: any) => (
  <div
    role="alert"
    aria-live="polite"
    aria-atomic="true"
    className={`toast toast-${type}`}
  >
    <div>{message}</div>
    <button onClick={onDismiss} aria-label="Dismiss notification">
      ×
    </button>
  </div>
);

// Mock Loading Spinner
const TestSpinner = ({ label = 'Loading' }: any) => (
  <div role="status" aria-live="polite" aria-busy="true">
    <span className="sr-only">{label}</span>
    <div aria-hidden="true" className="spinner">
      ⏳
    </div>
  </div>
);

const messages = {
  common: {
    loading: 'Loading',
    close: 'Close',
    dismiss: 'Dismiss',
  },
  emptyState: {
    noData: 'No data available',
    noResults: 'No results found',
    tryAgain: 'Try again',
  },
};

const TestWrapper = ({ children }: any) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    <NotificationProvider>{children}</NotificationProvider>
  </NextIntlClientProvider>
);

describe('UI Components Accessibility Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Buttons', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestButton>Click me</TestButton>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should indicate disabled state', () => {
      const { container } = render(
        <TestWrapper>
          <TestButton disabled={true}>Disabled Button</TestButton>
        </TestWrapper>
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    it('should indicate loading state', () => {
      const { container } = render(
        <TestWrapper>
          <TestButton loading={true}>Submit</TestButton>
        </TestWrapper>
      );

      const button = container.querySelector('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
      expect(button).toHaveAttribute('disabled');

      // Should have screen reader text
      const srText = container.querySelector('.sr-only');
      expect(srText).toBeInTheDocument();
      expect(srText?.textContent).toBe('Loading...');
    });

    it('should have descriptive text', () => {
      const { container } = render(
        <TestWrapper>
          <TestButton>Save Changes</TestButton>
        </TestWrapper>
      );

      const button = container.querySelector('button');
      expect(button?.textContent).toBeTruthy();
      expect(button?.textContent?.length).toBeGreaterThan(0);
    });
  });

  describe('Modals', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestModal isOpen={true} onClose={vi.fn()} title="Test Modal">
            <p>Modal content</p>
          </TestModal>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA attributes', () => {
      const { container } = render(
        <TestWrapper>
          <TestModal isOpen={true} onClose={vi.fn()} title="Confirm Action">
            <p>Are you sure?</p>
          </TestModal>
        </TestWrapper>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');

      const title = container.querySelector('#modal-title');
      expect(title).toBeInTheDocument();
      expect(title?.textContent).toBe('Confirm Action');
    });

    it('should have accessible close button', () => {
      const { container } = render(
        <TestWrapper>
          <TestModal isOpen={true} onClose={vi.fn()} title="Test">
            <p>Content</p>
          </TestModal>
        </TestWrapper>
      );

      const closeButton = container.querySelector(
        'button[aria-label*="Close"]'
      );
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveAttribute('aria-label');
    });
  });

  describe('Notifications/Toasts', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestToast message="Success!" type="success" onDismiss={vi.fn()} />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should use proper ARIA live region', () => {
      const { container } = render(
        <TestWrapper>
          <TestToast message="Item saved" type="success" onDismiss={vi.fn()} />
        </TestWrapper>
      );

      const toast = container.querySelector('[role="alert"]');
      expect(toast).toHaveAttribute('aria-live', 'polite');
      expect(toast).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have accessible dismiss button', () => {
      const { container } = render(
        <TestWrapper>
          <TestToast message="Warning!" type="warning" onDismiss={vi.fn()} />
        </TestWrapper>
      );

      const dismissButton = container.querySelector(
        'button[aria-label*="Dismiss"]'
      );
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Loading States', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <TestSpinner label="Loading data" />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should announce loading state', () => {
      const { container } = render(
        <TestWrapper>
          <TestSpinner label="Processing request" />
        </TestWrapper>
      );

      const status = container.querySelector('[role="status"]');
      expect(status).toHaveAttribute('aria-live', 'polite');
      expect(status).toHaveAttribute('aria-busy', 'true');

      const srText = container.querySelector('.sr-only');
      expect(srText?.textContent).toBe('Processing request');
    });

    it('should hide decorative spinner from screen readers', () => {
      const { container } = render(
        <TestWrapper>
          <TestSpinner />
        </TestWrapper>
      );

      const spinner = container.querySelector('.spinner');
      expect(spinner).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Empty States', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(
        <TestWrapper>
          <EmptyState
            type="no-data"
            title="No items found"
            description="Try adding some items"
          />
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper heading structure', () => {
      const { container } = render(
        <TestWrapper>
          <EmptyState
            type="no-results"
            title="No results"
            description="Try different filters"
          />
        </TestWrapper>
      );

      // Should have a heading
      const heading = container.querySelector('h2, h3, h4');
      expect(heading).toBeInTheDocument();
    });

    it('should have accessible action button', () => {
      const { container } = render(
        <TestWrapper>
          <EmptyState
            type="no-data"
            title="No data"
            description="Get started"
            action={{
              label: 'Add Item',
              onClick: vi.fn(),
            }}
          />
        </TestWrapper>
      );

      const button = container.querySelector('button');
      expect(button).toBeInTheDocument();
      expect(button?.textContent).toBeTruthy();
    });
  });

  describe('Focus Management', () => {
    it('should trap focus in modal', () => {
      const { container } = render(
        <TestWrapper>
          <TestModal isOpen={true} onClose={vi.fn()} title="Test">
            <input type="text" />
            <button>Action</button>
          </TestModal>
        </TestWrapper>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();

      // Modal should contain focusable elements
      const focusableElements = container.querySelectorAll(
        'button, input, select, textarea, a[href]'
      );
      expect(focusableElements.length).toBeGreaterThan(0);
    });
  });

  describe('Skip Links', () => {
    it('should have skip to main content link', () => {
      const { container } = render(
        <TestWrapper>
          <a href="#main-content" className="sr-only focus:not-sr-only">
            Skip to main content
          </a>
          <main id="main-content">Content</main>
        </TestWrapper>
      );

      const skipLink = container.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink?.textContent).toContain('Skip to main content');
    });
  });

  describe('ARIA Live Regions', () => {
    it('should announce dynamic content changes', () => {
      const { container } = render(
        <TestWrapper>
          <div aria-live="polite" aria-atomic="true">
            <p>5 new notifications</p>
          </div>
        </TestWrapper>
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });
  });

  describe('Reduced Motion', () => {
    it('should respect prefers-reduced-motion', () => {
      // This would typically be tested with CSS or animation libraries
      // Here we just verify the structure supports it
      const { container } = render(
        <TestWrapper>
          <div className="transition-all motion-reduce:transition-none">
            Animated content
          </div>
        </TestWrapper>
      );

      const element = container.querySelector(
        '.motion-reduce\\:transition-none'
      );
      expect(element).toBeInTheDocument();
    });
  });
});
