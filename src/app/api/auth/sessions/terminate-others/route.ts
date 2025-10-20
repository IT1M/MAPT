import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { terminateOtherSessions } from '@/services/session';

/**
 * POST /api/auth/sessions/terminate-others
 * Terminate all sessions except the current one
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current session token
    const currentSessionToken =
      request.cookies.get('authjs.session-token')?.value ||
      request.cookies.get('__Secure-authjs.session-token')?.value;

    if (!currentSessionToken) {
      return NextResponse.json(
        { error: 'No session token found' },
        { status: 400 }
      );
    }

    // Terminate all other sessions
    const count = await terminateOtherSessions(
      session.user.id,
      currentSessionToken
    );

    return NextResponse.json({
      success: true,
      message: `Terminated ${count} session${count !== 1 ? 's' : ''}`,
      count,
    });
  } catch (error) {
    console.error('Error terminating sessions:', error);
    return NextResponse.json(
      { error: 'Failed to terminate sessions' },
      { status: 500 }
    );
  }
}
