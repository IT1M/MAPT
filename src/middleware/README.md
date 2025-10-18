# API Middleware Documentation

This directory contains comprehensive middleware for securing and managing API routes.

## Overview

The middleware system provides:
- **Error Handling**: Centralized error handling with detailed logging
- **Rate Limiting**: Configurable rate limiting per user/IP
- **CSRF Protection**: Token-based CSRF protection for mutations
- **Security Headers**: Standard security headers on all responses

## Quick Start

### Basic Usage

The simplest way to protect your API routes is using the `withApiWrapper` function:

```typescript
import { NextRequest } from 'next/server'
import { withApiWrapper } from '@/middleware/api-wrapper'
import { successResponse } from '@/utils/api-response'

export const GET = withApiWrapper(async (request: NextRequest) => {
  // Your route logic here
  const data = { message: 'Hello World' }
  return successResponse(data)
}, { errorContext: 'GET /api/example' })
```

This automatically applies:
- ✅ Error handling with logging
- ✅ Rate limiting (100 req/min per user)
- ✅ CSRF protection for POST/PATCH/DELETE
- ✅ Security headers

### Custom Configuration

```typescript
import { withApiWrapper } from '@/middleware/api-wrapper'
import { RateLimiter } from '@/middleware/rate-limiter'

// Custom rate limiter (e.g., for admin endpoints)
const adminRateLimiter = new RateLimiter({
  windowMs: 60 * 1000,
  maxRequests: 200, // Higher limit for admins
  keyGenerator: (req) => req.cookies.get('session')?.value || 'unknown'
})

export const POST = withApiWrapper(async (request) => {
  // Your logic
}, {
  errorContext: 'POST /api/admin/action',
  rateLimiter: adminRateLimiter,
  enableRateLimit: true,
  enableCsrfProtection: true,
  enableSecurityHeaders: true,
})
```

## Components

### 1. Error Handling (`error-handler.ts`)

Provides centralized error handling with automatic error type detection.

#### Functions

**`handleApiError(error, context?)`**
- Automatically detects error type (Zod, Prisma, Gemini, etc.)
- Logs errors appropriately for dev/production
- Returns standardized error response

**`withErrorHandler(handler, context?)`**
- Wraps route handler with try-catch
- Automatically handles all errors
- Returns appropriate HTTP status codes

**`handleZodError(error)`**
- Enhanced Zod validation error messages
- Field-level error details
- User-friendly error messages

**`handlePrismaError(error)`**
- Maps Prisma error codes to user-friendly messages
- Handles unique constraints, foreign keys, not found, etc.
- Includes helpful details in development mode

**`handleGeminiError(error)`**
- Graceful fallback for AI service errors
- Handles rate limits, timeouts, circuit breaker
- Provides helpful suggestions in development

#### Example

```typescript
import { handleApiError, logError } from '@/utils/error-handler'

try {
  // Your code
} catch (error) {
  logError(error, 'User Registration')
  const errorResponse = handleApiError(error)
  // errorResponse is a standardized ErrorResponse object
}
```

### 2. Rate Limiting (`rate-limiter.ts`)

In-memory rate limiting with configurable windows and limits.

#### Default Rate Limiters

**`defaultRateLimiter`**
- 100 requests per minute per user
- Uses session ID or IP address as key

**`geminiRateLimiter`**
- 60 requests per minute globally
- For Gemini AI endpoints

#### Functions

**`checkRateLimit(request, limiter?)`**
- Checks if request is within rate limit
- Returns 429 response if exceeded
- Logs violations with IP and path

**`withRateLimit(handler, limiter?)`**
- Wraps handler with rate limiting
- Adds rate limit headers to response
- Logs violations

#### Custom Rate Limiter

```typescript
import { RateLimiter } from '@/middleware/rate-limiter'

const customLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 50,
  keyGenerator: (req) => {
    // Custom key generation logic
    return req.headers.get('x-api-key') || 'anonymous'
  }
})
```

### 3. CSRF Protection (`csrf.ts`)

Token-based CSRF protection for mutation operations.

#### Functions

**`generateCsrfToken()`**
- Generates cryptographically secure token
- 32-byte random token

**`verifyCsrfToken(request)`**
- Verifies token from header matches cookie
- Constant-time comparison

**`checkCsrf(request)`**
- Checks CSRF for POST/PATCH/PUT/DELETE
- Skips NextAuth routes (have own protection)
- Logs violations

**`withCsrfProtection(handler)`**
- Wraps handler with CSRF checks
- Generates tokens for GET requests
- Validates tokens for mutations

#### Usage

CSRF protection is automatically applied when using `withApiWrapper`. For manual usage:

```typescript
import { withCsrfProtection } from '@/middleware/csrf'

export const POST = withCsrfProtection(async (request) => {
  // CSRF token already verified
  // Your logic here
})
```

### 4. Security Headers (`security-headers.ts`)

Standard security headers for all API responses.

#### Headers Applied

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

#### Functions

**`addSecurityHeaders(headers)`**
- Adds security headers to existing headers object

**`createSecureResponse(body, init?)`**
- Creates Response with security headers

### 5. API Wrapper (`api-wrapper.ts`)

Comprehensive wrapper combining all middleware.

#### Functions

**`withApiWrapper(handler, options?)`**
- Main wrapper function
- Applies all middleware in correct order
- Highly configurable

**`withApiWrapperNoRateLimit(handler, context?)`**
- For routes that don't need rate limiting
- E.g., health checks, webhooks

**`withApiWrapperNoCsrf(handler, context?)`**
- For routes that don't need CSRF
- E.g., public APIs, webhooks

**`withGeminiApiWrapper(handler, context?)`**
- For Gemini AI routes
- Uses geminiRateLimiter (60 req/min)

## Usage Examples

### Standard API Route

```typescript
import { NextRequest } from 'next/server'
import { withApiWrapper } from '@/middleware/api-wrapper'
import { successResponse, authRequiredError } from '@/utils/api-response'
import { auth } from '@/services/auth'

export const GET = withApiWrapper(async (request: NextRequest) => {
  const session = await auth()
  if (!session?.user) {
    return authRequiredError()
  }

  const data = { user: session.user }
  return successResponse(data)
}, { errorContext: 'GET /api/user/profile' })
```

### Mutation Route with Validation

```typescript
import { withApiWrapper } from '@/middleware/api-wrapper'
import { z } from 'zod'
import { prisma } from '@/services/prisma'

const createItemSchema = z.object({
  name: z.string().min(2).max(100),
  quantity: z.number().int().positive(),
})

export const POST = withApiWrapper(async (request) => {
  const body = await request.json()
  
  // Zod validation - errors automatically handled
  const data = createItemSchema.parse(body)
  
  // Prisma operations - errors automatically handled
  const item = await prisma.inventoryItem.create({ data })
  
  return successResponse(item, 'Item created', 201)
}, { errorContext: 'POST /api/inventory' })
```

### Gemini AI Route

```typescript
import { withGeminiApiWrapper } from '@/middleware/api-wrapper'
import { geminiService } from '@/services/gemini'

export const POST = withGeminiApiWrapper(async (request) => {
  const { query } = await request.json()
  
  // Gemini errors automatically handled with graceful fallback
  const insights = await geminiService.generateInsights(query)
  
  return successResponse({ insights })
}, 'POST /api/ai/insights')
```

### Public Webhook (No CSRF)

```typescript
import { withApiWrapperNoCsrf } from '@/middleware/api-wrapper'

export const POST = withApiWrapperNoCsrf(async (request) => {
  // Verify webhook signature manually
  const signature = request.headers.get('x-webhook-signature')
  // ... verify signature
  
  // Process webhook
  return successResponse({ received: true })
}, 'POST /api/webhooks/stripe')
```

### Health Check (No Rate Limit)

```typescript
import { withApiWrapperNoRateLimit } from '@/middleware/api-wrapper'

export const GET = withApiWrapperNoRateLimit(async () => {
  return successResponse({ 
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}, 'GET /api/health')
```

## Error Response Format

All errors follow a consistent format:

```typescript
{
  success: false,
  error: {
    code: 'ERROR_CODE',
    message: 'User-friendly error message',
    details?: any // Only in development mode
  }
}
```

### Error Codes

- `AUTH_REQUIRED` (401): Authentication required
- `INSUFFICIENT_PERMISSIONS` (403): User lacks permissions
- `VALIDATION_ERROR` (400): Input validation failed
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource conflict (e.g., duplicate)
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `EXTERNAL_SERVICE_ERROR` (502): External service failed
- `DATABASE_ERROR` (500): Database operation failed
- `INTERNAL_ERROR` (500): Unexpected error

## Best Practices

1. **Always use `withApiWrapper`** for API routes unless you have a specific reason not to
2. **Provide error context** to help with debugging: `{ errorContext: 'GET /api/...' }`
3. **Let errors bubble up** - the wrapper will catch and handle them appropriately
4. **Use Zod for validation** - errors are automatically formatted nicely
5. **Don't catch errors manually** unless you need custom handling
6. **Use appropriate wrapper variants** for special cases (webhooks, health checks, etc.)

## Testing

The middleware includes comprehensive error handling that makes testing easier:

```typescript
// In your tests
import { handleApiError } from '@/utils/error-handler'

test('handles validation errors', () => {
  const zodError = new ZodError([...])
  const response = handleApiError(zodError)
  
  expect(response.success).toBe(false)
  expect(response.error.code).toBe('VALIDATION_ERROR')
})
```

## Production Considerations

- **Logging**: In production, errors are logged with minimal details to avoid exposing sensitive information
- **Rate Limiting**: Consider using Redis for distributed rate limiting in production
- **CSRF Tokens**: Tokens are HttpOnly and Secure in production
- **Security Headers**: All security headers are automatically applied
- **Error Details**: Detailed error information is only shown in development mode

## Migration Guide

To migrate existing routes to use the new middleware:

### Before
```typescript
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // ... logic
    
    return NextResponse.json({ data })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
```

### After
```typescript
export const GET = withApiWrapper(async (request: NextRequest) => {
  const session = await auth()
  if (!session) {
    return authRequiredError()
  }
  
  // ... logic
  
  return successResponse(data)
}, { errorContext: 'GET /api/...' })
```

Benefits:
- ✅ Automatic error handling
- ✅ Rate limiting
- ✅ CSRF protection
- ✅ Security headers
- ✅ Consistent error format
- ✅ Better logging
- ✅ Less boilerplate
