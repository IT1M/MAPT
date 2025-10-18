import { NextRequest } from 'next/server'
import { prisma } from '@/services/prisma'
import { successResponse, handleApiError, validationError } from '@/utils/api-response'

/**
 * GET /api/auth/check-email
 * Check if an email address is available for registration
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')

    if (!email) {
      return validationError('Email parameter is required')
    }

    // Check if email exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true },
    })

    return successResponse({
      available: !existingUser,
      email,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
