/**
 * Utility functions for URL parameter handling
 */

/**
 * Parse a date from URL parameter
 */
export function parseDateParam(value: string | null): Date | null {
  if (!value) return null
  
  try {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

/**
 * Parse an integer from URL parameter
 */
export function parseIntParam(value: string | null, defaultValue: number): number {
  if (!value) return defaultValue
  
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? defaultValue : parsed
}

/**
 * Parse a boolean from URL parameter
 */
export function parseBooleanParam(value: string | null, defaultValue: boolean): boolean {
  if (!value) return defaultValue
  
  return value === 'true' || value === '1'
}

/**
 * Parse an enum value from URL parameter
 */
export function parseEnumParam<T extends string>(
  value: string | null,
  validValues: readonly T[],
  defaultValue: T
): T {
  if (!value) return defaultValue
  
  return validValues.includes(value as T) ? (value as T) : defaultValue
}

/**
 * Parse an array from URL parameters
 */
export function parseArrayParam(searchParams: URLSearchParams, key: string): string[] {
  return searchParams.getAll(key)
}

/**
 * Build URL search params from an object
 */
export function buildSearchParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams()
  
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return
    }
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          searchParams.append(key, String(item))
        }
      })
    } else if (value instanceof Date) {
      searchParams.set(key, value.toISOString())
    } else {
      searchParams.set(key, String(value))
    }
  })
  
  return searchParams
}

/**
 * Merge search params with new values
 */
export function mergeSearchParams(
  current: URLSearchParams,
  updates: Record<string, any>
): URLSearchParams {
  const params = new URLSearchParams(current)
  
  Object.entries(updates).forEach(([key, value]) => {
    // Remove existing values for this key
    params.delete(key)
    
    if (value === null || value === undefined || value === '') {
      return
    }
    
    if (Array.isArray(value)) {
      value.forEach(item => {
        if (item !== null && item !== undefined && item !== '') {
          params.append(key, String(item))
        }
      })
    } else if (value instanceof Date) {
      params.set(key, value.toISOString())
    } else {
      params.set(key, String(value))
    }
  })
  
  return params
}

/**
 * Remove specific keys from search params
 */
export function removeSearchParams(
  current: URLSearchParams,
  keys: string[]
): URLSearchParams {
  const params = new URLSearchParams(current)
  keys.forEach(key => params.delete(key))
  return params
}

/**
 * Check if search params are equal
 */
export function areSearchParamsEqual(
  params1: URLSearchParams,
  params2: URLSearchParams
): boolean {
  const str1 = params1.toString()
  const str2 = params2.toString()
  return str1 === str2
}

/**
 * Convert search params to object
 */
export function searchParamsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const obj: Record<string, string | string[]> = {}
  
  params.forEach((value, key) => {
    const existing = obj[key]
    if (existing) {
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        obj[key] = [existing, value]
      }
    } else {
      obj[key] = value
    }
  })
  
  return obj
}

/**
 * Get a clean URL without empty parameters
 */
export function getCleanURL(baseURL: string, params: URLSearchParams): string {
  const cleanParams = new URLSearchParams()
  
  params.forEach((value, key) => {
    if (value && value !== '' && value !== 'null' && value !== 'undefined') {
      cleanParams.append(key, value)
    }
  })
  
  const paramString = cleanParams.toString()
  return paramString ? `${baseURL}?${paramString}` : baseURL
}
