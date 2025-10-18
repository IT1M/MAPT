/**
 * Global Search Service
 * Provides full-text search across inventory, reports, users, and settings
 * with role-based filtering
 */

import { prisma } from '@/services/prisma'
import { UserRole } from '@prisma/client'

export interface SearchQuery {
  query: string
  filters?: {
    categories?: string[]
    dateRange?: { from: Date; to: Date }
    users?: string[]
  }
  limit?: number
}

export interface SearchResultItem {
  id: string
  type: 'item' | 'report' | 'user' | 'setting'
  title: string
  description: string
  url: string
  metadata?: Record<string, any>
}

export interface SearchResult {
  items: SearchResultItem[]
  reports: SearchResultItem[]
  users: SearchResultItem[]
  settings: SearchResultItem[]
  total: number
}

/**
 * Perform global search across all entities with role-based filtering
 */
export async function globalSearch(
  query: string,
  userId: string,
  userRole: UserRole,
  limit: number = 5
): Promise<SearchResult> {
  const searchTerm = query.toLowerCase().trim()
  
  if (!searchTerm) {
    return {
      items: [],
      reports: [],
      users: [],
      settings: [],
      total: 0
    }
  }

  // Search inventory items (all roles)
  const items = await searchInventoryItems(searchTerm, limit)
  
  // Search reports (exclude DATA_ENTRY)
  const reports = userRole !== 'DATA_ENTRY' 
    ? await searchReports(searchTerm, limit) 
    : []
  
  // Search users (ADMIN, MANAGER, SUPERVISOR only)
  const users = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRole)
    ? await searchUsers(searchTerm, limit)
    : []
  
  // Search settings (all roles, filtered by access)
  const settings = await searchSettings(searchTerm, userRole, limit)
  
  return {
    items,
    reports,
    users,
    settings,
    total: items.length + reports.length + users.length + settings.length
  }
}

/**
 * Search inventory items
 */
async function searchInventoryItems(
  searchTerm: string,
  limit: number
): Promise<SearchResultItem[]> {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        OR: [
          { itemName: { contains: searchTerm, mode: 'insensitive' } },
          { batch: { contains: searchTerm, mode: 'insensitive' } },
          { category: { contains: searchTerm, mode: 'insensitive' } }
        ],
        deletedAt: null
      },
      take: limit,
      select: {
        id: true,
        itemName: true,
        batch: true,
        category: true,
        quantity: true,
        destination: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return items.map(item => ({
      id: item.id,
      type: 'item' as const,
      title: item.itemName,
      description: `Batch: ${item.batch} | Category: ${item.category} | Qty: ${item.quantity}`,
      url: `/inventory/${item.id}`,
      metadata: {
        destination: item.destination,
        quantity: item.quantity
      }
    }))
  } catch (error) {
    console.error('Error searching inventory items:', error)
    return []
  }
}

/**
 * Search reports
 */
async function searchReports(
  searchTerm: string,
  limit: number
): Promise<SearchResultItem[]> {
  try {
    const reports = await prisma.report.findMany({
      where: {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { type: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        createdAt: true,
        generatedBy: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return reports.map(report => ({
      id: report.id,
      type: 'report' as const,
      title: report.title,
      description: `Type: ${report.type} | Status: ${report.status} | By: ${report.generatedBy.name}`,
      url: `/reports/${report.id}`,
      metadata: {
        type: report.type,
        status: report.status
      }
    }))
  } catch (error) {
    console.error('Error searching reports:', error)
    return []
  }
}

/**
 * Search users
 */
async function searchUsers(
  searchTerm: string,
  limit: number
): Promise<SearchResultItem[]> {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ],
        isActive: true
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true
      },
      orderBy: {
        name: 'asc'
      }
    })

    return users.map(user => ({
      id: user.id,
      type: 'user' as const,
      title: user.name,
      description: `${user.email} | ${user.role}${user.department ? ` | ${user.department}` : ''}`,
      url: `/settings/users/${user.id}`,
      metadata: {
        role: user.role,
        email: user.email
      }
    }))
  } catch (error) {
    console.error('Error searching users:', error)
    return []
  }
}

/**
 * Search settings pages
 */
async function searchSettings(
  searchTerm: string,
  userRole: UserRole,
  limit: number
): Promise<SearchResultItem[]> {
  // Define searchable settings with role-based access
  const settingsPages = [
    {
      id: 'profile',
      title: 'Profile Settings',
      description: 'Update your personal information and preferences',
      url: '/settings/profile',
      keywords: ['profile', 'personal', 'info', 'avatar', 'name', 'email'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
    },
    {
      id: 'security',
      title: 'Security Settings',
      description: 'Manage password, sessions, and security preferences',
      url: '/settings/security',
      keywords: ['security', 'password', 'sessions', '2fa', 'authentication'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
    },
    {
      id: 'appearance',
      title: 'Appearance Settings',
      description: 'Customize theme, language, and display preferences',
      url: '/settings/appearance',
      keywords: ['appearance', 'theme', 'language', 'dark', 'light', 'rtl', 'locale'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
    },
    {
      id: 'notifications',
      title: 'Notification Settings',
      description: 'Configure email and in-app notification preferences',
      url: '/settings/notifications',
      keywords: ['notifications', 'alerts', 'email', 'preferences'],
      roles: ['ADMIN', 'MANAGER', 'SUPERVISOR', 'DATA_ENTRY', 'AUDITOR']
    },
    {
      id: 'users',
      title: 'User Management',
      description: 'Manage users, roles, and permissions',
      url: '/settings/users',
      keywords: ['users', 'management', 'roles', 'permissions', 'team'],
      roles: ['ADMIN']
    },
    {
      id: 'system',
      title: 'System Settings',
      description: 'Configure system-wide settings and preferences',
      url: '/settings/system',
      keywords: ['system', 'configuration', 'settings', 'preferences'],
      roles: ['ADMIN']
    },
    {
      id: 'backup',
      title: 'Backup Management',
      description: 'Manage database backups and restore operations',
      url: '/backup',
      keywords: ['backup', 'restore', 'database', 'recovery'],
      roles: ['ADMIN']
    },
    {
      id: 'audit',
      title: 'Audit Logs',
      description: 'View system audit logs and user activities',
      url: '/audit',
      keywords: ['audit', 'logs', 'history', 'activity', 'tracking'],
      roles: ['ADMIN', 'AUDITOR']
    }
  ]

  // Filter by role and search term
  const results = settingsPages
    .filter(page => page.roles.includes(userRole))
    .filter(page => {
      const searchLower = searchTerm.toLowerCase()
      return (
        page.title.toLowerCase().includes(searchLower) ||
        page.description.toLowerCase().includes(searchLower) ||
        page.keywords.some(keyword => keyword.includes(searchLower))
      )
    })
    .slice(0, limit)
    .map(page => ({
      id: page.id,
      type: 'setting' as const,
      title: page.title,
      description: page.description,
      url: page.url,
      metadata: {
        keywords: page.keywords
      }
    }))

  return results
}

/**
 * Get recent searches from localStorage
 */
export function getRecentSearches(): string[] {
  if (typeof window === 'undefined') return []
  
  try {
    const recent = localStorage.getItem('recent-searches')
    return recent ? JSON.parse(recent) : []
  } catch {
    return []
  }
}

/**
 * Save search to recent searches
 */
export function saveRecentSearch(query: string): void {
  if (typeof window === 'undefined' || !query.trim()) return
  
  try {
    const recent = getRecentSearches()
    const updated = [query, ...recent.filter(q => q !== query)].slice(0, 10)
    localStorage.setItem('recent-searches', JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving recent search:', error)
  }
}

/**
 * Clear recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('recent-searches')
  } catch (error) {
    console.error('Error clearing recent searches:', error)
  }
}
