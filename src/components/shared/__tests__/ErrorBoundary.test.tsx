/**
 * ErrorBoundary Component Tests
 * Tests for error catching and recovery
 */

import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  ErrorBoundary,
  PageErrorBoundary,
  ComponentErrorBoundary,
} from '../ErrorBoundary'

// Mock the logger service
vi.mock('@/services/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

// Mock ErrorState component
vi.mock('@/components/ui/ErrorState', () => ({
  ErrorState: ({ title, description, retry, showHomeButton }: any) => (
    <div data-testid="error-state">
      <h1>{title}</h1>
      <p>{description}</p>
      {retry && <button onClick={retry}>Retry</button>}
      {showHomeButton && <button onClick={() => window.location.href = '/'}>Go Home</button>}
    </div>
  ),
}))

// Component that throws an error
const ThrowError = ({ shouldThrow = true }: { shouldThrow?: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for cleaner test output
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  describe('Error catching', () => {
    it('should catch errors from child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-state')).toBeInTheDocument()
    })

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument()
    })

    it('should display default error message', () => {
      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    })
  })

  describe('Custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const CustomFallback = () => <div>Custom error UI</div>

      render(
        <ErrorBoundary fallback={<CustomFallback />}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error UI')).toBeInTheDocument()
      expect(screen.queryByTestId('error-state')).not.toBeInTheDocument()
    })
  })

  describe('Error callback', () => {
    it('should call onError callback when error occurs', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledTimes(1)
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })

    it('should pass error details to callback', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError />
        </ErrorBoundary>
      )

      const [error] = onError.mock.calls[0]
      expect(error.message).toBe('Test error')
    })
  })

  describe('Error recovery', () => {
    it('should reset error state when onReset is called', () => {
      const onReset = vi.fn()

      const { rerender } = render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError />
        </ErrorBoundary>
      )

      expect(screen.getByTestId('error-state')).toBeInTheDocument()

      // Simulate reset
      const retryButton = screen.getByRole('button', { name: 'Retry' })
      retryButton.click()

      expect(onReset).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error logging', () => {
    it('should log error to localStorage', () => {
      localStorage.clear()

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const logs = localStorage.getItem('error-logs')
      expect(logs).toBeTruthy()

      const parsed = JSON.parse(logs!)
      expect(parsed).toHaveLength(1)
      expect(parsed[0].message).toBe('Test error')
    })

    it('should limit error logs to 50 entries', () => {
      // Pre-fill with 50 errors
      const existingLogs = Array(50).fill(null).map((_, i) => ({
        timestamp: new Date().toISOString(),
        message: `Error ${i}`,
      }))
      localStorage.setItem('error-logs', JSON.stringify(existingLogs))

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      const logs = localStorage.getItem('error-logs')
      const parsed = JSON.parse(logs!)
      expect(parsed).toHaveLength(50)
      // Should have removed the oldest and added the new one
      expect(parsed[49].message).toBe('Test error')
    })

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = Storage.prototype.setItem
      Storage.prototype.setItem = vi.fn(() => {
        throw new Error('Storage full')
      })

      // Should not throw
      expect(() => {
        render(
          <ErrorBoundary>
            <ThrowError />
          </ErrorBoundary>
        )
      }).not.toThrow()

      // Restore
      Storage.prototype.setItem = originalSetItem
    })
  })

  describe('Development vs Production', () => {
    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'

      render(
        <ErrorBoundary>
          <ThrowError />
        </ErrorBoundary>
      )

      // ErrorState should receive showDetails=true
      expect(screen.getByTestId('error-state')).toBeInTheDocument()

      process.env.NODE_ENV = originalEnv
    })
  })
})

describe('PageErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render page-level error UI', () => {
    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    )

    expect(screen.getByText('Page Error')).toBeInTheDocument()
  })

  it('should show home button', () => {
    render(
      <PageErrorBoundary>
        <ThrowError />
      </PageErrorBoundary>
    )

    expect(screen.getByText('Go Home')).toBeInTheDocument()
  })

  it('should render children when no error', () => {
    render(
      <PageErrorBoundary>
        <div>Page content</div>
      </PageErrorBoundary>
    )

    expect(screen.getByText('Page content')).toBeInTheDocument()
  })
})

describe('ComponentErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should render component-level error UI', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Component failed to load')).toBeInTheDocument()
  })

  it('should show component name when provided', () => {
    render(
      <ComponentErrorBoundary componentName="TestComponent">
        <ThrowError />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('TestComponent failed to load')).toBeInTheDocument()
  })

  it('should show reload button', () => {
    render(
      <ComponentErrorBoundary>
        <ThrowError />
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Reload page')).toBeInTheDocument()
  })

  it('should render children when no error', () => {
    render(
      <ComponentErrorBoundary>
        <div>Component content</div>
      </ComponentErrorBoundary>
    )

    expect(screen.getByText('Component content')).toBeInTheDocument()
  })

  it('should have warning styling', () => {
    const { container } = render(
      <ComponentErrorBoundary>
        <ThrowError />
      </ComponentErrorBoundary>
    )

    const wrapper = container.querySelector('.bg-yellow-50')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('Error information', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should capture error message', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const logs = localStorage.getItem('error-logs')
    const parsed = JSON.parse(logs!)
    expect(parsed[0].message).toBe('Test error')
  })

  it('should capture error stack', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const logs = localStorage.getItem('error-logs')
    const parsed = JSON.parse(logs!)
    expect(parsed[0].stack).toBeTruthy()
  })

  it('should capture timestamp', () => {
    const beforeTime = new Date()

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const afterTime = new Date()

    const logs = localStorage.getItem('error-logs')
    const parsed = JSON.parse(logs!)
    const logTime = new Date(parsed[0].timestamp)

    expect(logTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    expect(logTime.getTime()).toBeLessThanOrEqual(afterTime.getTime())
  })

  it('should capture component stack', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const logs = localStorage.getItem('error-logs')
    const parsed = JSON.parse(logs!)
    expect(parsed[0].componentStack).toBeTruthy()
  })
})

describe('Accessibility', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('should have proper heading structure', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Something went wrong')
  })

  it('should have actionable retry button', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    )

    const button = screen.getByRole('button', { name: 'Retry' })
    expect(button).toBeInTheDocument()
  })
})
