'use client'

import React, { useState, useEffect } from 'react'
import { UserRole } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { UserTableMobileCard } from './UserTableMobileCard'

export interface UserWithStatus {
  id: string
  name: string
  email: string
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLogin?: Date
  sessionCount?: number
}

export interface UserTableProps {
  users: UserWithStatus[]
  selectedUsers: string[]
  onSelect: (userIds: string[]) => void
  onEdit: (user: UserWithStatus) => void
  onDelete: (userId: string) => void
  onToggleStatus: (userId: string, active: boolean) => void
  currentUserId: string
  isLoading?: boolean
}

export function UserTable({
  users,
  selectedUsers,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
  currentUserId,
  isLoading = false,
}: UserTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'email' | 'role' | 'lastLogin'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState(1)
  const [isMobile, setIsMobile] = useState(false)
  const pageSize = 25

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    return matchesSearch && matchesRole
  })

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'email':
        comparison = a.email.localeCompare(b.email)
        break
      case 'role':
        comparison = a.role.localeCompare(b.role)
        break
      case 'lastLogin':
        const aDate = a.lastLogin?.getTime() || 0
        const bDate = b.lastLogin?.getTime() || 0
        comparison = aDate - bDate
        break
    }
    return sortOrder === 'asc' ? comparison : -comparison
  })

  // Paginate users
  const totalPages = Math.ceil(sortedUsers.length / pageSize)
  const paginatedUsers = sortedUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Handle select all
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const selectableIds = paginatedUsers
        .filter((user) => user.id !== currentUserId)
        .map((user) => user.id)
      onSelect([...new Set([...selectedUsers, ...selectableIds])])
    } else {
      const pageIds = paginatedUsers.map((user) => user.id)
      onSelect(selectedUsers.filter((id) => !pageIds.includes(id)))
    }
  }

  // Handle individual select
  const handleSelectUser = (userId: string, checked: boolean) => {
    if (checked) {
      onSelect([...selectedUsers, userId])
    } else {
      onSelect(selectedUsers.filter((id) => id !== userId))
    }
  }

  // Handle sort
  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('asc')
    }
  }

  const allPageUsersSelected =
    paginatedUsers.length > 0 &&
    paginatedUsers
      .filter((user) => user.id !== currentUserId)
      .every((user) => selectedUsers.includes(user.id))

  const somePageUsersSelected =
    paginatedUsers.some((user) => selectedUsers.includes(user.id)) &&
    !allPageUsersSelected

  const roleOptions = [
    { value: 'all', label: 'All Roles' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.SUPERVISOR, label: 'Supervisor' },
    { value: UserRole.MANAGER, label: 'Manager' },
    { value: UserRole.DATA_ENTRY, label: 'Data Entry' },
    { value: UserRole.AUDITOR, label: 'Auditor' },
  ]

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case UserRole.SUPERVISOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case UserRole.MANAGER:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case UserRole.DATA_ENTRY:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case UserRole.AUDITOR:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    }
  }

  const formatDate = (date?: Date) => {
    if (!date) return 'Never'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  return (
    <div className="space-y-4" role="region" aria-label="User management table">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Search users"
            className="min-h-[44px]"
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            options={roleOptions}
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setCurrentPage(1)
            }}
            aria-label="Filter by role"
            className="min-h-[44px]"
          />
        </div>
      </div>

      {/* Mobile Card View */}
      {isMobile ? (
        <div className="space-y-3" role="list" aria-label="Users list">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              Loading users...
            </div>
          ) : paginatedUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              No users found
            </div>
          ) : (
            paginatedUsers.map((user) => (
              <UserTableMobileCard
                key={user.id}
                user={user}
                isSelected={selectedUsers.includes(user.id)}
                isCurrentUser={user.id === currentUserId}
                onSelect={(checked) => handleSelectUser(user.id, checked)}
                onEdit={() => onEdit(user)}
                onDelete={() => onDelete(user.id)}
                onToggleStatus={(active) => onToggleStatus(user.id, active)}
              />
            ))
          )}
        </div>
      ) : (
        /* Desktop Table View */
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="w-12 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allPageUsersSelected}
                  ref={(input) => {
                    if (input) {
                      input.indeterminate = somePageUsersSelected
                    }
                  }}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  aria-label="Select all users on page"
                />
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Name
                  {sortBy === 'name' && (
                    <span aria-label={`Sorted ${sortOrder}ending`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('email')}
              >
                <div className="flex items-center gap-1">
                  Email
                  {sortBy === 'email' && (
                    <span aria-label={`Sorted ${sortOrder}ending`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('role')}
              >
                <div className="flex items-center gap-1">
                  Role
                  {sortBy === 'role' && (
                    <span aria-label={`Sorted ${sortOrder}ending`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                Status
              </th>
              <th
                scope="col"
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => handleSort('lastLogin')}
              >
                <div className="flex items-center gap-1">
                  Last Login
                  {sortBy === 'lastLogin' && (
                    <span aria-label={`Sorted ${sortOrder}ending`}>
                      {sortOrder === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  Loading users...
                </td>
              </tr>
            ) : paginatedUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            ) : (
              paginatedUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isSelected = selectedUsers.includes(user.id)

                return (
                  <tr
                    key={user.id}
                    className={`${
                      isCurrentUser
                        ? 'bg-blue-50 dark:bg-blue-900/20'
                        : isSelected
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : ''
                    } ${!user.isActive ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleSelectUser(user.id, e.target.checked)}
                        disabled={isCurrentUser}
                        className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                        aria-label={`Select ${user.name}`}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name}
                            {isCurrentUser && (
                              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {user.email}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onToggleStatus(user.id, !user.isActive)}
                        disabled={isCurrentUser}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${
                          user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                        aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            user.isActive ? 'bg-green-600' : 'bg-red-600'
                          }`}
                        />
                        {user.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          aria-label={`Edit ${user.name}`}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(user.id)}
                          disabled={isCurrentUser}
                          className="text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label={`Delete ${user.name}`}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          aria-label="Pagination navigation"
        >
          <div className="text-sm text-gray-700 dark:text-gray-300" role="status" aria-live="polite">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, sortedUsers.length)} of {sortedUsers.length} users
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Go to previous page"
              className="min-h-[44px] min-w-[44px]"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300" aria-current="page">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="secondary"
              size="small"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Go to next page"
              className="min-h-[44px] min-w-[44px]"
            >
              Next
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}
