/**
 * Global Search Service - Server-Side
 * Database search functions using Prisma (Server Components & API Routes only)
 */

import { prisma } from '@/services/prisma';
import { UserRole } from '@prisma/client';
import type { SearchResult, SearchResultItem } from './search';

/**
 * Perform global search across all entities with role-based filtering
 * ⚠️ SERVER-SIDE ONLY - Do not import in Client Components
 */
export async function globalSearch(
  query: string,
  userId: string,
  userRole: UserRole,
  limit: number = 5
): Promise<SearchResult> {
  const searchTerm = query.toLowerCase().trim();

  if (!searchTerm) {
    return {
      items: [],
      reports: [],
      users: [],
      settings: [],
      total: 0,
    };
  }

  // Search inventory items (all roles)
  const items = await searchInventoryItems(searchTerm, limit);

  // Search reports (exclude DATA_ENTRY)
  const reports =
    userRole !== 'DATA_ENTRY' ? await searchReports(searchTerm, limit) : [];

  // Search users (ADMIN, MANAGER, SUPERVISOR only)
  const users = ['ADMIN', 'MANAGER', 'SUPERVISOR'].includes(userRole)
    ? await searchUsers(searchTerm, limit)
    : [];

  return {
    items,
    reports,
    users,
    settings: [], // Settings search is client-side only
    total: items.length + reports.length + users.length,
  };
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
          { category: { contains: searchTerm, mode: 'insensitive' } },
        ],
        deletedAt: null,
      },
      take: limit,
      select: {
        id: true,
        itemName: true,
        batch: true,
        category: true,
        quantity: true,
        destination: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return items.map((item) => ({
      id: item.id,
      type: 'item' as const,
      title: item.itemName,
      description: `Batch: ${item.batch} | Category: ${item.category} | Qty: ${item.quantity}`,
      url: `/inventory/${item.id}`,
      metadata: {
        destination: item.destination,
        quantity: item.quantity,
      },
    }));
  } catch (error) {
    console.error('Error searching inventory items:', error);
    return [];
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
    // Search only by title since type is an enum
    const reports = await prisma.report.findMany({
      where: {
        title: { contains: searchTerm, mode: 'insensitive' },
      },
      take: limit,
      select: {
        id: true,
        title: true,
        type: true,
        status: true,
        generatedBy: true,
      },
      orderBy: {
        generatedAt: 'desc',
      },
    });

    // Fetch user names separately
    const userIds = [...new Set(reports.map((r) => r.generatedBy))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.name]));

    return reports.map((report) => ({
      id: report.id,
      type: 'report' as const,
      title: report.title,
      description: `Type: ${report.type} | Status: ${report.status} | By: ${userMap.get(report.generatedBy) || 'Unknown'}`,
      url: `/reports/${report.id}`,
      metadata: {
        type: report.type,
        status: report.status,
      },
    }));
  } catch (error) {
    console.error('Error searching reports:', error);
    return [];
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
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      type: 'user' as const,
      title: user.name,
      description: `${user.email} | ${user.role}`,
      url: `/settings/users/${user.id}`,
      metadata: {
        role: user.role,
        email: user.email,
      },
    }));
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}
