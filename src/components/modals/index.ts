// Export regular components
export { EditInventoryModal } from './EditInventoryModal';
export { DeleteConfirmationDialog } from './DeleteConfirmationDialog';
export { AuditHistoryModal } from './AuditHistoryModal';
export { BulkEditDestinationModal } from './BulkEditDestinationModal';
export { BulkEditModal } from './BulkEditModal';
export { BulkDeleteModal } from './BulkDeleteModal';

// Export lazy-loaded versions for better performance
export {
  LazyEditInventoryModal,
  LazyDeleteConfirmationDialog,
  LazyAuditHistoryModal,
  LazyBulkEditDestinationModal,
} from './LazyModals';
