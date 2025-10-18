'use client'

import React, { useMemo, useCallback } from 'react'
import { List } from 'react-window'
import { UserRole } from '@prisma/client'
import type { UserWithStatus } from './UserTable'

interface VirtualizedUserTableProps {
    users: UserWithStatus[]
    selectedUsers: string[]
    onSelect: (userId: string, checked: boolean) => void
    onEdit: (user: UserWithStatus) => void
    onDelete: (userId: string) => void
    onToggleStatus: (userId: string, active: boolean) => void
    currentUserId: string
    height?: number
}

interface RowData {
    users: UserWithStatus[]
    selectedUsers: string[]
    currentUserId: string
    onSelect: (userId: string, checked: boolean) => void
    onEdit: (user: UserWithStatus) => void
    onDelete: (userId: string) => void
    onToggleStatus: (userId: string, active: boolean) => void
}

// Memoized row component for virtual scrolling
const UserRow = React.memo<{
    ariaAttributes: {
        'aria-posinset': number
        'aria-setsize': number
        role: 'listitem'
    }
    index: number
    style: React.CSSProperties
} & RowData>(({ index, style, ariaAttributes, users, selectedUsers, currentUserId, onSelect, onEdit, onDelete, onToggleStatus }) => {
    const user = users[index]

    if (!user) return null

    const isCurrentUser = user.id === currentUserId
    const isSelected = selectedUsers.includes(user.id)

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
        <div
            {...ariaAttributes}
            style={style}
            className={`flex items-center border-b border-gray-200 dark:border-gray-700 ${isCurrentUser
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : isSelected
                        ? 'bg-gray-50 dark:bg-gray-800'
                        : 'bg-white dark:bg-gray-900'
                } ${!user.isActive ? 'opacity-60' : ''}`}
        >
            {/* Checkbox */}
            <div className="w-12 px-4 flex-shrink-0">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={(e) => onSelect(user.id, e.target.checked)}
                    disabled={isCurrentUser}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50"
                    aria-label={`Select ${user.name}`}
                />
            </div>

            {/* Name */}
            <div className="flex-1 min-w-0 px-4">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-sm flex-shrink-0">
                        {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {user.name}
                            {isCurrentUser && (
                                <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">(You)</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Email */}
            <div className="flex-1 min-w-0 px-4">
                <div className="text-sm text-gray-700 dark:text-gray-300 truncate">{user.email}</div>
            </div>

            {/* Role */}
            <div className="w-32 px-4 flex-shrink-0">
                <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                        user.role
                    )}`}
                >
                    {user.role}
                </span>
            </div>

            {/* Status */}
            <div className="w-28 px-4 flex-shrink-0">
                <button
                    onClick={() => onToggleStatus(user.id, !user.isActive)}
                    disabled={isCurrentUser}
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors ${user.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                    aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
                >
                    <span
                        className={`h-2 w-2 rounded-full ${user.isActive ? 'bg-green-600' : 'bg-red-600'}`}
                    />
                    {user.isActive ? 'Active' : 'Inactive'}
                </button>
            </div>

            {/* Last Login */}
            <div className="w-40 px-4 flex-shrink-0">
                <div className="text-sm text-gray-700 dark:text-gray-300">{formatDate(user.lastLogin)}</div>
            </div>

            {/* Actions */}
            <div className="w-32 px-4 flex-shrink-0">
                <div className="flex items-center justify-end gap-2">
                    <button
                        onClick={() => onEdit(user)}
                        className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300 text-sm"
                        aria-label={`Edit ${user.name}`}
                    >
                        Edit
                    </button>
                    <button
                        onClick={() => onDelete(user.id)}
                        disabled={isCurrentUser}
                        className="text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                        aria-label={`Delete ${user.name}`}
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    )
})

UserRow.displayName = 'UserRow'

/**
 * Virtualized user table for handling large lists efficiently
 * Uses react-window for virtual scrolling
 */
export const VirtualizedUserTable = React.memo<VirtualizedUserTableProps>(
    ({
        users,
        selectedUsers,
        onSelect,
        onEdit,
        onDelete,
        onToggleStatus,
        currentUserId,
        height = 600,
    }) => {
        // Memoize row data to prevent unnecessary re-renders
        const itemData = useMemo<RowData>(
            () => ({
                users,
                selectedUsers,
                currentUserId,
                onSelect,
                onEdit,
                onDelete,
                onToggleStatus,
            }),
            [users, selectedUsers, currentUserId, onSelect, onEdit, onDelete, onToggleStatus]
        )

        return (
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-12">
                    <div className="w-12 px-4 flex-shrink-0">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            aria-label="Select all users"
                            onChange={(e) => {
                                // Handle select all
                                if (e.target.checked) {
                                    users.forEach((user) => {
                                        if (user.id !== currentUserId && !selectedUsers.includes(user.id)) {
                                            onSelect(user.id, true)
                                        }
                                    })
                                } else {
                                    users.forEach((user) => {
                                        if (selectedUsers.includes(user.id)) {
                                            onSelect(user.id, false)
                                        }
                                    })
                                }
                            }}
                        />
                    </div>
                    <div className="flex-1 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Name
                    </div>
                    <div className="flex-1 px-4 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Email
                    </div>
                    <div className="w-32 px-4 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                    </div>
                    <div className="w-28 px-4 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                    </div>
                    <div className="w-40 px-4 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Login
                    </div>
                    <div className="w-32 px-4 flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                        Actions
                    </div>
                </div>

                {/* Virtualized List */}
                <List
                    defaultHeight={height}
                    rowCount={users.length}
                    rowHeight={64}
                    rowComponent={UserRow}
                    rowProps={itemData}
                />
            </div>
        )
    }
)

VirtualizedUserTable.displayName = 'VirtualizedUserTable'
