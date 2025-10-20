/**
 * Bulk Operations Usage Example
 *
 * This file demonstrates how to integrate bulk operations into a data table page.
 * Copy and adapt this code to your own pages.
 */

'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { BulkActionsToolbar } from '@/components/tables';
import { BulkEditModal, BulkDeleteModal } from '@/components/modals';
import { InventoryTable } from '@/components/tables';
import { toast } from '@/utils/toast';
import type { InventoryItemWithUser } from '@/types';

export default function BulkOperationsExample() {
  const { data: session } = useSession();

  // Sample data (replace with your actual data fetching)
  const [items, setItems] = useState<InventoryItemWithUser[]>([]);
  const [loading, setLoading] = useState(false);

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Bulk edit state
  const [bulkEditItems, setBulkEditItems] = useState<InventoryItemWithUser[]>(
    []
  );
  const [showBulkEdit, setShowBulkEdit] = useState(false);

  // Bulk delete state
  const [bulkDeleteItems, setBulkDeleteItems] = useState<
    InventoryItemWithUser[]
  >([]);
  const [showBulkDelete, setShowBulkDelete] = useState(false);

  /**
   * Fetch data from API
   */
  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/inventory/data-log');
      const result = await response.json();
      if (result.success) {
        setItems(result.data.items);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle bulk edit
   */
  const handleBulkEdit = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }

    setBulkEditItems(selectedItems);
    setShowBulkEdit(true);
  };

  /**
   * Handle bulk delete
   */
  const handleBulkDelete = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }

    // Check permissions
    const canDelete = session?.user?.permissions?.includes('inventory:delete');
    const canBulkDelete =
      canDelete && ['SUPERVISOR', 'ADMIN'].includes(session?.user?.role || '');

    if (!canBulkDelete) {
      toast.error('You do not have permission to delete items');
      return;
    }

    setBulkDeleteItems(selectedItems);
    setShowBulkDelete(true);
  };

  /**
   * Handle bulk export
   */
  const handleBulkExport = () => {
    const selectedItems = items.filter((item) => selectedIds.has(item.id));

    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }

    // Implement export logic
    console.log('Exporting items:', selectedItems);
    toast.success(`Exporting ${selectedItems.length} items...`);
  };

  /**
   * Handle bulk edit destination (legacy)
   */
  const handleBulkEditDestination = () => {
    // This is the old bulk edit destination modal
    // You can keep it for backward compatibility or remove it
    handleBulkEdit();
  };

  /**
   * Handle bulk operation success
   */
  const handleBulkSuccess = () => {
    // Refresh data
    fetchData();

    // Clear selection
    setSelectedIds(new Set());

    // Show success message
    toast.success('Operation completed successfully');
  };

  /**
   * Handle selection change
   */
  const handleSelectionChange = (newSelection: Set<string>) => {
    setSelectedIds(newSelection);
  };

  /**
   * Clear selection
   */
  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Inventory Data Log
        </h1>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          Refresh
        </button>
      </div>

      {/* Bulk Actions Toolbar */}
      {selectedIds.size > 0 && (
        <BulkActionsToolbar
          selectedCount={selectedIds.size}
          onBulkEdit={handleBulkEdit}
          onBulkEditDestination={handleBulkEditDestination}
          onBulkExport={handleBulkExport}
          onBulkDelete={handleBulkDelete}
          onClearSelection={handleClearSelection}
          userPermissions={session?.user?.permissions || []}
        />
      )}

      {/* Inventory Table */}
      <InventoryTable
        items={items}
        loading={loading}
        selectedIds={selectedIds}
        onSelectionChange={handleSelectionChange}
        userPermissions={session?.user?.permissions || []}
      />

      {/* Bulk Edit Modal */}
      <BulkEditModal
        items={bulkEditItems}
        isOpen={showBulkEdit}
        onClose={() => setShowBulkEdit(false)}
        onSuccess={handleBulkSuccess}
      />

      {/* Bulk Delete Modal */}
      <BulkDeleteModal
        items={bulkDeleteItems}
        isOpen={showBulkDelete}
        onClose={() => setShowBulkDelete(false)}
        onSuccess={handleBulkSuccess}
      />
    </div>
  );
}

/**
 * INTEGRATION CHECKLIST
 *
 * 1. Import required components:
 *    - BulkActionsToolbar from '@/components/tables'
 *    - BulkEditModal, BulkDeleteModal from '@/components/modals'
 *    - InventoryTable from '@/components/tables'
 *
 * 2. Set up state:
 *    - items: Array of inventory items
 *    - selectedIds: Set of selected item IDs
 *    - bulkEditItems: Array of items to edit
 *    - bulkDeleteItems: Array of items to delete
 *    - showBulkEdit: Boolean for modal visibility
 *    - showBulkDelete: Boolean for modal visibility
 *
 * 3. Implement handlers:
 *    - handleBulkEdit: Filter selected items and open modal
 *    - handleBulkDelete: Check permissions, filter items, open modal
 *    - handleBulkSuccess: Refresh data and clear selection
 *    - handleSelectionChange: Update selected IDs
 *
 * 4. Render components:
 *    - BulkActionsToolbar (conditionally when items selected)
 *    - InventoryTable with selection support
 *    - BulkEditModal
 *    - BulkDeleteModal
 *
 * 5. Test:
 *    - Select items
 *    - Perform bulk edit
 *    - Perform bulk delete
 *    - Verify audit logs
 *    - Test error handling
 *    - Test permissions
 */
