'use client';

import React from 'react';
import { UserTable, type UserTableProps } from './UserTable';

/**
 * Optimized UserTable with React.memo to prevent unnecessary re-renders
 * Use this component when you need better performance with large user lists
 */
export const OptimizedUserTable = React.memo<UserTableProps>(
  UserTable,
  (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
      prevProps.users.length === nextProps.users.length &&
      prevProps.selectedUsers.length === nextProps.selectedUsers.length &&
      prevProps.currentUserId === nextProps.currentUserId &&
      prevProps.isLoading === nextProps.isLoading &&
      // Deep comparison for users array (only if lengths match)
      prevProps.users.every((user, index) => {
        const nextUser = nextProps.users[index];
        return (
          user.id === nextUser?.id &&
          user.name === nextUser?.name &&
          user.email === nextUser?.email &&
          user.role === nextUser?.role &&
          user.isActive === nextUser?.isActive &&
          user.lastLogin?.getTime() === nextUser?.lastLogin?.getTime()
        );
      })
    );
  }
);

OptimizedUserTable.displayName = 'OptimizedUserTable';
