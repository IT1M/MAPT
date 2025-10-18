'use client'

import React, { useState, useEffect } from 'react'
import { UserTable, UserWithStatus } from './UserTable'
import { UserModal, UserFormData } from './UserModal'
import { RolePermissionsMatrix } from './RolePermissionsMatrix'
import { BulkUserActions } from './BulkUserActions'
import { Button } from '@/components/ui/button'
import { UserRole } from '@prisma/client'

export interface UserManagementProps {
  currentUserId: string
}

export function UserManagement({ currentUserId }: UserManagementProps) {
  const [users, setUsers] = useState<UserWithStatus[]>([])
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserWithStatus | undefined>()
  const [showPermissions, setShowPermissions] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch users
  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/users')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch users')
      }

      setUsers(data.data || [])
    } catch (err) {
      console.error('Error fetching users:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateUser = () => {
    setEditingUser(undefined)
    setIsModalOpen(true)
  }

  const handleEditUser = (user: UserWithStatus) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete user')
      }

      // Refresh users list
      await fetchUsers()
      
      // Clear selection if deleted user was selected
      setSelectedUsers((prev) => prev.filter((id) => id !== userId))
    } catch (err) {
      console.error('Error deleting user:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete user')
    }
  }

  const handleToggleStatus = async (userId: string, active: boolean) => {
    try {
      const response = await fetch(`/api/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: active }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to update user status')
      }

      // Update local state
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: active } : user
        )
      )
    } catch (err) {
      console.error('Error updating user status:', err)
      alert(err instanceof Error ? err.message : 'Failed to update user status')
    }
  }

  const handleSubmitUser = async (formData: UserFormData) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || `Failed to ${editingUser ? 'update' : 'create'} user`)
      }

      // Refresh users list
      await fetchUsers()
      setIsModalOpen(false)
    } catch (err) {
      console.error('Error submitting user:', err)
      throw err // Re-throw to let modal handle the error
    }
  }

  const handleBulkActivate = async (userIds: string[]) => {
    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'activate',
          userIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to activate users')
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error activating users:', err)
      throw err
    }
  }

  const handleBulkDeactivate = async (userIds: string[]) => {
    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'deactivate',
          userIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to deactivate users')
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error deactivating users:', err)
      throw err
    }
  }

  const handleBulkChangeRole = async (userIds: string[], role: UserRole) => {
    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'changeRole',
          userIds,
          data: { role },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to change user roles')
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error changing user roles:', err)
      throw err
    }
  }

  const handleBulkDelete = async (userIds: string[]) => {
    try {
      const response = await fetch('/api/users/bulk-action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          userIds,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to delete users')
      }

      // Refresh users list
      await fetchUsers()
    } catch (err) {
      console.error('Error deleting users:', err)
      throw err
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">User Management</h2>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowPermissions(!showPermissions)}
          >
            {showPermissions ? 'Hide' : 'Show'} Permissions
          </Button>
          <Button variant="primary" onClick={handleCreateUser}>
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add New User
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
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
            <div>
              <h3 className="text-sm font-medium text-red-900 dark:text-red-100">Error</h3>
              <p className="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Permissions Matrix */}
      {showPermissions && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <RolePermissionsMatrix />
        </div>
      )}

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <BulkUserActions
          selectedUsers={selectedUsers}
          currentUserId={currentUserId}
          onActivate={handleBulkActivate}
          onDeactivate={handleBulkDeactivate}
          onChangeRole={handleBulkChangeRole}
          onDelete={handleBulkDelete}
          onClearSelection={() => setSelectedUsers([])}
        />
      )}

      {/* User Table */}
      <UserTable
        users={users}
        selectedUsers={selectedUsers}
        onSelect={setSelectedUsers}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        onToggleStatus={handleToggleStatus}
        currentUserId={currentUserId}
        isLoading={isLoading}
      />

      {/* User Modal */}
      <UserModal
        user={editingUser}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitUser}
      />
    </div>
  )
}
