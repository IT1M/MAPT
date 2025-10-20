/**
 * Query Optimization Utilities
 *
 * Provides helpers for optimizing database queries
 */

import { Prisma } from '@prisma/client';
import { logger } from '@/services/logger';

/**
 * Default pagination settings
 */
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Pagination result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Calculate pagination values
 */
export function calculatePagination(
  page: number = 1,
  limit: number = DEFAULT_PAGE_SIZE
): { skip: number; take: number; page: number; limit: number } {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(Math.max(1, limit), MAX_PAGE_SIZE);

  return {
    skip: (normalizedPage - 1) * normalizedLimit,
    take: normalizedLimit,
    page: normalizedPage,
    limit: normalizedLimit,
  };
}

/**
 * Create paginated result
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Measure query execution time
 */
export async function measureQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();

  try {
    const result = await queryFn();
    const duration = Date.now() - start;

    if (duration > 1000) {
      logger.warn('Slow query detected', {
        query: queryName,
        duration: `${duration}ms`,
      });
    } else if (duration > 500) {
      logger.info('Query performance', {
        query: queryName,
        duration: `${duration}ms`,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Query failed', error as Error, {
      query: queryName,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Build dynamic where clause with type safety
 */
export function buildWhereClause<T extends Record<string, any>>(
  filters: Partial<T>
): Record<string, any> {
  const where: Record<string, any> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      where[key] = value;
    }
  });

  return where;
}

/**
 * Build date range filter
 */
export function buildDateRangeFilter(
  startDate?: Date | string,
  endDate?: Date | string
): { gte?: Date; lte?: Date } | undefined {
  if (!startDate && !endDate) {
    return undefined;
  }

  const filter: { gte?: Date; lte?: Date } = {};

  if (startDate) {
    filter.gte =
      typeof startDate === 'string' ? new Date(startDate) : startDate;
  }

  if (endDate) {
    filter.lte = typeof endDate === 'string' ? new Date(endDate) : endDate;
  }

  return filter;
}

/**
 * Build search filter for text fields
 */
export function buildSearchFilter(
  searchTerm?: string,
  fields: string[] = []
): any {
  if (!searchTerm || fields.length === 0) {
    return undefined;
  }

  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive' as Prisma.QueryMode,
      },
    })),
  };
}

/**
 * Optimize select fields for common queries
 */
export const SELECT_PRESETS = {
  user: {
    id: true,
    name: true,
    email: true,
    role: true,
  },
  userBasic: {
    id: true,
    name: true,
    email: true,
  },
  inventoryItem: {
    id: true,
    itemName: true,
    batch: true,
    quantity: true,
    reject: true,
    destination: true,
    category: true,
    createdAt: true,
    updatedAt: true,
  },
  inventoryItemWithUser: {
    id: true,
    itemName: true,
    batch: true,
    quantity: true,
    reject: true,
    destination: true,
    category: true,
    createdAt: true,
    enteredBy: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  auditLog: {
    id: true,
    timestamp: true,
    action: true,
    entityType: true,
    entityId: true,
    ipAddress: true,
    user: {
      select: {
        id: true,
        name: true,
        email: true,
      },
    },
  },
  report: {
    id: true,
    title: true,
    type: true,
    periodFrom: true,
    periodTo: true,
    generatedAt: true,
    format: true,
    status: true,
    fileSize: true,
  },
  backup: {
    id: true,
    filename: true,
    type: true,
    format: true,
    fileSize: true,
    recordCount: true,
    status: true,
    createdAt: true,
    validated: true,
  },
} as const;

/**
 * Common order by presets
 */
export const ORDER_BY_PRESETS = {
  newest: { createdAt: 'desc' as const },
  oldest: { createdAt: 'asc' as const },
  nameAsc: { name: 'asc' as const },
  nameDesc: { name: 'desc' as const },
  updatedDesc: { updatedAt: 'desc' as const },
  updatedAsc: { updatedAt: 'asc' as const },
} as const;

/**
 * Batch operation helper
 */
export async function batchOperation<T, R>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = await operation(batch);
    results.push(result);
  }

  return results;
}

/**
 * Parallel query execution helper
 */
export async function executeParallel<T extends Record<string, any>>(queries: {
  [K in keyof T]: () => Promise<T[K]>;
}): Promise<T> {
  const keys = Object.keys(queries) as (keyof T)[];
  const promises = keys.map((key) => queries[key]());

  const results = await Promise.all(promises);

  return keys.reduce((acc, key, index) => {
    acc[key] = results[index];
    return acc;
  }, {} as T);
}

/**
 * Query result cache key generator
 */
export function generateQueryCacheKey(
  model: string,
  operation: string,
  params: Record<string, any>
): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${JSON.stringify(params[key])}`)
    .join('&');

  return `query:${model}:${operation}:${sortedParams}`;
}

/**
 * Soft delete helper
 */
export function buildSoftDeleteFilter(includeSoftDeleted: boolean = false) {
  return includeSoftDeleted ? {} : { deletedAt: null };
}

/**
 * Count with cache helper
 */
export async function cachedCount(
  cacheKey: string,
  countFn: () => Promise<number>,
  ttl: number = 300
): Promise<number> {
  const { withCache } = await import('./cache');
  return withCache(cacheKey, ttl, countFn);
}
