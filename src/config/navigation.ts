import { UserRole } from '@prisma/client';
import {
  LayoutDashboard,
  ClipboardEdit,
  Database,
  Package,
  BarChart3,
  FileText,
  Shield,
  Settings,
  LucideIcon,
} from 'lucide-react';

/**
 * Badge variant types for navigation items
 */
export type BadgeVariant = 'new' | 'info' | 'warning' | 'error';

/**
 * Badge configuration for navigation items
 */
export interface NavigationBadge {
  text: string;
  variant: BadgeVariant;
  count?: number;
}

/**
 * Navigation item configuration
 */
export interface NavigationItem {
  id: string;
  label: {
    en: string;
    ar: string;
  };
  icon: LucideIcon;
  href: string;
  roles: UserRole[];
  badge?: NavigationBadge;
  children?: NavigationItem[]; // For nested menus (future)
}

/**
 * Complete navigation configuration
 * Defines all menu items with icons, paths, roles, and badges
 */
export const navigationConfig: NavigationItem[] = [
  {
    id: 'dashboard',
    label: {
      en: 'Dashboard',
      ar: 'لوحة التحكم',
    },
    icon: LayoutDashboard,
    href: '/dashboard',
    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
  },
  {
    id: 'data-entry',
    label: {
      en: 'Data Entry',
      ar: 'إدخال البيانات',
    },
    icon: ClipboardEdit,
    href: '/data-entry',
    roles: ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'],
  },
  {
    id: 'data-log',
    label: {
      en: 'Data Log',
      ar: 'سجل البيانات',
    },
    icon: Database,
    href: '/data-log',
    roles: ['ADMIN', 'SUPERVISOR', 'MANAGER', 'DATA_ENTRY', 'AUDITOR'],
  },
  {
    id: 'inventory',
    label: {
      en: 'Inventory',
      ar: 'المخزون',
    },
    icon: Package,
    href: '/inventory',
    roles: ['ADMIN', 'SUPERVISOR', 'DATA_ENTRY'],
  },
  {
    id: 'analytics',
    label: {
      en: 'Analytics',
      ar: 'التحليلات',
    },
    icon: BarChart3,
    href: '/analytics',
    roles: ['ADMIN', 'SUPERVISOR', 'MANAGER', 'AUDITOR'],
  },
  {
    id: 'reports',
    label: {
      en: 'Reports',
      ar: 'التقارير',
    },
    icon: FileText,
    href: '/reports',
    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'AUDITOR'],
  },
  {
    id: 'backup',
    label: {
      en: 'Backup',
      ar: 'النسخ الاحتياطي',
    },
    icon: FileText,
    href: '/backup',
    roles: ['ADMIN', 'MANAGER'],
  },
  {
    id: 'audit',
    label: {
      en: 'Audit & History',
      ar: 'التدقيق والسجل',
    },
    icon: Shield,
    href: '/audit',
    roles: ['ADMIN', 'AUDITOR'],
  },
  {
    id: 'settings',
    label: {
      en: 'Settings',
      ar: 'الإعدادات',
    },
    icon: Settings,
    href: '/settings',
    roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
  },
];

/**
 * Filter navigation items based on user role
 * @param userRole - The role of the current user
 * @returns Filtered array of navigation items accessible to the user
 */
export function filterNavigationByRole(
  userRole: UserRole | undefined
): NavigationItem[] {
  if (!userRole) return [];

  return navigationConfig.filter((item) => item.roles.includes(userRole));
}

/**
 * Get navigation item by ID
 * @param id - The ID of the navigation item
 * @returns The navigation item or undefined if not found
 */
export function getNavigationItemById(id: string): NavigationItem | undefined {
  return navigationConfig.find((item) => item.id === id);
}

/**
 * Get navigation item by href
 * @param href - The href path of the navigation item
 * @returns The navigation item or undefined if not found
 */
export function getNavigationItemByHref(
  href: string
): NavigationItem | undefined {
  // Remove locale prefix from href for matching
  const pathWithoutLocale = href.replace(/^\/(en|ar)/, '');
  return navigationConfig.find((item) => item.href === pathWithoutLocale);
}

/**
 * Check if a user has access to a specific navigation item
 * @param itemId - The ID of the navigation item
 * @param userRole - The role of the current user
 * @returns True if the user has access, false otherwise
 */
export function hasAccessToNavigationItem(
  itemId: string,
  userRole: UserRole | undefined
): boolean {
  if (!userRole) return false;

  const item = getNavigationItemById(itemId);
  if (!item) return false;

  return item.roles.includes(userRole);
}

/**
 * Get the label for a navigation item based on locale
 * @param item - The navigation item
 * @param locale - The current locale ('en' or 'ar')
 * @returns The localized label
 */
export function getNavigationLabel(
  item: NavigationItem,
  locale: 'en' | 'ar'
): string {
  return item.label[locale];
}
