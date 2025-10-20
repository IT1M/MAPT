import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { prisma } from '@/services/prisma';

/**
 * DELETE /api/auth/sessions/[id]
 * Terminate a specific session
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: sessionId } = await params;

    // Get current session token to prevent self-termination
    const currentSessionToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;

    // Find the session to delete
    const sessionToDelete = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!sessionToDelete) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // Verify the session belongs to the current user
    if (sessionToDelete.userId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Prevent deleting current session
    if (sessionToDelete.sessionToken === currentSessionToken) {
      return NextResponse.json(
        { error: 'Cannot terminate current session' },
        { status: 400 }
      );
    }

    // Delete the session
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({
      success: true,
      message: 'Session terminated successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      { error: 'Failed to terminate session' },
      { status: 500 }
    );
  }
}
