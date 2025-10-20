import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BulkActionsToolbar } from '../BulkActionsToolbar';

// Mock next-intl
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

describe('BulkActionsToolbar', () => {
  const defaultProps = {
    selectedCount: 5,
    onBulkDelete: vi.fn(),
    onBulkExport: vi.fn(),
    onBulkEditDestination: vi.fn(),
    onClearSelection: vi.fn(),
    userPermissions: [],
  };

  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(
      <BulkActionsToolbar {...defaultProps} selectedCount={0} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays selected count correctly', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={5} />);

    expect(screen.getByText('5 items selected')).toBeInTheDocument();
  });

  it('displays singular form when only 1 item is selected', () => {
    render(<BulkActionsToolbar {...defaultProps} selectedCount={1} />);

    expect(screen.getByText('1 item selected')).toBeInTheDocument();
  });

  it('renders clear selection button', () => {
    render(<BulkActionsToolbar {...defaultProps} />);

    const clearButton = screen.getByLabelText('Clear selection');
    expect(clearButton).toBeInTheDocument();
    expect(clearButton).toHaveTextContent('Clear');
  });

  it('calls onClearSelection when clear button is clicked', () => {
    const onClearSelection = vi.fn();
    render(
      <BulkActionsToolbar
        {...defaultProps}
        onClearSelection={onClearSelection}
      />
    );

    const clearButton = screen.getByLabelText('Clear selection');
    clearButton.click();

    expect(onClearSelection).toHaveBeenCalled();
  });

  it('renders bulk export button on desktop', () => {
    render(<BulkActionsToolbar {...defaultProps} />);

    const exportButton = screen.getByTitle('Export selected items');
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveTextContent('Export');
  });

  it('calls onBulkExport when export button is clicked', () => {
    const onBulkExport = vi.fn();
    render(
      <BulkActionsToolbar {...defaultProps} onBulkExport={onBulkExport} />
    );

    const exportButton = screen.getByTitle('Export selected items');
    exportButton.click();

    expect(onBulkExport).toHaveBeenCalled();
  });

  it('renders bulk edit destination button on desktop', () => {
    render(<BulkActionsToolbar {...defaultProps} />);

    const editButton = screen.getByTitle('Edit destination for selected items');
    expect(editButton).toBeInTheDocument();
    expect(editButton).toHaveTextContent('Edit Destination');
  });

  it('calls onBulkEditDestination when edit destination button is clicked', () => {
    const onBulkEditDestination = vi.fn();
    render(
      <BulkActionsToolbar
        {...defaultProps}
        onBulkEditDestination={onBulkEditDestination}
      />
    );

    const editButton = screen.getByTitle('Edit destination for selected items');
    editButton.click();

    expect(onBulkEditDestination).toHaveBeenCalled();
  });

  it('renders bulk delete button when user has delete permission', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        userPermissions={['inventory:delete']}
      />
    );

    const deleteButton = screen.getByTitle('Delete selected items');
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toHaveTextContent('Delete');
  });

  it('does not render bulk delete button when user lacks delete permission', () => {
    render(<BulkActionsToolbar {...defaultProps} userPermissions={[]} />);

    const deleteButton = screen.queryByTitle('Delete selected items');
    expect(deleteButton).not.toBeInTheDocument();
  });

  it('calls onBulkDelete when delete button is clicked', () => {
    const onBulkDelete = vi.fn();
    render(
      <BulkActionsToolbar
        {...defaultProps}
        onBulkDelete={onBulkDelete}
        userPermissions={['inventory:delete']}
      />
    );

    const deleteButton = screen.getByTitle('Delete selected items');
    deleteButton.click();

    expect(onBulkDelete).toHaveBeenCalled();
  });

  it('applies red styling to delete button', () => {
    render(
      <BulkActionsToolbar
        {...defaultProps}
        userPermissions={['inventory:delete']}
      />
    );

    const deleteButton = screen.getByTitle('Delete selected items');
    expect(deleteButton).toHaveClass('text-red-600');
  });

  it('has sticky positioning', () => {
    const { container } = render(<BulkActionsToolbar {...defaultProps} />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toHaveClass('sticky');
    expect(toolbar).toHaveClass('top-0');
  });

  it('has high z-index for proper layering', () => {
    const { container } = render(<BulkActionsToolbar {...defaultProps} />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toHaveClass('z-20');
  });

  it('uses primary color scheme for background', () => {
    const { container } = render(<BulkActionsToolbar {...defaultProps} />);

    const toolbar = container.firstChild as HTMLElement;
    expect(toolbar).toHaveClass('bg-primary-50');
  });

  it('renders mobile actions dropdown button', () => {
    render(<BulkActionsToolbar {...defaultProps} />);

    const actionsButton = screen.getByTitle('Bulk actions');
    expect(actionsButton).toBeInTheDocument();
    expect(actionsButton).toHaveTextContent('Actions');
  });

  it('opens mobile dropdown when actions button is clicked', async () => {
    const { findByText } = render(<BulkActionsToolbar {...defaultProps} />);

    const actionsButton = screen.getByTitle('Bulk actions');
    actionsButton.click();

    // Check if dropdown menu items are visible
    const exportOption = await findByText('Export Selected');
    expect(exportOption).toBeInTheDocument();
  });

  it('includes all actions in mobile dropdown', async () => {
    const { findAllByText } = render(
      <BulkActionsToolbar
        {...defaultProps}
        userPermissions={['inventory:delete']}
      />
    );

    const actionsButton = screen.getByTitle('Bulk actions');
    actionsButton.click();

    // Check all menu items (using findAllByText since desktop and mobile versions both exist)
    expect((await findAllByText('Export Selected')).length).toBeGreaterThan(0);
    expect((await findAllByText('Edit Destination')).length).toBeGreaterThan(0);
    expect((await findAllByText('Delete Selected')).length).toBeGreaterThan(0);
  });

  it('calls action handlers from mobile dropdown', async () => {
    const onBulkExport = vi.fn();
    const { findByText } = render(
      <BulkActionsToolbar {...defaultProps} onBulkExport={onBulkExport} />
    );

    const actionsButton = screen.getByTitle('Bulk actions');
    actionsButton.click();

    const exportOption = await findByText('Export Selected');
    exportOption.click();

    expect(onBulkExport).toHaveBeenCalled();
  });

  it('closes mobile dropdown after action is selected', async () => {
    const onBulkExport = vi.fn();
    const { findAllByText, queryAllByText } = render(
      <BulkActionsToolbar {...defaultProps} onBulkExport={onBulkExport} />
    );

    const actionsButton = screen.getByTitle('Bulk actions');
    actionsButton.click();

    // Wait for dropdown to appear
    const exportButtons = await findAllByText('Export Selected');
    expect(exportButtons.length).toBeGreaterThan(1);

    // Click an action in the mobile dropdown (last one in the array)
    exportButtons[exportButtons.length - 1].click();

    // Verify the action was called
    expect(onBulkExport).toHaveBeenCalled();

    // After clicking, the dropdown should close (only desktop version remains)
    const remainingButtons = queryAllByText('Export Selected');
    // Desktop button is always present, mobile dropdown should be gone
    expect(remainingButtons.length).toBe(1);
  });

  it('does not show delete option in mobile dropdown without permission', async () => {
    const { findByText, queryByText } = render(
      <BulkActionsToolbar {...defaultProps} userPermissions={[]} />
    );

    const actionsButton = screen.getByTitle('Bulk actions');
    actionsButton.click();

    await findByText('Export Selected');

    expect(queryByText('Delete Selected')).not.toBeInTheDocument();
  });

  it('displays checkmark icon next to selected count', () => {
    const { container } = render(<BulkActionsToolbar {...defaultProps} />);

    // Check for SVG icon
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('applies correct ARIA attributes', () => {
    render(<BulkActionsToolbar {...defaultProps} />);

    const clearButton = screen.getByLabelText('Clear selection');
    expect(clearButton).toHaveAttribute('aria-label', 'Clear selection');
  });
});
