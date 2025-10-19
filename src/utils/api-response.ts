/**
 * API Response Utilities
 * Standardized response helpers for API routes
 */

import { NextResponse } from 'next/server'

export const apiResponse = {
  /**
   * Success response
   */
  success: (data: any, status = 200) => 
    NextResponse.json({ success: true, data }, { status }),
    
  /**
   * Error response
   */
  error: (message: string, details?: string, status = 400) => 
    NextResponse.json({ 
      success: false, 
      error: { message, details } 
    }, { status }),
    
  /**
   * Unauthorized (401)
   */
  unauthorized: (message = 'Authentication required') =>
    NextResponse.json({ 
      success: false, 
      error: { message } 
    }, { status: 401 }),
    
  /**
   * Forbidden (403)
   */
  forbidden: (message = 'Access forbidden') =>
    NextResponse.json({ 
      success: false, 
      error: { message } 
    }, { status: 403 }),
    
  /**
   * Not Found (404)
   */
  notFound: (message = 'Resource not found') =>
    NextResponse.json({ 
      success: false, 
      error: { message } 
    }, { status: 404 }),
    
  /**
   * Bad Request (400)
   */
  badRequest: (message: string) =>
    NextResponse.json({ 
      success: false, 
      error: { message } 
    }, { status: 400 }),
    
  /**
   * Server Error (500)
   */
  serverError: (message = 'Internal server error', details?: string) =>
    NextResponse.json({ 
      success: false, 
      error: { message, details } 
    }, { status: 500 })
}

/**
 * Additional helper functions for backward compatibility
 */

export const validationError = (message: string, errors?: any) =>
  NextResponse.json({ 
    success: false, 
    error: { message, errors } 
  }, { status: 400 })

export const authRequiredError = (message = 'Authentication required') =>
  NextResponse.json({ 
    success: false, 
    error: { message } 
  }, { status: 401 })

export const insufficientPermissionsError = (message = 'Insufficient permissions') =>
  NextResponse.json({ 
    success: false, 
    error: { message } 
  }, { status: 403 })

export const notFoundError = (message = 'Resource not found') =>
  NextResponse.json({ 
    success: false, 
    error: { message } 
  }, { status: 404 })

export const handleApiError = (error: any, defaultMessage = 'An error occurred') => {
  console.error('API Error:', error)
  
  const message = error instanceof Error ? error.message : defaultMessage
  const status = error.status || 500
  
  return NextResponse.json({ 
    success: false, 
    error: { message } 
  }, { status })
}
