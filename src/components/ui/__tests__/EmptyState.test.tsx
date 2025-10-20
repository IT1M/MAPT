/**
 * EmptyState Component Tests
 * Tests for different empty state variants and actions
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EmptyState,
  TableEmptyState,
  NotificationsEmptyState,
  SearchEmptyState,
  ErrorEmptyState,
} from '../EmptyState';

describe('EmptyState', () => {
  describe('Basic rendering', () => {
    it('should render title', () => {
      render(<EmptyState title="No data available" />);

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('should render description when provided', () => {
      render(
        <EmptyState
          title="No data"
          description="Start by adding your first item"
        />
      );

      expect(
        screen.getByText('Start by adding your first item')
      ).toBeInTheDocument();
    });

    it('should not render description when not provided', () => {
      const { container } = render(<EmptyState title="No data" />);

      const paragraphs = container.querySelectorAll('p');
      expect(paragraphs).toHaveLength(0);
    });

    it('should apply custom className', () => {
      const { container } = render(
        <EmptyState title="No data" className="custom-class" />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass('custom-class');
    });
  });

  describe('Illustrations', () => {
    it('should render no-data illustration', () => {
      const { container } = render(
        <EmptyState title="No data" illustration="no-data" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render no-results illustration', () => {
      const { container } = render(
        <EmptyState title="No results" illustration="no-results" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should render no-access illustration', () => {
      const { container } = render(
        <EmptyState title="No access" illustration="no-access" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-yellow-500');
    });

    it('should render error illustration', () => {
      const { container } = render(
        <EmptyState title="Error" illustration="error" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass('text-red-500');
    });

    it('should render custom icon when provided', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

      render(<EmptyState title="No data" icon={<CustomIcon />} />);

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });

    it('should prioritize custom icon over illustration', () => {
      const CustomIcon = () => <div data-testid="custom-icon">Custom</div>;

      render(
        <EmptyState
          title="No data"
          icon={<CustomIcon />}
          illustration="no-data"
        />
      );

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('should render action button with onClick', () => {
      const handleClick = vi.fn();

      render(
        <EmptyState
          title="No data"
          action={{ label: 'Add Item', onClick: handleClick }}
        />
      );

      const button = screen.getByRole('button', { name: 'Add Item' });
      expect(button).toBeInTheDocument();

      fireEvent.click(button);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should render action link with href', () => {
      render(
        <EmptyState
          title="No data"
          action={{ label: 'Go to page', href: '/page' }}
        />
      );

      const link = screen.getByRole('link', { name: 'Go to page' });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/page');
    });

    it('should not render action when not provided', () => {
      render(<EmptyState title="No data" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
      expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('should apply button styles to action', () => {
      render(
        <EmptyState
          title="No data"
          action={{ label: 'Action', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-primary-600', 'hover:bg-primary-700');
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(<EmptyState title="No data available" />);

      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('No data available');
    });

    it('should have focus management for action button', () => {
      render(
        <EmptyState
          title="No data"
          action={{ label: 'Add Item', onClick: vi.fn() }}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('focus:outline-none', 'focus:ring-2');
    });
  });
});

describe('TableEmptyState', () => {
  it('should render with default no-data message', () => {
    render(<TableEmptyState />);

    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  it('should render with custom title and description', () => {
    render(
      <TableEmptyState title="Custom title" description="Custom description" />
    );

    expect(screen.getByText('Custom title')).toBeInTheDocument();
    expect(screen.getByText('Custom description')).toBeInTheDocument();
  });

  it('should show no-results illustration when hasFilters is true', () => {
    const { container } = render(<TableEmptyState hasFilters={true} />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should show reset filters button when hasFilters and onResetFilters provided', () => {
    const handleReset = vi.fn();

    render(<TableEmptyState hasFilters={true} onResetFilters={handleReset} />);

    const button = screen.getByRole('button', { name: 'Reset Filters' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleReset).toHaveBeenCalledTimes(1);
  });

  it('should render custom action when provided', () => {
    render(
      <TableEmptyState action={{ label: 'Custom Action', onClick: vi.fn() }} />
    );

    expect(
      screen.getByRole('button', { name: 'Custom Action' })
    ).toBeInTheDocument();
  });

  it('should wrap content in table-styled container', () => {
    const { container } = render(<TableEmptyState />);

    const wrapper = container.querySelector('.bg-white');
    expect(wrapper).toHaveClass('rounded-lg', 'border');
  });
});

describe('NotificationsEmptyState', () => {
  it('should render success message', () => {
    render(<NotificationsEmptyState />);

    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
    expect(
      screen.getByText('No new notifications at this time')
    ).toBeInTheDocument();
  });

  it('should render checkmark icon', () => {
    const { container } = render(<NotificationsEmptyState />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-green-600');
  });

  it('should have green background for icon', () => {
    const { container } = render(<NotificationsEmptyState />);

    const iconWrapper = container.querySelector('.bg-green-100');
    expect(iconWrapper).toBeInTheDocument();
  });
});

describe('SearchEmptyState', () => {
  it('should render with search query', () => {
    render(<SearchEmptyState searchQuery="test query" />);

    expect(screen.getByText('No results for "test query"')).toBeInTheDocument();
  });

  it('should render default description', () => {
    render(<SearchEmptyState searchQuery="test" />);

    expect(
      screen.getByText('Try different keywords or check your spelling')
    ).toBeInTheDocument();
  });

  it('should render clear search button when onClearSearch provided', () => {
    const handleClear = vi.fn();

    render(<SearchEmptyState searchQuery="test" onClearSearch={handleClear} />);

    const button = screen.getByRole('button', { name: 'Clear Search' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClear).toHaveBeenCalledTimes(1);
  });

  it('should not render button when onClearSearch not provided', () => {
    render(<SearchEmptyState searchQuery="test" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should use no-results illustration', () => {
    const { container } = render(<SearchEmptyState searchQuery="test" />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});

describe('ErrorEmptyState', () => {
  it('should render default error message', () => {
    render(<ErrorEmptyState />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('We encountered an error while loading this content')
    ).toBeInTheDocument();
  });

  it('should render custom title and description', () => {
    render(
      <ErrorEmptyState
        title="Custom error"
        description="Custom error description"
      />
    );

    expect(screen.getByText('Custom error')).toBeInTheDocument();
    expect(screen.getByText('Custom error description')).toBeInTheDocument();
  });

  it('should render retry button when onRetry provided', () => {
    const handleRetry = vi.fn();

    render(<ErrorEmptyState onRetry={handleRetry} />);

    const button = screen.getByRole('button', { name: 'Try Again' });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleRetry).toHaveBeenCalledTimes(1);
  });

  it('should not render button when onRetry not provided', () => {
    render(<ErrorEmptyState />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('should use error illustration', () => {
    const { container } = render(<ErrorEmptyState />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveClass('text-red-500');
  });
});

describe('Dark mode support', () => {
  it('should have dark mode classes', () => {
    const { container } = render(<EmptyState title="No data" />);

    const title = screen.getByText('No data');
    expect(title).toHaveClass('dark:text-white');
  });

  it('should have dark mode button styles', () => {
    render(
      <EmptyState
        title="No data"
        action={{ label: 'Action', onClick: vi.fn() }}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('dark:bg-primary-500');
  });
});
