'use client';

import React, { useRef, useEffect, useState } from 'react';
import type { InventoryItemWithUser } from '@/types';

// Dynamic import for react-window to avoid SSR issues
const FixedSizeList =
  typeof window !== 'undefined' ? require('react-window').FixedSizeList : null;

interface VirtualizedTableProps {
  items: InventoryItemWithUser[];
  rowHeight: number;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (item: InventoryItemWithUser) => void;
  onEdit?: (item: InventoryItemWithUser) => void;
  onDelete?: (id: string) => void;
  onDuplicate?: (item: InventoryItemWithUser) => void;
  onViewAudit?: (id: string) => void;
  onCopyBatch?: (batch: string) => void;
  columnVisibility?: Record<string, boolean>;
  userPermissions?: string[];
  renderRow: (props: {
    item: InventoryItemWithUser;
    index: number;
    style: React.CSSProperties;
    isSelected: boolean;
    onSelect: (checked: boolean) => void;
    onRowClick: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
    onViewAudit: () => void;
    onCopyBatch: () => void;
  }) => React.ReactNode;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  items,
  rowHeight,
  selectedIds = new Set(),
  onSelectionChange,
  onRowClick,
  onEdit,
  onDelete,
  onDuplicate,
  onViewAudit,
  onCopyBatch,
  renderRow,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(600);

  // Calculate container height based on viewport
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const availableHeight = window.innerHeight - rect.top - 100; // Leave 100px for padding
        setContainerHeight(Math.max(400, Math.min(availableHeight, 800)));
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  // Handle individual selection
  const handleSelectItem = (id: string, checked: boolean) => {
    if (onSelectionChange) {
      const newSelection = new Set(selectedIds);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      onSelectionChange(newSelection);
    }
  };

  // Row renderer for react-window
  const Row = ({
    index,
    style,
  }: {
    index: number;
    style: React.CSSProperties;
  }) => {
    const item = items[index];
    const isSelected = selectedIds.has(item.id);

    return (
      <div
        role="row"
        aria-rowindex={index + 1}
        aria-selected={isSelected}
        tabIndex={0}
      >
        {renderRow({
          item,
          index,
          style,
          isSelected,
          onSelect: (checked) => handleSelectItem(item.id, checked),
          onRowClick: () => onRowClick?.(item),
          onEdit: () => onEdit?.(item),
          onDelete: () => onDelete?.(item.id),
          onDuplicate: () => onDuplicate?.(item),
          onViewAudit: () => onViewAudit?.(item.id),
          onCopyBatch: () => onCopyBatch?.(item.batch),
        })}
      </div>
    );
  };

  // Fallback if FixedSizeList is not available (SSR)
  if (!FixedSizeList) {
    return (
      <div ref={containerRef} className="w-full">
        <div className="text-center py-8 text-gray-500">
          Loading virtual scroll...
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
      role="table"
      aria-label="Inventory data table with virtual scrolling"
      aria-rowcount={items.length}
    >
      <FixedSizeList
        height={containerHeight}
        itemCount={items.length}
        itemSize={rowHeight}
        width="100%"
        overscanCount={5}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
};
