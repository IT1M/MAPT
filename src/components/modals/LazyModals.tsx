'use client'

import { lazy, Suspense } from 'react'
import type { ComponentType } from 'react'

// Lazy load modal components for better performance
const EditInventoryModal = lazy(() =>
  import('./EditInventoryModal').then((mod) => ({ default: mod.EditInventoryModal }))
)

const DeleteConfirmationDialog = lazy(() =>
  import('./DeleteConfirmationDialog').then((mod) => ({ default: mod.DeleteConfirmationDialog }))
)

const AuditHistoryModal = lazy(() =>
  import('./AuditHistoryModal').then((mod) => ({ default: mod.AuditHistoryModal }))
)

const BulkEditDestinationModal = lazy(() =>
  import('./BulkEditDestinationModal').then((mod) => ({ default: mod.BulkEditDestinationModal }))
)

// Loading fallback component
const ModalLoadingFallback = () => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
    </div>
  </div>
)

// Wrapper components with Suspense
export const LazyEditInventoryModal: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ModalLoadingFallback /> : null}>
    <EditInventoryModal {...props} />
  </Suspense>
)

export const LazyDeleteConfirmationDialog: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ModalLoadingFallback /> : null}>
    <DeleteConfirmationDialog {...props} />
  </Suspense>
)

export const LazyAuditHistoryModal: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ModalLoadingFallback /> : null}>
    <AuditHistoryModal {...props} />
  </Suspense>
)

export const LazyBulkEditDestinationModal: ComponentType<any> = (props) => (
  <Suspense fallback={props.isOpen ? <ModalLoadingFallback /> : null}>
    <BulkEditDestinationModal {...props} />
  </Suspense>
)
