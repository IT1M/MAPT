/**
 * Global Search Service - Client-Side Utilities
 * Browser-safe functions for search functionality
 * Server-side search logic is in /api/search route
 */

import type { UserRole } from '@prisma/client';

export interface SearchQuery {
  query: string;
  filters?: {
    categories?: string[];
    dateRange?: { from: Date; to: Date };
    users?: string[];
  };
  limit?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'item' | 'report' | 'user' | 'setting';
  title: string;
  description: string;
  url: string;
  metadata?: Record<string, any>;
}

export interface SearchResult {
  items: SearchResultItem[];
  reports: SearchResultItem[];
  users: SearchResultItem[];
  settings: SearchResultItem[];
  total: number;
}

/**
 * Search settings pages (client-side only, no database access)
 */
export function searchSettings(
  searchTerm: string,
  userRole: UserRole,
  limit: number = 5
): SearchResultItem[] {
  // Define searchable settings with role-based access
  const settingsPages = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Update your personal information and preferences',
      url: '/settings/profile',
      keywords: ['profile', 'personal', 'info', 'avatar', 'name', 'email'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Manage password, sessions, and security preferences',
      url: '/settings/security',
      keywords: ['security', 'password', 'sessions', '2fa', 'authentication'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
    },
    {
      id: 'appearance',
      title: 'Appearance Settings',
      description: 'Customize theme, language, and display preferences',
      url: '/settings/appearance',
      keywords: [
        'appearance',
        'theme',
        'language',
        'dark',
        'light',
        'rtl',
        'locale',
      ],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure email and in-app notification preferences',
      url: '/settings/notifications',
      keywords: ['notifications', 'alerts', 'email', 'preferences'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR'],
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      url: '/settings/users',
      keywords: ['users', 'management', 'roles', 'permissions', 'team'],
      roles: ['ADMIN'],
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      url: '/settings/system',
      keywords: ['system', 'configuration', 'settings', 'preferences'],
      roles: ['ADMIN'],
    },
    {
      id: 'backup',
      title: 'Backup Management',
      description: 'Manage database backups and restore operations',
      url: '/backup',
      keywords: ['backup', 'restore', 'database', 'recovery'],
      roles: ['ADMIN'],
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'View system audit logs and user activities',
      url: '/audit',
      keywords: ['audit', 'logs', 'history', 'activity', 'tracking'],
      roles: ['ADMIN', 'AUDITOR'],
    },
  ];

  // Filter by role and search term
  const results = settingsPages
    .filter((page) => page.roles.includes(userRole))
    .filter((page) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.description.toLowerCase().includes(searchLower) ||
        page.keywords.some((keyword) => keyword.includes(searchLower))
      );
    })
    .slice(0, limit)
    .map((page) => ({
      id: page.id,
      type: 'setting' as const,
      title: page.title,
      description: page.description,
      url: page.url,
      metadata: {
        keywords: page.keywords,
      },
    }));

  return results;
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return [];

  try {
    const recent = localStorage.getItem('recent-searches');
    return recent ? JSON.parse(recent) : [];
  } catch {
    return [];
  }
}

/**
 * Save search to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return;

  try {
    const recent = getRecentSearches();
    const updated = [query, ...recent.filter((q) => q !== query)].slice(0, 10);
    localStorage.setItem('recent-searches', JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('recent-searches');
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}
