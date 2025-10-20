'use client';

import React from 'react';
import { UserRole } from '@prisma/client';
import { UserWithStatus } from './UserTable';

interface UserTableMobileCardProps {
  user: UserWithStatus;
  isSelected: boolean;
  isCurrentUser: boolean;
  onSelect: (checked: boolean) => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: (active: boolean) => void;
}

export function UserTableMobileCard({
  user,
  isSelected,
  isCurrentUser,
  onSelect,
  onEdit,
  onDelete,
  onToggleStatus,
}: UserTableMobileCardProps) {
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case UserRole.SUPERVISOR:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case UserRole.MANAGER:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case UserRole.DATA_ENTRY:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case UserRole.AUDITOR:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const formatDate = (date?: Date) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div
      className={`border rounded-lg p-4 space-y-3 ${
        isCurrentUser
          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
          : isSelected
            ? 'bg-gray-50 border-gray-300 dark:bg-gray-800 dark:border-gray-600'
            : 'bg-white border-gray-200 dark:bg-gray-900 dark:border-gray-700'
      } ${!user.isActive ? 'opacity-60' : ''}`}
      role="article"
      aria-label={`User card for ${user.name}`}
    >
      {/* Header with checkbox and avatar */}
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={(e) => onSelect(e.target.checked)}
          disabled={isCurrentUser}
          className="mt-1 h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-50 min-h-[44px] min-w-[44px]"
          aria-label={`Select ${user.name}`}
        />
        <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-primary-700 dark:text-primary-300 font-medium text-lg flex-shrink-0">
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {user.name}
            {isCurrentUser && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400 font-normal">
                (You)
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {user.email}
          </p>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 pl-16">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Role:
          </span>
          <span
            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
              user.role
            )}`}
          >
            {user.role}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Status:
          </span>
          <button
            onClick={() => onToggleStatus(!user.isActive)}
            disabled={isCurrentUser}
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full transition-colors min-h-[44px] ${
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
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Last Login:
          </span>
          <span className="text-sm text-gray-900 dark:text-gray-100">
            {formatDate(user.lastLogin)}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onEdit}
          className="flex-1 px-4 py-2 text-sm font-medium text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 dark:bg-primary-900/20 dark:text-primary-400 dark:hover:bg-primary-900/30 transition-colors min-h-[44px]"
          aria-label={`Edit ${user.name}`}
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={isCurrentUser}
          className="flex-1 px-4 py-2 text-sm font-medium text-red-700 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[44px]"
          aria-label={`Delete ${user.name}`}
        >
          Delete
        </button>
      </div>
    </div>
  );
}
