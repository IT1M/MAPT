import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/services/auth';
import { getExportHistory } from '@/services/export';
import { authRequiredError, handleApiError } from '@/utils/api-response';

/**
 * GET /api/export/history
 * Get export history for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return authRequiredError();
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get export history
    const history = await getExportHistory(session.user.id, limit);

    return NextResponse.json({
      success: true,
      data: history,
      total: history.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
