'use client';

import React from 'react';
import { UserRole } from '@prisma/client';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface RolePermissionsMatrixProps {
  roles?: UserRole[];
  permissions?: Permission[];
}

const defaultRoles: UserRole[] = [
  UserRole.ADMIN,
  UserRole.SUPERVISOR,
  UserRole.MANAGER,
  UserRole.DATA_ENTRY,
  UserRole.AUDITOR,
];

const defaultPermissions: Permission[] = [
  {
    id: 'inventory:add',
    name: 'Add Inventory',
    description: 'Create new inventory items',
    category: 'Inventory',
  },
  {
    id: 'inventory:edit',
    name: 'Edit Inventory',
    description: 'Modify existing inventory items',
    category: 'Inventory',
  },
  {
    id: 'inventory:delete',
    name: 'Delete Inventory',
    description: 'Remove inventory items',
    category: 'Inventory',
  },
  {
    id: 'analytics:view',
    name: 'View Analytics',
    description: 'Access analytics dashboard and insights',
    category: 'Analytics',
  },
  {
    id: 'reports:generate',
    name: 'Generate Reports',
    description: 'Create and download reports',
    category: 'Reports',
  },
  {
    id: 'users:manage',
    name: 'Manage Users',
    description: 'Create, edit, and delete user accounts',
    category: 'Administration',
  },
  {
    id: 'settings:manage',
    name: 'System Settings',
    description: 'Configure system-wide settings',
    category: 'Administration',
  },
  {
    id: 'audit:view',
    name: 'View Audit Logs',
    description: 'Access audit trail and security logs',
    category: 'Security',
  },
  {
    id: 'data:export',
    name: 'Export Data',
    description: 'Export data to CSV, PDF, or other formats',
    category: 'Data',
  },
];

// Permission matrix: role -> permission -> hasPermission
const permissionMatrix: Record<UserRole, Record<string, boolean>> = {
  [UserRole.ADMIN]: {
    'inventory:add': true,
    'inventory:edit': true,
    'inventory:delete': true,
    'analytics:view': true,
    'reports:generate': true,
    'users:manage': true,
    'settings:manage': true,
    'audit:view': true,
    'data:export': true,
  },
  [UserRole.SUPERVISOR]: {
    'inventory:add': true,
    'inventory:edit': true,
    'inventory:delete': true,
    'analytics:view': true,
    'reports:generate': true,
    'users:manage': false,
    'settings:manage': false,
    'audit:view': true,
    'data:export': true,
  },
  [UserRole.MANAGER]: {
    'inventory:add': false,
    'inventory:edit': false,
    'inventory:delete': false,
    'analytics:view': true,
    'reports:generate': true,
    'users:manage': false,
    'settings:manage': false,
    'audit:view': false,
    'data:export': true,
  },
  [UserRole.DATA_ENTRY]: {
    'inventory:add': true,
    'inventory:edit': true,
    'inventory:delete': false,
    'analytics:view': false,
    'reports:generate': false,
    'users:manage': false,
    'settings:manage': false,
    'audit:view': false,
    'data:export': false,
  },
  [UserRole.AUDITOR]: {
    'inventory:add': false,
    'inventory:edit': false,
    'inventory:delete': false,
    'analytics:view': true,
    'reports:generate': false,
    'users:manage': false,
    'settings:manage': false,
    'audit:view': true,
    'data:export': true,
  },
};

export function RolePermissionsMatrix({
  roles = defaultRoles,
  permissions = defaultPermissions,
}: RolePermissionsMatrixProps) {
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

  // Group permissions by category
  const groupedPermissions = permissions.reduce(
    (acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    },
    {} as Record<string, Permission[]>
  );

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Role Permissions Overview
            </h3>
            <p className="mt-1 text-sm text-blue-700 dark:text-blue-300">
              This matrix shows which permissions are granted to each role.
              These permissions are read-only and configured at the system
              level.
            </p>
          </div>
        </div>
      </div>

      {Object.entries(groupedPermissions).map(
        ([category, categoryPermissions]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {category}
            </h3>
            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      Permission
                    </th>
                    {roles.map((role) => (
                      <th
                        key={role}
                        scope="col"
                        className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(
                            role
                          )}`}
                        >
                          {role}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {categoryPermissions.map((permission) => (
                    <tr key={permission.id}>
                      <td className="px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {permission.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {permission.description}
                          </div>
                        </div>
                      </td>
                      {roles.map((role) => {
                        const hasPermission =
                          permissionMatrix[role]?.[permission.id] || false;
                        return (
                          <td key={role} className="px-4 py-3 text-center">
                            {hasPermission ? (
                              <div className="flex justify-center">
                                <svg
                                  className="w-5 h-5 text-green-600 dark:text-green-400"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-label="Has permission"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                <span className="sr-only">
                                  {role} has {permission.name} permission
                                </span>
                              </div>
                            ) : (
                              <div className="flex justify-center">
                                <svg
                                  className="w-5 h-5 text-gray-300 dark:text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-label="No permission"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                <span className="sr-only">
                                  {role} does not have {permission.name}{' '}
                                  permission
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}
    </div>
  );
}
