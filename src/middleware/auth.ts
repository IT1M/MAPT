import { NextRequest } from 'next/server';
import { auth } from '@/services/auth';
import { UserRole, Permission } from '@/types';

/**
 * Authentication context returned by auth middleware
 */
export interface AuthContext {
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: Permission[];
  };
  session: any;
}

/**
 * Role-based permission mapping
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
    'users:manage',
    'settings:manage',
    'audit:view',
  ],
  MANAGER: ['inventory:read', 'inventory:write', 'reports:view', 'audit:view'],
  SUPERVISOR: [
    'inventory:read',
    'inventory:write',
    'inventory:delete',
    'reports:view',
  ],
  DATA_ENTRY: ['inventory:read', 'inventory:write'],
  AUDITOR: ['inventory:read', 'reports:view', 'audit:view'],
};

/**
 * Get permissions for a user role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Require authenticated session
 * @returns AuthContext if authenticated, null otherwise
 */
export async function requireAuth(): Promise<AuthContext | null> {
  const session = await auth();

  if (!session || !session.user) {
    return null;
  }

  const user = session.user as any;
  const permissions = getPermissionsForRole(user.role as UserRole);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as UserRole,
      permissions,
    },
    session,
  };
}

/**
 * Check if user has required role
 * @param requiredRole - Minimum role required
 * @param context - Auth context from requireAuth
 * @returns true if user has required role or higher
 */
export function requireRole(
  requiredRole: UserRole,
  context: AuthContext
): boolean {
  const roleHierarchy: UserRole[] = [
    'DATA_ENTRY',
    'AUDITOR',
    'SUPERVISOR',
    'MANAGER',
    'ADMIN',
  ];
  const userRoleIndex = roleHierarchy.indexOf(context.user.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}

/**
 * Check if user has required permission
 * @param permission - Permission to check
 * @param context - Auth context from requireAuth
 * @returns true if user has the permission
 */
export function requirePermission(
  permission: Permission,
  context: AuthContext
): boolean {
  return context.user.permissions.includes(permission);
}

/**
 * Create unauthorized response
 */
export function unauthorizedResponse(
  message: string = 'Authentication required'
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'AUTH_REQUIRED',
        message,
      },
    }),
    {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Create forbidden response
 */
export function forbiddenResponse(
  message: string = 'Insufficient permissions'
): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: {
        code: 'INSUFFICIENT_PERMISSIONS',
        message,
      },
    }),
    {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}

/**
 * Middleware helper to check authentication
 */
export async function checkAuth(): Promise<
  { context: AuthContext } | { error: Response }
> {
  const context = await requireAuth();

  if (!context) {
    return { error: unauthorizedResponse() };
  }

  return { context };
}

/**
 * Middleware helper to check role
 */
export function checkRole(
  requiredRole: UserRole,
  context: AuthContext
): { success: true } | { error: Response } {
  if (!requireRole(requiredRole, context)) {
    return {
      error: forbiddenResponse(`${requiredRole} role or higher required`),
    };
  }

  return { success: true };
}

/**
 * Middleware helper to check permission
 */
export function checkPermission(
  permission: Permission,
  context: AuthContext
): { success: true } | { error: Response } {
  if (!requirePermission(permission, context)) {
    return {
      error: forbiddenResponse(`Permission '${permission}' required`),
    };
  }

  return { success: true };
}
