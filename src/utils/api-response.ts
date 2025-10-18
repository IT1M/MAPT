import { NextResponse } from 'next/server'

// Error codes for consistent error handling
export const ErrorCodes = {
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes]

// Success response interface
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// Error response interface
export interface ErrorResponse {
  success: false
  error: {
    code: ErrorCode
    message: string
    details?: any
  }
}

// API response type
export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse

/**
 * Create a success response
 */
export function successResponse<T>(
  data: T,
  message?: string,
  status: number = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      ...(message && { message }),
    },
    { status }
  )
}

/**
 * Create an error response
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number = 400,
  details?: any
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    {
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  )
}

/**
 * Create a validation error response
 */
export function validationError(
  message: string = 'Validation failed',
  details?: any
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.VALIDATION_ERROR, message, 400, details)
}

/**
 * Create an authentication required error response
 */
export function authRequiredError(
  message: string = 'Authentication required'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.AUTH_REQUIRED, message, 401)
}

/**
 * Create an insufficient permissions error response
 */
export function insufficientPermissionsError(
  message: string = 'Insufficient permissions'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.INSUFFICIENT_PERMISSIONS, message, 403)
}

/**
 * Create a not found error response
 */
export function notFoundError(
  message: string = 'Resource not found'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.NOT_FOUND, message, 404)
}

/**
 * Create a conflict error response
 */
export function conflictError(
  message: string = 'Resource conflict',
  details?: any
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.CONFLICT, message, 409, details)
}

/**
 * Create a rate limit error response
 */
export function rateLimitError(
  message: string = 'Rate limit exceeded'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429)
}

/**
 * Create a database error response
 */
export function databaseError(
  message: string = 'Database operation failed'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.DATABASE_ERROR, message, 500)
}

/**
 * Create an external service error response
 */
export function externalServiceError(
  message: string = 'External service error'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.EXTERNAL_SERVICE_ERROR, message, 502)
}

/**
 * Create an internal server error response
 */
export function internalError(
  message: string = 'Internal server error'
): NextResponse<ErrorResponse> {
  return errorResponse(ErrorCodes.INTERNAL_ERROR, message, 500)
}

/**
 * Handle Prisma errors and convert to appropriate error responses
 */
export function handlePrismaError(error: any): NextResponse<ErrorResponse> {
  // Prisma unique constraint violation
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field'
    return conflictError(`A record with this ${field} already exists`, {
      field,
    })
  }

  // Prisma foreign key constraint violation
  if (error.code === 'P2003') {
    return validationError('Invalid reference to related record')
  }

  // Prisma record not found
  if (error.code === 'P2025') {
    return notFoundError('Record not found')
  }

  // Generic database error
  console.error('Database error:', error)
  return databaseError()
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: any): NextResponse<ErrorResponse> {
  const details = error.errors?.map((err: any) => ({
    field: err.path.join('.'),
    message: err.message,
  }))

  return validationError('Validation failed', details)
}

/**
 * Generic error handler for API routes
 */
export function handleApiError(error: any): NextResponse<ErrorResponse> {
  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('API Error:', error)
  }

  // Handle Zod validation errors
  if (error.name === 'ZodError') {
    return handleZodError(error)
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    return handlePrismaError(error)
  }

  // Handle custom error responses
  if (error.response && error.response.status) {
    return errorResponse(
      ErrorCodes.EXTERNAL_SERVICE_ERROR,
      error.message || 'External service error',
      error.response.status
    )
  }

  // Default to internal server error
  return internalError(
    process.env.NODE_ENV === 'development'
      ? error.message
      : 'An unexpected error occurred'
  )
}
