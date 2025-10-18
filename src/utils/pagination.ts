import { PaginationMetadata } from '@/types'

/**
 * Calculate pagination metadata
 * @param total - Total number of items
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Pagination metadata
 */
export function calculatePagination(
  total: number,
  page: number,
  limit: number
): PaginationMetadata {
  const totalPages = Math.ceil(total / limit)
  
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  }
}

/**
 * Calculate skip value for Prisma queries
 * @param page - Current page number (1-indexed)
 * @param limit - Items per page
 * @returns Number of items to skip
 */
export function calculateSkip(page: number, limit: number): number {
  return (page - 1) * limit
}

/**
 * Validate and normalize pagination parameters
 * @param page - Page number from query
 * @param limit - Limit from query
 * @param maxLimit - Maximum allowed limit
 * @returns Normalized pagination parameters
 */
export function normalizePagination(
  page?: number,
  limit?: number,
  maxLimit: number = 200
): { page: number; limit: number } {
  const normalizedPage = Math.max(1, page || 1)
  const normalizedLimit = Math.min(maxLimit, Math.max(1, limit || 50))
  
  return {
    page: normalizedPage,
    limit: normalizedLimit,
  }
}
