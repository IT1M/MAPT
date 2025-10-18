/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize a string by removing potentially dangerous characters
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove null bytes
    .replace(/\0/g, '')
    // Remove control characters except newlines and tabs
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
}

/**
 * Sanitize HTML by removing all HTML tags and dangerous characters
 * @param input - HTML string to sanitize
 * @returns Sanitized string without HTML
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove event handlers
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/on\w+\s*=\s*[^\s>]*/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove data: protocol
    .replace(/data:text\/html/gi, '')
    // Decode HTML entities to prevent double encoding attacks
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, '&')
    // Remove the decoded tags again
    .replace(/<[^>]*>/g, '')
}

/**
 * Sanitize an object recursively
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(item => 
      typeof item === 'string' ? sanitizeString(item) : 
      typeof item === 'object' ? sanitizeObject(item) : 
      item
    ) as any
  }

  const sanitized: any = {}

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value)
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Sanitize email address
 * @param email - Email to sanitize
 * @returns Sanitized email in lowercase
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return ''
  }

  return email
    .trim()
    .toLowerCase()
    // Remove any characters that aren't valid in email addresses
    .replace(/[^a-z0-9@._+-]/g, '')
}

/**
 * Sanitize filename to prevent directory traversal
 * @param filename - Filename to sanitize
 * @returns Safe filename
 */
export function sanitizeFilename(filename: string): string {
  if (typeof filename !== 'string') {
    return ''
  }

  return filename
    .trim()
    // Remove directory traversal attempts
    .replace(/\.\./g, '')
    .replace(/[\/\\]/g, '')
    // Remove null bytes
    .replace(/\0/g, '')
    // Only allow alphanumeric, dash, underscore, and dot
    .replace(/[^a-zA-Z0-9._-]/g, '_')
}

/**
 * Sanitize SQL-like input (for search queries)
 * @param input - Search query to sanitize
 * @returns Sanitized search query
 */
export function sanitizeSearchQuery(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input
    .trim()
    // Remove SQL wildcards that could be used maliciously
    .replace(/[%;]/g, '')
    // Remove SQL comments
    .replace(/--/g, '')
    .replace(/\/\*/g, '')
    .replace(/\*\//g, '')
}

/**
 * Escape special regex characters in a string
 * @param input - String to escape
 * @returns Escaped string safe for use in regex
 */
export function escapeRegex(input: string): string {
  if (typeof input !== 'string') {
    return ''
  }

  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
