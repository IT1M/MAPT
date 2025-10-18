'use client'

import React, { useState } from 'react'
import { UserRole } from '@prisma/client'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Modal } from '@/components/ui/modal'

export interface BulkUserActionsProps {
  selectedUsers: string[]
  currentUserId: string
  onActivate: (userIds: string[]) => Promise<void>
  onDeactivate: (userIds: string[]) => Promise<void>
  onChangeRole: (userIds: string[], role: UserRole) => Promise<void>
  onDelete: (userIds: string[]) => Promise<void>
  onClearSelection: () => void
}

export function BulkUserActions({
  selectedUsers,
  currentUserId,
  onActivate,
  onDeactivate,
  onChangeRole,
  onDelete,
  onClearSelection,
}: BulkUserActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showRoleChange, setShowRoleChange] = useState(false)
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.DATA_ENTRY)
  const [operationResult, setOperationResult] = useState<{
    success: number
    failed: number
    message?: string
  } | null>(null)

  // Filter out current user from selected users
  const validSelectedUsers = selectedUsers.filter((id) => id !== currentUserId)
  const selectedCount = validSelectedUsers.length

  if (selectedCount === 0) {
    return null
  }

  const handleActivate = async () => {
    setIsProcessing(true)
    setOperationResult(null)
    try {
      await onActivate(validSelectedUsers)
      setOperationResult({
        success: validSelectedUsers.length,
        failed: 0,
        message: `Successfully activated ${validSelectedUsers.length} user(s)`,
      })
      onClearSelection()
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: validSelectedUsers.length,
        message: 'Failed to activate users',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDeactivate = async () => {
    setIsProcessing(true)
    setOperationResult(null)
    try {
      await onDeactivate(validSelectedUsers)
      setOperationResult({
        success: validSelectedUsers.length,
        failed: 0,
        message: `Successfully deactivated ${validSelectedUsers.length} user(s)`,
      })
      onClearSelection()
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: validSelectedUsers.length,
        message: 'Failed to deactivate users',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRoleChange = async () => {
    setIsProcessing(true)
    setOperationResult(null)
    try {
      await onChangeRole(validSelectedUsers, selectedRole)
      setOperationResult({
        success: validSelectedUsers.length,
        failed: 0,
        message: `Successfully changed role for ${validSelectedUsers.length} user(s)`,
      })
      setShowRoleChange(false)
      onClearSelection()
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: validSelectedUsers.length,
        message: 'Failed to change user roles',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    setIsProcessing(true)
    setOperationResult(null)
    try {
      await onDelete(validSelectedUsers)
      setOperationResult({
        success: validSelectedUsers.length,
        failed: 0,
        message: `Successfully deleted ${validSelectedUsers.length} user(s)`,
      })
      setShowDeleteConfirm(false)
      onClearSelection()
    } catch (error) {
      setOperationResult({
        success: 0,
        failed: validSelectedUsers.length,
        message: 'Failed to delete users',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const roleOptions = [
    { value: UserRole.DATA_ENTRY, label: 'Data Entry' },
    { value: UserRole.SUPERVISOR, label: 'Supervisor' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.AUDITOR, label: 'Auditor' },
    { value: UserRole.ADMIN, label: 'Admin' },
  ]

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={handleActivate}
              disabled={isProcessing}
              loading={isProcessing}
            >
              Activate
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={handleDeactivate}
              disabled={isProcessing}
              loading={isProcessing}
            >
              Deactivate
            </Button>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setShowRoleChange(true)}
              disabled={isProcessing}
            >
              Change Role
            </Button>
            <Button
              variant="danger"
              size="small"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
            >
              Delete
            </Button>
            <button
              onClick={onClearSelection}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 underline"
              disabled={isProcessing}
            >
              Clear Selection
            </button>
          </div>
        </div>

        {/* Operation Result */}
        {operationResult && (
          <div
            className={`mt-3 p-3 rounded-lg ${
              operationResult.failed === 0
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}
          >
            <div className="flex items-start gap-2">
              {operationResult.failed === 0 ? (
                <svg
                  className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    operationResult.failed === 0
                      ? 'text-green-900 dark:text-green-100'
                      : 'text-red-900 dark:text-red-100'
                  }`}
                >
                  {operationResult.message}
                </p>
                {operationResult.failed > 0 && (
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                    {operationResult.success} succeeded, {operationResult.failed} failed
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Confirm Delete"
        size="small"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="w-6 h-6 text-red-600 dark:text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Delete {selectedCount} user{selectedCount !== 1 ? 's' : ''}?
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                This action cannot be undone. All data associated with these users will be
                permanently deleted.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={isProcessing}>
              Delete Users
            </Button>
          </div>
        </div>
      </Modal>

      {/* Role Change Modal */}
      <Modal
        isOpen={showRoleChange}
        onClose={() => setShowRoleChange(false)}
        title="Change User Role"
        size="small"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Change the role for {selectedCount} selected user{selectedCount !== 1 ? 's' : ''}.
          </p>

          <Select
            label="New Role"
            options={roleOptions}
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={() => setShowRoleChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button variant="primary" onClick={handleRoleChange} loading={isProcessing}>
              Change Role
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
