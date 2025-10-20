/**
 * Global Search Component Tests
 * Tests for search functionality, keyboard navigation, and recent searches
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GlobalSearch } from '../GlobalSearch';
import { NextIntlClientProvider } from 'next-intl';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock fetch
global.fetch = vi.fn();

const mockMessages = {
  search: {
    placeholder: 'Search inventory, reports, users, settings...',
    recent: 'Recent Searches',
    clearRecent: 'Clear',
    items: 'Inventory Items',
    reports: 'Reports',
    users: 'Users',
    settings: 'Settings',
    noResults: 'No results found',
    tryDifferent: 'Try a different search term',
    startTyping: 'Start typing to search',
    navigate: 'Navigate',
    select: 'Select',
    close: 'Close',
  },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={mockMessages}>
    {children}
  </NextIntlClientProvider>
);

describe('GlobalSearch', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render when open', () => {
    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    expect(
      screen.getByPlaceholderText(/search inventory/i)
    ).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(<GlobalSearch isOpen={false} onClose={mockOnClose} />, { wrapper });

    expect(
      screen.queryByPlaceholderText(/search inventory/i)
    ).not.toBeInTheDocument();
  });

  it('should call onClose when backdrop is clicked', () => {
    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    const backdrop = screen.getByRole('dialog').parentElement
      ?.previousSibling as HTMLElement;
    fireEvent.click(backdrop);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display empty state when no query', () => {
    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    expect(screen.getByText(/start typing to search/i)).toBeInTheDocument();
  });

  it('should perform search when typing', async () => {
    const mockResults = {
      data: {
        items: [
          {
            id: '1',
            type: 'item',
            title: 'Test Item',
            description: 'Test Description',
            url: '/inventory/1',
          },
        ],
        reports: [],
        users: [],
        settings: [],
        total: 1,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    const input = screen.getByPlaceholderText(/search inventory/i);
    fireEvent.change(input, { target: { value: 'test' } });

    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/search',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ query: 'test', limit: 5 }),
          })
        );
      },
      { timeout: 500 }
    );
  });

  it('should display no results message when search returns empty', async () => {
    const mockResults = {
      data: {
        items: [],
        reports: [],
        users: [],
        settings: [],
        total: 0,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    const input = screen.getByPlaceholderText(/search inventory/i);
    fireEvent.change(input, { target: { value: 'nonexistent' } });

    await waitFor(
      () => {
        expect(screen.getByText(/no results found/i)).toBeInTheDocument();
      },
      { timeout: 500 }
    );
  });

  it('should handle keyboard navigation', async () => {
    const mockResults = {
      data: {
        items: [
          {
            id: '1',
            type: 'item',
            title: 'Item 1',
            description: 'Description 1',
            url: '/inventory/1',
          },
          {
            id: '2',
            type: 'item',
            title: 'Item 2',
            description: 'Description 2',
            url: '/inventory/2',
          },
        ],
        reports: [],
        users: [],
        settings: [],
        total: 2,
      },
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResults,
    });

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    const input = screen.getByPlaceholderText(/search inventory/i);
    fireEvent.change(input, { target: { value: 'item' } });

    await waitFor(() => {
      expect(screen.getByText('Item 1')).toBeInTheDocument();
    });

    // Test arrow down navigation
    fireEvent.keyDown(document, { key: 'ArrowDown' });

    // First item should be selected by default, arrow down should select second
    const buttons = screen.getAllByRole('option');
    expect(buttons[1]).toHaveClass('bg-blue-50');
  });

  it('should close on Escape key', () => {
    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display recent searches when available', () => {
    localStorage.setItem(
      'recent-searches',
      JSON.stringify(['test search', 'another search'])
    );

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    expect(screen.getByText(/recent searches/i)).toBeInTheDocument();
    expect(screen.getByText('test search')).toBeInTheDocument();
    expect(screen.getByText('another search')).toBeInTheDocument();
  });

  it('should clear recent searches', () => {
    localStorage.setItem('recent-searches', JSON.stringify(['test search']));

    render(<GlobalSearch isOpen={true} onClose={mockOnClose} />, { wrapper });

    const clearButton = screen.getByText(/clear/i);
    fireEvent.click(clearButton);

    expect(localStorage.getItem('recent-searches')).toBeNull();
  });
});
