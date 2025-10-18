// Export regular components
export { EditInventoryModal } from './EditInventoryModal'
export { DeleteConfirmationDialog } from './DeleteConfirmationDialog'
export { AuditHistoryModal } from './AuditHistoryModal'
export { BulkEditDestinationModal } from './BulkEditDestinationModal'

// Export lazy-loaded versions for better performance
export {
  LazyEditInventoryModal,
  LazyDeleteConfirmationDialog,
  LazyAuditHistoryModal,
  LazyBulkEditDestinationModal,
} from './LazyModals'
