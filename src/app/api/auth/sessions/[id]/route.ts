import { NextRequest } from 'next/server'
import { auth } from '@/services/auth'
import { prisma } from '@/services/prisma'
import {
  successResponse,
  handleApiError,
  authRequiredError,
  notFoundError,
} from '@/utils/api-response'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * DELETE /api/auth/sessions/:id
 * Terminate a specific session
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return authRequiredError('You must be logged in to manage sessions')
    }

    const { id } = context.params

    // Find the session
    const targetSession = await prisma.session.findUnique({
      where: { id },
    })

    if (!targetSession) {
      return notFoundError('Session not found')
    }

    // Verify the session belongs to the current user
    if (targetSession.userId !== session.user.id) {
      return authRequiredError('You can only terminate your own sessions')
    }

    // Get current session token to prevent self-termination
    const currentSessionToken = request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value

    if (targetSession.sessionToken === currentSessionToken) {
      return handleApiError(
        new Error('Cannot terminate your current session. Please use sign out instead.')
      )
    }

    // Delete the session
    await prisma.session.delete({
      where: { id },
    })

    return successResponse(
      { sessionId: id },
      'Session terminated successfully'
    )
  } catch (error) {
    return handleApiError(error)
  }
}
