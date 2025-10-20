/**
 * USAGE EXAMPLE - Tasks 13, 14, 15 Components
 *
 * This file demonstrates how to use the newly created components:
 * - TableLoadingState, TableEmptyState, TableErrorState
 * - Pagination
 * - ExportButton
 *
 * This is a reference file and should not be imported in production code.
 */

'use client';

import React, { useState } from 'react';
import {
  InventoryTable,
  TableLoadingState,
  TableEmptyState,
  TableErrorState,
} from '@/components/tables';
import { Pagination } from '@/components/ui/Pagination';
import { ExportButton } from '@/components/export';

// Example: Complete Data Log Page with all states
export function DataLogPageExample() {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState({});

  // Simulated data fetching (replace with actual API call)
  const { data, isLoading, error, refetch } = useInventoryData({
    page: currentPage,
    limit: itemsPerPage,
    filters,
  });

  const totalItems = data?.total || 0;
  const items = data?.items || [];
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Data Log</h1>
          <ExportButton data={[]} disabled />
        </div>
        <TableLoadingState columns={10} rows={10} hasSelection />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Data Log</h1>
        <TableErrorState
          title="Failed to load inventory data"
          error={error}
          onRetry={refetch}
        />
      </div>
    );
  }

  // Empty state
  if (items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Data Log</h1>
          <ExportButton data={[]} disabled />
        </div>
        <TableEmptyState
          title="No inventory items found"
          description="Try adjusting your filters or add a new inventory item."
          action={{
            label: 'Clear Filters',
            onClick: () => setFilters({}),
          }}
        />
      </div>
    );
  }

  // Success state with data
  return (
    <div className="space-y-4">
      {/* Header with Export Button */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Log</h1>
        <ExportButton
          data={items}
          filename="inventory-export"
          selectedIds={selectedIds}
          filters={filters}
          onExport={(format, success) => {
            if (success) {
              console.log(`${format.toUpperCase()} exported successfully`);
              // Show toast notification here
            }
          }}
        />
      </div>

      {/* Table */}
      <InventoryTable
        items={items}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        // ... other props
      />

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
      />
    </div>
  );
}

// Example: Simple pagination usage
export function SimplePaginationExample() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const totalItems = 1000;

  return (
    <Pagination
      currentPage={page}
      totalPages={Math.ceil(totalItems / limit)}
      totalItems={totalItems}
      itemsPerPage={limit}
      onPageChange={setPage}
      onItemsPerPageChange={setLimit}
    />
  );
}

// Example: Export button with selected items
export function ExportWithSelectionExample() {
  const data = [
    { id: '1', name: 'Item 1', quantity: 100 },
    { id: '2', name: 'Item 2', quantity: 200 },
    { id: '3', name: 'Item 3', quantity: 300 },
  ];
  const selectedIds = new Set(['1', '3']);

  return (
    <ExportButton
      data={data}
      selectedIds={selectedIds}
      onExport={(format, success) => {
        console.log(`Export ${format}: ${success ? 'success' : 'failed'}`);
      }}
    />
  );
}

// Example: Table states
export function TableStatesExample() {
  const [state, setState] = useState<'loading' | 'error' | 'empty' | 'data'>(
    'loading'
  );

  if (state === 'loading') {
    return <TableLoadingState columns={8} rows={5} hasSelection />;
  }

  if (state === 'error') {
    return (
      <TableErrorState
        error={new Error('Network error')}
        onRetry={() => setState('loading')}
      />
    );
  }

  if (state === 'empty') {
    return (
      <TableEmptyState
        action={{
          label: 'Reload',
          onClick: () => setState('loading'),
        }}
      />
    );
  }

  return <div>Table with data...</div>;
}

// Mock hook for demonstration
function useInventoryData(params: any) {
  // Replace with actual SWR or React Query hook
  return {
    data: { items: [], total: 0 },
    isLoading: false,
    error: null,
    refetch: () => {},
  };
}
