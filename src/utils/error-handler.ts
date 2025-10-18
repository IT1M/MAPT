import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import { ErrorCode, ErrorResponse } from '@/types'

/**
 * Handle Zod validation errors with detailed field-level information
 */
export function handleZodError(error: ZodError): ErrorResponse {
  const details = error.errors.map(err => {
    const field = err.path.join('.')
    let message = err.message
    
    // Enhance error messages for common validation issues
    if (err.code === 'invalid_type') {
      message = `Expected ${err.expected}, received ${err.received}`
    } else if (err.code === 'too_small') {
      const min = (err as any).minimum
      message = `Must be at least ${min} ${(err as any).type === 'string' ? 'characters' : ''}`
    } else if (err.code === 'too_big') {
      const max = (err as any).maximum
      message = `Must be at most ${max} ${(err as any).type === 'string' ? 'characters' : ''}`
    } else if (err.code === 'invalid_string') {
      const validation = (err as any).validation
      if (validation === 'email') {
        message = 'Invalid email address format'
      } else if (validation === 'url') {
        message = 'Invalid URL format'
      } else if (validation === 'uuid') {
        message = 'Invalid UUID format'
      }
    }

    return {
      field: field || 'root',
      message,
      code: err.code,
    }
  })

  return {
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed. Please check the provided data.',
      details,
    }
  }
}

/**
 * Handle Prisma database errors with detailed error mapping
 */
export function handlePrismaError(error: any): ErrorResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle specific Prisma error codes
    switch (error.code) {
      case 'P2002':
        // Unique constraint violation
        const target = error.meta?.target as string[] | undefined
        const field = target ? target[0] : 'field'
        return {
          success: false,
          error: {
            code: 'CONFLICT',
            message: `A record with this ${field} already exists`,
            details: { 
              field,
              constraint: 'unique',
              value: error.meta?.target 
            },
          }
        }
      case 'P2025':
        // Record not found
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'The requested record was not found',
            details: process.env.NODE_ENV === 'development' ? {
              cause: error.meta?.cause
            } : undefined,
          }
        }
      case 'P2003':
        // Foreign key constraint violation
        const fieldName = error.meta?.field_name as string | undefined
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Invalid reference: ${fieldName || 'related record'} does not exist`,
            details: { 
              field: fieldName,
              constraint: 'foreign_key'
            },
          }
        }
      case 'P2014':
        // Required relation violation
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The change violates a required relation',
            details: { relation: error.meta?.relation_name },
          }
        }
      case 'P2000':
        // Value too long for column
        return {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'The provided value is too long for the database field',
            details: { column: error.meta?.column_name },
          }
        }
      case 'P2001':
        // Record does not exist
        return {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'The record required for this operation does not exist',
          }
        }
      case 'P2024':
        // Connection timeout
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database connection timeout. Please try again.',
          }
        }
      default:
        return {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
            details: process.env.NODE_ENV === 'development' ? {
              code: error.code,
              message: error.message,
              meta: error.meta
            } : undefined,
          }
        }
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided to database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }
    }
  }

  // Handle Prisma initialization errors
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return {
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Failed to connect to database',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      }
    }
  }

  return {
    success: false,
    error: {
      code: 'DATABASE_ERROR',
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
    }
  }
}

/**
 * Handle Gemini AI service errors with graceful fallback
 */
export function handleGeminiError(error: any): ErrorResponse {
  // Check for rate limit errors
  if (error.message?.includes('429') || error.message?.includes('rate limit')) {
    return {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'AI service rate limit exceeded. Please try again in a moment.',
        details: process.env.NODE_ENV === 'development' ? {
          service: 'Gemini AI',
          suggestion: 'Reduce request frequency or implement caching'
        } : undefined,
      }
    }
  }

  // Check for API key errors
  if (error.message?.includes('API key') || error.message?.includes('authentication')) {
    return {
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'AI service authentication failed',
        details: process.env.NODE_ENV === 'development' ? {
          service: 'Gemini AI',
          suggestion: 'Check GEMINI_API_KEY environment variable'
        } : undefined,
      }
    }
  }

  // Check for quota exceeded errors
  if (error.message?.includes('quota') || error.message?.includes('limit exceeded')) {
    return {
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'AI service quota exceeded',
        details: process.env.NODE_ENV === 'development' ? {
          service: 'Gemini AI',
          suggestion: 'Check API quota limits'
        } : undefined,
      }
    }
  }

  // Check for circuit breaker open
  if (error.message?.includes('Circuit breaker')) {
    return {
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'AI service is temporarily unavailable due to repeated failures',
        details: process.env.NODE_ENV === 'development' ? {
          service: 'Gemini AI',
          suggestion: 'Service will retry automatically after cooldown period'
        } : undefined,
      }
    }
  }

  // Check for timeout errors
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
    return {
      success: false,
      error: {
        code: 'EXTERNAL_SERVICE_ERROR',
        message: 'AI service request timed out',
        details: process.env.NODE_ENV === 'development' ? {
          service: 'Gemini AI',
          suggestion: 'Try again or reduce request complexity'
        } : undefined,
      }
    }
  }

  // Generic Gemini error
  return {
    success: false,
    error: {
      code: 'EXTERNAL_SERVICE_ERROR',
      message: 'AI service encountered an error',
      details: process.env.NODE_ENV === 'development' ? {
        service: 'Gemini AI',
        error: error.message
      } : undefined,
    }
  }
}

/**
 * Handle generic API errors with comprehensive logging
 */
export function handleApiError(error: any, context?: string): ErrorResponse {
  // Log error for monitoring
  logError(error, context)

  // Handle Zod errors
  if (error instanceof ZodError) {
    return handleZodError(error)
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError ||
      error instanceof Prisma.PrismaClientValidationError ||
      error instanceof Prisma.PrismaClientInitializationError) {
    return handlePrismaError(error)
  }

  // Handle Gemini AI errors (check for Gemini-related error messages)
  if (error.message?.includes('Gemini') || 
      error.message?.includes('AI service') ||
      error.message?.includes('Circuit breaker') ||
      context?.toLowerCase().includes('gemini') ||
      context?.toLowerCase().includes('ai')) {
    return handleGeminiError(error)
  }

  // Handle custom errors with code property
  if (error.code && typeof error.code === 'string') {
    return {
      success: false,
      error: {
        code: error.code as ErrorCode,
        message: error.message || 'An error occurred',
        details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      }
    }
  }

  // Generic error
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message || 'Internal server error'
        : 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }
  }
}

/**
 * Create a standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  status: number = 500
): Response {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code,
      message,
      details: process.env.NODE_ENV === 'development' ? details : undefined,
    }
  }

  return new Response(JSON.stringify(errorResponse), {
    status,
    headers: { 'Content-Type': 'application/json' }
  })
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify({
      success: true,
      data,
      message,
    }),
    {
      status,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

/**
 * Log error for monitoring
 */
export function logError(error: any, context?: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error)
  } else {
    // In production, you might want to send to a logging service
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, {
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString(),
    })
  }
}

/**
 * Wrap route handler with centralized error handling
 * This ensures all errors are caught and handled consistently
 */
export function withErrorHandler<T = any>(
  handler: (request: any, ...args: any[]) => Promise<Response>,
  context?: string
): (request: any, ...args: any[]) => Promise<Response> {
  return async (request: any, ...args: any[]): Promise<Response> => {
    try {
      return await handler(request, ...args)
    } catch (error) {
      // Log the error with context
      logError(error, context)

      // Handle the error and return appropriate response
      const errorResponse = handleApiError(error, context)
      
      // Determine HTTP status code based on error code
      let status = 500
      switch (errorResponse.error.code) {
        case 'AUTH_REQUIRED':
          status = 401
          break
        case 'INSUFFICIENT_PERMISSIONS':
          status = 403
          break
        case 'VALIDATION_ERROR':
        case 'INVALID_INPUT':
          status = 400
          break
        case 'NOT_FOUND':
          status = 404
          break
        case 'CONFLICT':
          status = 409
          break
        case 'RATE_LIMIT_EXCEEDED':
          status = 429
          break
        case 'EXTERNAL_SERVICE_ERROR':
          status = 502
          break
        case 'DATABASE_ERROR':
        case 'INTERNAL_ERROR':
        default:
          status = 500
          break
      }

      return new Response(JSON.stringify(errorResponse), {
        status,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
}
