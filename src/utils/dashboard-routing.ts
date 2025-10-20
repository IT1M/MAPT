/**
 * Dashboard Routing Utilities
 * Handles role-based dashboard redirection and routing logic
 */

import { UserRole } from '@prisma/client';

/**
 * Role-to-path mapping for dashboard redirection after login
 */
export const ROLE_DASHBOARDS: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  MANAGER: '/analytics',
  SUPERVISOR: '/data-log',
  DATA_ENTRY: '/data-entry',
  AUDITOR: '/audit',
};

/**
 * Get the appropriate dashboard path for a user role
 * @param role - User role
 * @param callbackUrl - Optional callback URL to redirect to instead
 * @returns Dashboard path
 */
export function getDashboardPath(role: UserRole, callbackUrl?: string): string {
  // If callback URL is provided and valid, use it
  if (callbackUrl && isValidCallbackUrl(callbackUrl)) {
    return callbackUrl;
  }

  // Otherwise, use role-based default
  return ROLE_DASHBOARDS[role] || '/dashboard';
}

/**
 * Validate callback URL to prevent open redirect vulnerabilities
 * @param url - URL to validate
 * @returns True if URL is valid and safe
 */
function isValidCallbackUrl(url: string): boolean {
  try {
    // Must be a relative URL (starts with /)
    if (!url.startsWith('/')) {
      return false;
    }

    // Must not be a protocol-relative URL (starts with //)
    if (url.startsWith('//')) {
      return false;
    }

    // Must not contain backslashes (potential bypass)
    if (url.includes('\\')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Get the full dashboard URL (no locale needed)
 * @param role - User role
 * @param locale - Deprecated, kept for compatibility
 * @param callbackUrl - Optional callback URL
 * @returns Full dashboard URL
 */
export function getDashboardUrl(
  role: UserRole,
  locale?: string,
  callbackUrl?: string
): string {
  return getDashboardPath(role, callbackUrl);
}
