import { NextRequest } from 'next/server'
import { hash, compare } from 'bcrypt'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import { passwordChangeSchema } from '@/utils/validators'
import { createAuditLog, extractRequestMetadata } from '@/utils/audit'
import { RateLimiter, withRateLimit } from '@/middleware/rate-limiter'
import {
  successResponse,
  handleApiError,
  authRequiredError,
  validationError,
} from '@/utils/api-response'

// Rate limiter for password changes (5 attempts per hour per user)
const passwordChangeRateLimiter = new RateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxRequests: 5,
  keyGenerator: (req: NextRequest) => {
    const sessionId = req.cookies.get('next-auth.session-token')?.value ||
      req.cookies.get('__Secure-next-auth.session-token')?.value
    return `password-change:${sessionId || 'unknown'}`
  },
})

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
async function handlePasswordChange(request: NextRequest) {
  try {
    // Require authenticated session
    const session = await auth()
    
    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to change your password')
    }

    // Parse request body
    const body = await request.json()

    // Validate input with Zod schema
    const validationResult = passwordChangeSchema.safeParse(body)
    
    if (!validationResult.success) {
      return validationError('Validation failed', validationResult.error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message,
      })))
    }

    const { oldPassword, newPassword } = validationResult.data

    // Fetch user with current passwordHash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return authRequiredError('User not found')
    }

    // Verify old password with bcrypt.compare
    const isPasswordValid = await compare(oldPassword, user.passwordHash)

    if (!isPasswordValid) {
      return validationError('Current password is incorrect', {
        field: 'oldPassword',
        message: 'The current password you entered is incorrect',
      })
    }

    // Hash new password with bcrypt (12 rounds)
    const newPasswordHash = await hash(newPassword, 12)

    // Update user passwordHash
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newPasswordHash,
      },
    })

    // Invalidate other sessions by updating the user's updatedAt timestamp
    // This will cause JWT tokens to be considered stale on next verification
    // Note: NextAuth JWT strategy doesn't have built-in session invalidation,
    // but updating the user record helps with security
    await prisma.user.update({
      where: { id: user.id },
      data: {
        updatedAt: new Date(),
      },
    })

    // Extract request metadata for audit log
    const metadata = extractRequestMetadata(request)

    // Create audit log entry
    await createAuditLog({
      userId: user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: user.id,
      changes: {
        action: 'password_change',
        timestamp: new Date().toISOString(),
      },
      metadata,
    })

    // Return success response
    return successResponse(
      { message: 'Password changed successfully' },
      'Your password has been updated. Please log in again with your new password.'
    )
  } catch (error) {
    return handleApiError(error)
  }
}

// Export with rate limiting
export const POST = withRateLimit(handlePasswordChange, passwordChangeRateLimiter)
