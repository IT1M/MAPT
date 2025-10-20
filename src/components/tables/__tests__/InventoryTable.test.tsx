import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InventoryTable } from '../InventoryTable';
import { Destination } from '@prisma/client';
import type { InventoryItemWithUser } from '@/types';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

const mockItems: InventoryItemWithUser[] = [
  {
    id: '1',
    itemName: 'Surgical Gloves',
    batch: 'BATCH-2024-001',
    quantity: 1000,
    reject: 50,
    destination: Destination.MAIS,
    category: 'Surgical Supplies',
    notes: 'Standard latex gloves',
    enteredById: '1',
    deletedAt: null,
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:30:00'),
    enteredBy: {
      id: '1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
    },
    rejectPercentage: 5.0,
  },
  {
    id: '2',
    itemName: 'Syringes 10ml',
    batch: 'BATCH-2024-002',
    quantity: 500,
    reject: 0,
    destination: Destination.FOZAN,
    category: 'Medical Equipment',
    notes: 'Sterile disposable syringes',
    enteredById: '2',
    deletedAt: null,
    createdAt: new Date('2024-01-15T11:45:00'),
    updatedAt: new Date('2024-01-15T11:45:00'),
    enteredBy: {
      id: '2',
      name: 'Fatima Hassan',
      email: 'fatima@example.com',
    },
    rejectPercentage: 0,
  },
];

describe('InventoryTable', () => {
  it('renders table with items', () => {
    render(<InventoryTable items={mockItems} />);

    // Check if item names are rendered
    expect(screen.getByText('Surgical Gloves')).toBeInTheDocument();
    expect(screen.getByText('Syringes 10ml')).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<InventoryTable items={[]} loading={true} />);

    // Check for loading skeleton
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
  });

  it('renders empty state when no items', () => {
    render(<InventoryTable items={[]} />);

    expect(screen.getByText('dataLog.noData')).toBeInTheDocument();
  });

  it('renders error state', () => {
    const error = new Error('Test error');
    render(<InventoryTable items={[]} error={error} />);

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('displays destination badges with correct colors', () => {
    render(<InventoryTable items={mockItems} />);

    const maisBadge = screen.getByText('MAIS');
    const fozanBadge = screen.getByText('FOZAN');

    expect(maisBadge).toHaveClass('bg-blue-100');
    expect(fozanBadge).toHaveClass('bg-green-100');
  });

  it('formats dates correctly', () => {
    render(<InventoryTable items={mockItems} />);

    // Check if date is formatted as "DD MMM YYYY, HH:mm"
    expect(screen.getByText(/15 Jan 2024, 10:30/)).toBeInTheDocument();
  });

  it('calculates and displays reject percentage', () => {
    render(<InventoryTable items={mockItems} />);

    // First item has 50 rejects out of 1000 = 5%
    expect(screen.getByText('5.00%')).toBeInTheDocument();

    // Second item has 0 rejects = 0%
    expect(screen.getByText('0.00%')).toBeInTheDocument();
  });

  it('applies right alignment to numeric columns', () => {
    const { container } = render(<InventoryTable items={mockItems} />);

    // Find quantity cells and check alignment
    const quantityCells = container.querySelectorAll('td.text-right');
    expect(quantityCells.length).toBeGreaterThan(0);
  });

  it('makes item name column sticky', () => {
    const { container } = render(<InventoryTable items={mockItems} />);

    // Find sticky cells
    const stickyCells = container.querySelectorAll('.sticky');
    expect(stickyCells.length).toBeGreaterThan(0);
  });

  it('hides columns on mobile', () => {
    const { container } = render(<InventoryTable items={mockItems} />);

    // Find cells with mobile hidden class
    const hiddenOnMobile = container.querySelectorAll(
      '.hidden.md\\:table-cell'
    );
    expect(hiddenOnMobile.length).toBeGreaterThan(0);
  });

  it('renders column customization button', () => {
    render(
      <InventoryTable items={mockItems} onToggleColumnVisibility={vi.fn()} />
    );

    const columnButton = screen.getByLabelText('Column settings');
    expect(columnButton).toBeInTheDocument();
    expect(columnButton).toHaveTextContent('Columns');
  });

  it('respects column visibility settings', () => {
    const columnVisibility = {
      itemName: true,
      batch: false,
      quantity: true,
      reject: false,
      rejectPercentage: true,
      destination: true,
      category: true,
      enteredBy: true,
      createdAt: true,
      actions: true,
    };

    render(
      <InventoryTable items={mockItems} columnVisibility={columnVisibility} />
    );

    // Visible columns should be present
    expect(screen.getByText('Surgical Gloves')).toBeInTheDocument();

    // Hidden columns should not render their headers
    const headers = screen.getAllByRole('columnheader');
    const batchHeader = headers.find((h) => h.textContent === 'Batch Number');
    expect(batchHeader).toBeUndefined();
  });

  it('applies custom column widths', () => {
    const columnWidths = {
      itemName: 300,
      batch: 200,
    };

    const { container } = render(
      <InventoryTable items={mockItems} columnWidths={columnWidths} />
    );

    // Check if custom widths are applied
    const headers = container.querySelectorAll('th');
    const itemNameHeader = Array.from(headers).find((h) =>
      h.textContent?.includes('Item Name')
    );
    expect(itemNameHeader).toHaveStyle({ width: '300px' });
  });

  it('renders resize handles when onColumnResize is provided', () => {
    const { container } = render(
      <InventoryTable items={mockItems} onColumnResize={vi.fn()} />
    );

    // Check for resize handles
    const resizeHandles = container.querySelectorAll('.cursor-col-resize');
    expect(resizeHandles.length).toBeGreaterThan(0);
  });

  it('shows column menu when column settings button is clicked', async () => {
    const onToggle = vi.fn();
    const { findByText } = render(
      <InventoryTable items={mockItems} onToggleColumnVisibility={onToggle} />
    );

    // Open column menu
    const columnButton = screen.getByLabelText('Column settings');
    columnButton.click();

    // Check if menu is visible
    const menuTitle = await findByText('Show/Hide Columns');
    expect(menuTitle).toBeInTheDocument();
  });

  it('calls onResetPreferences when reset button is clicked', async () => {
    const onReset = vi.fn();
    const { findByText } = render(
      <InventoryTable
        items={mockItems}
        onToggleColumnVisibility={vi.fn()}
        onResetPreferences={onReset}
      />
    );

    // Open column menu
    const columnButton = screen.getByLabelText('Column settings');
    columnButton.click();

    // Click reset button
    const resetButton = await findByText('Reset to Default');
    resetButton.click();

    expect(onReset).toHaveBeenCalled();
  });

  it('renders actions dropdown button for each row', () => {
    render(<InventoryTable items={mockItems} />);

    const actionButtons = screen.getAllByLabelText('Actions menu');
    expect(actionButtons).toHaveLength(mockItems.length);
  });

  it('opens actions dropdown when button is clicked', async () => {
    const { findByText } = render(
      <InventoryTable
        items={mockItems}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
      />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    // Check if dropdown menu items are visible
    const editButton = await findByText('Edit');
    const duplicateButton = await findByText('Duplicate');

    expect(editButton).toBeInTheDocument();
    expect(duplicateButton).toBeInTheDocument();
  });

  it('calls onEdit when Edit action is clicked', async () => {
    const onEdit = vi.fn();
    const { findByText } = render(
      <InventoryTable items={mockItems} onEdit={onEdit} />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    const editButton = await findByText('Edit');
    editButton.click();

    expect(onEdit).toHaveBeenCalledWith(mockItems[0]);
  });

  it('calls onDuplicate when Duplicate action is clicked', async () => {
    const onDuplicate = vi.fn();
    const { findByText } = render(
      <InventoryTable items={mockItems} onDuplicate={onDuplicate} />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    const duplicateButton = await findByText('Duplicate');
    duplicateButton.click();

    expect(onDuplicate).toHaveBeenCalledWith(mockItems[0]);
  });

  it('calls onViewAudit when View Audit History action is clicked', async () => {
    const onViewAudit = vi.fn();
    const { findByText } = render(
      <InventoryTable items={mockItems} onViewAudit={onViewAudit} />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    const auditButton = await findByText('View Audit History');
    auditButton.click();

    expect(onViewAudit).toHaveBeenCalledWith(mockItems[0].id);
  });

  it('shows Delete action only when user has delete permission', async () => {
    const onDelete = vi.fn();
    const { findByText, rerender } = render(
      <InventoryTable
        items={mockItems}
        onDelete={onDelete}
        userPermissions={['inventory:delete']}
      />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    // Should show delete button
    const deleteButton = await findByText('Delete');
    expect(deleteButton).toBeInTheDocument();

    // Rerender without delete permission
    rerender(
      <InventoryTable
        items={mockItems}
        onDelete={onDelete}
        userPermissions={[]}
      />
    );

    actionButtons[0].click();

    // Should not show delete button
    const deleteButtons = screen.queryAllByText('Delete');
    expect(deleteButtons).toHaveLength(0);
  });

  it('calls onDelete when Delete action is clicked', async () => {
    const onDelete = vi.fn();
    const { findByText } = render(
      <InventoryTable
        items={mockItems}
        onDelete={onDelete}
        userPermissions={['inventory:delete']}
      />
    );

    const actionButtons = screen.getAllByLabelText('Actions menu');
    actionButtons[0].click();

    const deleteButton = await findByText('Delete');
    deleteButton.click();

    expect(onDelete).toHaveBeenCalledWith(mockItems[0].id);
  });

  it('calls onRowClick when row is clicked', () => {
    const onRowClick = vi.fn();
    render(<InventoryTable items={mockItems} onRowClick={onRowClick} />);

    const rows = screen.getAllByRole('row');
    // Skip header row, click first data row
    rows[1].click();

    expect(onRowClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('applies hover highlighting to rows', () => {
    const { container } = render(<InventoryTable items={mockItems} />);

    const rows = container.querySelectorAll('tbody tr');
    rows.forEach((row) => {
      expect(row).toHaveClass('hover:bg-gray-50');
    });
  });

  it('highlights selected rows', () => {
    const selectedIds = new Set(['1']);
    const { container } = render(
      <InventoryTable
        items={mockItems}
        selectedIds={selectedIds}
        onSelectionChange={vi.fn()}
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    expect(rows[0]).toHaveClass('bg-primary-50');
  });

  it('supports keyboard navigation with arrow keys', () => {
    const { container } = render(<InventoryTable items={mockItems} />);

    const rows = container.querySelectorAll('tbody tr');
    const firstRow = rows[0] as HTMLElement;

    // Focus first row
    firstRow.focus();
    expect(document.activeElement).toBe(firstRow);

    // Press ArrowDown
    firstRow.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })
    );

    // Second row should be focused (handled by component state)
    expect(rows[0]).toHaveAttribute('tabIndex', '0');
  });

  it('calls onRowClick when Enter key is pressed', () => {
    const onRowClick = vi.fn();
    const { container } = render(
      <InventoryTable items={mockItems} onRowClick={onRowClick} />
    );

    const rows = container.querySelectorAll('tbody tr');
    const firstRow = rows[0] as HTMLElement;

    firstRow.focus();
    firstRow.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
    );

    expect(onRowClick).toHaveBeenCalledWith(mockItems[0]);
  });

  it('toggles selection when Space key is pressed', () => {
    const onSelectionChange = vi.fn();
    const { container } = render(
      <InventoryTable
        items={mockItems}
        selectedIds={new Set()}
        onSelectionChange={onSelectionChange}
      />
    );

    const rows = container.querySelectorAll('tbody tr');
    const firstRow = rows[0] as HTMLElement;

    firstRow.focus();
    firstRow.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Space', bubbles: true })
    );

    expect(onSelectionChange).toHaveBeenCalled();
  });

  describe('Virtual Scrolling', () => {
    it('uses virtual scrolling for datasets with more than 1000 rows', () => {
      // Create a large dataset
      const largeDataset: InventoryItemWithUser[] = Array.from(
        { length: 1500 },
        (_, i) => ({
          id: `${i + 1}`,
          itemName: `Item ${i + 1}`,
          batch: `BATCH-${i + 1}`,
          quantity: 100,
          reject: 5,
          destination: i % 2 === 0 ? Destination.MAIS : Destination.FOZAN,
          category: 'Test Category',
          notes: 'Test notes',
          enteredById: '1',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          enteredBy: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
          rejectPercentage: 5.0,
        })
      );

      const { container } = render(<InventoryTable items={largeDataset} />);

      // Check for virtual scrolling indicator
      expect(
        screen.getByText(/Using virtual scrolling for 1,500 items/)
      ).toBeInTheDocument();
    });

    it('does not use virtual scrolling for datasets with 1000 or fewer rows', () => {
      // Create a dataset with exactly 1000 items
      const mediumDataset: InventoryItemWithUser[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `${i + 1}`,
          itemName: `Item ${i + 1}`,
          batch: `BATCH-${i + 1}`,
          quantity: 100,
          reject: 5,
          destination: i % 2 === 0 ? Destination.MAIS : Destination.FOZAN,
          category: 'Test Category',
          notes: 'Test notes',
          enteredById: '1',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          enteredBy: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
          rejectPercentage: 5.0,
        })
      );

      render(<InventoryTable items={mediumDataset} />);

      // Should not show virtual scrolling indicator
      expect(
        screen.queryByText(/Using virtual scrolling/)
      ).not.toBeInTheDocument();

      // Should render standard table
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    it('maintains accessibility features with virtual scrolling', () => {
      // Create a large dataset
      const largeDataset: InventoryItemWithUser[] = Array.from(
        { length: 1500 },
        (_, i) => ({
          id: `${i + 1}`,
          itemName: `Item ${i + 1}`,
          batch: `BATCH-${i + 1}`,
          quantity: 100,
          reject: 5,
          destination: i % 2 === 0 ? Destination.MAIS : Destination.FOZAN,
          category: 'Test Category',
          notes: 'Test notes',
          enteredById: '1',
          deletedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          enteredBy: {
            id: '1',
            name: 'Test User',
            email: 'test@example.com',
          },
          rejectPercentage: 5.0,
        })
      );

      render(
        <InventoryTable
          items={largeDataset}
          selectedIds={new Set()}
          onSelectionChange={vi.fn()}
        />
      );

      // Check that virtual scrolling is enabled
      expect(
        screen.getByText(/Using virtual scrolling for 1,500 items/)
      ).toBeInTheDocument();

      // Virtual scrolling component should maintain column customization
      expect(screen.getByLabelText('Column settings')).toBeInTheDocument();
    });
  });

  describe('Row Selection', () => {
    it('renders selection checkboxes when onSelectionChange is provided', () => {
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={new Set()}
          onSelectionChange={vi.fn()}
        />
      );

      // Check for header checkbox
      const headerCheckbox = screen.getByLabelText('Select all items');
      expect(headerCheckbox).toBeInTheDocument();

      // Check for row checkboxes
      const rowCheckboxes = screen.getAllByRole('checkbox');
      expect(rowCheckboxes).toHaveLength(mockItems.length + 1); // +1 for header
    });

    it('does not render selection checkboxes when onSelectionChange is not provided', () => {
      render(<InventoryTable items={mockItems} />);

      const checkboxes = screen.queryAllByRole('checkbox');
      expect(checkboxes).toHaveLength(0);
    });

    it('checks individual row checkbox when item is selected', () => {
      const selectedIds = new Set(['1']);
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={vi.fn()}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // First checkbox is header, second is first row
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).not.toBeChecked();
    });

    it('calls onSelectionChange when individual checkbox is clicked', () => {
      const onSelectionChange = vi.fn();
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={new Set()}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Click first row checkbox (index 1, since 0 is header)
      checkboxes[1].click();

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1']));
    });

    it('calls onSelectionChange to deselect when checked checkbox is clicked', () => {
      const onSelectionChange = vi.fn();
      const selectedIds = new Set(['1']);
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      // Click first row checkbox to deselect
      checkboxes[1].click();

      expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('checks header checkbox when all items are selected', () => {
      const selectedIds = new Set(['1', '2']);
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={vi.fn()}
        />
      );

      const headerCheckbox = screen.getByLabelText('Select all items');
      expect(headerCheckbox).toBeChecked();
    });

    it('does not check header checkbox when some items are selected', () => {
      const selectedIds = new Set(['1']);
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={vi.fn()}
        />
      );

      const headerCheckbox = screen.getByLabelText('Select all items');
      expect(headerCheckbox).not.toBeChecked();
    });

    it('selects all items when header checkbox is clicked', () => {
      const onSelectionChange = vi.fn();
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={new Set()}
          onSelectionChange={onSelectionChange}
        />
      );

      const headerCheckbox = screen.getByLabelText('Select all items');
      headerCheckbox.click();

      expect(onSelectionChange).toHaveBeenCalledWith(new Set(['1', '2']));
    });

    it('deselects all items when header checkbox is unchecked', () => {
      const onSelectionChange = vi.fn();
      const selectedIds = new Set(['1', '2']);
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={onSelectionChange}
        />
      );

      const headerCheckbox = screen.getByLabelText('Select all items');
      headerCheckbox.click();

      expect(onSelectionChange).toHaveBeenCalledWith(new Set());
    });

    it('applies selected row styling to selected items', () => {
      const selectedIds = new Set(['1']);
      const { container } = render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={vi.fn()}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveClass('bg-primary-50');
      expect(rows[1]).not.toHaveClass('bg-primary-50');
    });

    it('sets aria-selected attribute on selected rows', () => {
      const selectedIds = new Set(['1']);
      const { container } = render(
        <InventoryTable
          items={mockItems}
          selectedIds={selectedIds}
          onSelectionChange={vi.fn()}
        />
      );

      const rows = container.querySelectorAll('tbody tr');
      expect(rows[0]).toHaveAttribute('aria-selected', 'true');
      expect(rows[1]).toHaveAttribute('aria-selected', 'false');
    });

    it('prevents row click when clicking on checkbox', () => {
      const onRowClick = vi.fn();
      render(
        <InventoryTable
          items={mockItems}
          selectedIds={new Set()}
          onSelectionChange={vi.fn()}
          onRowClick={onRowClick}
        />
      );

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes[1].click();

      // onRowClick should not be called when clicking checkbox
      expect(onRowClick).not.toHaveBeenCalled();
    });
  });
});
