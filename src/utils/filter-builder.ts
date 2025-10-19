/**
 * Filter Builder Utility
 * Converts filter groups to Prisma where clauses
 */

import { Filter, FilterGroup, FilterOperator } from '@/types/filters'

/**
 * Build Prisma where clause from filter group
 */
export function buildPrismaWhere(filterGroup: FilterGroup): any {
  if (!filterGroup.filters || filterGroup.filters.length === 0) {
    return {}
  }

  const conditions = filterGroup.filters.map(filter => buildFilterCondition(filter))

  if (conditions.length === 0) {
    return {}
  }

  if (conditions.length === 1) {
    return conditions[0]
  }

  return filterGroup.logic === 'AND' 
    ? { AND: conditions }
    : { OR: conditions }
}

/**
 * Build a single filter condition
 */
function buildFilterCondition(filter: Filter): any {
  const { field, operator, value } = filter

  // Handle null checks
  if (operator === 'is_null') {
    return { [field]: null }
  }

  if (operator === 'is_not_null') {
    return { [field]: { not: null } }
  }

  // Handle empty values
  if (value === null || value === undefined || value === '') {
    return {}
  }

  switch (operator) {
    case 'equals':
      return { [field]: value }

    case 'not_equals':
      return { [field]: { not: value } }

    case 'contains':
      return { [field]: { contains: value, mode: 'insensitive' } }

    case 'not_contains':
      return { [field]: { not: { contains: value, mode: 'insensitive' } } }

    case 'starts_with':
      return { [field]: { startsWith: value, mode: 'insensitive' } }

    case 'ends_with':
      return { [field]: { endsWith: value, mode: 'insensitive' } }

    case 'greater_than':
      return { [field]: { gt: value } }

    case 'less_than':
      return { [field]: { lt: value } }

    case 'greater_than_or_equal':
      return { [field]: { gte: value } }

    case 'less_than_or_equal':
      return { [field]: { lte: value } }

    case 'between':
      if (Array.isArray(value) && value.length === 2) {
        return { [field]: { gte: value[0], lte: value[1] } }
      }
      return {}

    case 'in':
      if (Array.isArray(value) && value.length > 0) {
        return { [field]: { in: value } }
      }
      return {}

    case 'not_in':
      if (Array.isArray(value) && value.length > 0) {
        return { [field]: { notIn: value } }
      }
      return {}

    default:
      return {}
  }
}

/**
 * Generate a unique filter ID
 */
export function generateFilterId(): string {
  return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Validate filter value based on operator
 */
export function validateFilterValue(operator: FilterOperator, value: any): boolean {
  switch (operator) {
    case 'is_null':
    case 'is_not_null':
      return true

    case 'between':
      return Array.isArray(value) && value.length === 2

    case 'in':
    case 'not_in':
      return Array.isArray(value) && value.length > 0

    default:
      return value !== null && value !== undefined && value !== ''
  }
}

/**
 * Get operator label for display
 */
export function getOperatorLabel(operator: FilterOperator): string {
  const labels: Record<FilterOperator, string> = {
    equals: 'equals',
    not_equals: 'does not equal',
    contains: 'contains',
    not_contains: 'does not contain',
    starts_with: 'starts with',
    ends_with: 'ends with',
    greater_than: 'greater than',
    less_than: 'less than',
    greater_than_or_equal: 'greater than or equal to',
    less_than_or_equal: 'less than or equal to',
    between: 'between',
    is_null: 'is empty',
    is_not_null: 'is not empty',
    in: 'is one of',
    not_in: 'is not one of',
  }

  return labels[operator] || operator
}

/**
 * Get available operators for field type
 */
export function getOperatorsForType(type: 'string' | 'number' | 'date' | 'boolean' | 'enum'): FilterOperator[] {
  switch (type) {
    case 'string':
      return [
        'equals',
        'not_equals',
        'contains',
        'not_contains',
        'starts_with',
        'ends_with',
        'is_null',
        'is_not_null',
      ]

    case 'number':
    case 'date':
      return [
        'equals',
        'not_equals',
        'greater_than',
        'less_than',
        'greater_than_or_equal',
        'less_than_or_equal',
        'between',
        'is_null',
        'is_not_null',
      ]

    case 'boolean':
      return ['equals', 'is_null', 'is_not_null']

    case 'enum':
      return ['equals', 'not_equals', 'in', 'not_in', 'is_null', 'is_not_null']

    default:
      return ['equals', 'not_equals']
  }
}

/**
 * Export filter group to shareable format
 */
export function exportFilterGroup(filterGroup: FilterGroup, name: string, page: string): string {
  const shareable = {
    name,
    filters: filterGroup,
    page,
    version: '1.0',
  }

  return btoa(JSON.stringify(shareable))
}

/**
 * Import filter group from shareable format
 */
export function importFilterGroup(encoded: string): { name: string; filters: FilterGroup; page: string } | null {
  try {
    const decoded = atob(encoded)
    const parsed = JSON.parse(decoded)

    if (!parsed.filters || !parsed.name || !parsed.page) {
      return null
    }

    return {
      name: parsed.name,
      filters: parsed.filters,
      page: parsed.page,
    }
  } catch (error) {
    console.error('Failed to import filter:', error)
    return null
  }
}
